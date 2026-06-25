/**
 * Route cũ — chuyển thẳng theo role.
 */

import { useGetCurrentUser } from '@/api/user/user.api';
import { router } from 'expo-router';
import React, { useEffect } from 'react';

export default function ConversationsRedirectScreen() {
  const { data: user, isSuccess, isLoading } = useGetCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!isSuccess || !user?._id) {
      router.replace('/chat/ai' as never);
      return;
    }
    if (user.role === 'admin') {
      router.replace('/admin/messages' as never);
    } else {
      router.replace('/chat/ai' as never);
    }
  }, [isLoading, isSuccess, user?._id, user?.role]);

  return null;
}
