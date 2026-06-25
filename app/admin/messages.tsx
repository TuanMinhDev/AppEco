import { useConversations } from '@/api/message/message.api';
import type { Conversation } from '@/api/message/message.type';
import {
  getConversationTitle,
  getLastMessagePreview,
  isUnreadConversation,
} from '@/api/message/message.utils';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function formatTime(dateStr?: string | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút`;
  if (diffHours < 24) return `${diffHours} giờ`;
  if (diffDays < 7) return `${diffDays} ngày`;
  return date.toLocaleDateString('vi-VN');
}

export default function AdminMessagesScreen() {
  const { data: currentUser } = useGetCurrentUser();
  const { data: conversations, isLoading, refetch, isFetching } = useConversations();

  const renderItem = ({ item }: { item: Conversation }) => {
    const title = getConversationTitle(item, currentUser?._id, true);
    const userObj =
      item.userId && typeof item.userId === 'object' ? item.userId : null;
    const initial = title.charAt(0).toUpperCase() || '?';
    const unread = isUnreadConversation(item, currentUser?._id);

    return (
      <TouchableOpacity
        style={[styles.item, unread && styles.itemUnread]}
        activeOpacity={0.85}
        onPress={() => router.push(`/chat/${item._id}` as never)}
      >
        <View style={[styles.avatar, unread && styles.avatarUnread]}>
          <Text style={[styles.avatarText, unread && styles.avatarTextUnread]}>{initial}</Text>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={[styles.itemName, unread && styles.itemNameUnread]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.itemTime}>{formatTime(item.lastMessageAt)}</Text>
          </View>
          {userObj?.email ? (
            <Text style={styles.itemEmail} numberOfLines={1}>
              {userObj.email}
            </Text>
          ) : null}
          <View style={styles.itemBottom}>
            <Text
              style={[styles.itemPreview, unread && styles.itemPreviewUnread]}
              numberOfLines={1}
            >
              {getLastMessagePreview(item.lastMessage)}
            </Text>
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHero
        title="Inbox hỗ trợ"
        subtitle="Tin nhắn từ khách hàng"
        onBack={() => router.back()}
      />

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loadingText}>Đang tải hộp thư...</Text>
        </View>
      ) : !conversations?.length ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="inbox-outline" size={64} color={AppEco.textMuted} />
          <Text style={styles.emptyTitle}>Chưa có tin nhắn</Text>
          <Text style={styles.emptySub}>
            Khi khách hàng nhắn hỗ trợ, cuộc trò chuyện sẽ hiện ở đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={AppEco.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  loadingText: { fontSize: 14, color: AppEco.textSecondary },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text, marginTop: 8 },
  emptySub: { fontSize: 14, color: AppEco.textMuted, textAlign: 'center', lineHeight: 21 },

  listContent: { padding: 16, paddingBottom: 28 },
  separator: { height: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 14,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  itemUnread: { borderColor: AppEco.border },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarUnread: { backgroundColor: AppEco.primary },
  avatarText: { fontSize: 18, fontWeight: '800', color: AppEco.primaryDark },
  avatarTextUnread: { color: '#fff' },
  itemBody: { flex: 1, gap: 2 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: AppEco.text },
  itemNameUnread: { fontWeight: '800' },
  itemTime: { fontSize: 11, color: AppEco.textMuted },
  itemEmail: { fontSize: 12, color: AppEco.textSecondary },
  itemBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  itemPreview: { flex: 1, fontSize: 13, color: AppEco.textMuted },
  itemPreviewUnread: { color: AppEco.textSecondary, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AppEco.primary },
});
