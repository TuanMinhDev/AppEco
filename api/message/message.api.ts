/**
 * API service cho Message / Conversation.
 *
 * Đặc biệt: createOrGetConversation đảm bảo 1 user vs 1 user chỉ có 1 room.
 * Backend trả về room đã tồn tại (200) hoặc tạo mới (201).
 */

import { apiClient } from '@/src/api/client';
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import type {
  Conversation,
  CreateConversationRequest,
  CreateConversationResponse,
  GetConversationsResponse,
  GetMessagesResponse,
  GetMessagesQuery,
  SendMessageRequest,
  SendMessageResponse,
} from './message.type';

const URL = '/message';

// ─── Query keys ─────────────────────────────────────────────

export const messageKeys = {
  CONVERSATIONS: 'CONVERSATIONS',
  CONVERSATION_DETAIL: 'CONVERSATION_DETAIL',
  MESSAGES: 'MESSAGES',
};

// ─── API functions ──────────────────────────────────────────

export const messageApis = {
  /**
   * Tạo hoặc lấy conversation 1-1 với một user.
   * Backend đảm bảo: 1 cặp user chỉ có 1 room.
   * - Nếu room đã tồn tại → trả về room cũ (200)
   * - Nếu chưa có → tạo mới (201)
   */
  createOrGetConversation: (data: CreateConversationRequest) =>
    apiClient.post<CreateConversationResponse>(`${URL}/conversation`, data),

  /** Lấy tất cả conversations của user (sort theo tin nhắn mới nhất) */
  getConversations: () =>
    apiClient.get<GetConversationsResponse>(`${URL}/conversations`),

  /** Lấy chi tiết 1 conversation */
  getConversationById: (id: string) =>
    apiClient.get<{ message: string; conversation: Conversation }>(
      `${URL}/conversation/${id}`
    ),

  /** Gửi tin nhắn */
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<SendMessageResponse>(`${URL}/send`, data),

  /** Lấy tin nhắn trong conversation (phân trang) */
  getMessages: (conversationId: string, params?: GetMessagesQuery) =>
    apiClient.get<GetMessagesResponse>(`${URL}/messages/${conversationId}`, {
      params,
    }),

  /** Đánh dấu đã đọc */
  markAsRead: (conversationId: string, messageIds?: string[]) =>
    apiClient.put<{ message: string }>(
      `${URL}/read/${conversationId}`,
      messageIds ? { messageIds } : {}
    ),

  /** Xóa tin nhắn (soft delete cho user hiện tại) */
  deleteMessage: (messageId: string) =>
    apiClient.delete<{ message: string }>(`${URL}/message/${messageId}`),

  /** Sửa tin nhắn */
  editMessage: (messageId: string, content: string) =>
    apiClient.put<SendMessageResponse>(`${URL}/message/${messageId}`, {
      content,
    }),
};

// ─── React Query Hooks ──────────────────────────────────────

/**
 * Hook: Lấy danh sách conversations.
 * Tự động sort theo tin nhắn mới nhất.
 */
export const useConversations = () => {
  return useQuery({
    queryKey: [messageKeys.CONVERSATIONS],
    queryFn: () => messageApis.getConversations(),
    select: (res) => res.data.conversations,
  });
};

/**
 * Hook: Lấy chi tiết conversation.
 */
export const useConversationDetail = (id: string) => {
  return useQuery({
    queryKey: [messageKeys.CONVERSATION_DETAIL, id],
    queryFn: () => messageApis.getConversationById(id),
    select: (res) => res.data.conversation,
    enabled: !!id,
  });
};

/**
 * Hook: Lấy messages với infinite scroll (load thêm trang cũ).
 */
export const useMessages = (conversationId: string, limit = 50) => {
  return useInfiniteQuery({
    queryKey: [messageKeys.MESSAGES, conversationId, limit],
    queryFn: ({ pageParam }) =>
      messageApis.getMessages(conversationId, { page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.data.pagination;
      return page < pages ? page + 1 : undefined;
    },
    enabled: !!conversationId,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      // Flatten tất cả trang thành 1 mảng messages
      messages: data.pages.flatMap((page) => page.data.messages),
    }),
  });
};

/**
 * Hook: Tạo hoặc lấy conversation 1-1.
 * Sau khi tạo, tự invalidate danh sách conversations.
 */
export const useCreateOrGetConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationRequest) =>
      messageApis.createOrGetConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [messageKeys.CONVERSATIONS],
      });
    },
  });
};

/**
 * Hook: Gửi tin nhắn.
 * Sau khi gửi, invalidate messages + conversations (để cập nhật lastMessage).
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messageApis.sendMessage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [messageKeys.MESSAGES, variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: [messageKeys.CONVERSATIONS],
      });
    },
  });
};

/**
 * Hook: Đánh dấu đã đọc.
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageIds,
    }: {
      conversationId: string;
      messageIds?: string[];
    }) => messageApis.markAsRead(conversationId, messageIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [messageKeys.MESSAGES, variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: [messageKeys.CONVERSATIONS],
      });
    },
  });
};

/**
 * Hook: Xóa tin nhắn.
 */
export const useDeleteMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageApis.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [messageKeys.MESSAGES, conversationId],
      });
    },
  });
};

/**
 * Hook: Sửa tin nhắn.
 */
export const useEditMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messageApis.editMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [messageKeys.MESSAGES, conversationId],
      });
    },
  });
};
