import { useAppDispatch, useAppSelector } from '@/src/store';
import {
    clearNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    selectNotifications,
    selectUnreadNotificationsCount,
} from '@/src/store/slices/ordersSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);

  const handleMarkAsRead = (notificationId: string) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleClearAll = () => {
    Alert.alert(
      'Xóa tất cả thông báo',
      'Bạn có chắc muốn xóa tất cả thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => dispatch(clearNotifications()),
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_success':
        return 'check-circle';
      case 'order_cancelled':
        return 'close-circle';
      case 'order_delivered':
        return 'truck-delivery';
      default:
        return 'information';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_success':
        return '#4CAF50';
      case 'order_cancelled':
        return '#FF6B6B';
      case 'order_delivered':
        return '#2196F3';
      default:
        return '#FFD700';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderNotification = (notification: any) => {
    const iconColor = getNotificationColor(notification.type);
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadNotification,
        ]}
        onPress={() => handleMarkAsRead(notification.id)}
      >
        <View style={styles.notificationLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
            <MaterialCommunityIcons
              name={getNotificationIcon(notification.type)}
              size={20}
              color="#fff"
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={[
              styles.notificationTitle,
              !notification.read && styles.unreadTitle,
            ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(notification.timestamp)}
            </Text>
          </View>
        </View>
        {!notification.read && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <View style={styles.actionButtons}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFD700" />
                <Text style={styles.actionButtonText}>Đã đọc tất cả</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
                Xóa tất cả
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={64}
                color="rgba(255,255,255,0.2)"
              />
              <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>
                Các thông báo của bạn sẽ hiển thị ở đây
              </Text>
            </View>
          ) : (
            notifications.map(renderNotification)
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 0,
  },

  // Notification Card
  notificationCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadNotification: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#FFD700',
  },
  notificationMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 20,
  },
});
