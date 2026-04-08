import {
  useDeleteAddress,
  useListAddress,
  useSetDefaultAddress,
} from '@/api/address/address.api';
import { AddressType, IAddress } from '@/api/address/address.type';
import { useAppDispatch } from '@/src/store';
import { setShippingInfo } from '@/src/store/slices/checkoutSlice';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADDRESS_TYPE_MAP: Record<AddressType, { label: string; icon: 'home-outline' | 'business-outline' | 'cube-outline'; color: string; bg: string }> = {
  home:      { label: 'Nhà riêng', icon: 'home-outline',     color: '#0EA5E9', bg: '#E0F2FE' },
  office:    { label: 'Văn phòng', icon: 'business-outline', color: '#7C3AED', bg: '#EDE9FE' },
  warehouse: { label: 'Kho hàng',  icon: 'cube-outline',     color: '#D97706', bg: '#FEF3C7' },
};

function AddressCard({
  item,
  isDefault,
  isSelectMode,
  onSelect,
  onSetDefault,
  onDelete,
  isSettingDefault,
  isDeletingId,
}: {
  item: IAddress;
  isDefault: boolean;
  isSelectMode: boolean;
  onSelect: (item: IAddress) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isSettingDefault: boolean;
  isDeletingId: string | null;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, isDefault && styles.cardDefault]}
      onPress={isSelectMode ? () => onSelect(item) : undefined}
      activeOpacity={isSelectMode ? 0.75 : 1}
    >
      {isDefault && (
        <View style={styles.defaultBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#0EA5E9" />
          <Text style={styles.defaultBadgeText}>Mặc định</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name="location"
            size={20}
            color={isDefault ? '#0EA5E9' : '#9CA3AF'}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.fullName}</Text>
          <Text style={styles.cardPhone}>{item.phoneNumber}</Text>
          <Text style={styles.cardAddr} numberOfLines={3}>
            {item.street}, {item.ward}, {item.district}, {item.province}
          </Text>
          {(() => {
            const t = ADDRESS_TYPE_MAP[item.type] ?? ADDRESS_TYPE_MAP.home;
            return (
              <View style={[styles.typeBadge, { backgroundColor: t.bg }]}>
                <Ionicons name={t.icon} size={11} color={t.color} />
                <Text style={[styles.typeBadgeText, { color: t.color }]}>{t.label}</Text>
              </View>
            );
          })()}
        </View>
        {isSelectMode && (
          <View style={styles.selectRadio}>
            <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
          </View>
        )}
      </View>

      {!isSelectMode && (
        <View style={styles.cardActions}>
          {!isDefault && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onSetDefault(item._id)}
              disabled={isSettingDefault}
              activeOpacity={0.7}
            >
              {isSettingDefault ? (
                <ActivityIndicator size="small" color="#0EA5E9" />
              ) : (
                <>
                  <Ionicons name="star-outline" size={14} color="#0EA5E9" />
                  <Text style={styles.actionBtnText}>Đặt mặc định</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push((`/add-address?id=${item._id}`) as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={14} color="#0EA5E9" />
            <Text style={styles.actionBtnText}>Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => onDelete(item._id)}
            disabled={isDeletingId === item._id}
            activeOpacity={0.7}
          >
            {isDeletingId === item._id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
                  Xoá
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isSelectMode && (
        <TouchableOpacity
          style={styles.selectBtn}
          onPress={() => onSelect(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
          <Text style={styles.selectBtnText}>Chọn địa chỉ này</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function AddressesScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSelectMode = mode === 'select';
  const dispatch = useAppDispatch();

  const { data: addressesData, isLoading } = useListAddress();
  const addresses: IAddress[] = addressesData?.data?.items ?? [];

  const defaultAddress = addresses.find((a) => a.isDefault);
  const otherAddresses = addresses.filter((a) => !a.isDefault);

  const [settingDefaultId, setSettingDefaultId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { mutate: setDefault } = useSetDefaultAddress({
    onSuccess: () => setSettingDefaultId(null),
    onError: () => {
      setSettingDefaultId(null);
      Alert.alert('Lỗi', 'Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
    },
  });

  const { mutate: deleteAddress } = useDeleteAddress({
    onSuccess: () => setDeletingId(null),
    onError: () => {
      setDeletingId(null);
      Alert.alert('Lỗi', 'Không thể xoá địa chỉ. Vui lòng thử lại.');
    },
  });

  const handleSetDefault = (id: string) => {
    setSettingDefaultId(id);
    setDefault(id);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xoá địa chỉ', 'Bạn có chắc muốn xoá địa chỉ này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          setDeletingId(id);
          deleteAddress(id);
        },
      },
    ]);
  };

  const handleSelectAddress = (addr: IAddress) => {
    dispatch(
      setShippingInfo({
        fullName: addr.fullName,
        phone: addr.phoneNumber,
        street: addr.street,
        ward: addr.ward,
        address: `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`,
        city: addr.province,
        district: addr.district,
        addressId: addr._id,
        postalCode: '',
        addressType: addr.type ?? 'home',
      })
    );
    router.back();
  };

  const sections: { title: string; data: IAddress[] }[] = [];
  if (defaultAddress) {
    sections.push({ title: 'Địa chỉ mặc định', data: [defaultAddress] });
  }
  if (otherAddresses.length > 0) {
    sections.push({ title: 'Địa chỉ khác', data: otherAddresses });
  }

  const flatItems: ({ type: 'header'; title: string } | { type: 'item'; item: IAddress })[] = [];
  for (const sec of sections) {
    flatItems.push({ type: 'header', title: sec.title });
    for (const item of sec.data) {
      flatItems.push({ type: 'item', item });
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSelectMode ? 'Chọn địa chỉ giao hàng' : 'Địa chỉ của tôi'}
        </Text>
        {isSelectMode ? (
          <View style={styles.backBtn} />
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/add-address' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color="#0EA5E9" />
          </TouchableOpacity>
        )}
      </View>

      {isSelectMode && (
        <View style={styles.selectBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
          <Text style={styles.selectBannerText}>
            Chạm vào địa chỉ để chọn làm địa chỉ giao hàng
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={60} color="#D1D5DB" />
          <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
          <Text style={styles.emptySubText}>Thêm địa chỉ để tiện đặt hàng</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => router.push('/add-address' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Thêm địa chỉ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={flatItems}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{row.title}</Text>
                </View>
              );
            }
            const addr = row.item;
            return (
              <AddressCard
                item={addr}
                isDefault={!!addr.isDefault}
                isSelectMode={isSelectMode}
                onSelect={handleSelectAddress}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
                isSettingDefault={settingDefaultId === addr._id}
                isDeletingId={deletingId}
              />
            );
          }}
          ListFooterComponent={
            isSelectMode ? (
              <TouchableOpacity
                style={styles.newAddressBtn}
                onPress={() => router.push('/add-address' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.newAddressBtnIcon}>
                  <Ionicons name="add" size={20} color="#0EA5E9" />
                </View>
                <View style={styles.newAddressBtnBody}>
                  <Text style={styles.newAddressBtnLabel}>Thêm địa chỉ mới</Text>
                  <Text style={styles.newAddressBtnSub}>Không tìm thấy địa chỉ phù hợp?</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  selectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E0F2FE',
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  selectBannerText: { fontSize: 13, color: '#0284C7', fontWeight: '500', flex: 1 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#9CA3AF' },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  sectionHeader: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDefault: {
    borderColor: '#BAE6FD',
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  defaultBadgeText: { fontSize: 12, fontWeight: '700', color: '#0EA5E9' },

  cardTop: { flexDirection: 'row', gap: 12 },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardAddr: { fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 20 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },

  selectRadio: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },

  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: '#0EA5E9',
    borderRadius: 10,
    paddingVertical: 11,
  },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  actionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#0EA5E9' },
  actionBtnTextDanger: { color: '#EF4444' },

  newAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
  },
  newAddressBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  newAddressBtnBody: { flex: 1 },
  newAddressBtnLabel: { fontSize: 15, fontWeight: '700', color: '#0EA5E9' },
  newAddressBtnSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
