import { router } from 'expo-router';
import { useEffect } from 'react';

/** Route cũ — chuyển thẳng sang màn chat AI. */
export default function SupportChatRedirect() {
  useEffect(() => {
    router.replace('/chat/ai' as never);
  }, []);

  return null;
}
