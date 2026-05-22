import { useDeleteCart, useListCart, useUpdateCartQuantity } from '@/api/cart/cart.api';
import type { CartProductPopulated, ICart } from '@/api/cart/cart.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ScreenHero, ScreenHeroChip } from '@/components/screen-hero/ScreenHero';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { useAppDispatch } from '@/src/store';
import { setCheckoutItems } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getApiErrorMessage } from '@/utils/api-error-message';

const PAGE_SIZE = 10;

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

function getPopulatedProduct(item: ICart): CartProductPopulated | null {
  const p = item.productId;
  if (p && typeof p === 'object' && 'name' in p) {
    return p as CartProductPopulated;
  }
  return null;
}

function sellerIdString(sellerId: CartProductPopulated['sellerId']): string {
  if (typeof sellerId === 'string') return sellerId;
  if (sellerId && typeof sellerId === 'object' && '_id' in sellerId) {
    return String(sellerId._id);
  }
  return '';
}

export default function CartScreen() {
  const toast = useToast();
  const dialog = useAppDialog();
  const dispatch = useAppDispatch();
  const { data: user, isSuccess: userOk } = useGetCurrentUser();
  const isLoggedIn = userOk && !!user?._id;

  const {
    data: cartItemsRaw = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useListCart(isLoggedIn);
  const {mutate: updateQuantityMutation, isPending: isUpdatingQuantity} = useUpdateCartQuantity({
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không cập nhật được số lượng.'));
    },
  });
  const {mutate: deleteMutationRaw} = useDeleteCart();
  const deleteMutation = (payload: Parameters<typeof deleteMutationRaw>[0], options?: Parameters<typeof deleteMutationRaw>[1]) => {
    deleteMutationRaw(payload, options);
  };
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allCartItems: ICart[] = useMemo(
    () => [...cartItemsRaw].reverse().filter((item) => getPopulatedProduct(item) != null),
    [cartItemsRaw],
  );
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
    dialog.showConfirm({
      title: 'Xác nhận',
      message: 'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      confirmText: 'Xóa',
      destructive: true,
      onConfirm: () => {
        deleteMutation({ itemIds: [itemId] }, {
          onSuccess: () => {
            setSelectedItems(prev => prev.filter(id => id !== itemId));
            toast.showSuccess('Đã xoá khỏi giỏ hàng.', { duration: 1600 });
          },
          onError: (e) => {
            toast.showError(getApiErrorMessage(e, 'Không thể xóa sản phẩm.'));
          },
        });
      },
    });
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    dialog.showConfirm({
      title: 'Xác nhận',
      message: `Xóa ${selectedItems.length} sản phẩm đã chọn?`,
      confirmText: 'Xóa',
      destructive: true,
      onConfirm: () => {
        deleteMutation({ itemIds: selectedItems }, {
          onSuccess: () => {
            setSelectedItems([]);
            toast.showSuccess('Đã xoá các sản phẩm đã chọn.', { duration: 1800 });
          },
          onError: (e) => {
            toast.showError(getApiErrorMessage(e, 'Không thể xóa sản phẩm.'));
          },
        });
      },
    });
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
      toast.showError('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }
    const checkoutItems = allCartItems
      .filter((item) => selectedItems.includes(item._id))
      .map((item) => {
        const product = getPopulatedProduct(item);
        if (!product) return null;
        return {
          _id: item._id,
          sellerId: sellerIdString(product.sellerId),
          productId: {
            _id: product._id,
            name: product.name,
            images: product.images,
            price: product.variants?.[0]?.price ?? item.price,
            sale: product.sale ?? undefined,
          },
          variant: item.variant,
          quantity: item.quantity,
          price: item.price,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
    if (checkoutItems.length === 0) {
      toast.showError('Không đọc được thông tin sản phẩm trong giỏ.');
      return;
    }
    dispatch(setCheckoutItems(checkoutItems));
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: ICart }) => {
    const isSelected = selectedItems.includes(item._id);
    const product = getPopulatedProduct(item);
    if (!product) return null;
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
            color={isSelected ? AppEco.primary : AppEco.textMuted}
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
                <Ionicons name="remove" size={16} color={AppEco.primary} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => handleQuantityChange(item._id, item.quantity + 1)}
                disabled={isUpdatingQuantity}
              >
                <Ionicons name="add" size={16} color={AppEco.primary} />
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

  if (!isLoggedIn) {
    return (
      <View style={styles.safeArea}>
        <ScreenHero
          title="Giỏ hàng"
          subtitle="Đăng nhập để xem và thanh toán sản phẩm"
          balanceBack={false}
        />
        <View style={styles.guestContainer}>
          <MaterialCommunityIcons name="cart-outline" size={56} color={AppEco.textMuted} />
          <Text style={styles.guestTitle}>Đăng nhập để dùng giỏ hàng</Text>
          <TouchableOpacity
            style={styles.shoppingBtn}
            onPress={() =>
              router.push(`/(auth)/login?redirect=${encodeURIComponent('/(tabs)/cart')}` as never)
            }
          >
            <Text style={styles.shoppingBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.safeArea}>
        <ScreenHero title="Giỏ hàng" subtitle="Đang tải..." balanceBack={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppEco.primary} />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.safeArea}>
        <ScreenHero title="Giỏ hàng" balanceBack={false} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="cart-off" size={60} color={AppEco.danger} />
          <Text style={styles.errorText}>Không thể tải giỏ hàng</Text>
          <Text style={styles.errorSub}>
            {getApiErrorMessage(error, 'Kiểm tra mạng hoặc đăng nhập lại.')}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
            <Text style={styles.retryBtnText}>{isFetching ? 'Đang thử…' : 'Thử lại'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScreenHero
        title="Giỏ hàng"
        subtitle={
          allCartItems.length > 0
            ? `${allCartItems.length} sản phẩm`
            : 'Chọn sản phẩm để thanh toán'
        }
        balanceBack={false}
        rightAction={
          allCartItems.length > 0 ? (
            <ScreenHeroChip
              icon={
                selectedItems.length === allCartItems.length
                  ? 'checkbox-outline'
                  : 'square-outline'
              }
              label={
                selectedItems.length === allCartItems.length ? 'Bỏ chọn' : 'Chọn tất cả'
              }
              onPress={toggleSelectAll}
            />
          ) : undefined
        }
      />

      {allCartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={AppEco.textMuted} />
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
                  <ActivityIndicator size="small" color={AppEco.primary} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppEco.background,
  },

  // Loading & Error States
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppEco.text,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: AppEco.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: AppEco.danger,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 14,
    color: AppEco.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: AppEco.primary,
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
    color: AppEco.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: AppEco.textMuted,
    textAlign: 'center',
  },
  shoppingBtn: {
    backgroundColor: AppEco.primary,
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
    color: AppEco.primary,
    fontWeight: '600',
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
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
    color: AppEco.text,
    marginBottom: 4,
  },
  variantInfo: {
    marginBottom: 8,
  },
  variantText: {
    fontSize: 12,
    color: AppEco.textSecondary,
  },
  priceRow: {
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: AppEco.primary,
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
    backgroundColor: AppEco.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppEco.text,
    minWidth: 20,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 8,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: AppEco.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1.5,
    borderTopColor: AppEco.borderSoft,
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
    color: AppEco.textSecondary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: AppEco.primary,
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
    backgroundColor: AppEco.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: AppEco.primary,
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
