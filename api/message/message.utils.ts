/**
 * Helpers cho Message / Conversation.
 */

import type { Conversation, Message, UserSummary } from './message.type';

export function getSenderId(sender: string | UserSummary): string {
  return typeof sender === 'string' ? sender : sender._id;
}

export function getSenderName(sender: string | UserSummary): string {
  if (typeof sender === 'string') return '';
  return sender.name ?? '';
}

export function getConversationPeer(
  conversation: Conversation | undefined,
  currentUserId: string | undefined,
): UserSummary | null {
  if (!conversation || !currentUserId) return null;

  const fromParticipants = conversation.participants.find((p) => p._id !== currentUserId);
  if (fromParticipants) return fromParticipants;

  if (conversation.userId && typeof conversation.userId === 'object') {
    return conversation.userId;
  }

  return conversation.participants[0] ?? null;
}

export function getConversationTitle(
  conversation: Conversation | undefined,
  currentUserId: string | undefined,
  isAdmin: boolean,
): string {
  if (isAdmin) {
    const user =
      conversation?.userId && typeof conversation.userId === 'object'
        ? conversation.userId
        : getConversationPeer(conversation, currentUserId);
    return user?.name ?? 'Khách hàng';
  }

  const peer = getConversationPeer(conversation, currentUserId);
  if (peer?.role === 'admin') return peer.name || 'Hỗ trợ cửa hàng';
  return peer?.name ?? 'Hỗ trợ cửa hàng';
}

export function getLastMessagePreview(message: Conversation['lastMessage']): string {
  if (!message) return 'Chưa có tin nhắn';
  if (message.messageType === 'image') return '📷 Hình ảnh';
  if (message.messageType === 'video') return '🎬 Video';
  return message.content || 'Tin nhắn';
}

export function isMyMessage(message: Message, currentUserId: string | undefined): boolean {
  if (!currentUserId) return false;
  return getSenderId(message.senderId) === currentUserId;
}

export function isUnreadConversation(
  conversation: Conversation,
  currentUserId: string | undefined,
): boolean {
  const lastMsg = conversation.lastMessage;
  if (!lastMsg || !currentUserId) return false;
  return lastMsg.senderId !== currentUserId;
}
