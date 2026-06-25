import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
} from '@/api/notification/notification.api';
import type { NotificationItem } from '@/api/notification/notification.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { ScreenHero, ScreenHeroChip } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { useToast } from '@/components/toast/ToastProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
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

import { getApiErrorMessage } from '@/utils/api-error-message';

function getIcon(type: string): { name: string; bg: string; color: string } {
  switch (type) {
    case 'order':
      return { name: 'bag-handle-outline', bg: '#F3F4F6', color: AppEco.primary };
    case 'payment':
      return { name: 'card-outline', bg: '#F5F3FF', color: '#7C3AED' };
    case 'promotion':
      return { name: 'pricetag-outline', bg: '#FFFBEB', color: '#D97706' };
    case 'system':
      return { name: 'settings-outline', bg: '#F1F5F9', color: '#475569' };
    case 'comment':
      return { name: 'chatbubble-outline', bg: '#F3F4F6', color: '#059669' };
    case 'favorite':
      return { name: 'heart-outline', bg: '#FEF2F2', color: '#DC2626' };
    case 'general':
    default:
      return { name: 'notifications-outline', bg: '#F3F4F6', color: AppEco.primary };
  }
}

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  if (h < 24) return `${h} giờ trước`;
  if (d < 7) return `${d} ngày trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

function orderIdFromItem(n: NotificationItem): string | undefined {
  if (n.relatedModel === 'Order' && n.relatedId) return n.relatedId;
  const m = n.metadata;
  if (m && typeof m.orderId === 'string') return m.orderId;
  if (m && typeof m.order_id === 'string') return m.order_id;
  return undefined;
}

function openNotification(n: NotificationItem) {
  if (n.type === 'order' && n.relatedModel === 'Order') {
    const oid = orderIdFromItem(n);
    if (oid) {
      router.push(`/order/${oid}` as any);
      return;
    }
  }
  if (n.actionUrl && typeof n.actionUrl === 'string' && n.actionUrl.startsWith('/')) {
    router.push(n.actionUrl as any);
  }
}

export default function NotificationsScreen() {
  const toast = useToast();
  const dialog = useAppDialog();
  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const isLoggedIn = meOk && !!me?._id;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfinite(isLoggedIn);

  const { mutate: markRead, isPending: markingOne } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteNotif, isPending: deleting } = useDeleteNotification();

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.notifications) ?? [],
    [data?.pages],
  );
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  const errMsg =
    error && typeof error === 'object' && 'response' in error
      ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
      : '';

  const handlePressItem = useCallback(
    (n: NotificationItem) => {
      if (!n.isRead) {
        markRead(n._id, {
          onError: (e: unknown) =>
            toast.showError(getApiErrorMessage(e, 'Không đánh dấu đã đọc được.')),
          onSettled: () => openNotification(n),
        });
      } else {
        openNotification(n);
      }
    },
    [markRead, toast],
  );

  const handleDelete = useCallback(
    (n: NotificationItem) => {
      dialog.showConfirm({
        title: 'Xóa thông báo',
        message: 'Bạn có chắc muốn xóa thông báo này?',
        confirmText: 'Xóa',
        destructive: true,
        onConfirm: () =>
          deleteNotif(n._id, {
            onSuccess: () => toast.showSuccess('Đã xoá thông báo.', { duration: 1800 }),
            onError: (e: unknown) => {
              toast.showError(getApiErrorMessage(e, 'Không xoá được.'));
            },
          }),
      });
    },
    [deleteNotif, dialog, toast],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => {
      const icon = getIcon(item.type);
      return (
        <View style={[styles.card, !item.isRead && styles.cardUnread]}>
          {!item.isRead && <View style={styles.accentBar} />}
          <TouchableOpacity
            style={styles.cardMain}
            onPress={() => handlePressItem(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
              <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={22} color={icon.color} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardTime}>{formatTime(item.sentAt)}</Text>
              </View>
              <Text style={styles.cardMsg} numberOfLines={3}>
                {item.message}
              </Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            disabled={deleting}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      );
    },
    [handleDelete, handlePressItem, deleting],
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <MaterialCommunityIcons name="bell-outline" size={56} color="#94A3B8" />
        <Text style={styles.guestTitle}>Đăng nhập để xem thông báo</Text>
        <Text style={styles.guestSub}>Cập nhật đơn hàng và tin mới từ cửa hàng.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push(`/(auth)/login?redirect=${encodeURIComponent('/(tabs)/notifications')}` as any)
          }
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        title="Thông báo"
        subtitle={
          unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Cập nhật đơn hàng và ưu đãi'
        }
        balanceBack={false}
        rightAction={
          unreadCount > 0 ? (
            <ScreenHeroChip
              icon="checkmark-done"
              label="Đọc tất cả"
              loading={markingAll}
              onPress={() =>
                markAllRead(undefined, {
                  onSuccess: () =>
                    toast.showSuccess('Đã đánh dấu đã đọc.', { duration: 1800 }),
                  onError: (e: unknown) => {
                    toast.showError(getApiErrorMessage(e, 'Không thể đánh dấu đã đọc.'));
                  },
                })
              }
            />
          ) : undefined
        }
      />

      {isLoading && !data ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loaderText}>Đang tải...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.guestTitle}>Không tải được</Text>
          <Text style={styles.errSub}>{errMsg || 'Vui lòng thử lại.'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void refetch()} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n._id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={AppEco.primary} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoader} color={AppEco.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="bell-off-outline" size={44} color={AppEco.primaryLight} />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptySub}>Các thông báo mới sẽ xuất hiện ở đây</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  sep: { height: 8 },

  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: AppEco.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#F3F4F6',
    borderColor: AppEco.border,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: AppEco.primary,
    borderRadius: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: AppEco.textSecondary, flex: 1, marginRight: 8 },
  cardTitleUnread: { color: AppEco.text },
  cardTime: { fontSize: 11, color: AppEco.textMuted, fontWeight: '500' },
  cardMsg: { fontSize: 13, color: AppEco.textSecondary, lineHeight: 19 },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: AppEco.primary,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  deleteBtn: {
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },

  emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text },
  emptySub: { fontSize: 14, color: AppEco.textMuted, textAlign: 'center', lineHeight: 21 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  guestTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text, textAlign: 'center' },
  guestSub: { fontSize: 14, color: AppEco.textSecondary, textAlign: 'center', lineHeight: 22 },
  errSub: { fontSize: 14, color: AppEco.textSecondary, textAlign: 'center' },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: AppEco.primary,
    borderRadius: 24,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 15, color: AppEco.textSecondary, fontWeight: '600' },
  footerLoader: { marginVertical: 16 },
});
