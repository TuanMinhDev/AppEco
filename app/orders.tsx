import { useListOrder } from '@/api/order/order.api';
import type { Order } from '@/api/order/order.type';
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
import { SafeAreaView } from 'react-native-safe-area-context';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
  shipping: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  delivered: { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  cancelled: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
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
            <MaterialCommunityIcons name="receipt-text-outline" size={16} color="#0EA5E9" />
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
            <Ionicons name="cube-outline" size={14} color="#9CA3AF" />
            <Text style={styles.detailText}>{item.items?.length ?? 0} sản phẩm</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
            <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
          </View>
          {item.shippingAddress && typeof item.shippingAddress === 'object' && 'city' in item.shippingAddress ? (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.detailText} numberOfLines={1}>
                {String((item.shippingAddress as { city?: string }).city ?? '')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.payMethod}>
            <Ionicons name="bicycle-outline" size={13} color="#9CA3AF" /> {ship ?? '—'}
          </Text>
          <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
        <View style={{ width: 38 }} />
      </View>

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
          <ActivityIndicator size="large" color="#0EA5E9" />
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
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} tintColor="#0EA5E9" />
          }
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="receipt-text-outline" size={44} color="#7DD3FC" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
              <Text style={styles.emptySub}>Các đơn hàng của bạn sẽ xuất hiện ở đây sau khi đặt mua</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
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

  filterWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#0284C7' },

  listContent: { padding: 16, paddingBottom: 30 },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280' },
  errText: { fontSize: 14, color: '#B91C1C', textAlign: 'center' },
  retryBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderId: { fontSize: 15, fontWeight: '800', color: '#111827' },
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
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  detailRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payMethod: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  totalPrice: { fontSize: 18, fontWeight: '900', color: '#0EA5E9' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#374151' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 21 },
});
