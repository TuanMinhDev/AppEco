import { useRecommendedProducts } from '@/api/ai/ai.api';
import { useListProduct } from '@/api/product/product.api';
import type { GetProductQuery, Product } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ProductItem } from '@/components/commom/ProductItem';
import { AppEco } from '@/constants/theme';
import { useAuthSocket } from '@/hooks/useAuthSocket';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

/** Carousel: mỗi slide full-width để paging + indicator khớp */
const BANNER_PAGE_WIDTH = SCREEN_WIDTH;
const BANNER_H_PADDING = 16;
const BANNER_INNER_WIDTH = BANNER_PAGE_WIDTH - BANNER_H_PADDING * 2;

type HomeCategory = {
    id: string;
    label: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    mode: 'filter' | 'navigate';
    href?: Href;
};

const CATEGORIES: HomeCategory[] = [
    { id: 'hot', label: 'Hot Sale', icon: 'fire', mode: 'filter' },
    { id: 'new', label: 'Mới nhất', icon: 'star-outline', mode: 'filter' },
    { id: 'fav', label: 'Yêu thích', icon: 'heart', mode: 'navigate', href: '/favorites' },
    { id: 'explore', label: 'Khám phá', icon: 'compass-outline', mode: 'navigate', href: '/(tabs)/search' },
];

type PromoBanner = {
    id: string;
    /** ảnh Unsplash cố định — tải có cache qua expo-image */
    image: string;
    eyebrow: string;
    discount: string;
    sub: string;
    code: string;
    /** Accent nhẹ cho nhãn & viền mã giảm */
    accentTint: string;
};

const BANNERS: PromoBanner[] = [
    {
        id: '1',
        image:
            'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=85',
        eyebrow: 'Thiên nhiên trong từng sản phẩm',
        discount: '30%',
        sub: 'Hàng mới về mỗi ngày • Giao nhanh, đóng gói Eco',
        code: 'FRESH30',
        accentTint: '#6EE7B7',
    },
    {
        id: '2',
        image:
            'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=85',
        eyebrow: 'Flash Sale — chỉ hôm nay',
        discount: '50%',
        sub: 'Ưu đãi độc quyền • Số lượng có hạn',
        code: 'EXCLUSIVE50',
        accentTint: '#F472B6',
    },
    {
        id: '3',
        image:
            'https://images.unsplash.com/photo-1559181567-c3194caecf02?auto=format&fit=crop&w=1200&q=85',
        eyebrow: 'Sống xanh — chi tiêu thông minh',
        discount: '25%',
        sub: 'Tích điểm & tiết kiệm thêm cho đơn kế tiếp',
        code: 'SAVE25',
        accentTint: '#FBBF24',
    },
];

export default function HomeScreen() {
    const methods = useForm<GetProductQuery>({
        defaultValues: {
            name: '',
            pageNumber: 1,
            pageSize: 10,
        },
    });
    
    const [activeCat, setActiveCat] = useState<HomeCategory['id']>('hot');
    const [currentAutoBannerIndex, setCurrentAutoBannerIndex] = useState(0);
    const autoBannerRef = useRef<FlatList>(null);

    const { data: currentUser } = useGetCurrentUser();
    const { data: dataProduct } = useListProduct();
    const products = dataProduct?.data?.items ?? [];
    
    // Socket notifications
    const { notifications } = useAuthSocket();
    const unreadCount = notifications.unreadCount;
    
    // AI Recommendations
    const { data: recommendData, isLoading: isLoadingRecommend } = useRecommendedProducts(6);

    const homeProducts = useMemo(() => {
        const list = [...products];
        if (activeCat === 'hot') {
            return list
                .filter((p) => p.sale != null && p.sale > 0)
                .sort((a, b) => (b.sale ?? 0) - (a.sale ?? 0));
        }
        if (activeCat === 'new') {
            return list.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );
        }
        return list;
    }, [products, activeCat]);

    const homeGridProducts = useMemo(() => homeProducts.slice(0, 10), [homeProducts]);

    const sectionTitle =
        activeCat === 'hot' ? 'Ưu đãi nổi bật' : activeCat === 'new' ? 'Hàng mới về' : 'Sản phẩm Eco';

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAutoBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % BANNERS.length;
                autoBannerRef.current?.scrollToOffset({
                    offset: nextIndex * BANNER_PAGE_WIDTH,
                    animated: true,
                });
                return nextIndex;
            });
        }, 4000); 

        return () => clearInterval(interval);
    }, []);



    const handleBannerPress = (discount: string) => {
        const percentage = parseInt(discount.replace('%', ''));
        router.push(`/(tabs)/search?sale=${percentage}`);
    };

    const handleCategoryPress = (cat: HomeCategory) => {
        if (cat.mode === 'navigate' && cat.href) {
            router.push(cat.href);
            return;
        }
        setActiveCat(cat.id);
    };

    return (
        <FormProvider {...methods}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                    {/* Modern Header */}
                    <View style={styles.modernHeader}>
                        <View style={styles.headerTop}>
                            <View style={styles.userSection}>
                                <View style={styles.avatarWrapper}>
                                    <FontAwesome name="user" size={20} color={AppEco.primary} />
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.welcomeText}>Xin chào,</Text>
                                    <Text style={styles.userName}>{currentUser?.name ?? 'Khách'}</Text>
                                    
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.notificationBtn}
                                onPress={() => router.push('/(tabs)/notifications')}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityLabel="Thông báo"
                            >
                                <Ionicons name="notifications-outline" size={22} color={AppEco.primary} />
                                {/* Badge hiển thị số thông báo chưa đọc */}
                                {unreadCount > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <TouchableOpacity 
                                style={styles.searchInputWrapper}
                                onPress={() => router.push('/(tabs)/search')}
                            >
                                <Ionicons name="search" size={20} color={AppEco.primary} style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Tìm kiếm sản phẩm"
                                    placeholderTextColor={AppEco.textMuted}
                                    value=""
                                    editable={false}
                                    pointerEvents="none"
                                />
                            </TouchableOpacity>
                            
                        </View>
                    </View>
                    <FlatList
                        data={[{ type: 'categories' }, { type: 'autobanner' }, { type: 'recommendations' }, { type: 'products' }]}
                        renderItem={({ item }) => {
                            if (item.type === 'categories') {
                                return (
                                    <View style={styles.categoriesSection}>
                                        <Text style={styles.quickPickTitle}>Lối tắt</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.categoriesList}
                                        >
                                            {CATEGORIES.map((cat) => {
                                                const active =
                                                    cat.mode === 'filter' && cat.id === activeCat;
                                                return (
                                                    <TouchableOpacity
                                                        key={cat.id}
                                                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                                                        onPress={() => handleCategoryPress(cat)}
                                                        activeOpacity={0.85}
                                                    >
                                                        <View
                                                            style={[
                                                                styles.categoryIconSmall,
                                                                active && styles.categoryIconSmallActive,
                                                            ]}
                                                        >
                                                            <MaterialCommunityIcons
                                                                name={cat.icon}
                                                                size={20}
                                                                color={active ? '#fff' : AppEco.primary}
                                                            />
                                                        </View>
                                                        <Text
                                                            style={[styles.categoryChipLabel, active && styles.categoryChipLabelActive]}
                                                        >
                                                            {cat.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    </View>
                                );
                            }

                            if (item.type === 'autobanner') {
                                return (
                                    <View style={styles.autoBannerSection}>
                                        <FlatList
                                            ref={autoBannerRef}
                                            data={BANNERS}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            pagingEnabled
                                            decelerationRate="fast"
                                            snapToAlignment="center"
                                            getItemLayout={(_, index) => ({
                                                length: BANNER_PAGE_WIDTH,
                                                offset: BANNER_PAGE_WIDTH * index,
                                                index,
                                            })}
                                            keyExtractor={(b) => b.id}
                                            renderItem={({ item: b }) => (
                                                <View
                                                    style={styles.heroBannerPage}
                                                    accessibilityRole="image"
                                                    accessibilityLabel={`${b.eyebrow}, giảm ${b.discount}`}
                                                >
                                                    <TouchableOpacity
                                                        style={[styles.heroBannerCard, { width: BANNER_INNER_WIDTH }]}
                                                        onPress={() => handleBannerPress(b.discount)}
                                                        activeOpacity={0.92}
                                                    >
                                                        <Image
                                                            source={{ uri: b.image }}
                                                            style={styles.heroBannerImage}
                                                            contentFit="cover"
                                                            transition={220}
                                                            cachePolicy="memory-disk"
                                                            recyclingKey={b.id}
                                                        />
                                                        <LinearGradient
                                                            colors={['rgba(0,0,0,0)', 'rgba(8,61,53,0.35)', 'rgba(6,40,39,0.92)']}
                                                            locations={[0, 0.42, 1]}
                                                            style={StyleSheet.absoluteFill}
                                                        />
                                                        <LinearGradient
                                                            colors={[AppEco.primary + '55', 'transparent']}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 0.6 }}
                                                            style={[StyleSheet.absoluteFill, styles.heroBannerTint]}
                                                        />

                                                        <View style={styles.heroBannerDecorCircle} />

                                                        <View style={styles.heroBannerBody}>
                                                            <View
                                                                style={[
                                                                    styles.heroBannerEyebrowPill,
                                                                    { borderColor: b.accentTint + '99' },
                                                                ]}
                                                            >
                                                                <MaterialCommunityIcons
                                                                    name="leaf"
                                                                    size={14}
                                                                    color={b.accentTint}
                                                                />
                                                                <Text
                                                                    style={[styles.heroBannerEyebrow, { color: b.accentTint }]}
                                                                    numberOfLines={1}
                                                                >
                                                                    {b.eyebrow}
                                                                </Text>
                                                            </View>

                                                            <View style={styles.heroBannerDiscountRow}>
                                                                <Text style={styles.heroBannerDiscountPrefix}>Giảm</Text>
                                                                <Text style={styles.heroBannerDiscount}>{b.discount}</Text>
                                                                <Text style={styles.heroBannerDiscountSuffix}>Giá cực êm</Text>
                                                            </View>

                                                            <Text style={styles.heroBannerSub} numberOfLines={2}>
                                                                {b.sub}
                                                            </Text>

                                                            <View style={styles.heroBannerFooter}>
                                                                <View
                                                                    style={[
                                                                        styles.heroBannerCodePill,
                                                                        { borderColor: 'rgba(255,255,255,0.45)' },
                                                                    ]}
                                                                >
                                                                    <MaterialCommunityIcons
                                                                        name="tag-outline"
                                                                        size={16}
                                                                        color="#FFFFFF"
                                                                        style={styles.heroBannerCodeIcon}
                                                                    />
                                                                    <Text style={styles.heroBannerCode}>{b.code}</Text>
                                                                </View>
                                                                <LinearGradient
                                                                    colors={[b.accentTint, '#FFFFFF']}
                                                                    style={styles.heroBannerCta}
                                                                    start={{ x: 0, y: 0.5 }}
                                                                    end={{ x: 1, y: 0.5 }}
                                                                >
                                                                    <Text style={styles.heroBannerCtaText}>Mở khuyến mãi</Text>
                                                                    <Ionicons name="arrow-forward" size={16} color={AppEco.text} />
                                                                </LinearGradient>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                            onMomentumScrollEnd={(event) => {
                                                const index = Math.round(
                                                    event.nativeEvent.contentOffset.x / BANNER_PAGE_WIDTH,
                                                );
                                                setCurrentAutoBannerIndex(
                                                    Math.min(BANNERS.length - 1, Math.max(0, index)),
                                                );
                                            }}
                                        />
                                        <View style={styles.autoBannerIndicator}>
                                            {BANNERS.map((_, index) => (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.autoBannerDot,
                                                        index === currentAutoBannerIndex && styles.autoBannerDotActive
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                );
                            }

                            if (item.type === 'recommendations') {
                                const recommendedProducts = recommendData?.products || [];
                                
                                return (
                                    <View style={styles.recommendSection}>
                                        <View style={styles.sectionHeader}>
                                            <View style={styles.sectionTitleBlock}>
                                                <View style={styles.aiRecommendBadge}>
                                                    <MaterialCommunityIcons
                                                        name="robot-happy-outline"
                                                        size={18}
                                                        color="#fff"
                                                    />
                                                    <Text style={styles.aiRecommendBadgeText}>Gợi ý cho bạn</Text>
                                                </View>
                                                <Text style={styles.sectionHint}>
                                                    {recommendData?.algorithm ? 
                                                        `Dựa trên ${recommendData.algorithm}` : 
                                                        'Được chọn riêng cho bạn'}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        {isLoadingRecommend ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator size="large" color={AppEco.primary} />
                                                <Text style={styles.loadingText}>Đang tìm sản phẩm phù hợp...</Text>
                                            </View>
                                        ) : recommendedProducts.length > 0 ? (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.recommendScroll}
                                            >
                                                {recommendedProducts.map((product) => {
                                                    // Convert recommended product to Product type
                                                    const productData: Product = {
                                                        _id: product._id,
                                                        name: product.name,
                                                        images: product.image ? [product.image] : [],
                                                        variants: [{
                                                            color: '',
                                                            size: '',
                                                            price: product.price,
                                                            sold: 0,
                                                            stock: 0,
                                                        }],
                                                        sale: product.sale,
                                                        sellerId: '',
                                                        categoryId: '',
                                                        description: '',
                                                        createdAt: new Date().toISOString(),
                                                        updatedAt: new Date().toISOString(),
                                                    };
                                                    
                                                    return (
                                                        <View key={product._id} style={styles.recommendCard}>
                                                            <ProductItem
                                                                product={productData}
                                                                cardWidth={CARD_WIDTH}
                                                            />
                                                            {product.reason && (
                                                                <View style={styles.reasonBadge}>
                                                                    <MaterialCommunityIcons
                                                                        name="lightbulb-on-outline"
                                                                        size={12}
                                                                        color="#8B5CF6"
                                                                    />
                                                                    <Text style={styles.reasonText} numberOfLines={1}>
                                                                        {product.reason}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    );
                                                })}
                                            </ScrollView>
                                        ) : (
                                            <View style={styles.emptyRecommend}>
                                                <MaterialCommunityIcons
                                                    name="robot-confused-outline"
                                                    size={48}
                                                    color={AppEco.border}
                                                />
                                                <Text style={styles.emptyText}>
                                                    Chưa có đủ dữ liệu để gợi ý
                                                </Text>
                                                <Text style={styles.emptyHint}>
                                                    Hãy mua sắm và đánh giá sản phẩm để nhận gợi ý tốt hơn!
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            }

                            if (item.type === 'products') {
                                return (
                                    <View style={styles.productsSection}>
                                        {homeGridProducts.length > 0 ? (
                                            <>
                                                <View style={styles.sectionHeader}>
                                                    <View style={styles.sectionTitleBlock}>
                                                        <View style={styles.ecoBadge}>
                                                            <MaterialCommunityIcons
                                                                name="leaf"
                                                                size={16}
                                                                color="#fff"
                                                            />
                                                            <Text style={styles.ecoBadgeText}>{sectionTitle}</Text>
                                                        </View>
                                                        <Text style={styles.sectionHint}>
                                                            {activeCat === 'hot'
                                                                ? 'Ưu đãi đang áp dụng'
                                                                : activeCat === 'new'
                                                                  ? 'Mới cập nhật gần đây'
                                                                  : 'Chọn lọc thân thiện môi trường'}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.seeAllBtn}
                                                        onPress={() => router.push('/(tabs)/search')}
                                                        activeOpacity={0.85}
                                                    >
                                                        <Text style={styles.seeAllText}>Xem thêm</Text>
                                                        <Ionicons name="chevron-forward" size={16} color={AppEco.primary} />
                                                    </TouchableOpacity>
                                                </View>
                                                <FlatList
                                                    data={homeGridProducts}
                                                    numColumns={2}
                                                    columnWrapperStyle={styles.productRow}
                                                    renderItem={({ item: product }) => (
                                                        <ProductItem
                                                            product={product}
                                                            cardWidth={CARD_WIDTH}
                                                            style={{ marginBottom: 12 }}
                                                        />
                                                    )}
                                                    keyExtractor={(p: Product) => p._id}
                                                    scrollEnabled={false}
                                                />
                                            </>
                                        ) : (
                                            <View style={styles.emptyState}>
                                                <MaterialCommunityIcons
                                                    name="shopping-outline"
                                                    size={48}
                                                    color={AppEco.border}
                                                />
                                                <Text style={styles.emptyText}>
                                                    {activeCat === 'hot'
                                                        ? 'Chưa có sản phẩm đang giảm giá'
                                                        : 'Chưa có sản phẩm để hiển thị'}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.emptyCta}
                                                    onPress={() => router.push('/(tabs)/search')}
                                                >
                                                    <Text style={styles.emptyCtaText}>Mở tìm kiếm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            }

                            return null;
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.mainContent}
                    />
                </SafeAreaView>
            </FormProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppEco.background,
    },

    // Modern Header
    modernHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AppEco.surfaceMuted,
        borderWidth: 1.5,
        borderColor: AppEco.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 12,
        color: AppEco.textSecondary,
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: AppEco.primary,
    },
    homeTagline: {
        fontSize: 12,
        color: AppEco.textMuted,
        marginTop: 4,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: AppEco.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: AppEco.border,
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: AppEco.sale,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: AppEco.surface,
    },
    notificationBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        lineHeight: 12,
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: AppEco.sale,
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AppEco.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: AppEco.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: AppEco.text,
    },
    clearBtn: {
        marginLeft: 8,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: AppEco.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: AppEco.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },

    // Main Content
    mainContent: {
        paddingHorizontal: 0,
        paddingBottom: 32,
        backgroundColor: AppEco.background,
        gap: 16,
    },

    // Section Card
    sectionCard: {
        backgroundColor: AppEco.surface,
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AppEco.borderSoft,
        ...AppEco.shadowCard,
    },

    // Categories — horizontal chips
    quickPickTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: AppEco.textSecondary,
        letterSpacing: 0.4,
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    categoriesSection: {
        marginBottom: 4,
        paddingTop: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: AppEco.primary,
        marginBottom: 16,
    },
    categoriesList: {
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: AppEco.surface,
        borderWidth: 1,
        borderColor: AppEco.border,
    },
    categoryChipActive: {
        backgroundColor: AppEco.primary,
        borderColor: AppEco.primary,
    },
    categoryIconSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AppEco.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryIconSmallActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    categoryChipLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: AppEco.textSecondary,
    },
    categoryChipLabelActive: {
        color: '#fff',
    },

    // Hero carousel (ảnh + gradient + typography)
    autoBannerSection: {
        marginTop: 4,
        marginBottom: 4,
    },
    heroBannerPage: {
        width: BANNER_PAGE_WIDTH,
        paddingHorizontal: BANNER_H_PADDING,
        alignItems: 'center',
    },
    heroBannerCard: {
        overflow: 'hidden',
        alignSelf: 'center',
        minHeight: 196,
        borderRadius: AppEco.radiusXl,
        ...AppEco.shadowSoft,
        backgroundColor: AppEco.primaryDark,
    },
    heroBannerImage: {
        ...StyleSheet.absoluteFillObject,
    },
    heroBannerTint: {
        opacity: 0.42,
    },
    heroBannerDecorCircle: {
        position: 'absolute',
        right: -52,
        top: -56,
        width: 158,
        height: 158,
        borderRadius: 79,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    heroBannerBody: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 8,
    },
    heroBannerEyebrowPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginBottom: 10,
        maxWidth: '92%',
        borderRadius: AppEco.radiusFull,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.22)',
    },
    heroBannerEyebrow: {
        flex: 1,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    heroBannerDiscountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    heroBannerDiscountPrefix: {
        fontSize: 22,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.95)',
    },
    heroBannerDiscount: {
        fontSize: 46,
        lineHeight: 50,
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 12,
    },
    heroBannerDiscountSuffix: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 2,
    },
    heroBannerSub: {
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 14,
        maxWidth: '98%',
    },
    heroBannerFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    heroBannerCodePill: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: AppEco.radiusMd,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
    },
    heroBannerCodeIcon: {
        marginRight: 6,
    },
    heroBannerCode: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.6,
    },
    heroBannerCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: AppEco.radiusFull,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
    },
    heroBannerCtaText: {
        fontSize: 13,
        fontWeight: '800',
        color: AppEco.text,
    },
    autoBannerIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    autoBannerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: AppEco.border,
    },
    autoBannerDotActive: {
        backgroundColor: AppEco.primary,
        width: 20,
    },

    // Banner Section
    bannerSection: {
        marginBottom: 0,
    },
    bannerCard: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    bannerContent: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    bannerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    bannerBtn: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    bannerBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: AppEco.primary,
    },

    // Products Section
    productsSection: {
        marginBottom: 0,
    },
    productCardWrapper: {
        marginBottom: 12,
        backgroundColor: AppEco.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AppEco.borderSoft,
        ...AppEco.shadowCard,
    },
    productsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flex: 1,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    seeAllText: {
        fontSize: 14,
        color: AppEco.primary,
        fontWeight: '600',
    },
    productRow: {
        justifyContent: 'space-between',
        gap: 16,
        paddingHorizontal: 16,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
        gap: 12,
    },
    emptyText: {
        color: AppEco.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyCta: {
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: AppEco.primary,
    },
    emptyCtaText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    // Section Header
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    sectionTitleBlock: {
        flex: 1,
        marginRight: 8,
        minWidth: 0,
    },
    ecoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: AppEco.success,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ecoBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    sectionHint: {
        fontSize: 13,
        color: AppEco.textSecondary,
        marginTop: 6,
    },

    // Regular Products Header
    regularProductsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },

    // AI Recommendations Section
    recommendSection: {
        marginBottom: 8,
    },
    aiRecommendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    aiRecommendBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    recommendScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    recommendCard: {
        width: CARD_WIDTH,
    },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    reasonText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8B5CF6',
        flex: 1,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: AppEco.textSecondary,
    },
    emptyRecommend: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyHint: {
        fontSize: 12,
        color: AppEco.textMuted,
        textAlign: 'center',
        marginTop: 4,
    },
});
