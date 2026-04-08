import { useDeleteCart, useListCart, useUpdateCartQuantity } from '@/api/cart/cart.api';
import { ICart } from '@/api/cart/cart.type';
import { useAppDispatch } from '@/src/store';
import { setCheckoutItems } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGE_SIZE = 10;

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

export default function CartScreen() {
  const dispatch = useAppDispatch();
  const { data: cartData, isLoading, error } = useListCart();
  const {mutate: updateQuantityMutation, isPending: isUpdatingQuantity} = useUpdateCartQuantity();
  const {mutate: deleteMutationRaw} = useDeleteCart();
  const deleteMutation = (payload: Parameters<typeof deleteMutationRaw>[0], options?: Parameters<typeof deleteMutationRaw>[1]) => {
    deleteMutationRaw(payload, options);
  };
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allCartItems: ICart[] = [...(cartData?.data?.items ?? [])].reverse();
  const cartItems = allCartItems.slice(0, visibleCount);
  const selectedItemsData = cartItems.filter((item: ICart) => selectedItems.includes(item._id));
  const totalPrice = selectedItemsData.reduce((sum: number, item: ICart) => sum + (item.price * item.quantity), 0);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    
    updateQuantityMutation({
      itemId,
      payload: { quantity: newQuantity },
    });
    
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMutation({ itemIds: [itemId] }, {
              onSuccess: () => {
                setSelectedItems(prev => prev.filter(id => id !== itemId));
              },
              onError: () => {
                Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
              }
            });
          }
        }
      ]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    Alert.alert(
      'Xác nhận',
      `Xóa ${selectedItems.length} sản phẩm đã chọn?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMutation({ itemIds: selectedItems }, {
              onSuccess: () => {
                setSelectedItems([]);
              },
              onError: () => {
                Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
              }
            });
          }
        }
      ]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === allCartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allCartItems.map((item: ICart) => item._id));
    }
  };

  const handleLoadMore = () => {
    if (visibleCount < allCartItems.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, allCartItems.length));
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    const checkoutItems = allCartItems
      .filter((item) => selectedItems.includes(item._id))
      .map((item) => ({
        _id: item._id,
        sellerId: item.productId.sellerId,
        productId: {
          _id: item.productId._id,
          name: item.productId.name,
          images: item.productId.images,
          price: item.productId.variants?.[0]?.price ?? item.price,
          sale: item.productId.sale ?? undefined,
        },
        variant: item.variant,
        quantity: item.quantity,
        price: item.price,
      }));
    dispatch(setCheckoutItems(checkoutItems));
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: ICart }) => {
    const isSelected = selectedItems.includes(item._id);
    const product = item.productId;
    const image = product.images?.[0];

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleItemSelection(item._id)}
        >
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? '#0EA5E9' : '#9CA3AF'}
          />
        </TouchableOpacity>

        <View style={styles.itemContent}>
          <View style={styles.itemImageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.itemImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={24}
                  color="rgba(255,255,255,0.2)"
                />
              </View>
            )}
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {product.name}
            </Text>
            
            <View style={styles.variantInfo}>
              <Text style={styles.variantText}>
                Màu: {item.variant.color} | Size: {item.variant.size}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
            </View>

            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => handleQuantityChange(item._id, item.quantity - 1)}
                disabled={item.quantity <= 1 || isUpdatingQuantity}
              >
                <Ionicons name="remove" size={16} color="#0EA5E9" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => handleQuantityChange(item._id, item.quantity + 1)}
                disabled={isUpdatingQuantity}
              >
                <Ionicons name="add" size={16} color="#0EA5E9" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteItem(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="cart-off" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>Không thể tải giỏ hàng</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => window.location.reload()}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          {allCartItems.length > 0 && (
            <Text style={styles.headerSub}>{allCartItems.length} sản phẩm</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {allCartItems.length > 0 && (
            <TouchableOpacity style={styles.headerBtn} onPress={toggleSelectAll}>
              <Ionicons
                name={selectedItems.length === allCartItems.length ? 'checkbox-outline' : 'square-outline'}
                size={16}
                color="#0EA5E9"
              />
              <Text style={styles.headerBtnText}>
                {selectedItems.length === allCartItems.length ? 'Bỏ chọn' : 'Chọn tất cả'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {allCartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={80} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtitle}>Thêm sản phẩm để bắt đầu mua sắm</Text>
          <TouchableOpacity
            style={styles.shoppingBtn}
            onPress={() => router.push('/')}
          >
            <Text style={styles.shoppingBtnText}>Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartListContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              visibleCount < allCartItems.length ? (
                <View style={styles.loadMoreIndicator}>
                  <ActivityIndicator size="small" color="#0EA5E9" />
                  <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
                </View>
              ) : null
            }
          />

          {selectedItems.length > 0 && (
            <View style={styles.bottomBar}>
              <View style={styles.bottomInfo}>
                <Text style={styles.selectedCount}>
                  Đã chọn {selectedItems.length} sản phẩm
                </Text>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              </View>
              
              <View style={styles.bottomActions}>
                {selectedItems.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteSelectedBtn}
                    onPress={handleDeleteSelected}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                  <Text style={styles.checkoutBtnText}>Thanh toán</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
  },
  headerSub: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0EA5E9',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  shoppingBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 8,
  },
  shoppingBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Cart List
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 16,
    gap: 12,
  },
  loadMoreIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '600',
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(103, 232, 249, 0.3)',
    shadowColor: '#67E8F9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  variantInfo: {
    marginBottom: 8,
  },
  variantText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceRow: {
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 8,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(103, 232, 249, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  deleteSelectedBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0EA5E9',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});