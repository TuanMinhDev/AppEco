import {
  messageKeys,
  useMarkAsRead,
  useMessages,
  useSendMessage,
} from '@/api/message/message.api';
import type { Message, SendMessageRequest } from '@/api/message/message.type';
import {
  getSenderId,
  getSenderName,
  isMyMessage,
} from '@/api/message/message.utils';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { useSocket } from '@/hooks/useSocket';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatPanelProps = {
  conversationId?: string;
  peerName: string;
  peerSubtitle?: string;
  /** Admin bắt buộc gửi kèm conversationId */
  requireConversationId?: boolean;
  isBootstrapping?: boolean;
  bootstrapError?: boolean;
  onRetryBootstrap?: () => void;
  guestMode?: boolean;
  onLoginPress?: () => void;
  onBack: () => void;
};

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string) {
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
}

export function ChatPanel({
  conversationId,
  peerName,
  peerSubtitle = 'Hỗ trợ trực tuyến',
  requireConversationId = false,
  isBootstrapping = false,
  bootstrapError = false,
  onRetryBootstrap,
  guestMode = false,
  onLoginPress,
  onBack,
}: ChatPanelProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: currentUser } = useGetCurrentUser();
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId ?? '');
  const messages = messagesData?.messages ?? [];
  const canChat = !!conversationId && !isBootstrapping && !bootstrapError && !guestMode;

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: markAsRead } = useMarkAsRead();
  const { joinConversation, leaveConversation, sendTyping, onMessage, onTyping } = useSocket();

  const buildSendPayload = useCallback(
    (payload: SendMessageRequest): SendMessageRequest => {
      if (requireConversationId && conversationId) {
        return { ...payload, conversationId };
      }
      return payload;
    },
    [conversationId, requireConversationId],
  );

  useEffect(() => {
    if (!conversationId) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [conversationId, joinConversation, leaveConversation]);

  useEffect(() => {
    if (conversationId && currentUser?._id) {
      markAsRead({ conversationId });
    }
  }, [conversationId, currentUser?._id, messages.length, markAsRead]);

  useEffect(() => {
    const unsubMessage = onMessage((msg) => {
      if (msg.conversationId !== conversationId) return;
      queryClient.invalidateQueries({
        queryKey: [messageKeys.MESSAGES, conversationId],
      });
      queryClient.invalidateQueries({ queryKey: [messageKeys.CONVERSATIONS] });
      queryClient.invalidateQueries({ queryKey: [messageKeys.MY_CONVERSATION] });
      if (currentUser?._id && getSenderId(msg.senderId as never) !== currentUser._id) {
        markAsRead({ conversationId });
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    });

    const unsubTyping = onTyping(({ conversationId: cid, userId, isTyping }) => {
      if (cid !== conversationId || userId === currentUser?._id) return;
      setPeerTyping(isTyping);
    });

    return () => {
      unsubMessage();
      unsubTyping();
    };
  }, [conversationId, currentUser?._id, markAsRead, onMessage, onTyping, queryClient]);

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!conversationId) return;
    sendTyping(conversationId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(conversationId, false);
    }, 1200);
  };

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    sendMessage(
      buildSendPayload({
        content: text,
        replyTo: replyTo?._id,
      }),
      {
        onSuccess: () => {
          setInputText('');
          setReplyTo(null);
          sendTyping(conversationId, false);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
        },
        onError: (e: unknown) => {
          toast.showError(getApiErrorMessage(e, 'Không gửi được tin nhắn.'));
        },
      },
    );
  }, [inputText, conversationId, replyTo, sendMessage, buildSendPayload, toast, sendTyping]);

  const handlePickMedia = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        toast.showError('Cần quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.85,
        videoMaxDuration: 120,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      const filename = asset.fileName ?? (isVideo ? 'video.mp4' : 'photo.jpg');
      const mime =
        asset.mimeType ?? (isVideo ? 'video/mp4' : filename.endsWith('.png') ? 'image/png' : 'image/jpeg');

      setUploading(true);
      sendMessage(
        buildSendPayload({
          file: { uri: asset.uri, name: filename, type: mime },
          content: inputText.trim() || undefined,
          replyTo: replyTo?._id,
        }),
        {
          onSuccess: () => {
            setInputText('');
            setReplyTo(null);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
          },
          onError: (e: unknown) => {
            toast.showError(getApiErrorMessage(e, 'Không gửi được file.'));
          },
          onSettled: () => setUploading(false),
        },
      );
    } catch {
      toast.showError('Không mở được thư viện ảnh.');
      setUploading(false);
    }
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].createdAt).toDateString();
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    return curr !== prev;
  };

  const renderMessageBody = (item: Message, mine: boolean) => {
    if (item.messageType === 'image' && item.imageUrl) {
      return (
        <View style={styles.mediaBlock}>
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} resizeMode="cover" />
          {!!item.content?.trim() && (
            <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.content}</Text>
          )}
        </View>
      );
    }

    if (item.messageType === 'video' && item.videoUrl) {
      return (
        <TouchableOpacity
          style={styles.videoBlock}
          activeOpacity={0.85}
          onPress={() => void Linking.openURL(item.videoUrl!)}
        >
          <View style={styles.videoIconWrap}>
            <Ionicons name="play" size={24} color="#fff" />
          </View>
          <Text style={[styles.videoLabel, mine && styles.messageTextMine]}>
            {item.content?.trim() || 'Video'}
          </Text>
          <Text style={[styles.videoHint, mine && styles.msgTimeMine]}>Chạm để mở</Text>
        </TouchableOpacity>
      );
    }

    return (
      <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.content}</Text>
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const mine = isMyMessage(item, currentUser?._id);
    const showDate = shouldShowDateSeparator(index);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}

        {item.replyTo && typeof item.replyTo !== 'string' && (
          <View style={[styles.replyRef, mine ? styles.replyRefMine : styles.replyRefOther]}>
            <View style={styles.replyBar} />
            <Text style={styles.replyRefText} numberOfLines={1}>
              {item.replyTo.content}
            </Text>
          </View>
        )}

        <View style={[styles.messageRow, mine && styles.messageRowMine]}>
          {!mine && (
            <View style={styles.msgAvatar}>
              <Text style={styles.msgAvatarText}>
                {getSenderName(item.senderId).charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
            onLongPress={() => setReplyTo(item)}
            activeOpacity={0.85}
          >
            {renderMessageBody(item, mine)}
            <View style={styles.messageFooter}>
              {item.editedAt ? (
                <Text style={[styles.editedLabel, mine && styles.editedLabelMine]}>đã sửa</Text>
              ) : null}
              <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
                {formatMsgTime(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const busy = isSending || uploading;
  const showMessageLoader = isBootstrapping || (canChat && isLoading);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="headset" size={22} color={AppEco.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerName} numberOfLines={1}>
              {peerName}
            </Text>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {peerTyping ? 'Đang nhập...' : peerSubtitle}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {guestMode ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="chat-outline" size={56} color={AppEco.textMuted} />
            <Text style={styles.emptyTitle}>Đăng nhập để chat</Text>
            <Text style={styles.emptySub}>Nhắn tin trực tiếp với đội hỗ trợ cửa hàng.</Text>
            {onLoginPress ? (
              <TouchableOpacity style={styles.loginBtn} onPress={onLoginPress} activeOpacity={0.85}>
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : bootstrapError ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={AppEco.danger} />
            <Text style={styles.emptyTitle}>Không mở được chat</Text>
            {onRetryBootstrap ? (
              <TouchableOpacity style={styles.loginBtn} onPress={onRetryBootstrap} activeOpacity={0.85}>
                <Text style={styles.loginBtnText}>Thử lại</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : showMessageLoader ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={AppEco.primary} />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons
              name="chat-processing-outline"
              size={56}
              color={AppEco.primarySubtle}
            />
            <Text style={styles.emptyTitle}>Xin chào!</Text>
            <Text style={styles.emptySub}>
              Gửi tin nhắn cho đội hỗ trợ — chúng tôi sẽ phản hồi sớm nhất.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.3}
            ListHeaderComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={AppEco.primary}
                  style={{ marginVertical: 8 }}
                />
              ) : null
            }
          />
        )}

        {replyTo ? (
          <View style={styles.replyBar2}>
            <View style={styles.replyBarContent}>
              <View style={styles.replyBarLine} />
              <View style={styles.replyBarText}>
                <Text style={styles.replyBarLabel}>
                  Trả lời{' '}
                  {isMyMessage(replyTo, currentUser?._id)
                    ? 'bạn'
                    : getSenderName(replyTo.senderId) || peerName}
                </Text>
                <Text style={styles.replyBarMsg} numberOfLines={1}>
                  {replyTo.content || (replyTo.messageType === 'image' ? 'Hình ảnh' : 'Video')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyBarClose}>
              <Ionicons name="close" size={18} color={AppEco.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => void handlePickMedia()}
            disabled={busy || !canChat}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={AppEco.primary} />
            ) : (
              <Ionicons name="image-outline" size={22} color={AppEco.primary} />
            )}
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={handleTyping}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={AppEco.textMuted}
              multiline
              maxLength={2000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || busy || !canChat) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || busy || !canChat}
            activeOpacity={0.85}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: AppEco.primary,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  chatContainer: { flex: 1 },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  loadingText: { fontSize: 14, color: AppEco.textSecondary },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text },
  emptySub: { fontSize: 14, color: AppEco.textMuted, textAlign: 'center', lineHeight: 21 },
  loginBtn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: AppEco.radiusMd,
    ...AppEco.shadowCard,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  messagesList: { paddingHorizontal: 14, paddingVertical: 16 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: AppEco.borderSoft },
  dateText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: AppEco.textMuted,
    fontWeight: '600',
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    maxWidth: '82%',
  },
  messageRowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  msgAvatarText: { fontSize: 12, fontWeight: '800', color: AppEco.primaryDark },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleMine: {
    backgroundColor: AppEco.primary,
    borderBottomRightRadius: 4,
    ...AppEco.shadowSoft,
  },
  bubbleOther: {
    backgroundColor: AppEco.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  messageText: { fontSize: 15, color: AppEco.text, lineHeight: 21 },
  messageTextMine: { color: '#fff' },
  mediaBlock: { gap: 6 },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.surfaceMuted,
  },
  videoBlock: {
    width: 200,
    minHeight: 110,
    borderRadius: AppEco.radiusSm,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 6,
  },
  videoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLabel: { fontSize: 14, fontWeight: '700', color: AppEco.text, textAlign: 'center' },
  videoHint: { fontSize: 11, color: AppEco.textMuted },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  msgTime: { fontSize: 10, color: AppEco.textMuted },
  msgTimeMine: { color: 'rgba(255,255,255,0.65)' },
  editedLabel: { fontSize: 10, color: AppEco.textMuted, fontStyle: 'italic' },
  editedLabelMine: { color: 'rgba(255,255,255,0.55)' },

  replyRef: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 8,
    maxWidth: '82%',
  },
  replyRefMine: { alignSelf: 'flex-end' },
  replyRefOther: { alignSelf: 'flex-start', marginLeft: 34 },
  replyBar: {
    width: 3,
    height: 18,
    backgroundColor: AppEco.primary,
    borderRadius: 2,
    marginRight: 6,
  },
  replyRefText: { fontSize: 12, color: AppEco.textMuted, fontStyle: 'italic' },

  replyBar2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
  },
  replyBarContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  replyBarLine: {
    width: 3,
    height: 32,
    backgroundColor: AppEco.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  replyBarText: { flex: 1 },
  replyBarLabel: { fontSize: 12, fontWeight: '700', color: AppEco.primary, marginBottom: 2 },
  replyBarMsg: { fontSize: 13, color: AppEco.textSecondary },
  replyBarClose: { padding: 4 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: AppEco.surface,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: AppEco.surfaceMuted,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  textInput: { fontSize: 15, color: AppEco.text, maxHeight: 80 },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppEco.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppEco.shadowSoft,
  },
  sendBtnDisabled: { backgroundColor: AppEco.border, shadowOpacity: 0, elevation: 0 },
});
