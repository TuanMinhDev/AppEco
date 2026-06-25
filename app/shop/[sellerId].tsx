import { useProductsBySellerInfinite } from '@/api/product/product.api';
import { useGetCurrentUser, useSellerPublicShop } from '@/api/user/user.api';
import { ProductItem } from '@/components/commom/ProductItem';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
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

export default function SellerShopScreen() {
  const { sellerId } = useLocalSearchParams<{ sellerId: string }>();
  const id = typeof sellerId === 'string' ? sellerId : sellerId?.[0] ?? '';

  const {
    data: shop,
    isLoading: shopLoading,
    isError: shopError,
    refetch: refetchShop,
    isRefetching: shopRefetching,
  } = useSellerPublicShop(id);

  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const isLoggedIn = meOk && !!me?._id;
  const isOwnShop = Boolean(isLoggedIn && me && me._id === id);

  const {
    data: pagesData,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProducts,
    isRefetching: productsRefetching,
  } = useProductsBySellerInfinite(id, 12);

  const products = useMemo(
    () => pagesData?.pages.flatMap((p) => p.data.items ?? []) ?? [],
    [pagesData],
  );

  const refreshing = shopRefetching || productsRefetching;

  const onRefresh = useCallback(() => {
    void refetchShop();
    void refetchProducts();
  }, [refetchShop, refetchProducts]);

  const warehouseLine = useMemo(() => {
    const w = shop?.warehouse;
    if (!w) return null;
    return [w.province, w.district, w.ward].filter(Boolean).join(' · ');
  }, [shop]);

  const handleChatPress = () => {
    router.push('/chat/ai' as any);
  };

  const listHeader = (
    <View style={styles.headerBlock}>
      <LinearGradient
        colors={['#EFF6FF', '#DBEAFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.shopCard}
      >
        <View style={styles.shopTitleRow}>
          <View style={styles.shopIconWrap}>
            <MaterialCommunityIcons name="storefront" size={28} color="#1D4ED8" />
          </View>
          <View style={styles.shopTitleText}>
            <Text style={styles.shopName} numberOfLines={2}>
              {shop?.shopName ?? 'Cửa hàng'}
            </Text>
            {warehouseLine ? (
              <View style={styles.regionRow}>
                <Ionicons name="location-outline" size={14} color="#475569" />
                <Text style={styles.regionText} numberOfLines={2}>
                  Khu vực kho: {warehouseLine}
                </Text>
              </View>
            ) : (
              <Text style={styles.regionMuted}>Khu vực kho: Chưa cập nhật</Text>
            )}
          </View>
        </View>

        {!isOwnShop ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.chatBtn} onPress={handleChatPress} activeOpacity={0.85}>
              <Ionicons name="sparkles-outline" size={16} color="#1D4ED8" />
              <Text style={styles.chatBtnText}>Chat AI</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </LinearGradient>

      <Text style={styles.sectionLabel}>Sản phẩm của shop</Text>
    </View>
  );

  if (!id) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.errTitle}>Thiếu mã cửa hàng</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (shopLoading && !shop) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingLabel}>Đang tải cửa hàng...</Text>
      </SafeAreaView>
    );
  }

  if (shopError || !shop) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <MaterialCommunityIcons name="store-off-outline" size={56} color="#94A3B8" />
        <Text style={styles.errTitle}>Không tìm thấy cửa hàng</Text>
        <Text style={styles.errSub}>
          Chỉ tài khoản admin mới có trang cửa hàng công khai theo API hiện tại.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {shop.shopName}
        </Text>
        <View style={styles.backBtn} />
      </SafeAreaView>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
        renderItem={({ item }) => (
          <ProductItem product={item} cardWidth={CARD_WIDTH} style={styles.productCard} />
        )}
        ListEmptyComponent={
          productsLoading ? (
            <View style={styles.inlineLoader}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.inlineLoaderText}>Đang tải sản phẩm...</Text>
            </View>
          ) : (
            <View style={styles.emptyProducts}>
              <MaterialCommunityIcons name="package-variant-closed" size={48} color="#CBD5E1" />
              <Text style={styles.emptyProductsText}>Chưa có sản phẩm nào</Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator style={styles.footerLoader} color="#2563EB" />
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.35}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFF',
    gap: 12,
  },
  loadingLabel: { color: '#64748B', fontSize: 15, fontWeight: '600' },
  errTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  errSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 24,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
  },
  headerBlock: { marginBottom: 8 },
  shopCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  shopTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  shopIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  shopTitleText: { flex: 1 },
  shopName: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  regionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  regionText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '600', lineHeight: 18 },
  regionMuted: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },

  actionRow: { marginTop: 14, alignItems: 'flex-start' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chatBtnText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  productRow: { justifyContent: 'space-between', marginBottom: GAP },
  productCard: { marginBottom: 0 },

  inlineLoader: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  inlineLoaderText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  emptyProducts: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptyProductsText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  footerLoader: { marginVertical: 16 },
});
