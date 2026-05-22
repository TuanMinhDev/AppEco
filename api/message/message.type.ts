/**
 * Type definitions cho Message / Conversation.
 */

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ─── Message ────────────────────────────────────────────────

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | UserSummary;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  isRead: ReadReceipt[];
  replyTo?: string | { _id: string; content: string; senderId: string | UserSummary };
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Conversation ───────────────────────────────────────────

export interface LastMessage {
  _id: string;
  content: string;
  senderId: string;
  messageType: 'text' | 'image';
  createdAt: string;
}

export interface Conversation {
  _id: string;
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

// ─── Request / Response ─────────────────────────────────────

export interface CreateConversationRequest {
  participantId: string;
}

export interface CreateConversationResponse {
  message: string;
  conversation: Conversation;
}

export interface GetConversationsResponse {
  message: string;
  conversations: Conversation[];
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image';
  imageUrl?: string;
  replyTo?: string;
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
