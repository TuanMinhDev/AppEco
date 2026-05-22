/**
 * Chat Detail Screen — Chi tiết phòng chat.
 * Hiển thị tin nhắn, gửi tin nhắn, reply, đánh dấu đã đọc.
 */

import {
  useConversationDetail,
  useMessages,
  useSendMessage,
  useMarkAsRead,
} from '@/api/message/message.api';
import type { Message as MessageType, UserSummary } from '@/api/message/message.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useToast } from '@/components/toast/ToastProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

export default function ChatDetailScreen() {
  const toast = useToast();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);

  const { data: currentUser } = useGetCurrentUser();
  const { data: conversation } = useConversationDetail(conversationId ?? '');
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId ?? '');

  const messages = messagesData?.messages ?? [];
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markAsRead } = useMarkAsRead();

  /** Lấy tên đối phương */
  const otherUser = conversation?.participants.find(
    (p) => p._id !== currentUser?._id
  );

  /** Đánh dấu đã đọc khi mở room */
  useEffect(() => {
    if (conversationId && currentUser?._id) {
      markAsRead({ conversationId });
    }
  }, [conversationId, currentUser?._id, messages.length]);

  /** Gửi tin nhắn */
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    sendMessage(
      {
        conversationId,
        content: text,
        replyTo: replyTo?._id,
      },
      {
        onSuccess: () => {
          setInputText('');
          setReplyTo(null);
          // Scroll xuống cuối
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 200);
        },
        onError: (e: unknown) => {
          toast.showError(getApiErrorMessage(e, 'Không gửi được tin nhắn.'));
        },
      }
    );
  }, [inputText, conversationId, replyTo, sendMessage, toast]);

  /** Lấy sender name */
  const getSenderName = (sender: string | UserSummary): string => {
    if (typeof sender === 'string') return '';
    return sender.name ?? '';
  };

  /** Kiểm tra message là của mình hay của người khác */
  const isMyMessage = (msg: MessageType): boolean => {
    const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
    return senderId === currentUser?._id;
  };

  /** Format thời gian tin nhắn */
  const formatMsgTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  /** Format ngày cho separator */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /** Kiểm tra cần show date separator */
  const shouldShowDateSeparator = (index: number): boolean => {
    if (index === 0) return true;
    const curr = new Date(messages[index].createdAt).toDateString();
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    return curr !== prev;
  };

  /** Render message bubble */
  const renderMessage = ({ item, index }: { item: MessageType; index: number }) => {
    const mine = isMyMessage(item);
    const showDate = shouldShowDateSeparator(index);

    return (
      <View>
        {/* Date separator */}
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}

        {/* Reply reference */}
        {item.replyTo && typeof item.replyTo !== 'string' && (
          <View style={[styles.replyRef, mine ? styles.replyRefMine : styles.replyRefOther]}>
            <View style={styles.replyBar} />
            <Text style={styles.replyRefText} numberOfLines={1}>
              {item.replyTo.content}
            </Text>
          </View>
        )}

        {/* Message bubble */}
        <View style={[styles.messageRow, mine && styles.messageRowMine]}>
          {/* Avatar (chỉ hiện cho tin nhắn người khác) */}
          {!mine && (
            <View style={styles.msgAvatar}>
              <Text style={styles.msgAvatarText}>
                {getSenderName(item.senderId).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
            onLongPress={() => setReplyTo(item)}
            activeOpacity={0.8}
          >
            {/* Image message */}
            {item.messageType === 'image' && item.imageUrl && (
              <View style={styles.imageMessage}>
                <MaterialCommunityIcons name="image" size={48} color="#2563EB" />
              </View>
            )}

            {/* Text content */}
            <Text style={[styles.messageText, mine && styles.messageTextMine]}>
              {item.content}
            </Text>

            {/* Time + edited indicator */}
            <View style={styles.messageFooter}>
              {item.editedAt && (
                <Text style={[styles.editedLabel, mine && styles.editedLabelMine]}>đã sửa</Text>
              )}
              <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
                {formatMsgTime(item.createdAt)}
              </Text>
              {mine && (
                <Ionicons
                  name={item.isRead?.length > 0 ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.isRead?.length > 0 ? '#34D399' : 'rgba(255,255,255,0.5)'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {otherUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUser?.name ?? 'Đang tải...'}
            </Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <MaterialCommunityIcons name="hand-wave-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyChatText}>Hãy gửi lời chào! 👋</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              isFetchingNextPage ? (
                <ActivityIndicator size="small" color="#94A3B8" style={{ marginVertical: 8 }} />
              ) : null
            }
          />
        )}

        {/* Reply bar */}
        {replyTo && (
          <View style={styles.replyBar2}>
            <View style={styles.replyBarContent}>
              <View style={styles.replyBarLine} />
              <View style={styles.replyBarText}>
                <Text style={styles.replyBarLabel}>
                  Trả lời {isMyMessage(replyTo) ? 'bạn' : getSenderName(replyTo.senderId)}
                </Text>
                <Text style={styles.replyBarMsg} numberOfLines={1}>
                  {replyTo.content}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyBarClose}>
              <Ionicons name="close" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={2000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // ─── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerStatus: {
    fontSize: 12,
    color: '#34D399',
  },
  moreBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Chat area ────────────────────────────────────────────
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },

  // ─── Date separator ──────────────────────────────────────
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // ─── Message ──────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    maxWidth: '80%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  msgAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 21,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  msgTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  msgTimeMine: {
    color: 'rgba(255,255,255,0.6)',
  },
  editedLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginRight: 4,
  },
  editedLabelMine: {
    color: 'rgba(255,255,255,0.5)',
  },

  // ─── Image message ────────────────────────────────────────
  imageMessage: {
    width: 180,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  // ─── Reply reference in bubble ────────────────────────────
  replyRef: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 10,
    maxWidth: '80%',
  },
  replyRefMine: {
    alignSelf: 'flex-end',
  },
  replyRefOther: {
    alignSelf: 'flex-start',
    marginLeft: 34,
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginRight: 6,
  },
  replyRefText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // ─── Reply bar (above input) ──────────────────────────────
  replyBar2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarLine: {
    width: 3,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    marginRight: 10,
  },
  replyBarText: {
    flex: 1,
  },
  replyBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 2,
  },
  replyBarMsg: {
    fontSize: 13,
    color: '#6B7280',
  },
  replyBarClose: {
    padding: 4,
  },

  // ─── Input area ───────────────────────────────────────────
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 80,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
});
