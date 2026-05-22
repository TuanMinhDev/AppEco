import { apiClient } from '@/src/api/client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  DeleteNotificationResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
  NotificationListResponse,
} from './notification.type';

const base = '/notification';

const PAGE_SIZE = 20;

export const notificationKey = {
  root: ['notification'] as const,
  summary: ['notification', 'summary'] as const,
  infinite: ['notification', 'infinite'] as const,
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  isRead?: boolean;
};

export const notificationApis = {
  list: (params: NotificationListParams = {}) => {
    const { page = 1, limit = PAGE_SIZE, isRead } = params;
    return apiClient
      .get<NotificationListResponse>(base, {
        params: {
          page,
          limit,
          ...(typeof isRead === 'boolean' ? { isRead } : {}),
        },
      })
      .then((r) => r.data);
  },

  markRead: (id: string) =>
    apiClient
      .put<MarkNotificationReadResponse>(`${base}/${encodeURIComponent(id)}/read`)
      .then((r) => r.data),

  markAllRead: () =>
    apiClient
      .put<MarkAllNotificationsReadResponse>(`${base}/read-all`)
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient
      .delete<DeleteNotificationResponse>(`${base}/${encodeURIComponent(id)}`)
      .then((r) => r.data),
};

function invalidateNotificationQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: notificationKey.root });
}

/** Gọi nhẹ (page=1, limit=1) để lấy unreadCount cho badge. */
export const useNotificationUnreadSummary = (enabled: boolean) => {
  return useQuery({
    queryKey: notificationKey.summary,
    queryFn: () => notificationApis.list({ page: 1, limit: 1 }),
    select: (d) => ({ unreadCount: d.unreadCount }),
    enabled,
    staleTime: 30 * 1000,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) return false;
      return count < 2;
    },
  });
};

export const useNotificationsInfinite = (enabled: boolean) => {
  return useInfiniteQuery({
    queryKey: notificationKey.infinite,
    queryFn: ({ pageParam }) =>
      notificationApis.list({ page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, pages } = last.pagination;
      return page < pages ? page + 1 : undefined;
    },
    enabled,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) return false;
      return count < 2;
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApis.markRead(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApis.markAllRead(),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
};

export const useDeleteNotification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApis.delete(id),
    onSuccess: () => invalidateNotificationQueries(qc),
  });
};
