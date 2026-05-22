import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthWelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...AppEco.heroGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 24 }]}
      >
        <View style={styles.decorCircle} />
        <View style={[styles.decorCircle, styles.decorCircleSmall]} />
        <View style={styles.badge}>
          <Ionicons name="leaf" size={14} color="#fff" />
          <Text style={styles.badgeText}>Thân thiện môi trường</Text>
        </View>
        <Text style={styles.brand}>Pine Studio</Text>
        <Text style={styles.tagline}>Mua sắm xanh, giao nhanh, tối giản tác động.</Text>
      </LinearGradient>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.sheetTitle}>Bắt đầu</Text>
        <Text style={styles.sheetSub}>Đăng nhập hoặc tạo tài khoản mới để tiếp tục.</Text>
        <TouchableOpacity
          style={styles.btnPrimary}
          activeOpacity={0.9}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.btnPrimaryText}>Đăng nhập</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSecondary}
          activeOpacity={0.9}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.btnSecondaryText}>Tạo tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AppEco.background,
  },
  hero: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -60,
  },
  decorCircleSmall: {
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 120,
    left: -30,
    right: undefined,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AppEco.radiusFull,
    marginBottom: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    maxWidth: 320,
  },
  sheet: {
    backgroundColor: AppEco.surface,
    marginHorizontal: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    borderTopLeftRadius: AppEco.radiusXl,
    borderTopRightRadius: AppEco.radiusXl,
    marginTop: -20,
    ...AppEco.shadowSoft,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppEco.text,
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 15,
    color: AppEco.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: AppEco.primary,
    paddingVertical: 16,
    borderRadius: AppEco.radiusLg,
    marginBottom: 12,
    ...AppEco.shadowCard,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: AppEco.radiusLg,
    borderWidth: 2,
    borderColor: AppEco.border,
    backgroundColor: AppEco.surfaceMuted,
  },
  btnSecondaryText: {
    color: AppEco.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
