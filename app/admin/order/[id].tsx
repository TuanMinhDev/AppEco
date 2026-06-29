import {
  useSellerOrderDetail,
  useUpdateOrderStatus,
} from '@/api/order/order.api';
import type {
  OrderLineItemResolved,
  OrderShippingAddressSnapshot,
  OrderStatus,
} from '@/api/order/order.type';
import {
  useCreateShipment,
  useCancelShipment,
  useShipmentStatus,
} from '@/api/shipping/shipping.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { useToast } from '@/components/toast/ToastProvider';
import {
  getShippingStatusLabel,
  getShippingStatusColor,
  resolveGhtkTrackingUrl,
} from '@/utils/ghtk.utils';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

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

function buyerFromOrder(order: { userId?: unknown }): {
  name: string;
  phone?: string;
  email?: string;
} {
  const u = order.userId;
  if (u && typeof u === 'object') {
    const o = u as Record<string, string | undefined>;
    return {
      name: o.name ?? 'Khách',
      phone: o.phoneNumber,
      email: o.email,
    };
  }
  return { name: 'Khách hàng' };
}

export default function AdminSellerOrderDetailScreen() {
  const toast = useToast();
  const dialog = useAppDialog();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? rawId : rawId?.[0] ?? '';

  const { data: user, isLoading: authLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data: payload, isLoading, isError, error, refetch } =
    useSellerOrderDetail(id, !!id && isAdmin);
  const order = payload?.order;

  // ── GHTK Shipment ─────────────────────────────────────────────────
  const { data: shipmentData } = useShipmentStatus(id, !!order);

  const createShipment = useCreateShipment({
    onSuccess: (data) => {
      void refetch();
      toast.showSuccess(
        `Đăng đơn GHTK thành công!\nMã vận đơn: ${data.shipment.trackingNumber}`,
        { duration: 3000 },
      );
    },
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không đăng được đơn GHTK.'));
    },
  });

  const cancelShipment = useCancelShipment({
    onSuccess: () => {
      void refetch();
      toast.showSuccess('Đã hủy vận đơn GHTK.', { duration: 2000 });
    },
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không hủy được vận đơn.'));
    },
  });

  const updateStatus = useUpdateOrderStatus({
    onSuccess: () => {
      void refetch();
      toast.showSuccess('Đã cập nhật trạng thái đơn.', { duration: 2000 });
    },
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không cập nhật được trạng thái.'));
    },
  });

  const busy =
    updateStatus.isPending ||
    createShipment.isPending ||
    cancelShipment.isPending;

  const confirmStatus = (next: OrderStatus, title: string, body: string) => {
    dialog.showConfirm({
      title,
      message: body,
      confirmText: 'Xác nhận',
      onConfirm: () => updateStatus.mutate({ id, status: next }),
    });
  };

  const confirmCreateShipment = () => {
    dialog.showConfirm({
      title: 'Đăng đơn GHTK',
      message: 'Tạo vận đơn giao hàng qua GHTK? Đơn sẽ chuyển sang trạng thái đang giao.',
      confirmText: 'Đăng đơn',
      onConfirm: () => createShipment.mutate({ orderId: id }),
    });
  };

  const confirmCancelShipment = () => {
    dialog.showConfirm({
      title: 'Hủy vận đơn GHTK',
      message: 'Hủy vận đơn đã tạo trên GHTK? Đơn hàng sẽ bị hủy.',
      confirmText: 'Hủy vận đơn',
      onConfirm: () => cancelShipment.mutate({ orderId: id }),
    });
  };

  const handleOpenTracking = () => {
    const shipment = shipmentData?.shipment;
    if (!shipment) return;
    const url = resolveGhtkTrackingUrl(shipment);
    if (url) {
      void Linking.openURL(url);
    }
  };

  const errMsg =
    error && typeof error === 'object' && 'response' in error
      ? String(
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? '',
        )
      : '';

  if (authLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.deny}>Chỉ quản trị mới xem được.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <MaterialCommunityIcons name="alert" size={48} color="#EF4444" />
        <Text style={styles.err}>{errMsg || 'Không tải được đơn.'}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnTxt}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusKey = String(order.status);
  const buyer = buyerFromOrder(order);
  const addr = order.shippingAddress;
  const addrLines = isSnapshotAddr(addr)
    ? [
        `${addr.fullName} · ${addr.phoneNumber}`,
        [addr.address, addr.ward, (addr as OrderShippingAddressSnapshot).district, addr.province]
          .filter(Boolean)
          .join(', '),
      ]
    : [];

  // Shipment info
  const shipment = shipmentData?.shipment;
  const hasShipment = !!shipment?.trackingNumber;
  const shipmentStatus = shipment?.status;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn bán</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.code}>#{order.orderCode || order._id.slice(-8)}</Text>
          <Text style={styles.statusPill}>{STATUS_LABELS[statusKey] ?? statusKey}</Text>
          <Text style={styles.meta}>
            {new Date(order.createdAt).toLocaleString('vi-VN')}
          </Text>
        </View>

        {/* ── GHTK Shipping Card ──────────────────────────────────── */}
        {hasShipment ? (
          <View style={styles.card}>
            <View style={styles.ghtkHeader}>
              <MaterialCommunityIcons name="truck-delivery" size={20} color="#2563EB" />
              <Text style={styles.cardTitle}>Vận chuyển GHTK</Text>
            </View>

            <View style={styles.ghtkRow}>
              <Text style={styles.ghtkLabel}>Mã vận đơn</Text>
              <Text style={styles.ghtkValue}>{shipment?.trackingNumber}</Text>
            </View>

            <View style={styles.ghtkRow}>
              <Text style={styles.ghtkLabel}>Trạng thái</Text>
              <View
                style={[
                  styles.ghtkStatusBadge,
                  { backgroundColor: getShippingStatusColor(shipmentStatus) + '18' },
                ]}
              >
                <View
                  style={[
                    styles.ghtkStatusDot,
                    { backgroundColor: getShippingStatusColor(shipmentStatus) },
                  ]}
                />
                <Text
                  style={[
                    styles.ghtkStatusText,
                    { color: getShippingStatusColor(shipmentStatus) },
                  ]}
                >
                  {getShippingStatusLabel(shipmentStatus ?? null)}
                </Text>
              </View>
            </View>

            {shipment?.shippingFee ? (
              <View style={styles.ghtkRow}>
                <Text style={styles.ghtkLabel}>Phí vận chuyển</Text>
                <Text style={styles.ghtkValue}>
                  {formatPrice(shipment.shippingFee)}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.ghtkTrackBtn} onPress={handleOpenTracking}>
              <Ionicons name="location-outline" size={18} color="#2563EB" />
              <Text style={styles.ghtkTrackTxt}>Tra cứu vận đơn</Text>
              <Ionicons name="open-outline" size={16} color="#2563EB" />
            </TouchableOpacity>

            {/* Hủy vận đơn — chỉ khi đang pending hoặc chưa lấy hàng */}
            {shipmentStatus === 'pending' || shipmentStatus === 'delay_pickup' ? (
              <TouchableOpacity
                style={[styles.ghtkCancelBtn, busy && styles.dis]}
                disabled={busy}
                onPress={confirmCancelShipment}
              >
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.ghtkCancelTxt}>Hủy vận đơn</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Khách mua</Text>
          <Text style={styles.rowTxt}>{buyer.name}</Text>
          {buyer.phone ? <Text style={styles.rowTxtMuted}>{buyer.phone}</Text> : null}
          {buyer.email ? <Text style={styles.rowTxtMuted}>{buyer.email}</Text> : null}
        </View>

        {addrLines.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giao hàng</Text>
            {addrLines.map((line, i) => (
              <Text key={i} style={styles.rowTxt}>
                {line}
              </Text>
            ))}
            {order.notes ? (
              <Text style={styles.notes}>Ghi chú: {order.notes}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sản phẩm</Text>
          {order.items?.map((line, idx) => {
            const img = lineProductImage(line);
            return (
              <View key={idx} style={styles.lineRow}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPh]} />
                )}
                <View style={styles.lineBody}>
                  <Text style={styles.lineName} numberOfLines={2}>
                    {lineProductName(line)}
                  </Text>
                  <Text style={styles.lineMeta}>
                    {line.variant?.color} · {line.variant?.size} × {line.quantity}
                  </Text>
                  <Text style={styles.linePrice}>{formatPrice(line.price * line.quantity)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng</Text>
            <Text style={styles.totalVal}>{formatPrice(order.totalPrice)}</Text>
          </View>
        </View>

        {/* ── Actions khi pending ──────────────────────────────────── */}
        {statusKey === 'pending' ? (
          <View style={styles.actions}>
            {/* Nút đăng đơn GHTK — ưu tiên hiện trước */}
            {!hasShipment ? (
              <TouchableOpacity
                style={[styles.actionGhtk, busy && styles.dis]}
                disabled={busy}
                onPress={confirmCreateShipment}
              >
                {createShipment.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="truck-fast-outline" size={22} color="#fff" />
                )}
                <Text style={styles.actionGhtkTxt}>Đăng đơn GHTK</Text>
              </TouchableOpacity>
            ) : null}

            {/* Xác nhận thủ công (không qua GHTK) */}
            {!hasShipment ? (
              <TouchableOpacity
                style={[styles.actionSecondary, busy && styles.dis]}
                disabled={busy}
                onPress={() =>
                  confirmStatus(
                    'shipping',
                    'Giao thủ công',
                    'Xác nhận giao thủ công (không qua GHTK)?',
                  )
                }
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#2563EB" />
                <Text style={styles.actionSecondaryTxt}>Giao thủ công</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.actionDanger, busy && styles.dis]}
              disabled={busy}
              onPress={() =>
                confirmStatus(
                  'cancelled',
                  'Huỷ đơn',
                  'Khách sẽ thấy đơn ở trạng thái huỷ. Tiếp tục?',
                )
              }
            >
              <Ionicons name="close-circle-outline" size={22} color="#fff" />
              <Text style={styles.actionDangerTxt}>Huỷ đơn</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {statusKey === 'shipping' ? (
          <View style={styles.actions}>
            {!hasShipment ? (
              <TouchableOpacity
                style={[styles.actionPrimary, busy && styles.dis]}
                disabled={busy}
                onPress={() =>
                  confirmStatus(
                    'delivered',
                    'Hoàn tất',
                    'Xác nhận đơn đã giao cho khách?',
                  )
                }
              >
                <Ionicons name="bag-check-outline" size={22} color="#fff" />
                <Text style={styles.actionPrimaryTxt}>Đã giao hàng</Text>
              </TouchableOpacity>
            ) : null}

            {!hasShipment ? (
              <TouchableOpacity
                style={[styles.actionDanger, busy && styles.dis]}
                disabled={busy}
                onPress={() =>
                  confirmStatus('cancelled', 'Huỷ đơn', 'Huỷ đơn đang giao?')
                }
              >
                <Ionicons name="close-circle-outline" size={22} color="#fff" />
                <Text style={styles.actionDangerTxt}>Huỷ đơn</Text>
              </TouchableOpacity>
            ) : null}

            {/* Khi có GHTK shipment → hiện ghi chú GHTK tự cập nhật */}
            {hasShipment ? (
              <Text style={styles.ghtkNote}>
                Đơn đang giao qua GHTK. Trạng thái sẽ được cập nhật tự động qua webhook.
              </Text>
            ) : null}
          </View>
        ) : null}

        {statusKey === 'delivered' || statusKey === 'cancelled' ? (
          <Text style={styles.doneHint}>Không thể đổi trạng thái từ bước này.</Text>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  deny: { fontWeight: '800', color: '#475569' },
  link: { marginTop: 12, color: '#2563EB', fontWeight: '700' },
  err: { color: '#B91C1C', textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  scroll: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  code: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  statusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    fontWeight: '800',
    fontSize: 13,
  },
  meta: { marginTop: 8, fontSize: 13, color: '#64748B' },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowTxt: { fontSize: 15, color: '#334155', lineHeight: 22 },
  rowTxtMuted: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  notes: { marginTop: 10, fontSize: 13, color: '#0369A1', fontStyle: 'italic' },
  lineRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F1F5F9' },
  thumbPh: { justifyContent: 'center', alignItems: 'center' },
  lineBody: { flex: 1 },
  lineName: { fontWeight: '700', color: '#0F172A' },
  lineMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  linePrice: { fontSize: 14, fontWeight: '800', color: '#2563EB', marginTop: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '800' },
  totalVal: { fontSize: 20, fontWeight: '900', color: '#2563EB' },
  actions: { gap: 12, marginTop: 8 },

  // ── Nút đăng đơn GHTK ──────────────────────────────────────────
  actionGhtk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionGhtkTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // ── Nút giao thủ công (secondary) ──────────────────────────────
  actionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionSecondaryTxt: { color: '#2563EB', fontSize: 16, fontWeight: '800' },

  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionPrimaryTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  actionDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionDangerTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  dis: { opacity: 0.55 },
  doneHint: { textAlign: 'center', color: '#94A3B8', marginTop: 8, fontSize: 13 },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryBtnTxt: { color: '#fff', fontWeight: '800' },

  // ── GHTK Card styles ──────────────────────────────────────────
  ghtkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ghtkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  ghtkLabel: { fontSize: 14, color: '#64748B' },
  ghtkValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  ghtkStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ghtkStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ghtkStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ghtkTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  ghtkTrackTxt: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  ghtkCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  ghtkCancelTxt: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  ghtkNote: {
    textAlign: 'center',
    color: '#059669',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    paddingHorizontal: 8,
  },
});
