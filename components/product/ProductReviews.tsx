import {
  useCanReviewProduct,
  useCommentsByProduct,
  useCreateComment,
} from '@/api/comment/comment.api';
import type { Comment } from '@/api/comment/comment.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/utils/api-error-message';

function commentAuthorName(c: Comment): string {
  const u = c.userId;
  if (typeof u === 'object' && u && 'name' in u && typeof u.name === 'string' && u.name) {
    return u.name;
  }
  return 'Người mua';
}

function avgRating(comments: Comment[]): number | null {
  if (!comments.length) return null;
  const s = comments.reduce((acc, c) => acc + (Number(c.rating) || 0), 0);
  return Math.round((s / comments.length) * 10) / 10;
}

type Props = {
  productId: string;
  emphasizeForm?: boolean;
  embedded?: boolean;
};

type ReviewContext = {
  orderId: string | null;
  orderItemId: string | null;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function ProductReviews({ productId, emphasizeForm, embedded }: Props) {
  const toast = useToast();
  const { data: user } = useGetCurrentUser();
  const { data: commentsRes, isLoading, isError } = useCommentsByProduct(productId);
  const canReview = useCanReviewProduct(productId);
  const { mutate: submitComment, isPending } = useCreateComment(productId);
  const params = useLocalSearchParams();

  const list = commentsRes?.comment ?? [];
  const average = avgRating(list);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [img, setImg] = useState('');
  const [reviewContext, setReviewContext] = useState<ReviewContext>({
    orderId: null,
    orderItemId: null,
  });

  useEffect(() => {
    if (emphasizeForm) setRating(5);
  }, [emphasizeForm, productId]);

  useEffect(() => {
    // Route is /product/[id] — product id is params.id, not params.productId
    const reviewOn = firstParam(params.review as string | string[] | undefined) === '1';
    const oid = firstParam(params.orderId as string | string[] | undefined);
    const paramProductId =
      firstParam(params.productId as string | string[] | undefined) ??
      firstParam(params.id as string | string[] | undefined);
    if (reviewOn && oid && paramProductId === productId) {
      setReviewContext({
        orderId: oid,
        orderItemId: firstParam(params.orderItemId as string | string[] | undefined) || null,
      });
    }
  }, [params, productId]);

  const onSubmit = () => {
    const text = content.trim();
    if (!text) {
      toast.showError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.showError('Chọn số sao từ 1 đến 5.');
      return;
    }
    if (!reviewContext.orderId) {
      toast.showError('Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.');
      return;
    }
    submitComment(
      { 
        content: text, 
        rating, 
        img: img.trim() || undefined,
        orderId: reviewContext.orderId,
        orderItemId: reviewContext.orderItemId || undefined,
      },
      {
        onSuccess: () => {
          setContent('');
          setImg('');
          setRating(5);
          setReviewContext({ orderId: null, orderItemId: null });
          toast.showSuccess('Cảm ơn bạn đã đánh giá sản phẩm.');
        },
        onError: (e: unknown) => {
          const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string; status?: number };
          const message = err?.response?.data?.message || err?.message || 'Vui lòng thử lại.';
          const status = err?.response?.status || err.status;

          if (status === 400) {
            if (message.includes('giao')) {
              toast.showError('Chỉ có thể đánh giá sau khi đơn hàng đã giao.');
            } else if (message.includes('không có trong')) {
              toast.showError('Sản phẩm không có trong đơn hàng.');
            } else if (message.includes('rating')) {
              toast.showError('Rating phải từ 1 đến 5.');
            } else {
              toast.showError(message);
            }
          } else if (status === 403) {
            toast.showError('Đơn hàng không thuộc về bạn.');
          } else if (status === 409) {
            toast.showError(message);
          } else {
            toast.showError(getApiErrorMessage(e, 'Không gửi được đánh giá.'));
          }
        },
      }
    );
  };

  return (
    <View style={[styles.card, embedded && styles.cardEmbedded, emphasizeForm && styles.cardEmphasis]}>
      {!embedded && (
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Đánh giá sản phẩm</Text>
          {average != null && (
            <View style={styles.avgPill}>
              <Ionicons name="star" size={14} color={AppEco.accentSoft} />
              <Text style={styles.avgText}>{average}</Text>
              <Text style={styles.avgCount}>({list.length})</Text>
            </View>
          )}
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={AppEco.primary} />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      )}

      {isError && !isLoading ? (
        <Text style={styles.errText}>Không tải được danh sách đánh giá.</Text>
      ) : null}

      {!isLoading && list.length === 0 ? (
        <Text style={styles.empty}>Chưa có đánh giá nào. Hãy là người đầu tiên!</Text>
      ) : null}

      {list.map((c) => (
        <View key={c._id} style={styles.commentRow}>
          <View style={styles.commentTop}>
            <Text style={styles.commentAuthor}>{commentAuthorName(c)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= c.rating ? 'star' : 'star-outline'}
                  size={12}
                  color={AppEco.accentSoft}
                />
              ))}
            </View>
          </View>
          <Text style={styles.commentBody}>{c.content}</Text>
          {c.img ? (
            <Image source={{ uri: c.img }} style={styles.commentImg} resizeMode="cover" />
          ) : null}
          <Text style={styles.commentTime}>
            {new Date(c.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>
      ))}

      {user ? (
        canReview && reviewContext.orderId ? (
          <View style={[styles.formBlock, emphasizeForm && styles.formBlockEmphasis]}>
            <Text style={styles.formLabel}>Viết đánh giá</Text>
            <View style={styles.starPick}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} hitSlop={8}>
                  <Ionicons
                    name={i <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color={AppEco.accentSoft}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              placeholderTextColor={AppEco.textMuted}
              multiline
              value={content}
              onChangeText={setContent}
              textAlignVertical="top"
            />
            <TextInput
              style={styles.inputImg}
              placeholder="Link ảnh (tuỳ chọn)"
              placeholderTextColor={AppEco.textMuted}
              value={img}
              onChangeText={setImg}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.submitBtn, isPending && styles.submitBtnDis]}
              onPress={onSubmit}
              disabled={isPending}
              activeOpacity={0.85}
            >
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hintMuted}>
            {canReview 
              ? "Vui lòng vào trang chi tiết đơn hàng để đánh giá. Sau khi nhận hàng (đơn ở trạng thái \"Đã giao\"), bạn có thể đánh giá sản phẩm này."
              : "Sau khi nhận hàng (đơn ở trạng thái \"Đã giao\"), bạn có thể đánh giá sản phẩm này."
            }
          </Text>
        )
      ) : (
        <TouchableOpacity
          style={styles.loginCta}
          onPress={() => router.push('/(auth)/login' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.loginCtaText}>Đăng nhập để đánh giá</Text>
          <Ionicons name="chevron-forward" size={18} color={AppEco.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppEco.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: AppEco.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...AppEco.shadowCard,
  },
  cardEmphasis: {
    borderWidth: 2,
    borderColor: AppEco.primary,
  },
  cardEmbedded: {
    marginHorizontal: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppEco.text,
  },
  avgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AppEco.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  avgText: { fontSize: 14, fontWeight: '800', color: AppEco.accent },
  avgCount: { fontSize: 12, color: AppEco.accentSoft, fontWeight: '600' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: { fontSize: 13, color: AppEco.textSecondary },
  errText: { fontSize: 13, color: AppEco.danger, marginBottom: 8 },
  empty: { fontSize: 14, color: AppEco.textSecondary, marginBottom: 12, lineHeight: 21 },
  commentRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
  },
  commentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: AppEco.text },
  starsRow: { flexDirection: 'row', gap: 2 },
  commentBody: { fontSize: 14, color: AppEco.textSecondary, lineHeight: 22 },
  commentImg: {
    width: '100%',
    height: 160,
    borderRadius: AppEco.radiusSm,
    marginTop: 8,
    backgroundColor: AppEco.borderSoft,
  },
  commentTime: { fontSize: 11, color: AppEco.textMuted, marginTop: 6 },
  formBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
  },
  formBlockEmphasis: {
    backgroundColor: AppEco.surfaceMuted,
    marginHorizontal: -8,
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderRadius: AppEco.radiusSm,
    borderTopWidth: 0,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: AppEco.textSecondary, marginBottom: 10 },
  starPick: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  input: {
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusSm,
    padding: 12,
    fontSize: 14,
    color: AppEco.text,
    backgroundColor: AppEco.surfaceMuted,
    marginBottom: 10,
  },
  inputImg: {
    borderWidth: 1.5,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppEco.text,
    backgroundColor: AppEco.surfaceMuted,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: AppEco.primary,
    paddingVertical: 14,
    borderRadius: AppEco.radiusSm,
    alignItems: 'center',
    ...AppEco.shadowCard,
  },
  submitBtnDis: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  hintMuted: {
    fontSize: 13,
    color: AppEco.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  loginCta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.surfaceMuted,
    borderWidth: 1,
    borderColor: AppEco.border,
  },
  loginCtaText: { color: AppEco.primary, fontWeight: '700', fontSize: 14 },
});
