import { useListSellerOrders } from '@/api/order/order.api';
import type { Order } from '@/api/order/order.type';
import { useGetCurrentUser } from '@/api/user/user.api';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function formatPrice(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function buyerLabel(order: Order): string {
  const u = order.userId as unknown;
  if (u && typeof u === 'object' && 'name' in u) {
    return String((u as { name: string }).name);
  }
  return 'Khách hàng';
}

export default function AdminOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, refetch, isFetching } = useListSellerOrders(
    user?._id,
    !!user && isAdmin,
  );
  const orders = data?.orders ?? [];
  const [filter, setFilter] = useState<string>('all');

  const filtered = useMemo(
    () =>
      filter === 'all' ? orders : orders.filter((o) => String(o.status) === filter),
    [orders, filter],
  );

  if (userLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={AppEco.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={48} color={AppEco.textMuted} />
        <Text style={styles.deny}>Chỉ dành cho quản trị</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHero
        title="Đơn bán"
        subtitle="Xác nhận, giao hàng và huỷ đơn của cửa hàng bạn"
        onBack={() => router.back()}
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const label =
            f === 'all'
              ? 'Tất cả'
              : STATUS_LABELS[f] ?? f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o._id}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Không có đơn trong bộ lọc</Text>
            </View>
          }
          renderItem={({ item }) => {
            const s = String(item.status);
            const clr = STATUS_COLORS[s] ?? STATUS_COLORS.pending;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/admin/order/${item._id}` as never)}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.code}>#{item.orderCode || item._id.slice(-8)}</Text>
                  <View style={[styles.badge, { backgroundColor: clr.bg }]}>
                    <View style={[styles.dot, { backgroundColor: clr.dot }]} />
                    <Text style={[styles.badgeTxt, { color: clr.text }]}>
                      {STATUS_LABELS[s] ?? s}
                    </Text>
                  </View>
                </View>
                <Text style={styles.buyer}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />{' '}
                  {buyerLabel(item)}
                </Text>
                <View style={styles.cardFoot}>
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </Text>
                  <Text style={styles.total}>{formatPrice(item.totalPrice)}</Text>
                </View>
                {s === 'pending' ? (
                  <Text style={styles.hintTap}>Chạm để xác nhận / huỷ đơn</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  code: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 12, fontWeight: '800' },
  buyer: { fontSize: 14, color: '#475569', marginBottom: 8 },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: 12, color: '#94A3B8' },
  total: { fontSize: 16, fontWeight: '900', color: '#2563EB' },
  hintTap: { marginTop: 10, fontSize: 12, color: '#2563EB', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyText: { color: '#94A3B8', fontWeight: '600' },
  deny: { fontSize: 17, fontWeight: '800', color: '#475569', marginTop: 12 },
  btn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '800' },
});
