/**
 * API service cho Message / Conversation (user ↔ admin).
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
  GetConversationsResponse,
  GetMessagesQuery,
  GetMessagesResponse,
  MyConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
} from './message.type';
import { isMediaMessageRequest } from './message.type';

const URL = '/message';

export const messageKeys = {
  CONVERSATIONS: 'CONVERSATIONS',
  MY_CONVERSATION: 'MY_CONVERSATION',
  CONVERSATION_DETAIL: 'CONVERSATION_DETAIL',
  MESSAGES: 'MESSAGES',
};

export const messageApis = {
  /** User: lấy (hoặc tạo) cuộc trò chuyện duy nhất với admin */
  getMyConversation: () =>
    apiClient.get<MyConversationResponse>(`${URL}/my-conversation`),

  /** Danh sách conversations — user: 1 phần tử; admin: tất cả */
  getConversations: () =>
    apiClient.get<GetConversationsResponse>(`${URL}/conversations`),

  getConversationById: (id: string) =>
    apiClient.get<{ message: string; conversation: Conversation }>(
      `${URL}/conversation/${id}`,
    ),

  sendMessage: (data: SendMessageRequest) => {
    if (isMediaMessageRequest(data)) {
      const form = new FormData();
      form.append('file', data.file as never);
      if (data.content?.trim()) form.append('content', data.content.trim());
      if (data.conversationId) form.append('conversationId', data.conversationId);
      if (data.replyTo) form.append('replyTo', data.replyTo);
      return apiClient.post<SendMessageResponse>(`${URL}/send`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    const body: Record<string, string> = { content: data.content };
    if (data.conversationId) body.conversationId = data.conversationId;
    if (data.replyTo) body.replyTo = data.replyTo;
    return apiClient.post<SendMessageResponse>(`${URL}/send`, body);
  },

  getMessages: (conversationId: string, params?: GetMessagesQuery) =>
    apiClient.get<GetMessagesResponse>(`${URL}/messages/${conversationId}`, {
      params,
    }),

  markAsRead: (conversationId: string, messageIds?: string[]) =>
    apiClient.put<{ message: string }>(
      `${URL}/read/${conversationId}`,
      messageIds ? { messageIds } : {},
    ),

  deleteMessage: (messageId: string) =>
    apiClient.delete<{ message: string }>(`${URL}/message/${messageId}`),

  editMessage: (messageId: string, content: string) =>
    apiClient.put<SendMessageResponse>(`${URL}/message/${messageId}`, {
      content,
    }),
};

export const useMyConversation = (enabled = true) => {
  return useQuery({
    queryKey: [messageKeys.MY_CONVERSATION],
    queryFn: () => messageApis.getMyConversation(),
    select: (res) => res.data.conversation,
    enabled,
  });
};

export const useConversations = (enabled = true) => {
  return useQuery({
    queryKey: [messageKeys.CONVERSATIONS],
    queryFn: () => messageApis.getConversations(),
    select: (res) => res.data.conversations,
    enabled,
  });
};

export const useConversationDetail = (id: string) => {
  return useQuery({
    queryKey: [messageKeys.CONVERSATION_DETAIL, id],
    queryFn: () => messageApis.getConversationById(id),
    select: (res) => res.data.conversation,
    enabled: !!id,
  });
};

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
      messages: data.pages.flatMap((page) => page.data.messages),
    }),
  });
};

function invalidateConversationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId?: string,
) {
  queryClient.invalidateQueries({ queryKey: [messageKeys.CONVERSATIONS] });
  queryClient.invalidateQueries({ queryKey: [messageKeys.MY_CONVERSATION] });
  if (conversationId) {
    queryClient.invalidateQueries({
      queryKey: [messageKeys.MESSAGES, conversationId],
    });
    queryClient.invalidateQueries({
      queryKey: [messageKeys.CONVERSATION_DETAIL, conversationId],
    });
  }
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendMessageRequest) => messageApis.sendMessage(data),
    onSuccess: (res, variables) => {
      const conversationId =
        ('conversationId' in variables && variables.conversationId) ||
        res.data.messageData.conversationId;
      invalidateConversationQueries(queryClient, conversationId);
    },
  });
};

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
      invalidateConversationQueries(queryClient, variables.conversationId);
    },
  });
};

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
