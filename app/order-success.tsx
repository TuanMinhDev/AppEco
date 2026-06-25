import { AppEco } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  clearOrderSuccess,
  selectOrderSuccess,
} from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSuccessScreen() {
  const dispatch = useAppDispatch();
  const orderSuccess = useAppSelector(selectOrderSuccess);
  const items = orderSuccess?.items ?? [];
  const codesLine = orderSuccess?.codes?.join(', ') ?? '';

  const leave = (path: '/orders' | '/(tabs)') => {
    dispatch(clearOrderSuccess());
    router.replace(path as never);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.heroIcon}>
          <Ionicons name="checkmark-circle" size={56} color={AppEco.success} />
        </LinearGradient>
        <Text style={styles.title}>Đặt hàng thành công</Text>
        <Text style={styles.sub}>
          Cảm ơn bạn đã mua hàng.{codesLine ? `\nMã đơn: ${codesLine}` : ''}
        </Text>
        <Text style={styles.sectionLabel}>Sản phẩm vừa đặt</Text>
        {items.length === 0 ? (
          <Text style={styles.empty}>Không có danh sách sản phẩm để hiển thị.</Text>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.row}>
              {it.image ? (
                <Image
                  source={{ uri: it.image }}
                  style={styles.thumb}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <MaterialCommunityIcons name="image-off-outline" size={22} color={AppEco.textMuted} />
                </View>
              )}
              <Text style={styles.rowName} numberOfLines={2}>
                {it.name}
              </Text>
            </View>
          ))
        )}
        <Text style={styles.reviewHint}>
          Bạn có thể đánh giá sản phẩm sau khi đơn hàng được giao thành công.
        </Text>
        <TouchableOpacity style={styles.primary} onPress={() => leave('/orders')} activeOpacity={0.9}>
          <Text style={styles.primaryText}>Đơn hàng của tôi</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => leave('/(tabs)')} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Về trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  scroll: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  heroIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '900', color: AppEco.text, textAlign: 'center' },
  sub: {
    fontSize: 14,
    color: AppEco.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    alignSelf: 'stretch',
    fontSize: 13,
    fontWeight: '800',
    color: AppEco.textSecondary,
    marginBottom: 12,
  },
  empty: { fontSize: 14, color: AppEco.textMuted, alignSelf: 'stretch', marginBottom: 16 },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.borderSoft,
  },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  rowName: { flex: 1, fontSize: 15, fontWeight: '700', color: AppEco.text, lineHeight: 21 },
  reviewHint: {
    alignSelf: 'stretch',
    fontSize: 13,
    color: AppEco.textMuted,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  primary: {
    alignSelf: 'stretch',
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppEco.primary,
    paddingVertical: 16,
    borderRadius: AppEco.radiusMd,
    ...AppEco.shadowCard,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { marginTop: 12, paddingVertical: 12 },
  secondaryText: { color: AppEco.textSecondary, fontWeight: '700', fontSize: 15 },
});
