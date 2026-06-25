import { useConversationDetail, useMyConversation } from '@/api/message/message.api';
import { getConversationTitle } from '@/api/message/message.utils';
import { useGetCurrentUser } from '@/api/user/user.api';
import { AiChatPanel } from '@/components/chat/AiChatPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ChatDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const routeId = conversationId ?? '';
  const isAiRoute = routeId === 'ai';
  const isSupportRoute = routeId === 'support';

  // AI Chat — không cần auth, render riêng
  if (isAiRoute) {
    return <AiChatPanel onBack={() => router.back()} />;
  }

  const { data: user, isSuccess: userOk } = useGetCurrentUser();
  const isLoggedIn = userOk && !!user?._id;
  const isAdmin = user?.role === 'admin';

  const myConversationQ = useMyConversation(isSupportRoute && isLoggedIn && !isAdmin);
  const detailQ = useConversationDetail(isSupportRoute ? '' : routeId);

  if (isSupportRoute) {
    const conversation = myConversationQ.data;

    return (
      <ChatPanel
        conversationId={conversation?._id}
        isBootstrapping={isLoggedIn && myConversationQ.isLoading}
        bootstrapError={isLoggedIn && (myConversationQ.isError || !conversation) && !myConversationQ.isLoading}
        onRetryBootstrap={() => void myConversationQ.refetch()}
        guestMode={!isLoggedIn}
        onLoginPress={() =>
          router.push(`/(auth)/login?redirect=${encodeURIComponent('/chat/support')}` as never)
        }
        peerName={
          conversation ? getConversationTitle(conversation, user?._id, false) : 'Hỗ trợ cửa hàng'
        }
        peerSubtitle="Đội ngũ hỗ trợ AppEco"
        onBack={() => router.back()}
      />
    );
  }

  const conversation = detailQ.data;
  const peerName = conversation
    ? getConversationTitle(conversation, user?._id, isAdmin)
    : isAdmin
      ? 'Khách hàng'
      : 'Hỗ trợ cửa hàng';

  return (
    <ChatPanel
      conversationId={routeId}
      isBootstrapping={detailQ.isLoading}
      bootstrapError={detailQ.isError || !routeId}
      onRetryBootstrap={() => void detailQ.refetch()}
      peerName={peerName}
      peerSubtitle={isAdmin ? 'Khách hàng' : 'Đội ngũ hỗ trợ AppEco'}
      requireConversationId={isAdmin}
      onBack={() => router.back()}
    />
  );
}

