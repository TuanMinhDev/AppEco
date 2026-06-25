import {
  useCategories,
  useDeleteCategory,
} from '@/api/category/category.api';
import type { Category } from '@/api/category/category.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { ScreenHero, ScreenHeroAddButton } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function CategoryRow({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: Category;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardMain}
        onPress={onEdit}
        activeOpacity={0.85}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="pricetag-outline" size={22} color={AppEco.primary} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.cardSub} numberOfLines={2}>
              {item.description}
            </Text>
          ) : (
            <Text style={styles.cardSubMuted}>Chưa có mô tả</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        disabled={deleting}
        onPress={onDelete}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={20} color={AppEco.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const dialog = useAppDialog();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data: categories = [], isLoading, refetch, isFetching } = useCategories();

  const { mutate: removeCategory, isPending: deleting } = useDeleteCategory({
    onSuccess: () => toast.showSuccess('Đã xoá thể loại.', { duration: 2000 }),
    onError: (e) => toast.showError(getApiErrorMessage(e, 'Không xoá được thể loại.')),
  });

  const confirmDelete = (item: Category) => {
    dialog.showConfirm({
      title: 'Xoá thể loại',
      message: `Xoá "${item.name}"?`,
      confirmText: 'Xoá',
      destructive: true,
      onConfirm: () => removeCategory(item._id),
    });
  };

  if (userLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={AppEco.primary} />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Ionicons name="lock-closed-outline" size={48} color={AppEco.textMuted} />
        <Text style={styles.denyTitle}>Chỉ dành cho quản trị</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHero
        title="Thể loại"
        subtitle="Danh mục dùng khi tạo sản phẩm. Chạm vào thẻ để sửa."
        onBack={() => router.back()}
        rightAction={
          <ScreenHeroAddButton
            label="Thêm thể loại"
            onPress={() => router.push('/admin/category-form' as never)}
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
            data={categories}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="pricetags-outline" size={48} color={AppEco.textMuted} />
                <Text style={styles.emptyText}>Chưa có thể loại</Text>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.push('/admin/category-form' as never)}
                >
                  <Text style={styles.btnText}>Thêm thể loại đầu tiên</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <CategoryRow
                item={item}
                deleting={deleting}
                onEdit={() =>
                  router.push(`/admin/category-form?id=${item._id}` as never)
                }
                onDelete={() => confirmDelete(item)}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
    ...AppEco.shadowCard,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: AppEco.radiusSm,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, marginLeft: 12, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AppEco.text },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    color: AppEco.textSecondary,
    lineHeight: 18,
  },
  cardSubMuted: { marginTop: 4, fontSize: 13, color: AppEco.textMuted },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15, color: AppEco.textMuted, fontWeight: '600' },
  denyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: AppEco.text,
    marginTop: 12,
  },
  btn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: AppEco.radiusLg,
  },
  btnText: { color: '#fff', fontWeight: '800' },
});
