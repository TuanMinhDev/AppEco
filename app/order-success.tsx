import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppEco } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReviewItem = { id: string; name: string };

export default function OrderSuccessScreen() {
  const { items: itemsEnc, codes } = useLocalSearchParams<{ items?: string; codes?: string }>();

  const items = useMemo((): ReviewItem[] => {
    if (!itemsEnc) return [];
    try {
      const raw = decodeURIComponent(String(itemsEnc));
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x): x is ReviewItem => !!x && typeof x === 'object' && typeof (x as ReviewItem).id === 'string')
        .map((x) => ({ id: x.id, name: typeof x.name === 'string' ? x.name : 'Sản phẩm' }));
    } catch {
      return [];
    }
  }, [itemsEnc]);

  const codesLine = codes ? String(codes).split('|').filter(Boolean).join(', ') : '';

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
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="package-variant" size={22} color={AppEco.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName} numberOfLines={2}>
                  {it.name}
                </Text>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => router.push(`/product/${it.id}?review=1` as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="star-outline" size={16} color={AppEco.primaryDark} />
                  <Text style={styles.reviewBtnText}>Đánh giá</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.primary} onPress={() => router.replace('/orders' as any)} activeOpacity={0.9}>
          <Text style={styles.primaryText}>Đơn hàng của tôi</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => router.replace('/(tabs)' as any)} activeOpacity={0.85}>
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
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1, gap: 10 },
  rowName: { fontSize: 15, fontWeight: '700', color: AppEco.text },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.primaryMuted,
    borderWidth: 1,
    borderColor: AppEco.border,
  },
  reviewBtnText: { color: AppEco.primaryDark, fontWeight: '800', fontSize: 13 },
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
