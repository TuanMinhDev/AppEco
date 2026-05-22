/**
 * Conversations Screen — Danh sách phòng chat.
 * Hiển thị tất cả conversations, sort theo tin nhắn mới nhất.
 */

import { useConversations } from '@/api/message/message.api';
import type { Conversation } from '@/api/message/message.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConversationsScreen() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: conversations, isLoading, refetch } = useConversations();

  /** Lấy tên đối phương trong conversation 1-1 */
  const getOtherUser = (conv: Conversation) => {
    if (!currentUser) return null;
    return conv.participants.find((p) => p._id !== currentUser._id) ?? conv.participants[0];
  };

  /** Format thời gian */
  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    return date.toLocaleDateString('vi-VN');
  };

  /** Render mỗi conversation item */
  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUser = getOtherUser(item);
    const lastMsg = item.lastMessage;
    const initial = otherUser?.name?.charAt(0)?.toUpperCase() ?? '?';

    // Kiểm tra tin nhắn chưa đọc (đơn giản: lastMessage không phải của mình)
    const isUnread =
      lastMsg &&
      typeof lastMsg.senderId === 'string'
        ? lastMsg.senderId !== currentUser?._id
        : false;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          router.push(`/chat/${item._id}` as any)
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationTop}>
            <Text style={[styles.userName, isUnread && styles.userNameUnread]} numberOfLines={1}>
              {otherUser?.name ?? 'Người dùng'}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          <View style={styles.conversationBottom}>
            <Text
              style={[styles.lastMessage, isUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {lastMsg
                ? lastMsg.messageType === 'image'
                  ? '📷 Hình ảnh'
                  : lastMsg.content
                : 'Chưa có tin nhắn'}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : !conversations || conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
          <Text style={styles.emptySubtitle}>
            Nhắn tin cho người bán để bắt đầu
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // List
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 80,
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },

  // Avatar
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarUnread: {
    backgroundColor: '#2563EB',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Content
  conversationContent: {
    flex: 1,
  },
  conversationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  userNameUnread: {
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  conversationBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#94A3B8',
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: '#475569',
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
});
