import { useReviewableItems } from '@/api/comment/comment.api';
import { useOrderDetail } from '@/api/order/order.api';
import type { OrderLineItemResolved, OrderShippingAddressSnapshot } from '@/api/order/order.type';
import { getOrderLineProductId, resolveReviewableOrderItemId } from '@/api/order/order.utils';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FFFBEB', text: AppEco.accent, dot: AppEco.accentSoft },
  shipping: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  delivered: { bg: '#ECFDF5', text: '#065F46', dot: AppEco.success },
  cancelled: { bg: '#FEF2F2', text: AppEco.danger, dot: AppEco.danger },
};

const METHOD_LABELS: Record<string, string> = {
  economy: 'Tiết kiệm',
  fast: 'Nhanh',
  express: 'Hỏa tốc',
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Tiền mặt khi nhận hàng',
  card: 'Thẻ tín dụng / Ghi nợ',
  bank_transfer: 'Chuyển khoản ngân hàng',
};

function getStatusColors(statusKey: string) {
  return STATUS_COLORS[statusKey] ?? { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
}

function lineProductName(line: OrderLineItemResolved) {
  const p = line.productId;
  if (typeof p === 'object' && p !== null && 'name' in p && p.name) return p.name;
  return 'Sản phẩm';
}

function lineProductImage(line: OrderLineItemResolved) {
  const p = line.productId;
  if (typeof p === 'object' && p !== null && 'images' in p && Array.isArray(p.images)) {
    return p.images[0];
  }
  return undefined;
}

function isSnapshotAddr(a: unknown): a is OrderShippingAddressSnapshot {
  if (!a || typeof a !== 'object') return false;
  const o = a as Record<string, unknown>;
  return (
    typeof o.fullName === 'string' &&
    typeof o.phoneNumber === 'string' &&
    typeof o.address === 'string'
  );
}

function formatAddress(addr: OrderShippingAddressSnapshot) {
  const parts = [addr.address, addr.ward, addr.district, addr.city ?? addr.province].filter(Boolean);
  return parts.join(', ');
}

function StatusBadge({ statusKey }: { statusKey: string }) {
  const clr = getStatusColors(statusKey);
  const label = STATUS_LABELS[statusKey] ?? statusKey;

  return (
    <View style={[styles.statusBadge, { backgroundColor: clr.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: clr.dot }]} />
      <Text style={[styles.statusText, { color: clr.text }]}>{label}</Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={16} color={AppEco.primary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOrderDetail(id ?? '');
  const order = data?.data?.order;
  const deliveredOrderId =
    order && String(order.status) === 'delivered' ? order._id : undefined;
  const reviewableQ = useReviewableItems(deliveredOrderId);

  const errMsg =
    error && typeof error === 'object' && 'response' in error
      ? String(
          (error as { response?: { data?: { message?: string }; status?: number } }).response?.data
            ?.message ?? '',
        )
      : '';

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenHero
          title="Chi tiết đơn hàng"
          subtitle="Đang tải..."
          onBack={() => router.back()}
        />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.root}>
        <ScreenHero title="Chi tiết đơn hàng" onBack={() => router.back()} />
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={AppEco.danger} />
          <Text style={styles.errTitle}>Không tải được đơn</Text>
          <Text style={styles.errSub}>
            {errMsg || 'Đơn không tồn tại hoặc không thuộc tài khoản của bạn.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusKey = String(order.status);
  const orderCode = order.orderCode || order._id.slice(-8);
  const sellerName =
    typeof order.sellerId === 'object' && order.sellerId !== null && 'name' in order.sellerId
      ? order.sellerId.name
      : 'Cửa hàng';
  const shipMethod = order.shippingMethod
    ? METHOD_LABELS[String(order.shippingMethod)] ?? String(order.shippingMethod)
    : '—';
  const paymentLabel = order.paymentMethod
    ? PAYMENT_LABELS[String(order.paymentMethod)] ?? String(order.paymentMethod)
    : null;
  const addr = order.shippingAddress;

  const reviewableList = reviewableQ.data?.reviewableItems ?? [];
  const reviewableIds = new Set(reviewableList.map((r) => r.orderItemId));

  const subtotal = (order.items ?? []).reduce((sum, line) => sum + line.price * line.quantity, 0);
  const shippingFee = order.shippingFee ?? 0;

  return (
    <View style={styles.root}>
      <ScreenHero
        title="Chi tiết đơn hàng"
        subtitle={`#${orderCode} · ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`}
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusRow}>
          <Text style={styles.statusRowLabel}>Trạng thái đơn hàng</Text>
          <StatusBadge statusKey={statusKey} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color={AppEco.primary} />
            <Text style={styles.sectionTitle}>Thông tin đơn</Text>
          </View>
          <MetaRow
            icon="receipt-outline"
            label="Mã đơn"
            value={`#${orderCode}`}
          />
          <MetaRow
            icon="calendar-outline"
            label="Ngày đặt"
            value={new Date(order.createdAt).toLocaleString('vi-VN')}
          />
          <MetaRow icon="storefront-outline" label="Người bán" value={sellerName} />
          <MetaRow icon="bicycle-outline" label="Vận chuyển" value={shipMethod} />
          {paymentLabel ? (
            <MetaRow icon="wallet-outline" label="Thanh toán" value={paymentLabel} />
          ) : null}
        </View>

        {statusKey === 'delivered' ? (
          <View style={styles.reviewBanner}>
            <View style={styles.reviewBannerIcon}>
              <Ionicons name="sparkles-outline" size={22} color={AppEco.success} />
            </View>
            <View style={styles.reviewBannerTextWrap}>
              <Text style={styles.reviewBannerTitle}>Bạn đã nhận hàng</Text>
              <Text style={styles.reviewBannerSub}>Chia sẻ trải nghiệm với mọi người nhé!</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="bag-outline" size={18} color={AppEco.primary} />
            <Text style={styles.sectionTitle}>Sản phẩm ({order.items?.length ?? 0})</Text>
          </View>

          {statusKey === 'delivered' && reviewableQ.isLoading ? (
            <Text style={styles.reviewableHint}>Đang tải trạng thái đánh giá...</Text>
          ) : null}
          {statusKey === 'delivered' && reviewableQ.isError ? (
            <TouchableOpacity
              style={styles.reviewableErrRow}
              onPress={() => reviewableQ.refetch()}
              activeOpacity={0.85}
            >
              <Text style={styles.reviewableErrText}>
                Không tải được danh sách đánh giá. Chạm để thử lại.
              </Text>
            </TouchableOpacity>
          ) : null}

          {order.items?.map((line, idx) => {
            const uri = lineProductImage(line);
            const pid = getOrderLineProductId(line);
            const lineItemId = resolveReviewableOrderItemId(line, reviewableList);
            const showReviewBtn =
              statusKey === 'delivered' &&
              reviewableQ.isSuccess &&
              lineItemId != null &&
              reviewableIds.has(lineItemId);
            const lineKey = line._id ?? `line-${idx}`;
            const isLast = idx === (order.items?.length ?? 0) - 1;

            return (
              <View key={lineKey} style={[styles.orderItem, !isLast && styles.orderItemDivider]}>
                <View style={styles.itemImgWrap}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.itemImg} />
                  ) : (
                    <View style={styles.itemImgPlaceholder}>
                      <MaterialCommunityIcons name="image-off-outline" size={22} color={AppEco.textMuted} />
                    </View>
                  )}
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {lineProductName(line)}
                  </Text>
                  <Text style={styles.itemVariant}>
                    Màu: {line.variant?.color || '—'} · Size: {line.variant?.size || '—'}
                  </Text>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{formatPrice(line.price)}</Text>
                    <Text style={styles.itemQty}>x{line.quantity}</Text>
                    <Text style={styles.itemSubtotal}>{formatPrice(line.price * line.quantity)}</Text>
                  </View>
                  {showReviewBtn && lineItemId ? (
                    <TouchableOpacity
                      style={styles.reviewLineBtn}
                      onPress={() =>
                        router.push(
                          `/product/${pid}?review=1&orderId=${order._id}&orderItemId=${encodeURIComponent(lineItemId)}` as never,
                        )
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="star-outline" size={15} color={AppEco.primary} />
                      <Text style={styles.reviewLineBtnText}>Đánh giá sản phẩm</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="location-outline" size={18} color={AppEco.primary} />
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          </View>

          {isSnapshotAddr(addr) ? (
            <View style={styles.addressBox}>
              <View style={styles.addressBoxTop}>
                <View style={styles.addressBoxIconWrap}>
                  <Ionicons name="location" size={18} color={AppEco.primary} />
                </View>
                <View style={styles.addressBoxInfo}>
                  <View style={styles.addressBoxNameRow}>
                    <Text style={styles.addressBoxName}>{addr.fullName}</Text>
                    <Text style={styles.addressBoxPhone}>{addr.phoneNumber}</Text>
                  </View>
                  <Text style={styles.addressBoxAddr}>{formatAddress(addr)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.mutedText}>Không có dữ liệu địa chỉ chi tiết.</Text>
          )}
        </View>

        {order.notes ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Ghi chú</Text>
            </View>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={AppEco.primary} />
            <Text style={styles.sectionTitle}>Tóm tắt thanh toán</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalPrice)}</Text>
          </View>
          <Text style={styles.totalHint}>Số tiền theo xác nhận từ máy chủ</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: AppEco.textSecondary },
  errTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text, marginTop: 8 },
  errSub: { fontSize: 14, color: AppEco.textSecondary, textAlign: 'center', lineHeight: 21 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: AppEco.radiusMd,
    ...AppEco.shadowCard,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  scroll: { padding: 16, gap: 12 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  statusRowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppEco.text,
  },

  section: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppEco.text,
    flex: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppEco.borderSoft,
  },
  metaLabel: {
    width: 88,
    fontSize: 13,
    fontWeight: '600',
    color: AppEco.textSecondary,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: AppEco.text,
    textAlign: 'right',
    lineHeight: 19,
  },

  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: AppEco.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  reviewBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppEco.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewBannerTextWrap: { flex: 1, gap: 4 },
  reviewBannerTitle: { fontSize: 15, fontWeight: '800', color: AppEco.text },
  reviewBannerSub: { fontSize: 13, color: AppEco.textSecondary, lineHeight: 18 },

  orderItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  orderItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppEco.borderSoft,
  },
  itemImgWrap: { position: 'relative' },
  itemImg: {
    width: 72,
    height: 72,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surfaceMuted,
  },
  itemImgPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: '600', color: AppEco.text },
  itemVariant: { fontSize: 12, color: AppEco.textMuted },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  itemPrice: { fontSize: 14, fontWeight: '700', color: AppEco.primary },
  itemQty: { fontSize: 13, color: AppEco.textMuted, fontWeight: '500' },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '700',
    color: AppEco.textSecondary,
    marginLeft: 'auto',
  },

  reviewLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.primaryMuted,
    borderWidth: 1,
    borderColor: AppEco.border,
  },
  reviewLineBtnText: { fontSize: 13, fontWeight: '700', color: AppEco.primaryDark },
  reviewableHint: { fontSize: 13, color: AppEco.textMuted, marginBottom: 10 },
  reviewableErrRow: {
    marginBottom: 12,
    padding: 12,
    borderRadius: AppEco.radiusSm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewableErrText: { fontSize: 13, color: AppEco.danger, fontWeight: '600', lineHeight: 19 },

  addressBox: {
    backgroundColor: AppEco.primaryMuted,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: AppEco.border,
    padding: 14,
  },
  addressBoxTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressBoxIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBoxInfo: { flex: 1, gap: 4 },
  addressBoxNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  addressBoxName: { fontSize: 15, fontWeight: '700', color: AppEco.text },
  addressBoxPhone: { fontSize: 13, color: AppEco.textSecondary },
  addressBoxAddr: { fontSize: 13, color: AppEco.textSecondary, lineHeight: 20 },
  mutedText: { fontSize: 13, color: AppEco.textMuted, lineHeight: 20 },

  notesText: {
    fontSize: 14,
    color: AppEco.textSecondary,
    lineHeight: 21,
    backgroundColor: AppEco.surfaceMuted,
    borderRadius: AppEco.radiusSm,
    padding: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 14, color: AppEco.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: AppEco.text },
  summaryDivider: {
    height: 1,
    backgroundColor: AppEco.borderSoft,
    marginVertical: 4,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: AppEco.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: AppEco.primary },
  totalHint: {
    fontSize: 11,
    color: AppEco.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
