import { useDeleteProduct, useListSellerProducts } from '@/api/product/product.api';
import { Product } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ProductItem } from '@/components/commom/ProductItem';
import { ScreenHero, ScreenHeroAddButton } from '@/components/screen-hero/ScreenHero';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const dialog = useAppDialog();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, refetch, isFetching } = useListSellerProducts(
    {
      sellerId: user?._id,
      pageNumber: 1,
      pageSize: 50,
    },
    !!user && isAdmin,
  );

  const items = data?.items ?? [];

  const { mutate: removeProduct, isPending: deleting } = useDeleteProduct({
    onSuccess: () => {
      toast.showSuccess('Đã xoá sản phẩm.', { duration: 2000 });
    },
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không xoá được sản phẩm.'));
    },
  });

  const list = useMemo(
    () =>
      items.map((p) => ({
        product: p,
      })),
    [items],
  );

  if (userLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={AppEco.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed-outline" size={48} color={AppEco.textMuted} />
        <Text style={styles.denyTitle}>Chỉ dành cho quản trị</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHero
        title="Sản phẩm"
        subtitle="Danh sách sản phẩm cửa hàng. Chạm thẻ để sửa."
        onBack={() => router.back()}
        rightAction={
          <ScreenHeroAddButton
            label="Tạo sản phẩm"
            onPress={() => router.push('/admin/product-form' as never)}
          />
        }
      />

      <View style={styles.sheet}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppEco.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(row) => row.product._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => router.push('/admin/product-form' as never)}
              >
                <Text style={styles.btnText}>Tạo sản phẩm đầu tiên</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  router.push(`/admin/product-form?id=${item.product._id}` as never)
                }
              >
                <ProductItem product={item.product} cardWidth={CARD_W} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteChip}
                disabled={deleting}
                onPress={() => {
                  dialog.showConfirm({
                    title: 'Xoá sản phẩm',
                    message: `Xoá "${item.product.name}"?`,
                    confirmText: 'Xoá',
                    destructive: true,
                    onConfirm: () => removeProduct(item.product._id),
                  });
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  sheet: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  row: { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  listContent: { paddingTop: 16, paddingBottom: 32 },
  cardWrap: { position: 'relative' },
  deleteChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15, color: AppEco.textMuted, fontWeight: '600' },
  denyTitle: { fontSize: 18, fontWeight: '800', color: AppEco.text, marginTop: 12 },
  btn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: AppEco.radiusLg,
  },
  btnText: { color: '#fff', fontWeight: '800' },
});
