/**
 * Type definitions cho Message / Conversation (user ↔ admin).
 */

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'admin' | 'user' | string;
  phoneNumber?: string;
}

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | UserSummary;
  content: string;
  messageType: 'text' | 'image' | 'video';
  imageUrl?: string | null;
  videoUrl?: string | null;
  isRead?: ReadReceipt[];
  replyTo?: string | { _id: string; content: string; senderId: string | UserSummary };
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  senderId: string;
  messageType: 'text' | 'image' | 'video';
  createdAt: string;
}

export interface Conversation {
  _id: string;
  userId?: string | UserSummary;
  participants: UserSummary[];
  lastMessage?: LastMessage | null;
  lastMessageAt?: string | null;
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MyConversationResponse {
  message: string;
  conversation: Conversation;
}

export interface GetConversationsResponse {
  message: string;
  conversations: Conversation[];
}

export interface SendTextMessageRequest {
  content: string;
  conversationId?: string;
  replyTo?: string;
}

export interface SendMediaFile {
  uri: string;
  name: string;
  type: string;
}

export interface SendMediaMessageRequest {
  file: SendMediaFile;
  content?: string;
  conversationId?: string;
  replyTo?: string;
}

export type SendMessageRequest = SendTextMessageRequest | SendMediaMessageRequest;

export function isMediaMessageRequest(
  data: SendMessageRequest,
): data is SendMediaMessageRequest {
  return 'file' in data && !!data.file;
}

export interface SendMessageResponse {
  message: string;
  messageData: Message;
}

export interface GetMessagesResponse {
  message: string;
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GetMessagesQuery {
  page?: number;
  limit?: number;
}
