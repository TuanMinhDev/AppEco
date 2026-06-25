import { useListAddress } from '@/api/address/address.api';
import type { AddressType } from '@/api/address/address.type';
import {
  invalidateQueriesAfterOrderCreated,
  orderApis,
  useShippingOptions,
} from '@/api/order/order.api';
import type { CreateOrderBody, ShippingMethod } from '@/api/order/order.type';
import {
  getShippingOptionRows,
  isMultiShippingResponse,
  toShippingAddress,
} from '@/api/order/order.utils';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ScreenHero } from '@/components/screen-hero/ScreenHero';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  clearCheckout,
  setOrderSuccess,
  selectCheckoutItems,
  selectCheckoutNotes,
  selectCheckoutTotals,
  selectPaymentMethod,
  selectShippingInfo,
  setError,
  setNotes,
  setPaymentMethod,
  setProcessing,
  setShippingFee,
  setShippingInfo,
} from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAccessToken } from '@/src/auth/token-storage';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

const ADDRESS_TYPE_MAP: Record<AddressType, { label: string; icon: 'home-outline' | 'business-outline' | 'cube-outline'; color: string; bg: string }> = {
  home:      { label: 'Nhà riêng', icon: 'home-outline',     color: AppEco.primary, bg: AppEco.primaryMuted },
  office:    { label: 'Văn phòng', icon: 'business-outline', color: '#7C3AED', bg: '#EDE9FE' },
  warehouse: { label: 'Kho hàng',  icon: 'cube-outline',     color: AppEco.accent, bg: '#FEF3C7' },
};

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Tiền mặt khi nhận hàng', icon: 'cash-outline' as const, description: 'Thanh toán khi nhận sản phẩm' },
  { id: 'card', label: 'Thẻ tín dụng / Ghi nợ', icon: 'card-outline' as const, description: 'Visa, Mastercard, JCB' },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: 'business-outline' as const, description: 'Internet Banking' },
];

const SHIP_METHOD_ICON: Record<string, 'cube-outline' | 'flash-outline' | 'rocket-outline'> = {
  economy: 'cube-outline',
  fast: 'flash-outline',
  express: 'rocket-outline',
};

type CheckoutFormValues = {
  notes: string;
  paymentType: 'cod' | 'card' | 'bank_transfer';
};

function CheckoutScreenInner() {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { control, getValues, setValue } = useFormContext<CheckoutFormValues>();
  const items = useAppSelector(selectCheckoutItems);
  const totals = useAppSelector(selectCheckoutTotals);
  const shippingInfo = useAppSelector(selectShippingInfo);

  const notesWatched = useWatch({ control, name: 'notes' });
  const paymentTypeWatched = useWatch({ control, name: 'paymentType' });

  useEffect(() => {
    dispatch(setNotes(notesWatched));
  }, [notesWatched, dispatch]);

  useEffect(() => {
    dispatch(setPaymentMethod({ type: paymentTypeWatched }));
  }, [paymentTypeWatched, dispatch]);

  const { data: user } = useGetCurrentUser();

  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [placing, setPlacing] = useState(false);

  const { data: addressesData, isLoading: addressLoading } = useListAddress();
  const addresses = addressesData?.data?.items ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault);
  const hasAddresses = addresses.length > 0;

  const productIds = useMemo(
    () => items.map((i) => i.productId._id).filter(Boolean),
    [items]
  );

  const {
    data: shipRes,
    isLoading: shipLoading,
    isError: shipError,
    error: shipErr,
  } = useShippingOptions(shippingInfo.addressId, productIds);

  const shipData = shipRes?.data;
  const optionRows = useMemo(() => getShippingOptionRows(shipData), [shipData]);

  const expressReason = isMultiShippingResponse(shipData)
    ? shipData.expressUnavailableReason
    : undefined;

  const shipErrorMessage =
    shipErr && typeof shipErr === 'object' && 'response' in shipErr
      ? String((shipErr as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
      : '';

  useEffect(() => {
    if (!optionRows.length) {
      dispatch(setShippingFee(0));
      return;
    }
    const row = optionRows.find((o) => o.method === selectedShipping);
    dispatch(setShippingFee(row?.fee ?? 0));
  }, [optionRows, selectedShipping, dispatch]);

  useEffect(() => {
    if (!optionRows.length) return;
    if (!optionRows.some((o) => o.method === selectedShipping)) {
      setSelectedShipping(String(optionRows[0].method));
    }
  }, [optionRows, selectedShipping]);

  // Gán địa chỉ mặc định chỉ khi chưa chọn addressId (tránh ghi đè sau khi user chọn từ danh sách)
  useEffect(() => {
    if (defaultAddress && !shippingInfo.addressId) {
      dispatch(
        setShippingInfo({
          fullName: defaultAddress.fullName,
          phone: defaultAddress.phoneNumber,
          street: defaultAddress.street,
          ward: defaultAddress.ward,
          province: defaultAddress.province,
          address: [
            defaultAddress.street,
            defaultAddress.ward,
            defaultAddress.district,
            defaultAddress.province,
          ]
            .filter(Boolean)
            .join(', '),
          city: defaultAddress.province,
          district: defaultAddress.district ?? '',
          addressId: defaultAddress._id,
          postalCode: '',
          addressType: defaultAddress.type ?? 'home',
        })
      );
    } else if (user && !shippingInfo.fullName && !defaultAddress) {
      dispatch(
        setShippingInfo({
          fullName: user?.name || '',
          phone: user?.phoneNumber || '',
          address: '',
          city: '',
          district: '',
          postalCode: '',
        })
      );
    }
  }, [defaultAddress, user, shippingInfo.addressId]);

  const handlePlaceOrder = async () => {
    if (!shippingInfo.fullName || !shippingInfo.phone) {
      toast.showError('Vui lòng điền đầy đủ họ tên và số điện thoại người nhận');
      return;
    }
    if (!shippingInfo.addressId) {
      toast.showError(
        'Vui lòng chọn địa chỉ giao hàng từ danh sách để tính phí vận chuyển và đặt hàng.',
      );
      return;
    }
    if (items.length === 0) {
      toast.showError('Giỏ hàng trống, không thể đặt hàng');
      return;
    }
    if (!optionRows.length || !selectedShipping) {
      toast.showError('Chưa có phương án giao hàng. Kiểm tra địa chỉ và thử lại.');
      return;
    }

    const snap = toShippingAddress(shippingInfo);
    if (!snap) {
      toast.showError(
        'Cần đủ: họ tên, SĐT, địa chỉ chi tiết, tỉnh/thành và phường/xã. Hãy chọn hoặc cập nhật địa chỉ đã lưu.',
      );
      return;
    }

    const methodOk = ['economy', 'fast', 'express'].includes(selectedShipping);
    if (!methodOk) {
      toast.showError('Phương thức vận chuyển không hợp lệ.');
      return;
    }

    if (!user) {
      toast.showError('Vui lòng đăng nhập để đặt hàng');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      toast.showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      return;
    }

    const bySeller = new Map<string, typeof items>();
    for (const item of items) {
      const sid = item.sellerId;
      if (!sid) {
        toast.showError('Có sản phẩm thiếu thông tin người bán. Vui lòng thêm lại từ giỏ hàng.');
        return;
      }
      const cur = bySeller.get(sid) ?? [];
      cur.push(item);
      bySeller.set(sid, cur);
    }

    if (bySeller.size > 1 && selectedShipping === 'express') {
      toast.showError('Hỏa tốc không áp dụng khi giỏ có nhiều cửa hàng. Chọn tiết kiệm hoặc nhanh.');
      return;
    }

    try {
      dispatch(setProcessing(true));
      setPlacing(true);
      dispatch(setError(null));

      const created: string[] = [];
      let orderedFromCart = false;
      for (const [sellerId, lines] of bySeller) {
        const cartItemIds = lines
          .map((item) => item.cartItemId)
          .filter((id): id is string => !!id);
        if (cartItemIds.length > 0) orderedFromCart = true;

        const body: CreateOrderBody = {
          sellerId,
          items: lines.map((item) => ({
            productId: item.productId._id,
            variant: {
              color: item.variant?.color || '',
              size: item.variant?.size || '',
            },
            quantity: item.quantity,
            price: item.price,
          })),
          ...(cartItemIds.length > 0 ? { cartItemIds } : {}),
          shippingMethod: selectedShipping as ShippingMethod,
          shippingAddress: snap,
          notes: getValues('notes')?.trim() || undefined,
        };
        const order = (await orderApis.create(body)).data;
        if (order?.orderCode) created.push(order.orderCode);
        else if (order?._id) created.push(order._id);
      }

      await invalidateQueriesAfterOrderCreated(queryClient, {
        refreshCart: orderedFromCart,
      });

      const successItemsMap = new Map<
        string,
        { id: string; name: string; image?: string }
      >();
      for (const line of items) {
        successItemsMap.set(line.productId._id, {
          id: line.productId._id,
          name: line.productId.name,
          image: line.productId.images?.[0],
        });
      }

      dispatch(
        setOrderSuccess({
          items: [...successItemsMap.values()],
          codes: created,
        }),
      );
      dispatch(clearCheckout());
      toast.showSuccess('Đặt hàng thành công!', {
        duration: 2000,
        onHidden: () => {
          router.replace('/order-success' as never);
        },
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể đặt hàng. Vui lòng thử lại.';
      dispatch(setError(errorMessage));
      toast.showError(errorMessage);
    } finally {
      dispatch(setProcessing(false));
      setPlacing(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <ScreenHero
        title="Thanh toán"
        subtitle="Xác nhận địa chỉ, vận chuyển và phương thức thanh toán"
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* --- Sản phẩm đã chọn --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bag-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
            </View>
            {items.map((item, index) => {
              const image = item.productId.images?.[0];
              return (
                <View key={item._id || index} style={[styles.orderItem, index < items.length - 1 && styles.orderItemDivider]}>
                  <View style={styles.itemImgWrap}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.itemImg} />
                    ) : (
                      <View style={styles.itemImgPlaceholder}>
                        <MaterialCommunityIcons name="image-off-outline" size={22} color={AppEco.textMuted} />
                      </View>
                    )}
                    {!!item.productId.sale && item.productId.sale > 0 && (
                      <View style={styles.saleBadge}>
                        <Text style={styles.saleBadgeText}>-{item.productId.sale}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.productId.name}</Text>
                    <Text style={styles.itemVariant}>
                      Màu: {item.variant?.color || '—'} · Size: {item.variant?.size || '—'}
                    </Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                      <Text style={styles.itemQty}>x{item.quantity}</Text>
                      <Text style={styles.itemSubtotal}>{formatPrice(item.price * item.quantity)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* --- Thông tin giao hàng --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
              <TouchableOpacity
                onPress={() => router.push(hasAddresses ? ('/addresses?mode=select' as any) : ('/add-address' as any))}
                activeOpacity={0.7}
              >
                <Text style={styles.editLink}>{hasAddresses ? 'Sửa' : 'Thêm'}</Text>
              </TouchableOpacity>
            </View>

            {addressLoading && !shippingInfo.address ? (
              <View style={styles.addressLoadingWrap}>
                <ActivityIndicator size="small" color={AppEco.primary} />
                <Text style={styles.addressLoadingText}>Đang tải địa chỉ...</Text>
              </View>
            ) : shippingInfo.address ? (
              <View style={styles.addressBox}>
                <View style={styles.addressBoxTop}>
                  <View style={styles.addressBoxIconWrap}>
                    <Ionicons name="location" size={18} color={AppEco.primary} />
                  </View>
                  <View style={styles.addressBoxInfo}>
                    <View style={styles.addressBoxNameRow}>
                      <Text style={styles.addressBoxName}>{shippingInfo.fullName}</Text>
                      <Text style={styles.addressBoxPhone}>{shippingInfo.phone}</Text>
                    </View>
                    <Text style={styles.addressBoxAddr}>{shippingInfo.address}</Text>
                    {(() => {
                      const t = ADDRESS_TYPE_MAP[shippingInfo.addressType as AddressType] ?? ADDRESS_TYPE_MAP.home;
                      return (
                        <View style={[styles.addrTypeBadge, { backgroundColor: t.bg }]}>
                          <Ionicons name={t.icon} size={11} color={t.color} />
                          <Text style={[styles.addrTypeBadgeText, { color: t.color }]}>{t.label}</Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noAddressBox}
                onPress={() => router.push('/add-address' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={22} color={AppEco.primary} />
                <Text style={styles.noAddressText}>Thêm địa chỉ giao hàng</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* --- Phương thức vận chuyển (API shipping-options) --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="bicycle-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Phương thức vận chuyển</Text>
            </View>
            {!shippingInfo.addressId ? (
              <Text style={styles.shipHint}>
                Chọn địa chỉ từ danh sách để xem phí và phương án giao hàng.
              </Text>
            ) : null}
            {shippingInfo.addressId && shipLoading ? (
              <View style={styles.addressLoadingWrap}>
                <ActivityIndicator size="small" color={AppEco.primary} />
                <Text style={styles.addressLoadingText}>Đang tính phí vận chuyển...</Text>
              </View>
            ) : null}
            {shippingInfo.addressId && shipError ? (
              <Text style={styles.shipErrorText}>
                {shipErrorMessage || 'Không lấy được phương án giao hàng. Thử đổi địa chỉ hoặc kiểm tra sản phẩm.'}
              </Text>
            ) : null}
            {expressReason ? (
              <View style={styles.expressReasonBox}>
                <Ionicons name="information-circle-outline" size={16} color={AppEco.primaryDark} />
                <Text style={styles.expressReasonText}>{expressReason}</Text>
              </View>
            ) : null}
            {shippingInfo.addressId && !shipLoading && !shipError && optionRows.length === 0 ? (
              <Text style={styles.shipHint}>Không có phương án phù hợp cho giỏ hàng và địa chỉ này.</Text>
            ) : null}
            {optionRows.map((row) => {
              const selected = selectedShipping === row.method;
              const icon = SHIP_METHOD_ICON[row.method] ?? 'cube-outline';
              return (
                <TouchableOpacity
                  key={row.method}
                  style={[styles.shippingMethod, selected && styles.shippingMethodSelected]}
                  onPress={() => setSelectedShipping(String(row.method))}
                  activeOpacity={0.7}
                >
                  <View style={[styles.shippingIconWrap, selected && styles.shippingIconWrapSelected]}>
                    <Ionicons name={icon} size={20} color={selected ? AppEco.primary : AppEco.textSecondary} />
                  </View>

                  <View style={styles.shippingInfo}>
                    <View style={styles.shippingLabelRow}>
                      <Text style={[styles.shippingLabel, selected && styles.shippingLabelSelected]}>
                        {row.label}
                      </Text>
                    </View>
                    <Text style={styles.shippingDesc}>{row.estimatedDays}</Text>
                    {row.note ? <Text style={styles.shippingNote}>{row.note}</Text> : null}
                  </View>

                  <Text style={[styles.shippingFeeText, selected && styles.shippingFeeTextSelected]}>
                    {row.fee.toLocaleString('vi-VN')}đ
                  </Text>

                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- Phương thức thanh toán --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="wallet-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            </View>
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentTypeWatched === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.paymentMethod, selected && styles.paymentMethodSelected]}
                  onPress={() =>
                    setValue('paymentType', method.id as CheckoutFormValues['paymentType'], {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={[styles.paymentIconWrap, selected && styles.paymentIconWrapSelected]}>
                    <Ionicons name={method.icon} size={20} color={selected ? AppEco.primary : AppEco.textSecondary} />
                  </View>
                  <View style={styles.paymentInfo}>
                    <Text style={[styles.paymentLabel, selected && styles.paymentLabelSelected]}>{method.label}</Text>
                    <Text style={styles.paymentDesc}>{method.description}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* --- Ghi chú --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
              <Text style={styles.optionalBadge}>Tùy chọn</Text>
            </View>
            <Controller
              control={control}
              name="notes"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Ghi chú cho người giao hàng..."
                  placeholderTextColor={AppEco.textMuted}
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />
          </View>

          {/* --- Tóm tắt đơn hàng --- */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt-outline" size={18} color={AppEco.primary} />
              <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text style={styles.summaryValue}>{totals.shippingFee === 0 ? 'Miễn phí' : formatPrice(totals.shippingFee)}</Text>
            </View>
            {totals.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, { color: AppEco.success }]}>-{formatPrice(totals.discount)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{formatPrice(totals.total)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* --- Nút đặt hàng --- */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomTotalWrap}>
            <Text style={styles.bottomTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.bottomTotalValue}>{formatPrice(totals.total)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              (placing ||
                !shippingInfo.addressId ||
                !optionRows.length ||
                !selectedShipping ||
                shipError) &&
                styles.placeOrderBtnDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={
              placing ||
              !shippingInfo.addressId ||
              !optionRows.length ||
              !selectedShipping ||
              shipError
            }
            activeOpacity={0.85}
          >
            {placing ? (
              <Text style={styles.placeOrderText}>Đang xử lý...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.placeOrderText}>Đặt hàng ngay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function CheckoutScreen() {
  const notes = useAppSelector(selectCheckoutNotes);
  const paymentMethod = useAppSelector(selectPaymentMethod);
  const form = useForm<CheckoutFormValues>({
    defaultValues: {
      notes: notes ?? '',
      paymentType: (paymentMethod?.type ?? 'cod') as CheckoutFormValues['paymentType'],
    },
  });

  return (
    <FormProvider {...form}>
      <CheckoutScreenInner />
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppEco.background,
  },
  flex: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    gap: 12,
  },

  // Section card
  section: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    borderWidth: 1,
    borderColor: AppEco.border,
    ...AppEco.shadowCard,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppEco.text,
    flex: 1,
  },
  optionalBadge: {
    fontSize: 11,
    color: AppEco.textMuted,
    backgroundColor: AppEco.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '500',
  },

  // Order items
  orderItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  orderItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: AppEco.borderSoft,
  },
  itemImgWrap: {
    position: 'relative',
  },
  itemImg: {
    width: 72,
    height: 72,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surfaceMuted,
  },
  itemImgPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: AppEco.sale,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppEco.text,
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 12,
    color: AppEco.textSecondary,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: AppEco.primary,
  },
  itemQty: {
    fontSize: 13,
    color: AppEco.textMuted,
    fontWeight: '500',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '700',
    color: AppEco.textSecondary,
    marginLeft: 'auto',
  },

  // Form inputs
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputFlex: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppEco.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppEco.surfaceMuted,
    borderRadius: AppEco.radiusSm,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: AppEco.text,
  },
  inputMultiline: {
    height: 76,
    textAlignVertical: 'top',
  },

  // Edit / Add link
  editLink: {
    fontSize: 14,
    fontWeight: '700',
    color: AppEco.primary,
  },

  // Address box (combined)
  addressLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  addressLoadingText: { fontSize: 13, color: AppEco.textMuted },

  addressBox: {
    backgroundColor: AppEco.primaryMuted,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: AppEco.border,
    padding: 14,
    gap: 10,
  },
  addressBoxTop: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressBoxIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressBoxInfo: { flex: 1, gap: 4 },
  addressBoxNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  addressBoxName: { fontSize: 15, fontWeight: '700', color: AppEco.text },
  addressBoxPhone: { fontSize: 13, color: AppEco.textSecondary },
  addressBoxAddr: { fontSize: 13, color: AppEco.textSecondary, lineHeight: 20 },
  addrTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  addrTypeBadgeText: { fontSize: 11, fontWeight: '700' },
  defaultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: AppEco.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: AppEco.primary },

  noAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
  },
  noAddressText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },

  // Shipping methods
  shippingMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  shippingMethodSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  shippingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shippingIconWrapSelected: {
    backgroundColor: '#DBEAFE',
  },
  shippingInfo: { flex: 1 },
  shippingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  shippingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  shippingLabelSelected: { color: '#2563EB' },
  shippingBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shippingBadgeText: { fontSize: 10, fontWeight: '700' },
  shippingDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  shippingNote: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  shipHint: { fontSize: 13, color: '#6B7280', marginBottom: 10, lineHeight: 19 },
  shipErrorText: { fontSize: 13, color: '#B91C1C', marginBottom: 10, lineHeight: 19 },
  expressReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#DBEAFE',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  expressReasonText: { flex: 1, fontSize: 12, color: '#0369A1', lineHeight: 18 },
  shippingFeeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginRight: 6,
  },
  shippingFeeTextSelected: { color: '#2563EB' },

  // Payment methods
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  paymentMethodSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  paymentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconWrapSelected: {
    backgroundColor: '#DBEAFE',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  paymentLabelSelected: {
    color: '#2563EB',
  },
  paymentDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTotalWrap: {
    flex: 1,
  },
  bottomTotalLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  bottomTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
    marginTop: 2,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  placeOrderBtnDisabled: {
    backgroundColor: '#BFDBFE',
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
});
