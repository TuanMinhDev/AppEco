import { useDeleteCart, useListCart, useUpdateQuality } from '@/api/cart/cart.api';
import { CartItem } from '@/api/cart/cart.type';
import { useAppDispatch } from '@/src/store';
import { setCheckoutItems } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const updateQuantityMutation = useUpdateQuality({
    onSuccess: (data) => {
      console.log('Update quantity success:', data);
      // Cart data will be automatically refetched
    },
    onError: (error) => {
      console.error('Update quantity error:', error);
    }
  });

  const deleteCartMutation = useDeleteCart({
    onSuccess: () => {
      // Clear selection if deleted items were selected
      setSelectedItems(new Set());
    }
  });

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // If quantity would be 0 or less, delete the item
      deleteItem(itemId);
      return;
    }
    
    if (!cart?._id) {
      console.error('Cart ID not found');
      return;
    }
    
    console.log('Updating quantity:', { cartId: cart._id, itemId, newQuantity });
    
    updateQuantityMutation.mutate({
      cartId: cart._id,
      itemId: itemId,
      payload: { quantity: newQuantity }
    });
  };

  const deleteItem = (itemId: string) => {
    deleteCartMutation.mutate({
      itemIds: [itemId]
    });
    
    // Remove from selection if it was selected
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  const deleteSelectedItems = () => {
    if (selectedItems.size === 0) return;
    
    deleteCartMutation.mutate({
      itemIds: Array.from(selectedItems)
    });
    
    // Clear all selections
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item._id)));
    }
  };

  const getSelectedTotal = () => {
    return items
      .filter(item => selectedItems.has(item._id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    const selectedItemsList = items.filter(item => selectedItems.has(item._id));
    if (selectedItemsList.length === 0) return;
    
    // Convert selected cart items to checkout items format
    const checkoutItems = selectedItemsList.map(item => ({
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
    const isSelected = selectedItems.has(item._id);

    return (
      <View style={[styles.card, !isSelected && styles.cardUnselected]}>
        {/* Checkbox */}
        <TouchableOpacity 
          style={styles.checkbox} 
          onPress={() => toggleItemSelection(item._id)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
            size={22} 
            color={isSelected ? "#FFD700" : "rgba(255,255,255,0.4)"} 
          />
        </TouchableOpacity>

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
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={2}>{item.productId?.name ?? 'Sản phẩm'}</Text>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => deleteItem(item._id)}
              disabled={deleteCartMutation.isPending}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

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
          </View>

          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item._id, item.quantity - 1)}
              disabled={updateQuantityMutation.isPending}
            >
              <Ionicons name="remove" size={16} color="#FFD700" />
            </TouchableOpacity>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}</Text>
            </View>
            <TouchableOpacity 
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item._id, item.quantity + 1)}
              disabled={updateQuantityMutation.isPending}
            >
              <Ionicons name="add" size={16} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <Text style={styles.itemSubtotal}>Tổng cộng: {formatPrice(item.price * item.quantity)}</Text>
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
          <View style={styles.content}>
            {/* Select All */}
            {items.length > 0 && (
              <View style={styles.selectAllRow}>
                <TouchableOpacity 
                  style={styles.selectAllBtn} 
                  onPress={toggleSelectAll}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={selectedItems.size === items.length ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={selectedItems.size === items.length ? "#FFD700" : "rgba(255,255,255,0.4)"} 
                  />
                  <Text style={styles.selectAllText}>Chọn tất cả ({selectedItems.size}/{items.length})</Text>
                </TouchableOpacity>
                {selectedItems.size > 0 && (
                  <TouchableOpacity 
                    style={styles.deleteSelectedBtn}
                    onPress={deleteSelectedItems}
                    disabled={deleteCartMutation.isPending}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    <Text style={styles.deleteSelectedText}>Xóa ({selectedItems.size})</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Products List */}
            <FlatList
              data={items}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              ListEmptyComponent={EmptyCart}
              contentContainerStyle={[styles.listContent, items.length === 0 && styles.listEmpty]}
              showsVerticalScrollIndicator={false}
              onRefresh={refetch}
              refreshing={isRefetching}
              style={styles.productsList}
              removeClippedSubviews={false}
              windowSize={10}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
            />
          </View>
        )}
      </SafeAreaView>

      {/* Bottom Total Section */}
      {items.length > 0 && !isLoading && (
        <View style={styles.bottomSection}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng cộng ({selectedItems.size} sản phẩm)</Text>
              <Text style={styles.totalValue}>{formatPrice(getSelectedTotal())}</Text>
            </View>
            <TouchableOpacity 
              style={styles.checkoutBtn} 
              activeOpacity={0.85} 
              onPress={handleCheckout}
              disabled={selectedItems.size === 0}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Ionicons name="bag-check-outline" size={20} color="#1a1a2e" />
                <Text style={styles.checkoutText}>
                  Thanh toán
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
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

  // Content
  content: {
    flex: 1,
  },

  // Select All
  selectAllRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  deleteSelectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Products List
  productsList: {
    flex: 1,
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
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
  cardUnselected: {
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Checkbox
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,107,107,0.1)',
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
    marginBottom: 4,
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
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-end',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
    textAlign: 'right',
    alignSelf: 'flex-end',
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  totalCard: {
    padding: 16,
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
  checkoutBtnDisabled: {
    opacity: 0.5,
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
  checkoutTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
});
