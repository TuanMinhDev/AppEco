import { useFavoritesList } from '@/api/favorite/favorite.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ProductItem } from '@/components/commom/ProductItem';
import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;

export default function FavoritesScreen() {
  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const isLoggedIn = meOk && !!me?._id;

  const {
    data: favRes,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useFavoritesList(isLoggedIn);

  const items = favRes?.favorites ?? [];

  const onRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <MaterialCommunityIcons name="heart-outline" size={56} color={AppEco.textMuted} />
        <Text style={styles.title}>Đăng nhập để xem yêu thích</Text>
        <Text style={styles.sub}>Lưu sản phẩm bạn quan tâm và xem lại mọi lúc.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push(`/(auth)/login?redirect=${encodeURIComponent('/favorites')}` as any)
          }
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.linkBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={AppEco.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          Yêu thích
        </Text>
        <View style={styles.iconBtn} />
      </SafeAreaView>

      {isLoading && !favRes ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loaderText}>Đang tải...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerFlat}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={AppEco.danger} />
          <Text style={styles.title}>Không tải được danh sách</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => void refetch()} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={AppEco.primary} />
          }
          renderItem={({ item }) => (
            <ProductItem product={item} cardWidth={CARD_WIDTH} style={styles.card} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="heart-off-outline" size={52} color={AppEco.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
              <Text style={styles.emptySub}>Bấm tim ở trang sản phẩm để thêm vào đây.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: AppEco.background,
    borderBottomWidth: 1,
    borderBottomColor: AppEco.border,
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: AppEco.text,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 32,
  },
  listContentEmpty: { flexGrow: 1 },
  row: { justifyContent: 'space-between', marginBottom: GAP },
  card: { marginBottom: 0 },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: { fontSize: 15, color: AppEco.textSecondary, fontWeight: '600' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: AppEco.background,
    gap: 10,
  },
  centerFlat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: AppEco.text, textAlign: 'center' },
  sub: { fontSize: 14, color: AppEco.textSecondary, textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: AppEco.primary,
    borderRadius: AppEco.radiusLg,
    ...AppEco.shadowCard,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  linkBtn: { marginTop: 8, paddingVertical: 8 },
  linkBtnText: { color: AppEco.textSecondary, fontWeight: '700', fontSize: 15 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: AppEco.textSecondary },
  emptySub: { fontSize: 14, color: AppEco.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
