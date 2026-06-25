import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenHeroProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  /** Nút giả bên phải khi có nút lùi nhưng không có action (cân tiêu đề) */
  balanceBack?: boolean;
  style?: ViewStyle;
};

export function ScreenHero({
  title,
  subtitle,
  onBack,
  rightAction,
  balanceBack = true,
  style,
}: ScreenHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...AppEco.heroGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 12 }, style]}
    >
      <View style={styles.heroTopRow}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ??
          (onBack && balanceBack ? <View style={styles.sideSpacer} /> : null)}
      </View>
    </LinearGradient>
  );
}

export function ScreenHeroAddButton({
  onPress,
  label = 'Thêm',
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.addBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="add" size={26} color={AppEco.primary} />
    </TouchableOpacity>
  );
}

export function ScreenHeroChip({
  onPress,
  disabled,
  loading,
  icon,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, disabled && styles.chipDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name={icon} size={16} color="#fff" />
          <Text style={styles.chipText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    lineHeight: 22,
    marginTop: 4,
  },
  sideSpacer: { width: 44 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...AppEco.shadowCard,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: AppEco.radiusFull,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  chipDisabled: { opacity: 0.6 },
  chipText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
