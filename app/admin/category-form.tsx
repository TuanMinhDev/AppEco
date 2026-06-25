import {
  useCategory,
  useCreateCategory,
  useUpdateCategory,
} from '@/api/category/category.api';
import { AppInput } from '@/components/app-input';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type CategoryFormValues = {
  name: string;
  description: string;
};

function mapCategoryToForm(category: {
  name: string;
  description?: string;
}): CategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
  };
}

function CategoryFormFields({
  isEdit,
  categoryId,
}: {
  isEdit: boolean;
  categoryId?: string;
}) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { control, handleSubmit } = useFormContext<CategoryFormValues>();

  const createMutation = useCreateCategory({
    onSuccess: () => {
      toast.showSuccess('Đã thêm thể loại.', { duration: 2000 });
      router.back();
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không tạo được thể loại.')),
  });

  const updateMutation = useUpdateCategory({
    onSuccess: () => {
      toast.showSuccess('Đã cập nhật thể loại.', { duration: 2000 });
      router.back();
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không cập nhật được thể loại.')),
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: CategoryFormValues) => {
    const body = {
      name: data.name.trim(),
      description: data.description.trim() || undefined,
    };
    if (isEdit && categoryId) {
      updateMutation.mutate({ id: categoryId, body });
      return;
    }
    createMutation.mutate(body);
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 12 }]}>
      <ScreenHero
        title={isEdit ? 'Sửa thể loại' : 'Thêm thể loại'}
        subtitle={
          isEdit
            ? 'Cập nhật tên và mô tả danh mục'
            : 'Tạo danh mục mới cho sản phẩm'
        }
        onBack={() => router.back()}
      />

      <SafeAreaView style={styles.sheetSafe} edges={[]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppInput
            label="Tên thể loại"
            name="name"
            control={control}
            rules={{ required: 'Vui lòng nhập tên thể loại' }}
            placeholder="VD: Thực phẩm hữu cơ"
            autoCorrect={false}
            returnKeyType="next"
          />

          <AppInput
            label="Mô tả (tuỳ chọn)"
            name="description"
            control={control}
            placeholder="Mô tả ngắn về danh mục"
            multiline
            numberOfLines={3}
            style={styles.descInput}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, pending && styles.primaryBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={pending}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>
              {pending ? 'Đang xử lý…' : isEdit ? 'Lưu thay đổi' : 'Tạo thể loại'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function CategoryFormWithDefaults({
  initial,
  categoryId,
}: {
  initial: CategoryFormValues;
  categoryId?: string;
}) {
  const form = useForm<CategoryFormValues>({ defaultValues: initial });
  const isEdit = !!categoryId;

  return (
    <FormProvider {...form}>
      <CategoryFormFields isEdit={isEdit} categoryId={categoryId} />
    </FormProvider>
  );
}

export default function AdminCategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const categoryId = Array.isArray(id) ? id[0] : id;
  const isEdit = !!categoryId;

  const { data, isLoading, isError } = useCategory(categoryId ?? '', isEdit);

  if (isEdit && isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={AppEco.primary} />
      </View>
    );
  }

  if (isEdit && (isError || !data?.category)) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>Không tải được thể loại.</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEdit && data?.category) {
    return (
      <CategoryFormWithDefaults
        key={data.category._id}
        categoryId={categoryId}
        initial={mapCategoryToForm(data.category)}
      />
    );
  }

  return (
    <CategoryFormWithDefaults
      initial={{ name: '', description: '' }}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 16,
  },
  errorText: { fontSize: 16, color: AppEco.textSecondary, fontWeight: '600' },
  errorBtn: {
    backgroundColor: AppEco.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: AppEco.radiusLg,
  },
  errorBtnText: { color: '#fff', fontWeight: '700' },
  sheetSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: { flex: 1 },
  form: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 18,
  },
  descInput: { minHeight: 88, textAlignVertical: 'top' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: AppEco.primary,
    paddingVertical: 16,
    borderRadius: AppEco.radiusLg,
    alignItems: 'center',
    ...AppEco.shadowCard,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
