import { useListOrder } from '@/api/order/order.api';
import type { Order } from '@/api/order/order.type';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FFFBEB', text: AppEco.accent, dot: AppEco.accentSoft },
  shipping: { bg: AppEco.surfaceMuted, text: AppEco.primaryDark, dot: AppEco.primary },
  delivered: { bg: '#ECFDF5', text: '#065F46', dot: AppEco.success },
  cancelled: { bg: '#FEF2F2', text: AppEco.danger, dot: AppEco.danger },
};

const FILTERS = ['all', 'pending', 'shipping', 'delivered', 'cancelled'] as const;
const FILTER_LABELS: Record<string, string> = {
  all: 'Tất cả',
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

const METHOD_LABELS: Record<string, string> = {
  economy: 'Tiết kiệm',
  fast: 'Nhanh',
  express: 'Hỏa tốc',
};

export default function OrdersScreen() {
  const { data, isLoading, isError, error, refetch, isFetching } = useListOrder();
  const orders = data?.data?.orders ?? [];
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => String(o.status) === filter)),
    [orders, filter]
  );

  const errMsg =
    error && typeof error === 'object' && 'response' in error
      ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
      : '';

  const renderOrder = ({ item }: { item: Order }) => {
    const s = String(item.status);
    const clr = STATUS_COLORS[s] ?? { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
    const label = STATUS_LABELS[s] ?? s;
    const ship =
      item.shippingMethod != null
        ? METHOD_LABELS[String(item.shippingMethod)] ?? String(item.shippingMethod)
        : null;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/order/${item._id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <MaterialCommunityIcons name="receipt-text-outline" size={16} color={AppEco.primary} />
            <Text style={styles.orderId}>#{item.orderCode || item._id.slice(-8)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: clr.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: clr.dot }]} />
            <Text style={[styles.statusText, { color: clr.text }]}>{label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={AppEco.textMuted} />
            <Text style={styles.detailText}>{item.items?.length ?? 0} sản phẩm</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color={AppEco.textMuted} />
            <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
          {item.shippingAddress && typeof item.shippingAddress === 'object' && 'city' in item.shippingAddress ? (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={AppEco.textMuted} />
              <Text style={styles.detailText} numberOfLines={1}>
                {String((item.shippingAddress as { city?: string }).city ?? '')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.payMethod}>
            <Ionicons name="bicycle-outline" size={13} color={AppEco.textMuted} /> {ship ?? '—'}
          </Text>
          <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHero
        title="Lịch sử đơn hàng"
        subtitle="Theo dõi trạng thái các đơn đã đặt"
        onBack={() => router.back()}
      />

      <View style={styles.filterWrap}>
        <FlatList
          data={[...FILTERS]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(f) => f}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading && !data ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
        </View>
      ) : isError ? (
        <View style={styles.loadingBox}>
          <Text style={styles.errText}>{errMsg || 'Không tải được danh sách đơn.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o._id}
          renderItem={renderOrder}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor={AppEco.primary} />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="receipt-text-outline" size={44} color={AppEco.primarySubtle} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
              <Text style={styles.emptySub}>Các đơn hàng của bạn sẽ xuất hiện ở đây sau khi đặt mua</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },

  filterWrap: {
    backgroundColor: AppEco.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppEco.borderSoft,
  },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: AppEco.surfaceMuted,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: { backgroundColor: AppEco.primaryMuted, borderColor: AppEco.border },
  filterTabText: { fontSize: 13, fontWeight: '600', color: AppEco.textSecondary },
  filterTabTextActive: { color: AppEco.primaryDark },

  listContent: { padding: 16, paddingBottom: 30 },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 14, color: AppEco.textSecondary },
  errText: { fontSize: 14, color: AppEco.danger, textAlign: 'center' },
  retryBtn: {
    backgroundColor: AppEco.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: AppEco.radiusMd,
    ...AppEco.shadowCard,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderId: { fontSize: 15, fontWeight: '800', color: AppEco.text },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppEco.borderSoft, marginVertical: 12 },
  detailRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 13, color: AppEco.textSecondary, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payMethod: { fontSize: 13, color: AppEco.textMuted, fontWeight: '500' },
  totalPrice: { fontSize: 18, fontWeight: '900', color: AppEco.primary },

  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text },
  emptySub: { fontSize: 14, color: AppEco.textMuted, textAlign: 'center', lineHeight: 21 },
});
