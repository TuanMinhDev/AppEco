import { useAppDispatch, useAppSelector } from '@/src/store';
import {
    clearCheckout,
    selectCheckoutItems,
    selectCheckoutTotals,
    selectPaymentMethod,
    selectShippingInfo,
    setError,
    setNotes,
    setPaymentMethod,
    setProcessing,
    setShippingInfo,
} from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Tiền mặt khi nhận hàng', icon: 'cash' as const, description: 'Thanh toán khi nhận sản phẩm' },
  { id: 'card', label: 'Thẻ tín dụng/Ghi nợ', icon: 'card' as const, description: 'Visa, Mastercard, JCB' },
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: 'bank' as const, description: 'Chuyển khoản qua internet banking' },
];

export default function CheckoutScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCheckoutItems);
  const totals = useAppSelector(selectCheckoutTotals);
  const shippingInfo = useAppSelector(selectShippingInfo);
  const paymentMethod = useAppSelector(selectPaymentMethod);

  const [expandedSection, setExpandedSection] = useState<'shipping' | 'payment' | null>('shipping');

  const handleShippingInfoChange = (field: string, value: string) => {
    dispatch(setShippingInfo({ [field]: value }));
  };

  const handlePaymentMethodSelect = (method: 'cod' | 'card' | 'bank_transfer') => {
    dispatch(setPaymentMethod({ type: method }));
  };

  const handlePlaceOrder = async () => {
    // Validate shipping info
    if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    dispatch(setProcessing(true));
    
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Đặt hàng thành công!',
        'Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.',
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(clearCheckout());
              router.push('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      dispatch(setError('Có lỗi xảy ra khi đặt hàng'));
      Alert.alert('Lỗi', 'Không thể đặt hàng. Vui lòng thử lại.');
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const renderOrderItem = (item: any, index: number) => {
    const image = item.productId?.images?.[0];
    const salePercent = item.productId?.sale ?? 0;

    return (
      <View key={item._id} style={styles.orderItem}>
        <View style={styles.itemImageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="image-off-outline" size={24} color="rgba(255,255,255,0.2)" />
            </View>
          )}
          {salePercent > 0 && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>-{salePercent}%</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.productId?.name ?? 'Sản phẩm'}</Text>
          
          <View style={styles.variantRow}>
            {item.variant?.color && (
              <View style={styles.variantTag}>
                <View style={[styles.colorDot, { backgroundColor: item.variant.color }]} />
                <Text style={styles.variantText}>{item.variant.color}</Text>
              </View>
            )}
            {item.variant?.size && (
              <View style={styles.variantTag}>
                <Text style={styles.variantText}>{item.variant.size}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceQtyRow}>
            <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>x{item.quantity}</Text>
            </View>
          </View>

          <Text style={styles.itemSubtotal}>{formatPrice(item.price * item.quantity)}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Order Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đơn hàng ({items.length} sản phẩm)</Text>
              <View style={styles.itemsContainer}>
                {items.map(renderOrderItem)}
              </View>
            </View>

            {/* Shipping Info */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}
              >
                <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
                <Ionicons 
                  name={expandedSection === 'shipping' ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              {expandedSection === 'shipping' && (
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Họ và tên"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingInfo.fullName || ''}
                    onChangeText={(value) => handleShippingInfoChange('fullName', value)}
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingInfo.phone || ''}
                    onChangeText={(value) => handleShippingInfoChange('phone', value)}
                    keyboardType="phone-pad"
                  />
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Địa chỉ"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingInfo.address || ''}
                    onChangeText={(value) => handleShippingInfoChange('address', value)}
                  />
                  
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Thành phố"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={shippingInfo.city || ''}
                      onChangeText={(value) => handleShippingInfoChange('city', value)}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Quận/Huyện"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={shippingInfo.district || ''}
                      onChangeText={(value) => handleShippingInfoChange('district', value)}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => setExpandedSection(expandedSection === 'payment' ? null : 'payment')}
              >
                <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                <Ionicons 
                  name={expandedSection === 'payment' ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#fff" 
                />
              </TouchableOpacity>
              
              {expandedSection === 'payment' && (
                <View style={styles.paymentMethods}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethod,
                        paymentMethod.type === method.id && styles.selectedPaymentMethod,
                      ]}
                      onPress={() => handlePaymentMethodSelect(method.id as 'cod' | 'card' | 'bank_transfer')}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <MaterialCommunityIcons 
                          name={method.icon} 
                          size={24} 
                          color={paymentMethod.type === method.id ? '#FFD700' : 'rgba(255,255,255,0.6)'} 
                        />
                        <View style={styles.paymentMethodInfo}>
                          <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                          <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                        </View>
                      </View>
                      <View style={[
                        styles.radioCircle,
                        paymentMethod.type === method.id && styles.radioCircleSelected,
                      ]}>
                        {paymentMethod.type === method.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Order Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Nhập ghi chú cho đơn hàng (tùy chọn)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={''}
                onChangeText={(value) => dispatch(setNotes(value))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tạm tính</Text>
                  <Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  <Text style={styles.summaryValue}>
                    {totals.shippingFee === 0 ? 'Miễn phí' : formatPrice(totals.shippingFee)}
                  </Text>
                </View>
                {totals.discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Giảm giá</Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>
                      -{formatPrice(totals.discount)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalValue}>{formatPrice(totals.total)}</Text>
                </View>
              </View>
            </View>

            {/* Place Order Button */}
            <View style={styles.bottomSection}>
              <TouchableOpacity 
                style={styles.placeOrderBtn} 
                onPress={handlePlaceOrder}
                disabled={items.length === 0}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.placeOrderGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#1a1a2e" />
                  <Text style={styles.placeOrderText}>Đặt hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  placeholder: { width: 32 },

  // Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Section
  section: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },

  // Order Items
  itemsContainer: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
  },
  itemImageWrap: {
    position: 'relative',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
    marginBottom: 4,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  variantText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  priceQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD700',
  },
  qtyBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  qtyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD700',
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },

  // Form
  formContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // Payment Methods
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedPaymentMethod: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FFD700',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },

  // Summary
  summaryContainer: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  discountValue: {
    color: '#FF6B6B',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
  },

  // Bottom
  bottomSection: {
    paddingBottom: 20,
  },
  placeOrderBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
  },
});
