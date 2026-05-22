import { NotificationList } from '@/components/notifications/NotificationList';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { useAuthSocket } from '@/hooks/useAuthSocket';
import { NotificationData } from '@/hooks/useSocket';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function NotificationsScreen() {
  const { notifications } = useAuthSocket();

  const handleNotificationPress = (notification: NotificationData) => {
    switch (notification.type) {
      case 'order':
        if (notification.relatedId) {
          router.push(`/order/${notification.relatedId}` as any);
        }
        break;
      case 'general':
        break;
      case 'system':
        break;
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHero
        title="Thông báo"
        subtitle="Cập nhật đơn hàng và ưu đãi"
        onBack={() => router.back()}
      />

      <NotificationList
        notifications={notifications.notifications}
        unreadCount={notifications.unreadCount}
        onNotificationPress={handleNotificationPress}
        onMarkAsRead={notifications.markAsRead}
        onMarkAllAsRead={notifications.markAllAsRead}
        onClearAll={notifications.clearNotifications}
        onRefresh={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppEco.background,
  },
});
