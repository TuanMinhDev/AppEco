import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  clearNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  Notification,
  selectNotifications,
  selectUnreadNotificationsCount,
} from '@/src/store/slices/ordersSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotifType = Notification['type'];

function getIcon(type: NotifType): { name: any; bg: string; color: string } {
  switch (type) {
    case 'order_success': return { name: 'checkmark-circle', bg: '#ECFDF5', color: '#10B981' };
    case 'order_cancelled': return { name: 'close-circle', bg: '#FEF2F2', color: '#EF4444' };
    case 'order_delivered': return { name: 'cube', bg: '#F0F9FF', color: '#0EA5E9' };
    default: return { name: 'information-circle', bg: '#FFFBEB', color: '#F59E0B' };
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

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);

  const handleClearAll = () =>
    Alert.alert('Xóa tất cả', 'Bạn có chắc muốn xóa tất cả thông báo?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => dispatch(clearNotifications()) },
    ]);

  const renderItem = ({ item }: { item: Notification }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => dispatch(markNotificationAsRead(item.id))}
        activeOpacity={0.75}
      >
        {/* Unread accent bar */}
        {!item.read && <View style={styles.accentBar} />}

        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={24} color={icon.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} chưa đọc</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={() => dispatch(markAllNotificationsAsRead())}>
              <Ionicons name="checkmark-done" size={16} color="#0EA5E9" />
              <Text style={styles.headerBtnText}>Đọc tất cả</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={[styles.headerBtn, styles.headerBtnDanger]} onPress={handleClearAll}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="bell-off-outline" size={44} color="#7DD3FC" />
            </View>
            <Text style={styles.emptyTitle}>Không có thông báo</Text>
            <Text style={styles.emptySub}>Các thông báo mới sẽ xuất hiện ở đây</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#111827' },
  headerSub: { fontSize: 13, color: '#0EA5E9', fontWeight: '600', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  headerBtnText: { fontSize: 13, fontWeight: '700', color: '#0EA5E9' },
  headerBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    paddingHorizontal: 10,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  sep: { height: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  cardUnread: {
    backgroundColor: '#FAFBFF',
    borderColor: '#E0F2FE',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: '#0EA5E9',
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', flex: 1, marginRight: 8 },
  cardTitleUnread: { color: '#111827' },
  cardTime: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  cardMsg: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
