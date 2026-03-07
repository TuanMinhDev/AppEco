export type Notification = {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateNotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'promotion' | 'system';
};

export type CreateBulkNotificationPayload = {
  notifications: Omit<CreateNotificationPayload, 'userId'>[];
  userIds: string[];
};

export type GetNotificationResponse = {
  message: string;
  notification: Notification;
};

export type GetNotificationsByUserResponse = {
  message: string;
  notifications: Notification[];
};

export type GetUnreadCountResponse = {
  message: string;
  unreadCount: number;
};

export type CreateNotificationResponse = {
  message: string;
  notification: Notification;
};

export type CreateBulkNotificationResponse = {
  message: string;
  notifications: Notification[];
};

export type MarkAsReadResponse = {
  message: string;
  notification: Notification;
};

export type MarkAllAsReadResponse = {
  message: string;
  updatedCount: number;
};

export type DeleteNotificationResponse = {
  message: string;
};

export type ClearAllNotificationsResponse = {
  message: string;
  deletedCount: number;
};
