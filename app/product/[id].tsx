import { useCreateCart } from '@/api/cart/cart.api';
import { useDetailProduct } from '@/api/product/product.api';
import { ProductVariant } from '@/api/product/product.type';
import { useAppDispatch } from '@/src/store/index';
import { addCheckoutItem, clearCheckout } from '@/src/store/slices/checkoutSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatPrice(price: number) {
    return price.toLocaleString('vi-VN') + 'đ';
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data, isLoading } = useDetailProduct(id);
    const product = data?.data?.product;
    const dispatch = useAppDispatch();

    const [activeImage, setActiveImage] = useState<number>(0);
    const [qty, setQty] = useState(1);


    const { mutate: addToCart, isPending: isAddingCart } = useCreateCart({
        onSuccess: () => {
            Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng 🛒');
        },
        onError: (error: any) => {
            console.log('Add to cart error:', error);
            console.log('Error response:', error.response?.data);
            console.log('Error status:', error.response?.status);
            Alert.alert('Lỗi', `Không thể thêm vào giỏ hàng: ${error.response?.data?.message || error.message || 'Vui lòng thử lại.'}`);
        },
    });


    const handleBuyNow = () => {
        if (!variant || !product) {
            Alert.alert('Chú ý', 'Vui lòng chọn màu sắc và kích cỡ trước.');
            return;
        }

        // Clear existing checkout items and add current product
        dispatch(clearCheckout());
        dispatch(addCheckoutItem({
            _id: `${product._id}-${selectedColor}-${selectedSize}`,
            productId: {
                _id: product._id,
                name: product.name,
                images: product.images,
                price: salePrice ?? originalPrice,
                sale: product.sale || undefined,
            },
            variant: {
                color: selectedColor,
                size: selectedSize,
            },
            quantity: qty,
            price: salePrice ?? originalPrice,
        }));

        // Navigate to checkout
        router.push('/checkout' as any);
    };

    // Màu & Size selection
    const allColors = Array.from(new Set(product?.variants?.map((v: ProductVariant) => v.color).filter(Boolean) ?? []));
    const allSizes = Array.from(new Set(product?.variants?.map((v: ProductVariant) => v.size).filter(Boolean) ?? []));

    const [selectedColor, setSelectedColor] = useState<string>(allColors[0] ?? '');
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Variant khớp với màu + size đang chọn
    const selectedVariantIdx = product?.variants?.findIndex(
        (v: ProductVariant) => v.color === selectedColor && v.size === selectedSize
    ) ?? -1;
    const variant: ProductVariant | undefined = selectedVariantIdx >= 0
        ? product?.variants?.[selectedVariantIdx]
        : undefined;

    if (isLoading) {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </LinearGradient>
        );
    }

    if (!product) {
        return (
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.loadingContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={60} color="rgba(255,255,255,0.3)" />
                <Text style={styles.loadingText}>Không tìm thấy sản phẩm</Text>
                <TouchableOpacity style={styles.backBtnCenter} onPress={() => router.back()}>
                    <Text style={styles.backBtnCenterText}>Quay lại</Text>
                </TouchableOpacity>
            </LinearGradient>
        );
    }

    // Kiểm tra size có khả dụng với màu đang chọn không
    const isSizeAvailable = (size: string) => {
        return product.variants?.some(
            (v: ProductVariant) => v.color === selectedColor && v.size === size && v.stock > 0
        ) ?? false;
    };

    const handleSelectColor = (color: string) => {
        setSelectedColor(color);
        setSelectedSize(''); // reset size khi đổi màu
    };

    const handleSelectSize = (size: string) => {
        if (!isSizeAvailable(size)) return;
        setSelectedSize(size);
    };
    const originalPrice = variant?.price ?? (product.variants?.[0]?.price ?? 0);
    const salePrice = product.sale ? originalPrice * (1 - product.sale / 100) : null;
    const images = product.images?.length ? product.images : [];

    return (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradientBg}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết sản phẩm</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Image Gallery */}
                    <View style={styles.imageSection}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                setActiveImage(idx);
                            }}
                        >
                            {images.length > 0 ? images.map((img: string, i: number) => (
                                <Image key={i} source={{ uri: img }} style={styles.mainImage} resizeMode="cover" />
                            )) : (
                                <View style={[styles.mainImage, styles.placeholderImage]}>
                                    <MaterialCommunityIcons name="image-off-outline" size={60} color="rgba(255,255,255,0.2)" />
                                </View>
                            )}
                        </ScrollView>

                        {/* Dots */}
                        {images.length > 1 && (
                            <View style={styles.dotsRow}>
                                {images.map((_: string, i: number) => (
                                    <View key={i} style={[styles.dot, i === activeImage && styles.dotActive]} />
                                ))}
                            </View>
                        )}

                        {/* Sale badge */}
                        {product.sale ? (
                            <View style={styles.saleBadge}>
                                <Text style={styles.saleBadgeText}>-{product.sale}%</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons key={s} name="star" size={14} color="#FFD700" />
                            ))}
                            <Text style={styles.ratingText}>4.9 (128 đánh giá)</Text>
                        </View>

                        {/* Price */}
                        <View style={styles.priceBlock}>
                            {salePrice != null ? (
                                <>
                                    <Text style={styles.salePrice}>{formatPrice(salePrice)}</Text>
                                    <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
                                    <View style={styles.saveBadge}>
                                        <Text style={styles.saveText}>Tiết kiệm {formatPrice(originalPrice - salePrice)}</Text>
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.normalPrice}>{formatPrice(originalPrice)}</Text>
                            )}
                        </View>

                        {product.variants?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Phân loại</Text>

                                {allColors.length > 0 && (
                                    <View style={styles.variantRow}>
                                        <Text style={styles.variantRowLabel}>Màu sắc</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantList}>
                                            {allColors.map((color: string) => (
                                                <TouchableOpacity
                                                    key={color}
                                                    style={[
                                                        styles.colorChip,
                                                        color === selectedColor && styles.variantChipActive,
                                                    ]}
                                                    onPress={() => handleSelectColor(color)}
                                                    activeOpacity={0.8}
                                                >
                                                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                                                    <Text style={[styles.variantLabel, color === selectedColor && styles.variantLabelActive]}>
                                                        {color}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Dòng 2: Size */}
                                {allSizes.length > 0 && (
                                    <View style={styles.variantRow}>
                                        <Text style={styles.variantRowLabel}>Kích cỡ</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantList}>
                                            {allSizes.map((size: string) => {
                                                const available = isSizeAvailable(size);
                                                return (
                                                    <TouchableOpacity
                                                        key={size}
                                                        style={[
                                                            styles.variantChip,
                                                            size === selectedSize && styles.variantChipActive,
                                                            !available && styles.variantChipDisabled,
                                                        ]}
                                                        onPress={() => handleSelectSize(size)}
                                                        activeOpacity={available ? 0.8 : 1}
                                                        disabled={!available}
                                                    >
                                                        <Text style={[
                                                            styles.variantLabel,
                                                            size === selectedSize && styles.variantLabelActive,
                                                            !available && styles.variantLabelDisabled,
                                                        ]}>
                                                            {size}
                                                        </Text>
                                                        {!available && (
                                                            <Text style={styles.outOfStock}> Hết</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                )}

                                {variant && (
                                    <View style={styles.variantInfo}>
                                        <Text style={styles.variantInfoText}>
                                            🎨 Màu: <Text style={styles.bold}>{variant.color || '—'}</Text>
                                            {'   '}📐 Size: <Text style={styles.bold}>{variant.size || '—'}</Text>
                                            {'   '}📦 Kho: <Text style={styles.bold}>{variant.stock}</Text>
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Quantity */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Số lượng</Text>
                            <View style={styles.qtyRow}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="remove" size={18} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.qtyValue}>{qty}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => setQty((q) => Math.min(variant?.stock ?? 99, q + 1))}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="add" size={18} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.stockHint}>
                                    {variant?.stock != null ? `Còn ${variant.stock} sản phẩm` : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        {product.description ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
                                <Text style={styles.description}>{product.description}</Text>
                            </View>
                        ) : null}

                        {/* Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="cube-outline" size={22} color="#FFD700" />
                                <Text style={styles.statVal}>{variant?.stock ?? 0}</Text>
                                <Text style={styles.statLbl}>Còn hàng</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="bag-check-outline" size={22} color="#FFD700" />
                                <Text style={styles.statVal}>{variant?.sold ?? 0}</Text>
                                <Text style={styles.statLbl}>Đã bán</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Ionicons name="star" size={22} color="#FFD700" />
                                <Text style={styles.statVal}>4.9</Text>
                                <Text style={styles.statLbl}>Đánh giá</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom CTA */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[
                            styles.cartBtn,
                            (!variant || isAddingCart) && styles.cartBtnDisabled,
                        ]}
                        activeOpacity={0.85}
                        disabled={!variant || isAddingCart}
                        onPress={() => {
                            if (!variant) {
                                Alert.alert('Chú ý', 'Vui lòng chọn màu sắc và kích cỡ trước.');
                                return;
                            }
                            const payload = {
                                productId: product._id,
                                variant: {
                                    color: selectedColor,
                                    size: selectedSize,
                                },
                                quantity: qty,
                            };
                            console.log('Adding to cart with payload:', payload);
                            addToCart(payload);
                        }}
                    >
                        {isAddingCart ? (
                            <ActivityIndicator size="small" color="#FFD700" />
                        ) : (
                            <Ionicons name="cart-outline" size={22} color={variant ? '#FFD700' : 'rgba(255,215,0,0.35)'} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.buyBtn} activeOpacity={0.85} onPress={handleBuyNow}>
                        <LinearGradient
                            colors={['#FFD700', '#FFA500']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buyGradient}
                        >
                            <Text style={styles.buyText}>Mua ngay • {formatPrice((salePrice ?? originalPrice) * qty)}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBg: { flex: 1 },
    safeArea: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
    },
    backBtnCenter: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: '#FFD700',
        borderRadius: 20,
    },
    backBtnCenterText: {
        color: '#1a1a2e',
        fontWeight: '700',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },

    scrollContent: {
        paddingBottom: 100,
    },

    // Image
    imageSection: {
        position: 'relative',
    },
    mainImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 0.85,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotsRow: {
        position: 'absolute',
        bottom: 14,
        alignSelf: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    dotActive: {
        width: 18,
        backgroundColor: '#FFD700',
    },
    saleBadge: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
    },
    saleBadgeText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 13,
    },

    // Info Card
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
        paddingHorizontal: 20,
        paddingTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    productName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 30,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 16,
    },
    ratingText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginLeft: 4,
    },

    // Price
    priceBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    salePrice: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FF6B6B',
    },
    originalPrice: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.4)',
        textDecorationLine: 'line-through',
    },
    saveBadge: {
        backgroundColor: 'rgba(255,107,107,0.15)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
    },
    saveText: {
        color: '#FF6B6B',
        fontSize: 11,
        fontWeight: '600',
    },
    normalPrice: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFD700',
    },

    // Sections
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },

    // Variants
    variantRow: {
        marginBottom: 12,
    },
    variantRowLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    variantList: {
        gap: 10,
        paddingBottom: 4,
    },
    colorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        gap: 6,
    },
    variantChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        gap: 6,
    },
    variantChipActive: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.15)',
    },
    variantChipDisabled: {
        opacity: 0.3,
    },
    colorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    variantLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    variantLabelActive: {
        color: '#FFD700',
        fontWeight: '700',
    },
    variantLabelDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },
    outOfStock: {
        color: '#FF6B6B',
        fontSize: 11,
    },
    variantInfo: {
        marginTop: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 12,
    },
    variantInfoText: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 13,
    },
    bold: {
        color: '#fff',
        fontWeight: '700',
    },

    // Quantity
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    qtyBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    qtyValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        minWidth: 30,
        textAlign: 'center',
    },
    stockHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginLeft: 4,
    },

    // Description
    description: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 14,
        lineHeight: 22,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingVertical: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statVal: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    statLbl: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        paddingTop: 12,
        backgroundColor: 'rgba(26,26,46,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    cartBtn: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderWidth: 1.5,
        borderColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBtnDisabled: {
        opacity: 0.4,
        borderColor: 'rgba(255,215,0,0.4)',
    },
    buyBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    buyGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 54,
    },
    buyText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1a1a2e',
    },
});
