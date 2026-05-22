import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationBadge } from './NotificationBadge';

interface NotificationButtonProps {
  unreadCount: number;
  onPress: () => void;
  size?: number;
  color?: string;
  badgeColor?: string;
  badgeTextColor?: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({
  unreadCount,
  onPress,
  size = 24,
  color = '#374151',
  badgeColor = '#EF4444',
  badgeTextColor = '#FFFFFF',
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name="notifications-outline"
          size={size}
          color={color}
        />
        <NotificationBadge
          count={unreadCount}
          size="small"
          color={badgeColor}
          textColor={badgeTextColor}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
});
