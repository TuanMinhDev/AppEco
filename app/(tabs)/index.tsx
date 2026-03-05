import { useListProduct } from '@/api/product/product.api';
import { GetProductQuery } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const CATEGORIES = [
    { id: '1', label: 'Tất cả', icon: 'apps' as const },
    { id: '2', label: 'Hot Sale', icon: 'fire' as const },
    { id: '3', label: 'Mới nhất', icon: 'star-outline' as const },
    { id: '4', label: 'Yêu thích', icon: 'heart-outline' as const },
];

const BANNERS = [
    {
        id: '1',
        gradient: ['#FF6B6B', '#FF8E53'] as const,
        discount: '50%',
        sub: 'Ưu đãi cực lớn hôm nay',
        code: 'ECOAPP50',
        emoji: '🔥',
    },
    {
        id: '2',
        gradient: ['#4776E6', '#8E54E9'] as const,
        discount: '70%',
        sub: 'Sản phẩm chọn lọc',
        code: 'SUMMER70',
        emoji: '✨',
    },
    {
        id: '3',
        gradient: ['#11998e', '#38ef7d'] as const,
        discount: '30%',
        sub: 'Hàng mới về mỗi ngày',
        code: 'FRESH30',
        emoji: '🌿',
    },
];

function formatPrice(price: number) {
    return price.toLocaleString('vi-VN') + 'đ';
}

function ProductCard({ product }: { product: any }) {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30 }).start();
    };
    const onPressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
    };
    const onPress = () => {
        router.push(`/product/${product._id}`);
    };

    const originalPrice = product.variants?.[0]?.price || 0;
    const salePrice = product.sale ? originalPrice * (1 - product.sale / 100) : null;

    return (
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
            <Animated.View style={[styles.productCard, { transform: [{ scale }] }]}>
                <View style={styles.productImageWrapper}>
                    <Image
                        source={
                            product.images?.[0]
                                ? { uri: product.images[0] }
                                : require('@/assets/images/icon.png')
                        }
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                    {product.sale ? (
                        <View style={styles.saleTag}>
                            <Text style={styles.saleTagText}>-{product.sale}%</Text>
                        </View>
                    ) : null}
                    <TouchableOpacity style={styles.wishlistBtn} activeOpacity={0.8}>
                        <Ionicons name="heart-outline" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                    </Text>
                    <View style={styles.priceRow}>
                        {salePrice != null ? (
                            <>
                                <Text style={styles.salePrice}>{formatPrice(salePrice)}</Text>
                                <Text style={styles.crossedPrice}>{formatPrice(originalPrice)}</Text>
                            </>
                        ) : (
                            <Text style={styles.normalPrice}>{formatPrice(originalPrice)}</Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.addToCartBtn} activeOpacity={0.85}>
                        <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Pressable>
    );
}

export default function HomeScreen() {
    const methods = useForm<GetProductQuery>({
        defaultValues: {
            name: '',
            pageNumber: 1,
            pageSize: 10,
        },
    });
    const { control, setValue } = methods;
    const [name, pageNumber, pageSize] = useWatch({
        control,
        name: ['name', 'pageNumber', 'pageSize'],
    });
    const [searchText, setSearchText] = useState('');
    const [activeCat, setActiveCat] = useState('1');

    const { data: currentUser } = useGetCurrentUser();
    const { data: dataProduct } = useListProduct({ name, pageNumber, pageSize });
    const products = dataProduct?.data?.products ?? [];

    const handleSearch = (text: string) => {
        setSearchText(text);
        setValue('name', text);
    };

    return (
        <FormProvider {...methods}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradientBg}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* ── Header ── */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.greetingSmall}>Chào mừng trở lại 👋</Text>
                                <Text style={styles.greetingName} numberOfLines={1}>
                                    {currentUser?.data?.name ?? 'Khách hàng'}
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
                                    <Ionicons name="notifications-outline" size={22} color="#fff" />
                                    <View style={styles.notifDot} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.8}>
                                    <FontAwesome name="user" size={20} color="#FFD700" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── Search ── */}
                        <View style={styles.searchRow}>
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Tìm kiếm sản phẩm..."
                                    placeholderTextColor="#aaa"
                                    value={searchText}
                                    onChangeText={handleSearch}
                                />
                                {searchText.length > 0 && (
                                    <TouchableOpacity onPress={() => handleSearch('')}>
                                        <Ionicons name="close-circle" size={18} color="#aaa" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
                                <Ionicons name="options-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* ── Categories ── */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.catList}
                        >
                            {CATEGORIES.map((cat) => {
                                const active = cat.id === activeCat;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.catChip, active && styles.catChipActive]}
                                        activeOpacity={0.8}
                                        onPress={() => setActiveCat(cat.id)}
                                    >
                                        <MaterialCommunityIcons
                                            name={cat.icon}
                                            size={16}
                                            color={active ? '#1a1a2e' : '#ccc'}
                                            style={{ marginRight: 5 }}
                                        />
                                        <Text style={[styles.catLabel, active && styles.catLabelActive]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* ── Promotion Banners ── */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.bannerList}
                            decelerationRate="fast"
                            snapToInterval={SCREEN_WIDTH - 48}
                            snapToAlignment="start"
                        >
                            {BANNERS.map((b) => (
                                <LinearGradient
                                    key={b.id}
                                    colors={b.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.bannerCard}
                                >
                                    <View>
                                        <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                                        <Text style={styles.bannerDiscount}>GIẢM {b.discount}</Text>
                                        <Text style={styles.bannerSub}>{b.sub}</Text>
                                        <View style={styles.codeRow}>
                                            <Ionicons name="pricetag-outline" size={12} color="rgba(255,255,255,0.7)" />
                                            <Text style={styles.codeText}> Mã: {b.code}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.85}>
                                        <Text style={styles.bannerBtnText}>Mua ngay</Text>
                                        <Ionicons name="arrow-forward" size={14} color="#1a1a2e" />
                                    </TouchableOpacity>
                                </LinearGradient>
                            ))}
                        </ScrollView>

                        {/* ── Stats Row ── */}
                        <View style={styles.statsRow}>
                            {[
                                { label: 'Sản phẩm', value: products.length.toString(), icon: 'cube-outline' },
                                { label: 'Flash Sale', value: `${products.filter((p: any) => p.sale).length}`, icon: 'flash-outline' },
                                { label: 'Đánh giá', value: '4.9★', icon: 'star-outline' },
                            ].map((s, i) => (
                                <View key={i} style={styles.statCard}>
                                    <Ionicons name={s.icon as any} size={22} color="#FFD700" />
                                    <Text style={styles.statValue}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* ── Products Section ── */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🛍 Sản phẩm nổi bật</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>Xem tất cả →</Text>
                            </TouchableOpacity>
                        </View>

                        {products.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="shopping-outline" size={60} color="rgba(255,255,255,0.2)" />
                                <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
                            </View>
                        ) : (
                            <View style={styles.productsGrid}>
                                {products.slice(0, 6).map((product: any) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </FormProvider>
    );
}

const styles = StyleSheet.create({
    gradientBg: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    greetingSmall: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 2,
    },
    greetingName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        maxWidth: 220,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        borderWidth: 1.5,
        borderColor: '#1a1a2e',
    },
    avatarCircle: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Search ──
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 13 : 9,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#fff',
    },
    filterBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Categories ──
    catList: {
        flexDirection: 'row',
        gap: 10,
        paddingBottom: 4,
        marginBottom: 16,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    catChipActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    catLabel: {
        fontSize: 13,
        color: '#ccc',
        fontWeight: '500',
    },
    catLabelActive: {
        color: '#1a1a2e',
        fontWeight: '700',
    },

    // ── Banners ──
    bannerList: {
        gap: 14,
        paddingBottom: 4,
        marginBottom: 20,
        paddingRight: 20,
    },
    bannerCard: {
        width: SCREEN_WIDTH - 48,
        borderRadius: 22,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
            },
            android: { elevation: 10 },
        }),
    },
    bannerEmoji: {
        fontSize: 32,
        marginBottom: 6,
    },
    bannerDiscount: {
        fontSize: 30,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    bannerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
        marginBottom: 8,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    codeText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontStyle: 'italic',
    },
    bannerBtn: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        alignSelf: 'flex-end',
    },
    bannerBtnText: {
        color: '#1a1a2e',
        fontWeight: '700',
        fontSize: 13,
    },

    // ── Stats ──
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginTop: 6,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },

    // ── Section Header ──
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    seeAll: {
        fontSize: 13,
        color: '#FFD700',
        fontWeight: '600',
    },

    // ── Products Grid ──
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    // ── Product Card ──
    productCard: {
        width: CARD_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: { elevation: 5 },
        }),
    },
    productImageWrapper: {
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: 180,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    saleTag: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    saleTagText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    wishlistBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 6,
        lineHeight: 18,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    normalPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFD700',
    },
    salePrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FF6B6B',
    },
    crossedPrice: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        textDecorationLine: 'line-through',
    },
    addToCartBtn: {
        backgroundColor: '#FFD700',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
    },
    addToCartText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a2e',
    },

    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 15,
    },
});
