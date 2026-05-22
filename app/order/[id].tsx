import { useReviewableItems } from '@/api/comment/comment.api';
import { useOrderDetail } from '@/api/order/order.api';
import type { OrderLineItemResolved, OrderShippingAddressSnapshot } from '@/api/order/order.type';
import { getOrderLineProductId, resolveReviewableOrderItemId } from '@/api/order/order.utils';
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
import { SafeAreaView } from 'react-native-safe-area-context';

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

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

const METHOD_LABELS: Record<string, string> = {
  economy: 'Tiết kiệm',
  fast: 'Nhanh',
  express: 'Hỏa tốc',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, error } = useOrderDetail(id ?? '');
  const order = data?.data?.order;
  const deliveredOrderId =
    order && String(order.status) === 'delivered' ? order._id : undefined;
  const reviewableQ = useReviewableItems(deliveredOrderId);

  const errMsg =
    error && typeof error === 'object' && 'response' in error
      ? String((error as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message ?? '')
      : '';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.muted}>Đang tải đơn hàng...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errTitle}>Không tải được đơn</Text>
        <Text style={styles.errSub}>{errMsg || 'Đơn không tồn tại hoặc không thuộc tài khoản của bạn.'}</Text>
        <TouchableOpacity style={styles.backPrimary} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.backPrimaryText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusKey = String(order.status);
  const statusLabel = STATUS_LABELS[statusKey] ?? statusKey;
  const sellerName =
    typeof order.sellerId === 'object' && order.sellerId !== null && 'name' in order.sellerId
      ? order.sellerId.name
      : 'Cửa hàng';
  const shipMethod = order.shippingMethod ? METHOD_LABELS[String(order.shippingMethod)] ?? String(order.shippingMethod) : '—';
  const addr = order.shippingAddress;

  const reviewableList = reviewableQ.data?.reviewableItems ?? [];
  const reviewableIds = new Set(reviewableList.map((r) => r.orderItemId));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderCode}>#{order.orderCode || order._id.slice(-8)}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.meta}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
          <Text style={styles.meta}>Người bán: {sellerName}</Text>
        </View>

        {statusKey === 'delivered' ? (
          <View style={styles.reviewBanner}>
            <Ionicons name="sparkles-outline" size={22} color="#0369A1" />
            <View style={styles.reviewBannerTextWrap}>
              <Text style={styles.reviewBannerTitle}>Bạn đã nhận hàng</Text>
              <Text style={styles.reviewBannerSub}>Chia sẻ trải nghiệm với mọi người?</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sản phẩm</Text>
          {statusKey === 'delivered' && reviewableQ.isLoading ? (
            <Text style={styles.reviewableHint}>Đang tải trạng thái đánh giá...</Text>
          ) : null}
          {statusKey === 'delivered' && reviewableQ.isError ? (
            <TouchableOpacity
              style={styles.reviewableErrRow}
              onPress={() => reviewableQ.refetch()}
              activeOpacity={0.85}
            >
              <Text style={styles.reviewableErrText}>Không tải được danh sách đánh giá. Chạm để thử lại.</Text>
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
            return (
              <View key={lineKey} style={[styles.line, idx > 0 && styles.lineBorder]}>
                <View style={styles.lineImgWrap}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.lineImg} />
                  ) : (
                    <View style={styles.lineImgPh}>
                      <MaterialCommunityIcons name="image-off-outline" size={20} color="#D1D5DB" />
                    </View>
                  )}
                </View>
                <View style={styles.lineBody}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {lineProductName(line)}
                  </Text>
                  <Text style={styles.lineVar}>
                    {line.variant?.color || '—'} · {line.variant?.size || '—'} × {line.quantity}
                  </Text>
                  <Text style={styles.linePrice}>{formatPrice(line.price * line.quantity)}</Text>
                  {showReviewBtn && lineItemId ? (
                    <TouchableOpacity
                      style={styles.reviewLineBtn}
                      onPress={() =>
                        router.push(
                          `/product/${pid}?review=1&orderId=${order._id}&orderItemId=${encodeURIComponent(lineItemId)}` as any
                        )
                      }
                      activeOpacity={0.85}
                    >
                      <Ionicons name="star-outline" size={15} color="#1D4ED8" />
                      <Text style={styles.reviewLineBtnText}>Đánh giá sản phẩm</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giao hàng</Text>
          <Text style={styles.meta}>Phương thức: {shipMethod}</Text>
          {order.shippingFee != null ? (
            <Text style={styles.meta}>Phí vận chuyển: {formatPrice(order.shippingFee)}</Text>
          ) : null}
          {isSnapshotAddr(addr) ? (
            <>
              <Text style={styles.addrBlock}>
                {addr.fullName} · {addr.phoneNumber}
              </Text>
              <Text style={styles.addrBlock}>
                {addr.address}, {addr.ward}, {addr.district}, {addr.city}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>Không có dữ liệu địa chỉ chi tiết.</Text>
          )}
        </View>

        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú</Text>
            <Text style={styles.meta}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalValue}>{formatPrice(order.totalPrice)}</Text>
          <Text style={styles.totalHint}>Số tiền theo xác nhận từ máy chủ</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  muted: { fontSize: 14, color: '#6B7280' },
  errTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 8 },
  errSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 21 },
  backPrimary: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#111827' },
  headerSpacer: { width: 38 },

  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCode: { fontSize: 18, fontWeight: '900', color: '#111827' },
  statusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  meta: { fontSize: 14, color: '#4B5563', marginTop: 8, lineHeight: 20 },

  line: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  lineBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  lineImgWrap: {},
  lineImg: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#F3F4F6' },
  lineImgPh: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineBody: { flex: 1, gap: 4 },
  lineName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  lineVar: { fontSize: 12, color: '#6B7280' },
  linePrice: { fontSize: 14, fontWeight: '800', color: '#2563EB' },

  addrBlock: { fontSize: 14, color: '#374151', marginTop: 6, lineHeight: 21 },

  totalCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: '#0369A1', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '900', color: '#2563EB', marginTop: 6 },
  totalHint: { fontSize: 11, color: '#6B7280', marginTop: 8 },

  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reviewBannerTextWrap: { flex: 1, gap: 4 },
  reviewBannerTitle: { fontSize: 15, fontWeight: '800', color: '#0C4A6E' },
  reviewBannerSub: { fontSize: 13, color: '#0369A1', lineHeight: 18 },
  reviewLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reviewLineBtnText: { fontSize: 13, fontWeight: '800', color: '#1D4ED8' },
  reviewableHint: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  reviewableErrRow: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewableErrText: { fontSize: 13, color: '#B91C1C', fontWeight: '600', lineHeight: 19 },
});
