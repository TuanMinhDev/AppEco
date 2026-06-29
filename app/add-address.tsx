import {
  useCreateAddress,
  useDetailAddress,
  useUpdateAddress,
} from '@/api/address/address.api';
import { AddressType, CreateAddressPayload, IAddress } from '@/api/address/address.type';
import {
  LocationItem,
  useAllWardsOfProvince,
  useProvincesQuery,
  WardWithDistrict,
} from '@/api/address/vietnam-locations';
import { useGetCurrentUser } from '@/api/user/user.api';
import { LocationPicker } from '@/components/address/LocationPicker';
import { AppInput } from '@/components/app-input';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { useToast } from '@/components/toast/ToastProvider';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getApiErrorMessage } from '@/utils/api-error-message';

const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  icon: 'home-outline' | 'business-outline' | 'cube-outline';
  color: string;
  bg: string;
}[] = [
  {
    value: 'home',
    label: 'Nhà riêng',
    icon: 'home-outline',
    color: '#2563EB',
    bg: '#DBEAFE',
  },
  {
    value: 'office',
    label: 'Văn phòng',
    icon: 'business-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    value: 'warehouse',
    label: 'Kho hàng',
    icon: 'cube-outline',
    color: '#D97706',
    bg: '#FEF3C7',
  },
];

export type AddressFormValues = {
  fullName: string;
  phoneNumber: string;
  street: string;
  isDefault: boolean;
  addressType: AddressType;
  province: LocationItem | null;
  district: LocationItem | null;
  ward: LocationItem | null;
};

const DEFAULT_VALUES: AddressFormValues = {
  fullName: '',
  phoneNumber: '',
  street: '',
  isDefault: false,
  addressType: 'home',
  province: null,
  district: null,
  ward: null,
};

function AddAddressForm({ addressId, isEditMode }: { addressId?: string; isEditMode: boolean }) {
  const toast = useToast();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useFormContext<AddressFormValues>();

  const { data: currentUser } = useGetCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  const provinceWatch = useWatch({ control, name: 'province' });

  const { data: provinces = [], isLoading: loadingProvinces } =
    useProvincesQuery();
  const { data: allWards = [], isLoading: loadingAllWards } =
    useAllWardsOfProvince(provinceWatch?.code);

  const { mutate: createAddress, isPending: isCreating } = useCreateAddress({
    onSuccess: () => {
      toast.showSuccess('Đã thêm địa chỉ mới.', {
        onHidden: () => router.back(),
      });
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không thể lưu địa chỉ. Vui lòng thử lại.')),
  });

  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress({
    onSuccess: () => {
      toast.showSuccess('Đã cập nhật địa chỉ.', {
        onHidden: () => router.back(),
      });
    },
    onError: (e) =>
      toast.showError(getApiErrorMessage(e, 'Không thể cập nhật địa chỉ. Vui lòng thử lại.')),
  });

  const isPending = isCreating || isUpdating;

  const onValid = (data: AddressFormValues) => {
    const payload: CreateAddressPayload = {
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      province: data.province!.name,
      ward: data.ward!.name,
      street: data.street.trim(),
      isDefault: data.isDefault,
      type: data.addressType,
    };
    if (data.district?.name) payload.district = data.district.name;

    if (isEditMode && addressId) {
      updateAddress({ id: addressId, payload });
    } else {
      createAddress(payload);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <AppInput
            label="Họ và tên"
            name="fullName"
            control={control}
            rules={{ required: 'Vui lòng nhập họ tên' }}
            placeholder="Nhập họ và tên người nhận"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="words"
            returnKeyType="next"
          />
          <AppInput
            label="Số điện thoại"
            name="phoneNumber"
            control={control}
            rules={{
              required: 'Vui lòng nhập số điện thoại',
              pattern: {
                value: /^[0-9]{9,11}$/,
                message: 'Số điện thoại không hợp lệ',
              },
            }}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            returnKeyType="next"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>

          <Controller
            control={control}
            name="province"
            rules={{
              validate: (v) => (v?.name ? true : 'Vui lòng chọn tỉnh/thành'),
            }}
            render={({ field: { value } }) => (
              <>
                <LocationPicker
                  label="Tỉnh / Thành phố"
                  placeholder="Chọn tỉnh / thành phố"
                  value={value?.name ?? ''}
                  items={provinces}
                  loading={loadingProvinces}
                  disabled={loadingProvinces}
                  onSelect={(item) => {
                    setValue('province', item, { shouldValidate: true });
                    setValue('district', null);
                    setValue('ward', null);
                  }}
                />
                {errors.province?.message ? (
                  <Text style={styles.errorText}>{errors.province.message}</Text>
                ) : null}
              </>
            )}
          />

          <Controller
            control={control}
            name="ward"
            rules={{
              validate: (v) => (v?.name ? true : 'Vui lòng chọn phường/xã'),
            }}
            render={({ field: { value } }) => (
              <>
                <LocationPicker
                  label="Phường / Xã"
                  placeholder={
                    provinceWatch
                      ? 'Chọn phường / xã'
                      : 'Chọn tỉnh/thành trước'
                  }
                  value={value?.name ?? ''}
                  items={allWards.map((w) => ({
                    code: w.code,
                    name: w.name,
                    _original: w,
                  })) as any}
                  loading={loadingAllWards}
                  disabled={!provinceWatch || loadingAllWards}
                  onSelect={(item: any) => {
                    const original: WardWithDistrict | undefined = item._original;
                    if (original) {
                      setValue('ward', { code: original.code, name: original.name } as LocationItem, { shouldValidate: true });
                      setValue('district', original.district, { shouldValidate: true });
                    } else {
                      setValue('ward', item, { shouldValidate: true });
                    }
                  }}
                />
                {errors.ward?.message ? (
                  <Text style={[styles.errorText, styles.pickerError]}>
                    {errors.ward.message}
                  </Text>
                ) : null}
              </>
            )}
          />

          <AppInput
            label="Địa chỉ cụ thể (số nhà, đường)"
            name="street"
            control={control}
            rules={{ required: 'Vui lòng nhập địa chỉ cụ thể' }}
            placeholder="Số nhà, tên đường..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="sentences"
            multiline
            numberOfLines={2}
            style={{
              minHeight: 72,
              textAlignVertical: 'top',
              paddingTop: 12,
            }}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại địa chỉ</Text>
          <Controller
            control={control}
            name="addressType"
            render={({ field: { value, onChange } }) => (
              <View style={styles.typeGrid}>
                {ADDRESS_TYPES.filter(
                  (t) => isAdmin || t.value !== 'warehouse',
                ).map((opt) => {
                  const active = value === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.typeBtn,
                        active && {
                          borderColor: opt.color,
                          backgroundColor: opt.bg,
                        },
                      ]}
                      onPress={() => onChange(opt.value)}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.typeIconWrap,
                          {
                            backgroundColor: active ? opt.color : '#F3F4F6',
                          },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? '#fff' : '#9CA3AF'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.typeBtnText,
                          active && { color: opt.color },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {active && (
                        <View
                          style={[
                            styles.typeCheck,
                            { backgroundColor: opt.color },
                          ]}
                        >
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          />
        </View>

        <View style={styles.section}>
          <Controller
            control={control}
            name="isDefault"
            render={({ field: { value, onChange } }) => (
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <View>
                    <Text style={styles.toggleLabel}>
                      Đặt làm địa chỉ mặc định
                    </Text>
                    <Text style={styles.toggleSub}>
                      Dùng cho đơn hàng tiếp theo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#E5E7EB', true: '#BFDBFE' }}
                  thumbColor={value ? '#2563EB' : '#9CA3AF'}
                />
              </View>
            )}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isPending && styles.saveBtnDisabled]}
          onPress={handleSubmit(onValid)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isEditMode ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function AddAddressScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const methods = useForm<AddressFormValues>({ defaultValues: DEFAULT_VALUES });
  const { reset, watch, setValue } = methods;

  const { data: detailRes, isLoading: detailLoading } = useDetailAddress(
    id ?? '',
  );
  const rawBody = detailRes?.data as { data?: IAddress } | IAddress | undefined;
  const detail =
    rawBody &&
    typeof rawBody === 'object' &&
    'data' in rawBody &&
    rawBody.data
      ? rawBody.data
      : (rawBody as IAddress | undefined);

  const { data: provinces = [] } = useProvincesQuery();

  const provinceCode = watch('province')?.code;
  const { data: allWards = [] } = useAllWardsOfProvince(provinceCode);

  const hydrateStep = useRef<'idle' | 'province' | 'done'>('idle');

  useEffect(() => {
    hydrateStep.current = 'idle';
  }, [id]);

  useEffect(() => {
    if (!isEditMode || !detail || provinces.length === 0) return;
    if (hydrateStep.current !== 'idle') return;
    const p = provinces.find(
      (x) => x.name.toLowerCase() === detail.province?.toLowerCase(),
    );
    if (!p) return;
    reset({
      fullName: detail.fullName ?? '',
      phoneNumber: detail.phoneNumber ?? '',
      street: detail.street ?? '',
      isDefault: !!detail.isDefault,
      addressType: (detail.type as AddressType) ?? 'home',
      province: p,
      district: null,
      ward: null,
    });
    hydrateStep.current = 'province';
  }, [isEditMode, detail, provinces, reset]);

  // Hydrate ward + district từ allWards
  useEffect(() => {
    if (
      !isEditMode ||
      !detail ||
      allWards.length === 0 ||
      hydrateStep.current !== 'province'
    )
      return;
    if (detail.ward) {
      const w = allWards.find(
        (x) => x.name.toLowerCase() === detail.ward?.toLowerCase(),
      );
      if (w) {
        setValue('ward', { code: w.code, name: w.name });
        setValue('district', w.district);
      }
    }
    hydrateStep.current = 'done';
  }, [isEditMode, detail, allWards, setValue]);

  return (
    <View style={styles.root}>
      <ScreenHero
        title={isEditMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'}
        subtitle={
          isEditMode
            ? 'Cập nhật thông tin nhận hàng'
            : 'Thêm địa chỉ mới để đặt hàng nhanh hơn'
        }
        onBack={() => router.back()}
      />

      {isEditMode && detailLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải thông tin địa chỉ...</Text>
        </View>
      ) : (
        <FormProvider {...methods}>
          <AddAddressForm addressId={id} isEditMode={isEditMode} />
        </FormProvider>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#6B7280' },
  scrollContent: { padding: 16, gap: 12 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  pickerError: { marginTop: -4, marginBottom: 6 },
  typeGrid: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
    position: 'relative',
  },
  typeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  typeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  toggleSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 15,
  },
  saveBtnDisabled: { backgroundColor: '#BFDBFE' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
