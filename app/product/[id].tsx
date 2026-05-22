import { useCategories, useCategory } from '@/api/category/category.api';
import { useCreateCart } from '@/api/cart/cart.api';
import { useCommentsByProduct } from '@/api/comment/comment.api';
import {
  useAddFavorite,
  useFavoritesList,
  useRemoveFavorite,
} from '@/api/favorite/favorite.api';
import { useDetailProduct } from '@/api/product/product.api';
import type { Product } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ProductDetailGallery } from '@/components/product/ProductDetailGallery';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductVariantPicker } from '@/components/product/ProductVariantPicker';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { useAppDispatch } from '@/src/store/index';
import { addCheckoutItem, clearCheckout } from '@/src/store/slices/checkoutSlice';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(price: number) {
  return `${price.toLocaleString('vi-VN')}đ`;
}

function uniqueSizesForColor(product: Product, color: string): string[] {
  return [
    ...new Set(
      product.variants
        ?.filter((v) => v.color === color)
        .map((v) => v.size)
        .filter(Boolean) ?? [],
    ),
  ];
}

function resolveVariantSelection(
  product: Product,
  selectedColor: string,
  pickedSize: string | null,
) {
  let effectiveSize = pickedSize ?? '';
  if (selectedColor && !effectiveSize) {
    const sizes = uniqueSizesForColor(product, selectedColor);
    if (sizes.length === 1) effectiveSize = sizes[0];
  }

  const variant = product.variants?.find(
    (v) => v.color === selectedColor && v.size === effectiveSize,
  );

  return { effectiveSize, variant };
}

function categoryInfoFromProduct(raw: unknown): { id: string; name: string } {
  if (typeof raw === 'string' && raw) return { id: raw, name: '' };
  if (raw && typeof raw === 'object') {
    const obj = raw as { _id?: string; id?: string; name?: string };
    const id = obj._id ?? obj.id;
    if (id) {
      return { id: String(id), name: typeof obj.name === 'string' ? obj.name : '' };
    }
  }
  return { id: '', name: '' };
}

function MetaChip({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={AppEco.primary} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function ProductDetailContent({
  product,
  review,
}: {
  product: Product;
  review?: string;
}) {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [pickedSize, setPickedSize] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: commentsRes } = useCommentsByProduct(product._id);
  const ratingSummary = useMemo(() => {
    const list = commentsRes?.comment ?? [];
    if (!list.length) return null;
    const s = list.reduce((acc, c) => acc + (Number(c.rating) || 0), 0);
    return Math.round((s / list.length) * 10) / 10;
  }, [commentsRes]);

  const allColors = useMemo(
    () =>
      Array.from(
        new Set(product.variants?.map((v) => v.color).filter(Boolean) ?? []),
      ) as string[],
    [product.variants],
  );

  const selectedColor = pickedColor ?? allColors[0] ?? '';

  const { effectiveSize, variant } = useMemo(
    () => resolveVariantSelection(product, selectedColor, pickedSize),
    [product, selectedColor, pickedSize],
  );

  const categoryRef = useMemo(
    () => categoryInfoFromProduct(product.categoryId),
    [product.categoryId],
  );
  const categoryFromList = useMemo(
    () => categories.find((c) => c._id === categoryRef.id)?.name ?? '',
    [categories, categoryRef.id],
  );
  const needCategoryFetch =
    !!categoryRef.id && !categoryRef.name && !categoryFromList;
  const { data: categoryDetail } = useCategory(categoryRef.id, needCategoryFetch);
  const categoryName =
    categoryRef.name ||
    categoryFromList ||
    categoryDetail?.category?.name ||
    '';

  const selectedSize = effectiveSize;

  const originalPrice = variant?.price ?? product.variants?.[0]?.price ?? 0;
  const salePrice =
    product.sale != null ? originalPrice * (1 - product.sale / 100) : null;
  const displayPrice = salePrice ?? originalPrice;
  const images = product.images?.length ? product.images : [];

  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const isLoggedIn = meOk && !!me?._id;
  const { data: favRes, isLoading: favListLoading } = useFavoritesList(isLoggedIn);
  const { mutate: addFavorite, isPending: addFavPending } = useAddFavorite();
  const { mutate: removeFavorite, isPending: removeFavPending } =
    useRemoveFavorite();

  const isFavorite = useMemo(() => {
    if (!isLoggedIn) return false;
    return (favRes?.favorites ?? []).some((p) => p._id === product._id);
  }, [isLoggedIn, favRes?.favorites, product._id]);

  const favActionBusy = addFavPending || removeFavPending;

  const { mutate: addToCart, isPending: isAddingCart } = useCreateCart({
    onSuccess: () => toast.showSuccess('Đã thêm sản phẩm vào giỏ hàng'),
    onError: (error: unknown) => {
      toast.showError(
        getApiErrorMessage(error, 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.'),
      );
    },
  });

  useEffect(() => {
    if (review !== '1') return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 500);
    return () => clearTimeout(t);
  }, [review, product._id]);

  const handleToggleFavorite = () => {
    if (!isLoggedIn) {
      router.push(
        `/(auth)/login?redirect=${encodeURIComponent(`/product/${product._id}`)}` as never,
      );
      return;
    }
    if (favListLoading || favActionBusy) return;
    if (isFavorite) {
      removeFavorite(product._id, {
        onSuccess: () => toast.showSuccess('Đã bỏ yêu thích', { duration: 1600 }),
        onError: (e) =>
          toast.showError(getApiErrorMessage(e, 'Không thể bỏ yêu thích.')),
      });
    } else {
      addFavorite(product._id, {
        onSuccess: () => toast.showSuccess('Đã thêm yêu thích', { duration: 1600 }),
        onError: (e) =>
          toast.showError(getApiErrorMessage(e, 'Không thể thêm yêu thích.')),
      });
    }
  };

  const handleBuyNow = () => {
    if (!variant) return;
    dispatch(clearCheckout());
    const sid = product.sellerId;
    const sellerId = typeof sid === 'string' ? sid : sid?._id;
    dispatch(
      addCheckoutItem({
        _id: `${product._id}-${selectedColor}-${selectedSize}`,
        sellerId,
        productId: {
          _id: product._id,
          name: product.name,
          images: product.images,
          price: displayPrice,
          sale: product.sale || undefined,
        },
        variant: { color: selectedColor, size: selectedSize },
        quantity: qty,
        price: displayPrice,
      }),
    );
    router.push('/checkout');
  };

  const handleAddToCart = () => {
    if (!variant) return;
    addToCart({
      productId: product._id,
      variant: { color: selectedColor, size: selectedSize },
      quantity: qty,
    });
  };

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 72, 120],
    outputRange: [0, 0.92, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
              const y = e.nativeEvent.contentOffset.y;
              setHeaderScrolled((prev) => {
                const next = y > 56;
                return prev === next ? prev : next;
              });
            },
          },
        )}
      >
        <View style={styles.heroArea}>
          <ProductDetailGallery
            images={images}
            activeIndex={activeImage}
            onIndexChange={setActiveImage}
            topInset={insets.top + 48}
          />
        </View>

        <View style={styles.sheet}>
          {product.sale != null && (
            <View style={styles.saleRibbon}>
              <MaterialCommunityIcons name="tag-outline" size={14} color="#fff" />
              <Text style={styles.saleRibbonText}>Giảm {product.sale}%</Text>
            </View>
          )}

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.metaRow}>
            {ratingSummary != null && (
              <MetaChip icon="star" label={`${ratingSummary} sao`} />
            )}
            <MetaChip icon="bag-check-outline" label={`${variant?.sold ?? 0}+ đã bán`} />
            {categoryName ? (
              <MetaChip icon="pricetag-outline" label={categoryName} />
            ) : null}
            {variant && (
              <MetaChip icon="cube-outline" label={`Còn ${variant.stock}`} />
            )}
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.mainPrice}>{formatPrice(displayPrice)}</Text>
            {product.sale != null && (
              <Text style={styles.strikePrice}>{formatPrice(originalPrice)}</Text>
            )}
          </View>

          {product.sale != null && (
            <View style={styles.savePill}>
              <Text style={styles.savePillText}>
                Tiết kiệm {formatPrice(originalPrice - displayPrice)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Tuỳ chọn sản phẩm</Text>
          <ProductVariantPicker
            embedded
            product={product}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            qty={qty}
            onColorChange={setPickedColor}
            onSizeChange={setPickedSize}
            onQtyChange={setQty}
          />

          {product.description ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </>
          ) : null}

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Đánh giá</Text>
          <ProductReviews
            productId={product._id}
            emphasizeForm={review === '1'}
            embedded
          />
        </View>
      </Animated.ScrollView>

      <SafeAreaView edges={['top']} style={styles.stickyHeader} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[styles.stickyHeaderBg, { opacity: headerBgOpacity }]}
        />
        <View style={styles.stickyHeaderRow}>
          <TouchableOpacity
            style={[styles.floatBtn, headerScrolled && styles.floatBtnSolid]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={headerScrolled ? AppEco.text : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatBtn, headerScrolled && styles.floatBtnSolid]}
            onPress={handleToggleFavorite}
            disabled={isLoggedIn && (favListLoading || favActionBusy)}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
          >
            {isLoggedIn && (favListLoading || favActionBusy) ? (
              <ActivityIndicator
                size="small"
                color={headerScrolled ? AppEco.primary : '#fff'}
              />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? AppEco.danger : headerScrolled ? AppEco.text : '#fff'}
              />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottomWrap}>
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomPriceLabel}>Tổng cộng</Text>
            <Text style={styles.bottomPriceVal}>
              {formatPrice(displayPrice * qty)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.cartBtn, (!variant || isAddingCart) && styles.btnDisabled]}
            disabled={!variant || isAddingCart}
            onPress={handleAddToCart}
          >
            {isAddingCart ? (
              <ActivityIndicator size="small" color={AppEco.primary} />
            ) : (
              <Ionicons
                name="cart-outline"
                size={24}
                color={variant ? AppEco.primary : AppEco.textMuted}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buyBtn, !variant && styles.btnDisabled]}
            disabled={!variant}
            onPress={handleBuyNow}
          >
            <LinearGradient
              colors={
                variant ? [...AppEco.fabGradient] : [AppEco.border, AppEco.border]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyBtnGradient}
            >
              <Text style={styles.buyBtnText}>Mua ngay</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id, review } = useLocalSearchParams<{ id: string; review?: string }>();
  const productId = typeof id === 'string' ? id : id?.[0] ?? '';
  const { data, isLoading } = useDetailProduct(productId);
  const product = data?.data?.data;

  if (isLoading) {
    return (
      <View style={styles.centerScreen}>
        <LinearGradient colors={[...AppEco.heroGradient]} style={styles.loadingOrb}>
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.notFoundIcon}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={56}
            color={AppEco.primary}
          />
        </View>
        <Text style={styles.notFoundTitle}>Không tìm thấy sản phẩm</Text>
        <Text style={styles.notFoundSub}>
          Sản phẩm này có thể đã bị xoá hoặc không tồn tại.
        </Text>
        <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.backBtnCenterText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <ProductDetailContent key={product._id} product={product} review={review} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },

  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    backgroundColor: AppEco.background,
    paddingHorizontal: 32,
  },
  loadingOrb: {
    width: 76,
    height: 76,
    borderRadius: AppEco.radiusFull,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppEco.shadowSoft,
  },
  loadingText: { color: AppEco.textSecondary, fontSize: 15, fontWeight: '600' },
  notFoundIcon: {
    width: 96,
    height: 96,
    borderRadius: AppEco.radiusFull,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: AppEco.border,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppEco.text,
    textAlign: 'center',
  },
  notFoundSub: {
    fontSize: 14,
    color: AppEco.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtnCenter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: AppEco.primary,
    borderRadius: AppEco.radiusFull,
    ...AppEco.shadowCard,
  },
  backBtnCenterText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  scrollContent: { paddingBottom: 120 },

  heroArea: {
    position: 'relative',
    backgroundColor: AppEco.background,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: AppEco.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppEco.borderSoft,
  },
  stickyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  floatBtn: {
    width: 40,
    height: 40,
    borderRadius: AppEco.radiusFull,
    backgroundColor: 'rgba(19, 78, 74, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  floatBtnSolid: {
    backgroundColor: AppEco.surfaceMuted,
    borderColor: AppEco.borderSoft,
  },

  sheet: {
    marginTop: 8,
    backgroundColor: AppEco.surface,
    borderTopLeftRadius: AppEco.radiusXl,
    borderTopRightRadius: AppEco.radiusXl,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    ...AppEco.shadowSoft,
  },
  saleRibbon: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppEco.sale,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: AppEco.radiusFull,
    marginBottom: 12,
  },
  saleRibbonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: AppEco.text,
    lineHeight: 30,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: AppEco.radiusFull,
    backgroundColor: AppEco.surfaceMuted,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppEco.textSecondary,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 8,
  },
  mainPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: AppEco.primary,
    letterSpacing: -0.5,
  },
  strikePrice: {
    fontSize: 16,
    color: AppEco.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  savePill: {
    alignSelf: 'flex-start',
    backgroundColor: AppEco.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AppEco.radiusFull,
    marginBottom: 4,
  },
  savePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppEco.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: AppEco.borderSoft,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppEco.text,
    marginBottom: 14,
  },
  descText: {
    fontSize: 15,
    color: AppEco.textSecondary,
    lineHeight: 24,
  },

  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppEco.surface,
    borderTopLeftRadius: AppEco.radiusXl,
    borderTopRightRadius: AppEco.radiusXl,
    ...AppEco.shadowSoft,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  bottomPriceCol: { flex: 1 },
  bottomPriceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppEco.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '900',
    color: AppEco.text,
    marginTop: 2,
  },
  cartBtn: {
    width: 52,
    height: 52,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surfaceMuted,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtn: {
    flex: 1,
    borderRadius: AppEco.radiusMd,
    overflow: 'hidden',
    maxWidth: 180,
  },
  buyBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: { opacity: 0.45 },
});
