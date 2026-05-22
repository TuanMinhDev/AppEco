import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
  color?: string;
  textColor?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'medium',
  showZero = false,
  color = '#EF4444',
  textColor = '#FFFFFF',
}) => {
  if (!showZero && count === 0) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
          fontSize: 10,
          minWidth: 16,
        };
      case 'large':
        return {
          width: 28,
          height: 28,
          borderRadius: 14,
          fontSize: 12,
          minWidth: 28,
        };
      default: // medium
        return {
          width: 20,
          height: 20,
          borderRadius: 10,
          fontSize: 11,
          minWidth: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.borderRadius,
          minWidth: sizeStyles.minWidth,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 1,
    paddingHorizontal: 4,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
