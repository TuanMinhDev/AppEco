import { useNotificationUnreadSummary } from '@/api/notification/notification.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppEco } from '@/constants/theme';
import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONTENT_HEIGHT = 40;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottom = Math.max(insets.bottom, 12);
  const tabBarHeight = TAB_CONTENT_HEIGHT + tabBarBottom;

  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const { data: unreadSummary } = useNotificationUnreadSummary(meOk && !!me?._id);
  const unread = unreadSummary?.unreadCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppEco.primary,
        tabBarInactiveTintColor: AppEco.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: tabBarBottom,
          backgroundColor: AppEco.surface,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          shadowColor: '#134E4A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '',
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Ẩn khỏi tab bar
        }}
      />
      
    </Tabs>
  );
}
