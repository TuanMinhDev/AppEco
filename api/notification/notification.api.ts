const URI = '/notification';

import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { 
  CreateNotificationPayload, 
  CreateBulkNotificationPayload,
  GetNotificationResponse, 
  GetNotificationsByUserResponse,
  GetUnreadCountResponse,
  CreateNotificationResponse,
  CreateBulkNotificationResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
  ClearAllNotificationsResponse
} from './notification.type';

export const notificationUri = {
  getNotification: (id: string) => `${URI}/${id}`,
  getNotificationsByUser: (userId: string) => `${URI}/user/${userId}`,
  getUnreadCount: (userId: string) => `${URI}/user/${userId}/unread-count`,
  createNotification: `${URI}`,
  createBulkNotification: `${URI}/bulk`,
  markAsRead: (id: string) => `${URI}/${id}/read`,
  markAllAsRead: (userId: string) => `${URI}/user/${userId}/read-all`,
  deleteNotification: (id: string) => `${URI}/${id}`,
  clearAllNotifications: (userId: string) => `${URI}/user/${userId}/clear-all`,
};

export const notificationKey = {
  GET_NOTIFICATION: 'GET_NOTIFICATION',
  GET_NOTIFICATIONS_BY_USER: 'GET_NOTIFICATIONS_BY_USER',
  GET_UNREAD_COUNT: 'GET_UNREAD_COUNT',
  CREATE_NOTIFICATION: 'CREATE_NOTIFICATION',
  CREATE_BULK_NOTIFICATION: 'CREATE_BULK_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
};

export const notificationApis = {
  getNotification: (id: string) => {
    return apiClient.get<GetNotificationResponse>(notificationUri.getNotification(id));
  },
  getNotificationsByUser: (userId: string) => {
    return apiClient.get<GetNotificationsByUserResponse>(notificationUri.getNotificationsByUser(userId));
  },
  getUnreadCount: (userId: string) => {
    return apiClient.get<GetUnreadCountResponse>(notificationUri.getUnreadCount(userId));
  },
  createNotification: (payload: CreateNotificationPayload) => {
    return apiClient.post<CreateNotificationResponse>(notificationUri.createNotification, payload);
  },
  createBulkNotification: (payload: CreateBulkNotificationPayload) => {
    return apiClient.post<CreateBulkNotificationResponse>(notificationUri.createBulkNotification, payload);
  },
  markAsRead: (id: string) => {
    return apiClient.patch<MarkAsReadResponse>(notificationUri.markAsRead(id));
  },
  markAllAsRead: (userId: string) => {
    return apiClient.patch<MarkAllAsReadResponse>(notificationUri.markAllAsRead(userId));
  },
  deleteNotification: (id: string) => {
    return apiClient.delete<DeleteNotificationResponse>(notificationUri.deleteNotification(id));
  },
  clearAllNotifications: (userId: string) => {
    return apiClient.delete<ClearAllNotificationsResponse>(notificationUri.clearAllNotifications(userId));
  },
};

export const useGetNotification = (id: string) => {
  return useQuery({
    queryKey: [notificationKey.GET_NOTIFICATION, id],
    queryFn: () => notificationApis.getNotification(id),
    select: (data) => data,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetNotificationsByUser = (userId: string) => {
  return useQuery({
    queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER, userId],
    queryFn: () => notificationApis.getNotificationsByUser(userId),
    select: (data) => data,
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetUnreadCount = (userId: string) => {
  return useQuery({
    queryKey: [notificationKey.GET_UNREAD_COUNT, userId],
    queryFn: () => notificationApis.getUnreadCount(userId),
    select: (data) => data,
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateNotification = (props?: {
  onSuccess?: (data: CreateNotificationResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) => notificationApis.createNotification(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_UNREAD_COUNT],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useCreateBulkNotification = (props?: {
  onSuccess?: (data: CreateBulkNotificationResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: CreateBulkNotificationPayload) => notificationApis.createBulkNotification(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useMarkAsRead = (props?: {
  onSuccess?: (data: MarkAsReadResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) => notificationApis.markAsRead(id),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATION, variables],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_UNREAD_COUNT],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useMarkAllAsRead = (props?: {
  onSuccess?: (data: MarkAllAsReadResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (userId: string) => notificationApis.markAllAsRead(userId),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER, variables],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_UNREAD_COUNT, variables],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useDeleteNotification = (props?: {
  onSuccess?: (data: DeleteNotificationResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) => notificationApis.deleteNotification(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(_.data);
    },
    onError,
  });
};

export const useClearAllNotifications = (props?: {
  onSuccess?: (data: ClearAllNotificationsResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (userId: string) => notificationApis.clearAllNotifications(userId),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_NOTIFICATIONS_BY_USER, variables],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [notificationKey.GET_UNREAD_COUNT, variables],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};
