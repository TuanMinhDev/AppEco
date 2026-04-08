import { useCreateCart } from '@/api/cart/cart.api';
import { useDetailProduct } from '@/api/product/product.api';
import { ProductVariant, SellerSummary } from '@/api/product/product.type';
import { useAppDispatch } from '@/src/store/index';
import { addCheckoutItem, clearCheckout } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const IMAGE_HEIGHT = SW * 0.92;

function formatPrice(price: number) {
    return price.toLocaleString('vi-VN') + 'đ';
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, isLoading } = useDetailProduct(id);
    const product = data?.data?.data;
    const dispatch = useAppDispatch();

    const scrollY = useRef(new Animated.Value(0)).current;
    const [activeImage, setActiveImage] = useState(0);
    const [qty, setQty] = useState(1);
    const [liked, setLiked] = useState(false);

    const { mutate: addToCart, isPending: isAddingCart } = useCreateCart({
        onSuccess: () => Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng 🛒'),
        onError: (error: unknown) => {
            const err = error as any;
            Alert.alert('Lỗi', `Không thể thêm vào giỏ hàng: ${err?.response?.data?.message || err?.message || 'Vui lòng thử lại.'}`);
        },
    });

    const allColors = Array.from(new Set(product?.variants?.map((v: ProductVariant) => v.color).filter(Boolean) ?? [])) as string[];
    const allSizes = Array.from(new Set(product?.variants?.map((v: ProductVariant) => v.size).filter(Boolean) ?? [])) as string[];

    const [selectedColor, setSelectedColor] = useState<string>(allColors[0] ?? '');
    const [selectedSize, setSelectedSize] = useState<string>('');

    const selectedVariantIdx = product?.variants?.findIndex(
        (v: ProductVariant) => v.color === selectedColor && v.size === selectedSize
    ) ?? -1;
    const variant: ProductVariant | undefined = selectedVariantIdx >= 0 ? product?.variants?.[selectedVariantIdx] : undefined;

    const originalPrice = variant?.price ?? (product?.variants?.[0]?.price ?? 0);
    const salePrice = product?.sale ? originalPrice * (1 - product.sale / 100) : null;
    const images = product?.images?.length ? product.images : [];
    const seller = typeof product?.sellerId === 'object' ? product.sellerId as SellerSummary : null;
    const sellerStats = (data?.data as any)?.sellerStats;

    const handleBuyNow = () => {
        if (!variant || !product) {
            Alert.alert('Chú ý', 'Vui lòng chọn màu sắc và kích cỡ trước.');
            return;
        }
        dispatch(clearCheckout());
        const sid = product.sellerId;
        const sellerId = typeof sid === 'string' ? sid : sid?._id;
        dispatch(addCheckoutItem({
            _id: `${product._id}-${selectedColor}-${selectedSize}`,
            sellerId,
            productId: {
                _id: product._id,
                name: product.name,
                images: product.images,
                price: salePrice ?? originalPrice,
                sale: product.sale || undefined,
            },
            variant: { color: selectedColor, size: selectedSize },
            quantity: qty,
            price: salePrice ?? originalPrice,
        }));
        router.push('/checkout');
    };

    const handleSelectColor = (color: string) => { setSelectedColor(color); setSelectedSize(''); };
    const handleSelectSize = (size: string) => {
        const ok = product?.variants?.some((v: ProductVariant) => v.color === selectedColor && v.size === size && v.stock > 0) ?? false;
        if (!ok) return;
        setSelectedSize(size);
    };

    // Header animation
    const headerBg = scrollY.interpolate({ inputRange: [IMAGE_HEIGHT - 120, IMAGE_HEIGHT - 30], outputRange: [0, 1], extrapolate: 'clamp' });
    const headerTitleOpacity = scrollY.interpolate({ inputRange: [IMAGE_HEIGHT - 60, IMAGE_HEIGHT], outputRange: [0, 1], extrapolate: 'clamp' });

    if (isLoading) {
        return (
            <View style={styles.centerScreen}>
                <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={styles.loadingSpinner}>
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
                    <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#0EA5E9" />
                </View>
                <Text style={styles.notFoundTitle}>Không tìm thấy sản phẩm</Text>
                <Text style={styles.notFoundSub}>Sản phẩm này có thể đã bị xoá hoặc không tồn tại.</Text>
                <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={16} color="#fff" />
                    <Text style={styles.backBtnCenterText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* ── FLOATING HEADER ── */}
            <SafeAreaView edges={['top']} style={styles.headerWrap}>
                <Animated.View style={[styles.headerBgBlur, { opacity: headerBg }]} />
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={20} color="#1F2937" />
                    </TouchableOpacity>
                    <Animated.Text style={[styles.floatTitle, { opacity: headerTitleOpacity }]} numberOfLines={1}>
                        {product.name}
                    </Animated.Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity style={styles.floatBtn}>
                            <Ionicons name="share-social-outline" size={20} color="#1F2937" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.floatBtn} onPress={() => setLiked(l => !l)}>
                            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#EF4444' : '#1F2937'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {/* ── IMAGE CAROUSEL ── */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        snapToInterval={SW}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / SW);
                            setActiveImage(index);
                        }}
                    >
                        {images.length > 0 ? images.map((img: string, i: number) => (
                            <View key={i} style={styles.imageSlide}>
                                <Image source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
                            </View>
                        )) : (
                            <View style={styles.imageSlide}>
                                <View style={styles.heroImagePlaceholder}>
                                    <MaterialCommunityIcons name="image-off-outline" size={64} color="#BAE6FD" />
                                    <Text style={styles.noImageText}>Chưa có hình ảnh</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Gradient overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)']}
                        style={styles.imageGradient}
                    />


                    {/* Dot indicators */}
                    {images.length > 1 && (
                        <View style={styles.dotsRow}>
                            {images.map((_: string, i: number) => (
                                <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                            ))}
                        </View>
                    )}

                    {/* Counter pill */}
                    {images.length > 1 && (
                        <View style={styles.counterPill}>
                            <Text style={styles.counterText}>{activeImage + 1} / {images.length}</Text>
                        </View>
                    )}
                </View>

                {/* ── HERO INFO CARD ── */}
                <View style={styles.heroCard}>
                    {/* Price row */}
                    <View style={styles.priceBlock}>
                        <View style={styles.priceLeft}>
                            {product.sale != null ? (
                                <>
                                    <Text style={styles.salePrice}>{formatPrice(salePrice ?? originalPrice)}</Text>
                                    <Text style={styles.origPrice}>{formatPrice(originalPrice)}</Text>
                                </>
                            ) : (
                                <Text style={styles.normalPrice}>{formatPrice(originalPrice)}</Text>
                            )}
                        </View>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={13} color="#F59E0B" />
                            <Text style={styles.ratingBadgeText}>4.8</Text>
                        </View>
                    </View>

                    {/* Product name */}
                    <Text style={styles.productName}>{product.name}</Text>

                    {/* Sale info banner */}
                    {product.sale != null && (
                        <View style={styles.saleBanner}>
                            <Ionicons name="pricetag" size={14} color="#0284C7" />
                            <Text style={styles.saleBannerText}>
                                Tiết kiệm {formatPrice(originalPrice - (salePrice ?? originalPrice))} so với giá gốc
                            </Text>
                        </View>
                    )}

                    {/* Stats row */}
                    <View style={styles.inlineStats}>
                        <View style={styles.inlineStat}>
                            <View style={[styles.inlineStatIcon, { backgroundColor: '#F0F9FF' }]}>
                                <Ionicons name="cube-outline" size={16} color="#0EA5E9" />
                            </View>
                            <View>
                                <Text style={styles.inlineStatVal}>{variant?.stock ?? '--'}</Text>
                                <Text style={styles.inlineStatLbl}>Còn hàng</Text>
                            </View>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.inlineStat}>
                            <View style={[styles.inlineStatIcon, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="bag-check-outline" size={16} color="#10B981" />
                            </View>
                            <View>
                                <Text style={styles.inlineStatVal}>{variant?.sold ?? 0}+</Text>
                                <Text style={styles.inlineStatLbl}>Đã bán</Text>
                            </View>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.inlineStat}>
                            <View style={[styles.inlineStatIcon, { backgroundColor: '#FFFBEB' }]}>
                                <Ionicons name="star" size={16} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={styles.inlineStatVal}>4.8</Text>
                                <Text style={styles.inlineStatLbl}>Đánh giá</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── VARIANTS ── */}
                {product.variants?.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Phân loại sản phẩm</Text>

                        {allColors.length > 0 && (
                            <View style={styles.variantGroup}>
                                <View style={styles.variantLabelRow}>
                                    <Text style={styles.variantLabel}>Màu sắc</Text>
                                    {selectedColor ? (
                                        <View style={styles.selectedTag}>
                                            <Text style={styles.selectedTagText}>{selectedColor}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
                                    {allColors.map((color: string) => (
                                        <TouchableOpacity
                                            key={color}
                                            style={[styles.colorSwatch, color === selectedColor && styles.colorSwatchActive]}
                                            onPress={() => handleSelectColor(color)}
                                        >
                                            <View style={[styles.colorDot, { backgroundColor: color }]} />
                                            {color === selectedColor && (
                                                <View style={styles.colorCheckmark}>
                                                    <Ionicons name="checkmark" size={10} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {allSizes.length > 0 && (
                            <View style={styles.variantGroup}>
                                <View style={styles.variantLabelRow}>
                                    <Text style={styles.variantLabel}>Kích cỡ</Text>
                                    {selectedSize ? (
                                        <View style={styles.selectedTag}>
                                            <Text style={styles.selectedTagText}>{selectedSize}</Text>
                                        </View>
                                    ) : null}
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeList}>
                                    {allSizes.map((size: string) => {
                                        const avail = product.variants?.some((v: ProductVariant) => v.color === selectedColor && v.size === size && v.stock > 0) ?? false;
                                        return (
                                            <TouchableOpacity
                                                key={size}
                                                style={[
                                                    styles.sizeChip,
                                                    size === selectedSize && styles.sizeChipActive,
                                                    !avail && styles.sizeChipDis
                                                ]}
                                                disabled={!avail}
                                                onPress={() => handleSelectSize(size)}
                                            >
                                                <Text style={[
                                                    styles.sizeChipText,
                                                    size === selectedSize && styles.sizeChipTextActive,
                                                    !avail && styles.sizeChipTextDis
                                                ]}>{size}</Text>
                                                {!avail && <View style={styles.sizeStrikethrough} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        {/* Quantity control */}
                        <View style={styles.qtySection}>
                            <View>
                                <Text style={styles.variantLabel}>Số lượng</Text>
                                <Text style={styles.stockHint}>
                                    {variant ? `Còn ${variant.stock} sản phẩm` : 'Chọn phân loại để xem tồn kho'}
                                </Text>
                            </View>
                            <View style={styles.qtyCtrl}>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                                    <Ionicons name="remove" size={18} color="#0EA5E9" />
                                </TouchableOpacity>
                                <Text style={styles.qtyVal}>{qty}</Text>
                                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.min(variant?.stock ?? 99, q + 1))}>
                                    <Ionicons name="add" size={18} color="#0EA5E9" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── DESCRIPTION ── */}
                {product.description ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Mô tả sản phẩm</Text>
                        <Text style={styles.descText}>{product.description}</Text>
                    </View>
                ) : null}

                {/* ── SELLER CARD ── */}
                <View style={styles.sellerCard}>
                    <LinearGradient
                        colors={['#F0F9FF', '#E0F2FE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sellerGradient}
                    >
                        <View style={styles.sellerLeft}>
                            <View style={styles.sellerAvatarWrap}>
                                {seller?.avatar ? (
                                    <Image source={{ uri: seller.avatar }} style={styles.sellerAvatar} />
                                ) : (
                                    <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={styles.sellerAvatarFallback}>
                                        <Text style={styles.sellerAvatarInitial}>{(seller?.name ?? 'S')[0].toUpperCase()}</Text>
                                    </LinearGradient>
                                )}
                                <View style={styles.onlineDot} />
                            </View>
                            <View style={styles.sellerInfo}>
                                <Text style={styles.sellerName} numberOfLines={1}>{seller?.name ?? 'Shop'}</Text>
                                <View style={styles.sellerMeta}>
                                    {sellerStats?.totalProducts != null && (
                                        <View style={styles.sellerMetaItem}>
                                            <Ionicons name="cube-outline" size={11} color="#0EA5E9" />
                                            <Text style={styles.sellerMetaText}>{sellerStats.totalProducts} sản phẩm</Text>
                                        </View>
                                    )}
                                    {sellerStats?.totalFollowers != null && (
                                        <View style={styles.sellerMetaItem}>
                                            <Ionicons name="people-outline" size={11} color="#0EA5E9" />
                                            <Text style={styles.sellerMetaText}>{sellerStats.totalFollowers} theo dõi</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.visitBtn}>
                            <Text style={styles.visitBtnText}>Xem shop</Text>
                            <Ionicons name="chevron-forward" size={13} color="#0EA5E9" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>

                <View style={{ height: 20 }} />
            </Animated.ScrollView>

            {/* ── BOTTOM ACTION BAR ── */}
            <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                {/* Cart button */}
                <TouchableOpacity
                    style={[styles.cartBtn, (!variant || isAddingCart) && styles.btnDisabled]}
                    disabled={!variant || isAddingCart}
                    onPress={() => {
                        if (!variant) { Alert.alert('Chú ý', 'Vui lòng chọn màu sắc và kích cỡ trước.'); return; }
                        addToCart({ productId: product._id, variant: { color: selectedColor, size: selectedSize }, quantity: qty });
                    }}
                >
                    {isAddingCart
                        ? <ActivityIndicator size="small" color="#0EA5E9" />
                        : <>
                            <Ionicons name="cart-outline" size={22} color={variant ? '#0EA5E9' : '#93C5FD'} />
                            <Text style={[styles.cartBtnText, !variant && { color: '#93C5FD' }]}>Giỏ hàng</Text>
                        </>
                    }
                </TouchableOpacity>

                {/* Buy now button */}
                <TouchableOpacity
                    style={[styles.buyBtn, !variant && styles.buyBtnDisabled]}
                    disabled={!variant}
                    onPress={handleBuyNow}
                >
                    <LinearGradient
                        colors={variant ? ['#0284C7', '#0EA5E9', '#38BDF8'] : ['#BAE6FD', '#BAE6FD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buyBtnGradient}
                    >
                        <Ionicons name="flash" size={18} color="#fff" />
                        <View>
                            <Text style={styles.buyBtnLabel}>Mua ngay</Text>
                            <Text style={styles.buyBtnPrice}>{formatPrice((salePrice ?? originalPrice) * qty)}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F1F5F9' },

    // ── Center Screens ──
    centerScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#F8FAFF',
        paddingHorizontal: 32,
    },
    loadingSpinner: {
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: { color: '#6B7280', fontSize: 15, fontWeight: '600' },
    notFoundIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#BAE6FD',
    },
    notFoundTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
    notFoundSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
    backBtnCenter: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 28,
        paddingVertical: 12,
        backgroundColor: '#0EA5E9',
        borderRadius: 24,
    },
    backBtnCenterText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // ── Floating Header ──
    headerWrap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerBgBlur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
    },
    floatBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    floatTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    headerRight: { flexDirection: 'row', gap: 6 },

    scrollContent: { paddingBottom: 130 },

    // ── Image Carousel ──
    imageContainer: {
        width: SW,
        height: IMAGE_HEIGHT + 38,
        backgroundColor: '#FFFFFF',
        paddingTop: 38,
    },
    imageSlide: { width: SW, height: IMAGE_HEIGHT + 38 },
    heroImage: { width: SW, height: IMAGE_HEIGHT + 38, backgroundColor: '#CBD5E1' },
    heroImagePlaceholder: {
        width: SW,
        height: IMAGE_HEIGHT,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    noImageText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 140,
    },

    dotsRow: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: { width: 22, backgroundColor: '#FFFFFF', borderRadius: 3 },
    counterPill: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    // ── Hero Card ──
    heroCard: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 18,
        marginBottom: 10,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    priceBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
    salePrice: { fontSize: 32, fontWeight: '900', color: '#0EA5E9', letterSpacing: -1 },
    origPrice: { fontSize: 16, color: '#94A3B8', textDecorationLine: 'line-through', fontWeight: '500' },
    normalPrice: { fontSize: 30, fontWeight: '900', color: '#0EA5E9', letterSpacing: -0.5 },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingBadgeText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
    productName: { fontSize: 20, fontWeight: '800', color: '#0F172A', lineHeight: 28, marginBottom: 12 },
    saleBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginBottom: 16,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    saleBannerText: { fontSize: 13, fontWeight: '700', color: '#0284C7', flex: 1 },

    // Inline stats
    inlineStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFF',
        borderRadius: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inlineStat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    inlineStatIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inlineStatVal: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
    inlineStatLbl: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 1 },
    statDivider: { width: 1, height: 32, backgroundColor: '#E2E8F0' },

    // ── Generic Card ──
    card: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 12,
        marginBottom: 10,
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 14,
        letterSpacing: -0.2,
    },

    // ── Variants ──
    variantGroup: { marginBottom: 16 },
    variantLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    variantLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
    selectedTag: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    selectedTagText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

    colorList: { flexDirection: 'row', gap: 10, paddingRight: 4 },
    colorSwatch: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2.5,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    colorSwatchActive: {
        borderColor: '#0EA5E9',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    colorDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    colorCheckmark: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },

    sizeList: { flexDirection: 'row', gap: 8, paddingRight: 4 },
    sizeChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFF',
        position: 'relative',
        overflow: 'hidden',
    },
    sizeChipActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    sizeChipDis: { opacity: 0.35 },
    sizeChipText: { fontSize: 14, fontWeight: '600', color: '#475569' },
    sizeChipTextActive: { color: '#1D4ED8', fontWeight: '800' },
    sizeChipTextDis: { color: '#94A3B8' },
    sizeStrikethrough: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 1.5,
        backgroundColor: '#94A3B8',
    },

    // ── Quantity ──
    qtySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 4,
    },
    stockHint: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '500' },
    qtyCtrl: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        backgroundColor: '#F8FAFF',
    },
    qtyBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    qtyVal: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        minWidth: 46,
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        height: 44,
        lineHeight: 44,
    },

    // ── Description ──
    descText: { fontSize: 14, color: '#475569', lineHeight: 24 },

    // ── Seller ──
    sellerCard: {
        marginHorizontal: 12,
        marginBottom: 10,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    sellerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    sellerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
    sellerAvatarWrap: { position: 'relative' },
    sellerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    sellerAvatarFallback: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    sellerAvatarInitial: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    sellerInfo: { flex: 1 },
    sellerName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    sellerMeta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    sellerMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sellerMetaText: { fontSize: 12, color: '#475569', fontWeight: '600' },
    visitBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#BAE6FD',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 2,
    },
    visitBtnText: { color: '#0284C7', fontWeight: '700', fontSize: 13 },

    // ── Bottom Bar ──
    bottomBar: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 16,
    },
    cartBtn: {
        width: 68,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#F0F9FF',
        borderWidth: 1.5,
        borderColor: '#BAE6FD',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
    },
    cartBtnText: { fontSize: 10, fontWeight: '700', color: '#0EA5E9' },
    btnDisabled: { opacity: 0.45 },
    buyBtn: { flex: 1, borderRadius: 18, overflow: 'hidden' },
    buyBtnDisabled: { opacity: 0.5 },
    buyBtnGradient: {
        flex: 1,
        height: 58,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    buyBtnLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
        letterSpacing: 0.2,
    },
    buyBtnPrice: {
        fontSize: 17,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
});
