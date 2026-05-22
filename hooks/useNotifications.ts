import { useToast } from '@/components/toast/ToastProvider';
import { useEffect, useState } from 'react';
import { NotificationData, useSocket } from './useSocket';

export interface NotificationHookOptions {
  showToast?: boolean;
  maxNotifications?: number;
}

export const useNotifications = (
  userId: string | null,
  options: NotificationHookOptions = {},
) => {
  const { showToast = true, maxNotifications = 50 } = options;
  const { showSuccess } = useToast();
  const { onNotification, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConnected || !onNotification) return;

    const unsubscribe = onNotification((notification: NotificationData) => {
      setNotifications((prev) => {
        const updated = [notification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      if (showToast) {
        const { title, message } = notification;
        showSuccess(`${title}: ${message}`, { duration: 2800 });
      }
    });

    return unsubscribe;
  }, [isConnected, onNotification, showToast, maxNotifications, showSuccess]);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    );

    const notification = notifications.find((n) => n._id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true })),
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationsByType = (type: NotificationData['type']) => {
    return notifications.filter((notif) => notif.type === type);
  };

  const getOrderNotifications = () => {
    return notifications.filter((notif) => notif.type === 'order');
  };

  const getUnreadNotifications = () => {
    return notifications.filter((notif) => !notif.isRead);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationsByType,
    getOrderNotifications,
    getUnreadNotifications,
  };
};
