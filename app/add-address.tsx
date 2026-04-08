import {
  useCreateAddress,
  useDetailAddress,
  useUpdateAddress,
} from '@/api/address/address.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { AddressType, CreateAddressPayload } from '@/api/address/address.type';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PROVINCES_API = 'https://provinces.open-api.vn/api';

const ADDRESS_TYPES: { value: AddressType; label: string; icon: 'home-outline' | 'business-outline' | 'cube-outline'; color: string; bg: string }[] = [
  { value: 'home',      label: 'Nhà riêng', icon: 'home-outline',     color: '#0EA5E9', bg: '#E0F2FE' },
  { value: 'office',    label: 'Văn phòng', icon: 'business-outline', color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'warehouse', label: 'Kho hàng',  icon: 'cube-outline',     color: '#D97706', bg: '#FEF3C7' },
];

interface LocationItem {
  code: number;
  name: string;
}

// ─── LocationPicker ────────────────────────────────────────────────────────────
function LocationPicker({
  label,
  placeholder,
  value,
  items,
  loading,
  disabled,
  onSelect,
}: {
  label: string;
  placeholder: string;
  value: string;
  items: LocationItem[];
  loading: boolean;
  disabled: boolean;
  onSelect: (item: LocationItem) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const open = () => {
    setSearch('');
    setVisible(true);
  };

  return (
    <>
      <View style={pickerStyles.wrapper}>
        <Text style={pickerStyles.label}>{label}</Text>
        <TouchableOpacity
          style={[pickerStyles.trigger, disabled && pickerStyles.triggerDisabled]}
          onPress={open}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Text
            style={[pickerStyles.triggerText, !value && pickerStyles.triggerPlaceholder]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0EA5E9" />
          ) : (
            <Ionicons
              name="chevron-down"
              size={16}
              color={disabled ? '#D1D5DB' : '#6B7280'}
            />
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={pickerStyles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.sheetHandle} />

          <View style={pickerStyles.sheetHeader}>
            <Text style={pickerStyles.sheetTitle}>{label}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.searchWrap}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={pickerStyles.searchInput}
              placeholder={`Tìm ${label.toLowerCase()}...`}
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={pickerStyles.emptyWrap}>
              <Text style={pickerStyles.emptyText}>Không tìm thấy kết quả</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.code)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const selected = item.name === value;
                return (
                  <TouchableOpacity
                    style={[pickerStyles.option, selected && pickerStyles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[pickerStyles.optionText, selected && pickerStyles.optionTextSelected]}
                    >
                      {item.name}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark" size={16} color="#0EA5E9" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

// ─── AddAddressScreen ──────────────────────────────────────────────────────────
export default function AddAddressScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { data: currentUser } = useGetCurrentUser();
  const isSeller = (currentUser as any)?.role === 'seller';

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [addressType, setAddressType] = useState<AddressType>('home');

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(null);
  const [selectedWard, setSelectedWard] = useState<LocationItem | null>(null);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const phoneRef = useRef<TextInput>(null);
  const streetRef = useRef<TextInput>(null);
  // prevent double-init in edit mode
  const initDoneRef = useRef(false);

  // fetch detail when editing
  const { data: detailData, isLoading: detailLoading } = useDetailAddress(id ?? '');
  const detail = detailData?.data?.data;

  // fetch provinces on mount
  useEffect(() => {
    setLoadingProvinces(true);
    axios
      .get<LocationItem[]>(`${PROVINCES_API}/?depth=1`)
      .then((res) => setProvinces(res.data))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành.'))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // populate form once provinces & detail are both ready
  useEffect(() => {
    if (!isEditMode || !detail || provinces.length === 0 || initDoneRef.current) return;
    initDoneRef.current = true;

    setFullName(detail.fullName);
    setPhoneNumber(detail.phoneNumber);
    setStreet(detail.street);
    setIsDefault(detail.isDefault);
    setAddressType(detail.type ?? 'home');

    // find province by name then cascade
    const province = provinces.find(
      (p) => p.name.toLowerCase() === detail.province.toLowerCase()
    );
    if (!province) return;

    setSelectedProvince(province);
    setLoadingDistricts(true);
    axios
      .get<{ districts: LocationItem[] }>(`${PROVINCES_API}/p/${province.code}?depth=2`)
      .then((res) => {
        const dists = res.data.districts;
        setDistricts(dists);

        const district = dists.find(
          (d) => d.name.toLowerCase() === detail.district.toLowerCase()
        );
        if (!district) return;

        setSelectedDistrict(district);
        setLoadingWards(true);
        axios
          .get<{ wards: LocationItem[] }>(`${PROVINCES_API}/d/${district.code}?depth=2`)
          .then((wRes) => {
            const wardList = wRes.data.wards;
            setWards(wardList);

            const ward = wardList.find(
              (w) => w.name.toLowerCase() === detail.ward.toLowerCase()
            );
            if (ward) setSelectedWard(ward);
          })
          .finally(() => setLoadingWards(false));
      })
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách quận/huyện.'))
      .finally(() => setLoadingDistricts(false));
  }, [isEditMode, detail, provinces]);

  // fetch districts when user manually picks a province
  const handleSelectProvince = useCallback((item: LocationItem) => {
    setSelectedProvince(item);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    setLoadingDistricts(true);
    axios
      .get<{ districts: LocationItem[] }>(`${PROVINCES_API}/p/${item.code}?depth=2`)
      .then((res) => setDistricts(res.data.districts))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách quận/huyện.'))
      .finally(() => setLoadingDistricts(false));
  }, []);

  // fetch wards when user manually picks a district
  const handleSelectDistrict = useCallback((item: LocationItem) => {
    setSelectedDistrict(item);
    setSelectedWard(null);
    setWards([]);

    setLoadingWards(true);
    axios
      .get<{ wards: LocationItem[] }>(`${PROVINCES_API}/d/${item.code}?depth=2`)
      .then((res) => setWards(res.data.wards))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã.'))
      .finally(() => setLoadingWards(false));
  }, []);

  const { mutate: createAddress, isPending: isCreating } = useCreateAddress({
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã thêm địa chỉ mới.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể lưu địa chỉ. Vui lòng thử lại.'),
  });

  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress({
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã cập nhật địa chỉ.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ. Vui lòng thử lại.'),
  });

  const isPending = isCreating || isUpdating;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
    if (!phoneNumber.trim()) e.phoneNumber = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(phoneNumber.trim()))
      e.phoneNumber = 'Số điện thoại không hợp lệ';
    if (!selectedProvince) e.province = 'Vui lòng chọn tỉnh/thành';
    if (!selectedDistrict) e.district = 'Vui lòng chọn quận/huyện';
    if (!selectedWard) e.ward = 'Vui lòng chọn phường/xã';
    if (!street.trim()) e.street = 'Vui lòng nhập địa chỉ cụ thể';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: CreateAddressPayload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      province: selectedProvince!.name,
      district: selectedDistrict!.name,
      ward: selectedWard!.name,
      street: street.trim(),
      isDefault,
      type: addressType,
    };
    if (isEditMode) {
      updateAddress({ id: id!, payload });
    } else {
      createAddress(payload);
    }
  };

  const isInitializing = isEditMode && (detailLoading || !initDoneRef.current);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Loading skeleton while fetching detail */}
      {isEditMode && detailLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Đang tải thông tin địa chỉ...</Text>
        </View>
      ) : (
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
            {/* Section: Thông tin liên hệ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Họ và tên <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, !!errors.fullName && styles.inputError]}
                  placeholder="Nhập họ và tên người nhận"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={(v) => {
                    setFullName(v);
                    if (errors.fullName) setErrors((e) => ({ ...e, fullName: '' }));
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                />
                {!!errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Số điện thoại <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={phoneRef}
                  style={[styles.input, !!errors.phoneNumber && styles.inputError]}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNumber}
                  onChangeText={(v) => {
                    setPhoneNumber(v);
                    if (errors.phoneNumber)
                      setErrors((e) => ({ ...e, phoneNumber: '' }));
                  }}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
                {!!errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>
            </View>

            {/* Section: Địa chỉ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Địa chỉ</Text>

              <LocationPicker
                label="Tỉnh / Thành phố"
                placeholder="Chọn tỉnh / thành phố"
                value={selectedProvince?.name ?? ''}
                items={provinces}
                loading={loadingProvinces}
                disabled={loadingProvinces}
                onSelect={(item) => {
                  handleSelectProvince(item);
                  if (errors.province) setErrors((e) => ({ ...e, province: '' }));
                }}
              />
              {!!errors.province && (
                <Text style={[styles.errorText, styles.pickerError]}>{errors.province}</Text>
              )}

              <LocationPicker
                label="Quận / Huyện"
                placeholder={
                  selectedProvince ? 'Chọn quận / huyện' : 'Chọn tỉnh/thành trước'
                }
                value={selectedDistrict?.name ?? ''}
                items={districts}
                loading={loadingDistricts}
                disabled={!selectedProvince || loadingDistricts}
                onSelect={(item) => {
                  handleSelectDistrict(item);
                  if (errors.district) setErrors((e) => ({ ...e, district: '' }));
                }}
              />
              {!!errors.district && (
                <Text style={[styles.errorText, styles.pickerError]}>{errors.district}</Text>
              )}

              <LocationPicker
                label="Phường / Xã"
                placeholder={
                  selectedDistrict ? 'Chọn phường / xã' : 'Chọn quận/huyện trước'
                }
                value={selectedWard?.name ?? ''}
                items={wards}
                loading={loadingWards}
                disabled={!selectedDistrict || loadingWards}
                onSelect={(item) => {
                  setSelectedWard(item);
                  if (errors.ward) setErrors((e) => ({ ...e, ward: '' }));
                }}
              />
              {!!errors.ward && (
                <Text style={[styles.errorText, styles.pickerError]}>{errors.ward}</Text>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>
                  Địa chỉ cụ thể <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  ref={streetRef}
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    !!errors.street && styles.inputError,
                  ]}
                  placeholder="Số nhà, tên đường, thôn/xóm..."
                  placeholderTextColor="#9CA3AF"
                  value={street}
                  onChangeText={(v) => {
                    setStreet(v);
                    if (errors.street) setErrors((e) => ({ ...e, street: '' }));
                  }}
                  multiline
                  numberOfLines={2}
                  returnKeyType="done"
                />
                {!!errors.street && (
                  <Text style={styles.errorText}>{errors.street}</Text>
                )}
              </View>
            </View>

            {/* Section: Loại địa chỉ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Loại địa chỉ</Text>
              <View style={styles.typeGrid}>
                {ADDRESS_TYPES.filter((t) => isSeller || t.value !== 'warehouse').map((opt) => {
                  const active = addressType === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.typeBtn, active && { borderColor: opt.color, backgroundColor: opt.bg }]}
                      onPress={() => setAddressType(opt.value)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.typeIconWrap, { backgroundColor: active ? opt.color : '#F3F4F6' }]}>
                        <Ionicons name={opt.icon} size={18} color={active ? '#fff' : '#9CA3AF'} />
                      </View>
                      <Text style={[styles.typeBtnText, active && { color: opt.color }]}>{opt.label}</Text>
                      {active && (
                        <View style={[styles.typeCheck, { backgroundColor: opt.color }]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section: Tuỳ chọn */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <View>
                    <Text style={styles.toggleLabel}>Đặt làm địa chỉ mặc định</Text>
                    <Text style={styles.toggleSub}>Dùng cho đơn hàng tiếp theo</Text>
                  </View>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  trackColor={{ false: '#E5E7EB', true: '#BAE6FD' }}
                  thumbColor={isDefault ? '#0EA5E9' : '#9CA3AF'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Save button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, (isPending || isInitializing) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isPending || isInitializing}
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
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

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

  fieldWrap: { marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  pickerError: { marginTop: -4, marginBottom: 6 },

  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
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
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
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
    backgroundColor: '#0EA5E9',
    borderRadius: 14,
    paddingVertical: 15,
  },
  saveBtnDisabled: { backgroundColor: '#BAE6FD' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

const pickerStyles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  triggerDisabled: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  triggerText: { flex: 1, fontSize: 14, color: '#111827' },
  triggerPlaceholder: { color: '#9CA3AF' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827', padding: 0 },

  emptyWrap: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  optionSelected: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionText: { fontSize: 14, color: '#374151', flex: 1 },
  optionTextSelected: { color: '#0EA5E9', fontWeight: '700' },
});
