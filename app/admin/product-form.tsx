import { useCategories } from '@/api/category/category.api';
import type { Category } from '@/api/category/category.type';
import {
  useCreateProduct,
  useDetailProduct,
  useUpdateProduct,
} from '@/api/product/product.api';
import type { Product, ProductVariant } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import {
  inferAttributesFromVariants,
  ProductPriceManager,
  type ProductAttribute,
  type ProductVariantForm,
} from '@/components/admin/ProductPriceManager';
import { AppInput } from '@/components/app-input';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProductFormValues = {
  name: string;
  description: string;
  categoryId: string;
  sale: string;
  attributes: ProductAttribute[];
  variants: ProductVariantForm[];
};

type FormTab = 'info' | 'price';

const DEFAULT_VARIANT: ProductVariantForm = {
  color: '',
  size: '',
  stock: 0,
  sold: 0,
  price: 0,
};

function categoryIdFromProduct(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && '_id' in raw) {
    return String((raw as { _id: string })._id);
  }
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return String((raw as { id: string }).id);
  }
  return '';
}

function getCategoryId(item: Category): string {
  const raw = item._id ?? (item as { id?: string }).id;
  return raw != null ? String(raw) : '';
}

function mapProductToForm(product: Product): ProductFormValues {
  const variants: ProductVariantForm[] = product.variants?.length
    ? product.variants.map((v) => ({
        color: v.color,
        size: v.size,
        stock: Number(v.stock),
        sold: Number(v.sold),
        price: Number(v.price),
      }))
    : [{ ...DEFAULT_VARIANT }];

  return {
    name: product.name,
    description: product.description ?? '',
    categoryId: categoryIdFromProduct(product.categoryId),
    sale:
      product.sale != null && product.sale > 0 ? String(product.sale) : '',
    attributes: inferAttributesFromVariants(product.variants ?? []),
    variants,
  };
}

function createEmptyForm(): ProductFormValues {
  return {
    name: '',
    description: '',
    categoryId: '',
    sale: '',
    attributes: [],
    variants: [{ ...DEFAULT_VARIANT }],
  };
}

function TabBar({
  active,
  onChange,
}: {
  active: FormTab;
  onChange: (tab: FormTab) => void;
}) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, active === 'info' && styles.tabActive]}
        onPress={() => onChange('info')}
      >
        <Text style={[styles.tabText, active === 'info' && styles.tabTextActive]}>
          Thông tin
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, active === 'price' && styles.tabActive]}
        onPress={() => onChange('price')}
      >
        <Text style={[styles.tabText, active === 'price' && styles.tabTextActive]}>
          Quản lý giá
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProductInfoTab({
  product,
  newUris,
  setNewUris,
  removedUrls,
  setRemovedUrls,
}: {
  product?: Product;
  newUris: string[];
  setNewUris: React.Dispatch<React.SetStateAction<string[]>>;
  removedUrls: string[];
  setRemovedUrls: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const { control } = useFormContext<ProductFormValues>();
  const toast = useToast();
  const { data: categories = [], isLoading: catLoading } = useCategories();
  const [catModal, setCatModal] = useState(false);

  const existingImages =
    product?.images?.filter((u) => !removedUrls.includes(u)) ?? [];

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.showError('Cần quyền thư viện ảnh để tải hình sản phẩm.');
      return;
    }
    const left = 10 - (existingImages.length + newUris.length);
    if (left <= 0) {
      toast.showError('Tối đa 10 ảnh mỗi sản phẩm.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: left,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.length) {
      setNewUris((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  return (
    <>
      <AppInput
        label="Tên sản phẩm"
        name="name"
        control={control}
        rules={{ required: 'Bắt buộc' }}
        placeholder="VD: Áo thun cổ tròn"
      />
      <AppInput
        label="Mô tả"
        name="description"
        control={control}
        rules={{ required: 'Bắt buộc' }}
        placeholder="Mô tả chi tiết"
        multiline
        style={styles.descInput}
      />

      <Controller
        name="categoryId"
        control={control}
        rules={{ required: 'Vui lòng chọn danh mục' }}
        render={({ field: { value, onChange } }) => {
          const selectedName =
            categories.find((c) => getCategoryId(c) === String(value ?? ''))
              ?.name ?? 'Chọn danh mục';

          return (
            <>
              <Text style={styles.label}>Danh mục</Text>
              <TouchableOpacity
                style={[
                  styles.selectBtn,
                  value ? styles.selectBtnActive : null,
                ]}
                onPress={() => setCatModal(true)}
                disabled={catLoading}
              >
                <Text
                  style={[
                    styles.selectBtnText,
                    value ? styles.selectBtnTextActive : null,
                  ]}
                >
                  {selectedName}
                </Text>
                <Ionicons name="chevron-down" size={18} color={AppEco.textMuted} />
              </TouchableOpacity>

              <Modal visible={catModal} transparent animationType="fade">
                <View style={styles.modalBg}>
                  <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={() => setCatModal(false)}
                  />
                  <View style={styles.modalSheet}>
                    <Text style={styles.modalTitle}>Chọn danh mục</Text>
                    <FlatList
                      data={categories}
                      keyExtractor={(c: Category) => getCategoryId(c)}
                      style={{ maxHeight: 360 }}
                      renderItem={({ item }) => {
                        const id = getCategoryId(item);
                        const selected = id === String(value ?? '');

                        return (
                          <TouchableOpacity
                            style={styles.catRow}
                            onPress={() => {
                              onChange(id);
                              setCatModal(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.catRowText,
                                selected && styles.catRowTextHi,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {selected ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={AppEco.primary}
                              />
                            ) : null}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                </View>
              </Modal>
            </>
          );
        }}
      />

      <AppInput
        label="Giảm giá (%) — tuỳ chọn"
        name="sale"
        control={control}
        placeholder="Để trống nếu không sale"
        keyboardType="number-pad"
      />

      <Text style={styles.sectionTitle}>Ảnh sản phẩm</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.imgRow}>
          {existingImages.map((uri) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.rmImg}
                onPress={() => setRemovedUrls((p) => [...p, uri])}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {newUris.map((uri) => (
            <View key={uri} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.rmImg}
                onPress={() => setNewUris((p) => p.filter((u) => u !== uri))}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImg} onPress={pickImages}>
            <Ionicons name="image-outline" size={28} color={AppEco.primary} />
            <Text style={styles.addImgText}>Thêm ảnh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function ProductFormFields({
  productId,
  product,
}: {
  productId?: string;
  product?: Product;
}) {
  const toast = useToast();
  const isEdit = !!productId;
  const { handleSubmit } = useFormContext<ProductFormValues>();
  const [activeTab, setActiveTab] = useState<FormTab>('info');
  const [newUris, setNewUris] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  const createMut = useCreateProduct({
    onSuccess: () => {
      toast.showSuccess('Đã tạo sản phẩm', {
        onHidden: () => router.back(),
      });
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không tạo được sản phẩm.')),
  });

  const updateMut = useUpdateProduct({
    onSuccess: () => {
      toast.showSuccess('Đã cập nhật sản phẩm', {
        onHidden: () => router.back(),
      });
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không cập nhật được.')),
  });

  const busy = createMut.isPending || updateMut.isPending;

  const onValid = (values: ProductFormValues) => {
    const variants: ProductVariant[] = values.variants.map((v) => {
      const color = v.color.trim();
      const size = v.size.trim();
      const existing = isEdit
        ? product?.variants?.find((ev) => ev.color === color && ev.size === size)
        : undefined;

      return {
        color,
        size,
        stock: Number(v.stock),
        sold: isEdit ? Number(existing?.sold ?? 0) : 0,
        price: Number(v.price),
      };
    });

    for (const v of variants) {
      if (!v.color || !v.size || v.price <= 0) {
        toast.showError(
          'Mỗi biến thể cần đầy đủ thuộc tính và giá > 0. Kiểm tra tab Quản lý giá.',
        );
        setActiveTab('price');
        return;
      }
    }

    if (!values.categoryId) {
      toast.showError('Vui lòng chọn danh mục.');
      setActiveTab('info');
      return;
    }

    const saleRaw = values.sale.trim();
    const saleNum =
      saleRaw === '' ? null : Math.min(100, Math.max(0, Number(saleRaw)));
    if (saleRaw !== '' && Number.isNaN(Number(saleRaw))) {
      toast.showError('Nhập phần trăm sale hợp lệ hoặc để trống.');
      setActiveTab('info');
      return;
    }

    if (!isEdit) {
      if (newUris.length === 0) {
        toast.showError('Thêm ít nhất một ảnh sản phẩm.');
        setActiveTab('info');
        return;
      }
      createMut.mutate({
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        sale: saleNum,
        variants,
        imageUris: newUris,
      });
      return;
    }

    if (!productId) return;
    updateMut.mutate({
      id: productId,
      payload: {
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        sale: saleNum,
        variants,
        newImageUris: newUris,
        removeImageUrls: removedUrls,
      },
    });
  };

  return (
    <>
      <TabBar active={activeTab} onChange={setActiveTab} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'info' ? (
          <ProductInfoTab
            product={product}
            newUris={newUris}
            setNewUris={setNewUris}
            removedUrls={removedUrls}
            setRemovedUrls={setRemovedUrls}
          />
        ) : (
          <ProductPriceManager />
        )}

        <TouchableOpacity
          style={[styles.submit, busy && styles.submitDis]}
          disabled={busy}
          onPress={handleSubmit(onValid)}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

function ProductFormWithDefaults({
  initial,
  productId,
  product,
}: {
  initial: ProductFormValues;
  productId?: string;
  product?: Product;
}) {
  const form = useForm<ProductFormValues>({ defaultValues: initial });

  useEffect(() => {
    form.reset(initial);
  }, [form, initial]);

  return (
    <FormProvider {...form}>
      <ProductFormFields productId={productId} product={product} />
    </FormProvider>
  );
}

export default function AdminProductFormScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const productId = typeof id === 'string' ? id : id?.[0];
  const isEdit = !!productId;

  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data: detailAxios, isLoading: detailLoading, isError } =
    useDetailProduct(productId ?? '');
  const product = detailAxios?.data?.data;

  if (userLoading) {
    return (
      <View style={[styles.centerAll, { paddingTop: insets.top }]}>
        <ActivityIndicator color={AppEco.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.centerAll, { paddingTop: insets.top }]}>
        <Text style={styles.deny}>Chỉ quản trị mới vào được.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEdit && detailLoading) {
    return (
      <View style={[styles.centerAll, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={AppEco.primary} />
        <Text style={styles.muted}>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  if (isEdit && (isError || !product)) {
    return (
      <View style={[styles.centerAll, { paddingTop: insets.top }]}>
        <Text style={styles.deny}>Không tải được sản phẩm.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <ScreenHero
        title={productId ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}
        subtitle={
          productId
            ? 'Cập nhật thông tin và quản lý giá biến thể'
            : 'Thêm sản phẩm mới cho cửa hàng'
        }
        onBack={() => router.back()}
      />
      {isEdit && product ? (
        <ProductFormWithDefaults
          key={product._id}
          initial={mapProductToForm(product)}
          productId={productId}
          product={product}
        />
      ) : (
        <ProductFormWithDefaults initial={createEmptyForm()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { marginTop: 8, color: AppEco.textSecondary },
  deny: { fontSize: 16, fontWeight: '700', color: AppEco.textSecondary },
  link: { marginTop: 12, color: AppEco.primary, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: AppEco.radiusLg,
    padding: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: AppEco.radiusMd,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: AppEco.surface,
    ...AppEco.shadowCard,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppEco.textSecondary,
  },
  tabTextActive: {
    color: AppEco.primary,
    fontWeight: '800',
  },
  scroll: { padding: 16, paddingTop: 12, paddingBottom: 48, gap: 4 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: AppEco.primary,
    paddingLeft: 10,
    marginBottom: 6,
  },
  descInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusLg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  selectBtnActive: {
    borderColor: AppEco.primary,
    backgroundColor: AppEco.surface,
  },
  selectBtnText: { fontSize: 16, color: AppEco.textMuted },
  selectBtnTextActive: { color: AppEco.text, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppEco.text,
    marginBottom: 10,
    marginTop: 8,
  },
  imgRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: AppEco.radiusSm,
    backgroundColor: '#F3F4F6',
  },
  rmImg: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: AppEco.radiusFull,
    backgroundColor: AppEco.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImg: {
    width: 88,
    height: 88,
    borderRadius: AppEco.radiusSm,
    borderWidth: 2,
    borderColor: AppEco.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  addImgText: {
    fontSize: 10,
    color: AppEco.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  submit: {
    backgroundColor: AppEco.primary,
    paddingVertical: 16,
    borderRadius: AppEco.radiusLg,
    alignItems: 'center',
    marginTop: 20,
    ...AppEco.shadowCard,
  },
  submitDis: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(19, 78, 74, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSheet: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    color: AppEco.text,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  catRowText: { fontSize: 15, color: AppEco.textSecondary },
  catRowTextHi: { color: AppEco.primary, fontWeight: '800' },
});
