import { useListCart } from '@/api/cart/cart.api';
import { CartItem } from '@/api/cart/cart.type';
import { useAppDispatch } from '@/src/store';
import { setCheckoutItems } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

export default function CartScreen() {
  const { data, isLoading, refetch, isRefetching } = useListCart();
  const cart = data?.data?.cart;
  const items: CartItem[] = cart?.items ?? [];
  const dispatch = useAppDispatch();

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    // Convert cart items to checkout items format
    const checkoutItems = items.map(item => ({
      _id: item._id,
      productId: {
        _id: item.productId._id,
        name: item.productId.name,
        images: item.productId.images || [],
        price: item.price,
        sale: item.productId.sale,
      },
      variant: item.variant,
      quantity: item.quantity,
      price: item.price,
    }));
    
    dispatch(setCheckoutItems(checkoutItems));
    router.push('/checkout' as any);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const image = item.productId?.images?.[0];
    const salePercent = item.productId?.sale ?? 0;

    return (
      <View style={styles.card}>
        {/* Product image */}
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={[styles.itemImage, styles.imagePlaceholder]}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color="rgba(255,255,255,0.2)" />
            </View>
          )}
          {salePercent > 0 && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>-{salePercent}%</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>{item.productId?.name ?? 'Sản phẩm'}</Text>

          <View style={styles.variantRow}>
            {item.variant?.color ? (
              <View style={styles.variantTag}>
                <View style={[styles.colorDot, { backgroundColor: item.variant.color }]} />
                <Text style={styles.variantText}>{item.variant.color}</Text>
              </View>
            ) : null}
            {item.variant?.size ? (
              <View style={styles.variantTag}>
                <Text style={styles.variantText}>{item.variant.size}</Text>
              </View>
            ) : null}
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

  const EmptyCart = () => (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="cart-off" size={72} color="rgba(255,255,255,0.15)" />
      <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
      <Text style={styles.emptySubtitle}>Hãy thêm sản phẩm vào giỏ hàng của bạn</Text>
      <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
        <Text style={styles.shopBtnText}>Mua sắm ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          {items.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{items.length}</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            ListEmptyComponent={EmptyCart}
            contentContainerStyle={[styles.listContent, items.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            ListFooterComponent={
              items.length > 0 ? (
                <View style={styles.totalCard}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>{formatPrice(cart?.totalPrice ?? 0)}</Text>
                  </View>
                  <TouchableOpacity style={styles.checkoutBtn} activeOpacity={0.85} onPress={handleCheckout}>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.checkoutGradient}
                    >
                      <Ionicons name="bag-check-outline" size={20} color="#1a1a2e" />
                      <Text style={styles.checkoutText}>Thanh toán</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    minWidth: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a2e',
  },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  imageWrap: {
    position: 'relative',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  saleBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  // Item info
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 20,
    marginBottom: 6,
  },
  variantRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  variantText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  priceQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  qtyBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },

  // Empty
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
  shopBtn: {
    marginTop: 12,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  shopBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a2e',
  },

  // Total + Checkout
  totalCard: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFD700',
  },
  checkoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
  },
});
