import {
    useDeleteAddress,
    useListAddress,
    useSetDefaultAddress,
} from '@/api/address/address.api';
import { AddressType, IAddress } from '@/api/address/address.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { ScreenHero, ScreenHeroAddButton } from '@/components/screen-hero/ScreenHero';
import { AppEco } from '@/constants/theme';
import { useAppDispatch } from '@/src/store';
import { setShippingInfo } from '@/src/store/slices/checkoutSlice';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getApiErrorMessage } from '@/utils/api-error-message';

const ADDRESS_TYPE_MAP: Record<AddressType, { label: string; icon: 'home-outline' | 'business-outline' | 'cube-outline'; color: string; bg: string }> = {
  home:      { label: 'Nhà riêng', icon: 'home-outline',     color: AppEco.primary, bg: AppEco.primaryMuted },
  office:    { label: 'Văn phòng', icon: 'business-outline', color: '#7C3AED', bg: '#EDE9FE' },
  warehouse: { label: 'Kho hàng',  icon: 'cube-outline',     color: AppEco.accent, bg: '#FEF3C7' },
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
  canDelete,
}: {
  item: IAddress;
  isDefault: boolean;
  isSelectMode: boolean;
  onSelect: (item: IAddress) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isSettingDefault: boolean;
  isDeletingId: string | null;
  canDelete: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, isDefault && styles.cardDefault]}
      onPress={isSelectMode ? () => onSelect(item) : undefined}
      activeOpacity={isSelectMode ? 0.75 : 1}
    >
      {isDefault && (
        <View style={styles.defaultBadge}>
          <Ionicons name="checkmark-circle" size={13} color={AppEco.primary} />
          <Text style={styles.defaultBadgeText}>Mặc định</Text>
        </View>
      )}

      <View style={styles.cardTop}>
        <View style={styles.cardIconWrap}>
          <Ionicons
            name="location"
            size={20}
            color={isDefault ? AppEco.primary : AppEco.textMuted}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.fullName}</Text>
          <Text style={styles.cardPhone}>{item.phoneNumber}</Text>
          <Text style={styles.cardAddr} numberOfLines={3}>
            {[item.street, item.ward, item.district, item.province].filter(Boolean).join(', ')}
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
            <Ionicons name="chevron-forward" size={18} color={AppEco.primary} />
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
                <ActivityIndicator size="small" color={AppEco.primary} />
              ) : (
                <>
                  <Ionicons name="star-outline" size={14} color={AppEco.primary} />
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
            <Ionicons name="pencil-outline" size={14} color={AppEco.primary} />
            <Text style={styles.actionBtnText}>Sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={() => onDelete(item._id)}
            disabled={isDeletingId === item._id || !canDelete}
            activeOpacity={0.7}
          >
            {isDeletingId === item._id ? (
              <ActivityIndicator size="small" color={AppEco.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={14} color={canDelete ? AppEco.danger : AppEco.textMuted} />
                <Text
                  style={[
                    styles.actionBtnText,
                    styles.actionBtnTextDanger,
                    !canDelete && { color: AppEco.textMuted },
                  ]}
                >
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
  const toast = useToast();
  const dialog = useAppDialog();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSelectMode = mode === 'select';
  const dispatch = useAppDispatch();

  const { data: me } = useGetCurrentUser();
  const isAdmin = me?.role === 'admin';

  const { data: addressesData, isLoading } = useListAddress();
  const addresses: IAddress[] = addressesData?.data?.items ?? [];

  const defaultAddress = addresses.find((a) => a.isDefault);
  const otherAddresses = addresses.filter((a) => !a.isDefault);

  const [settingDefaultId, setSettingDefaultId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { mutate: setDefault } = useSetDefaultAddress({
    onSuccess: () => {
      setSettingDefaultId(null);
      toast.showSuccess('Đã đặt địa chỉ mặc định.', { duration: 1800 });
    },
    onError: (e) => {
      setSettingDefaultId(null);
      toast.showError(getApiErrorMessage(e, 'Không thể đặt địa chỉ mặc định. Vui lòng thử lại.'));
    },
  });

  const { mutate: deleteAddress } = useDeleteAddress({
    onSuccess: () => {
      setDeletingId(null);
      toast.showSuccess('Đã xoá địa chỉ.', { duration: 1800 });
    },
    onError: (e) => {
      setDeletingId(null);
      toast.showError(getApiErrorMessage(e, 'Không thể xoá địa chỉ. Vui lòng thử lại.'));
    },
  });

  const handleSetDefault = (id: string) => {
    setSettingDefaultId(id);
    setDefault(id);
  };

  const handleDelete = (id: string) => {
    if (isAdmin) {
      dialog.showMessage({
        title: 'Không thể xoá',
        message:
          'Tài khoản admin chỉ có một địa chỉ kho — chỉ được sửa bằng chức năng Sửa, không xoá.',
      });
      return;
    }
    dialog.showConfirm({
      title: 'Xoá địa chỉ',
      message: 'Bạn có chắc muốn xoá địa chỉ này?',
      confirmText: 'Xoá',
      destructive: true,
      onConfirm: () => {
        setDeletingId(id);
        deleteAddress(id);
      },
    });
  };

  const handleSelectAddress = (addr: IAddress) => {
    dispatch(
      setShippingInfo({
        fullName: addr.fullName,
        phone: addr.phoneNumber,
        street: addr.street,
        ward: addr.ward,
        province: addr.province,
        address: [addr.street, addr.ward, addr.district, addr.province].filter(Boolean).join(', '),
        city: addr.province,
        district: addr.district ?? '',
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
    <View style={styles.root}>
      <ScreenHero
        title={isSelectMode ? 'Chọn địa chỉ giao hàng' : 'Địa chỉ của tôi'}
        subtitle={
          isSelectMode
            ? 'Chạm vào địa chỉ để chọn làm địa chỉ giao hàng'
            : 'Quản lý địa chỉ nhận hàng của bạn'
        }
        onBack={() => router.back()}
        rightAction={
          isSelectMode ? undefined : (
            <ScreenHeroAddButton
              label="Thêm địa chỉ"
              onPress={() => router.push('/add-address' as any)}
            />
          )
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={AppEco.primary} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={60} color={AppEco.textMuted} />
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
                canDelete={!isAdmin}
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
                  <Ionicons name="add" size={20} color={AppEco.primary} />
                </View>
                <View style={styles.newAddressBtnBody}>
                  <Text style={styles.newAddressBtnLabel}>Thêm địa chỉ mới</Text>
                  <Text style={styles.newAddressBtnSub}>Không tìm thấy địa chỉ phù hợp?</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={AppEco.textMuted} />
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: AppEco.textSecondary, marginTop: 8 },
  emptySubText: { fontSize: 13, color: AppEco.textMuted },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: AppEco.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: AppEco.radiusMd,
    ...AppEco.shadowCard,
  },
  emptyAddBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  sectionHeader: { marginTop: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: AppEco.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  cardDefault: {
    borderColor: AppEco.border,
    ...AppEco.shadowSoft,
  },

  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: AppEco.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  defaultBadgeText: { fontSize: 12, fontWeight: '700', color: AppEco.primary },

  cardTop: { flexDirection: 'row', gap: 12 },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: AppEco.text },
  cardPhone: { fontSize: 13, color: AppEco.textSecondary, marginTop: 2 },
  cardAddr: { fontSize: 13, color: AppEco.textSecondary, marginTop: 6, lineHeight: 20 },
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
    backgroundColor: AppEco.primary,
    borderRadius: AppEco.radiusSm,
    paddingVertical: 11,
    ...AppEco.shadowCard,
  },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: AppEco.primaryMuted,
    borderWidth: 1,
    borderColor: AppEco.border,
  },
  actionBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: AppEco.primary },
  actionBtnTextDanger: { color: AppEco.danger },

  newAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    borderStyle: 'dashed',
  },
  newAddressBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppEco.border,
  },
  newAddressBtnBody: { flex: 1 },
  newAddressBtnLabel: { fontSize: 15, fontWeight: '700', color: AppEco.primary },
  newAddressBtnSub: { fontSize: 12, color: AppEco.textMuted, marginTop: 2 },
});
