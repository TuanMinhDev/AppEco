/** Khớp FE_NOTIFICATION_API.md — dùng `message`, không dùng `content`. */

export type NotificationItemType =
  | 'order'
  | 'payment'
  | 'promotion'
  | 'system'
  | 'comment'
  | 'favorite'
  | 'general';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationItemType | string;
  relatedId?: string;
  relatedModel?: string;
  isRead: boolean;
  priority?: string;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string | null;
  sentAt: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface NotificationListResponse {
  message: string;
  notifications: NotificationItem[];
  pagination: NotificationListPagination;
  unreadCount: number;
}

export interface MarkNotificationReadResponse {
  message: string;
  notification: NotificationItem;
}

export interface MarkAllNotificationsReadResponse {
  message: string;
}

export interface DeleteNotificationResponse {
  message: string;
}
