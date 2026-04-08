import { useListProduct } from '@/api/product/product.api';
import { GetProductQuery } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { ProductItem } from '@/components/commom/ProductItem';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
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

const CATEGORIES = [
    { id: '2', label: 'Hot Sale', icon: 'fire' as const },
    { id: '3', label: 'Mới nhất', icon: 'star-outline' as const },
    { id: '4', label: 'Yêu thích', icon: 'heart' as const },
    { id: '5', label: 'Người theo dõi', icon: 'account-multiple' as const },
];

const BANNERS = [
    {
        id: '1',
        gradient: ['#11998e', '#38ef7d'] as const,
        discount: '30%',
        sub: 'Hàng mới về mỗi ngày',
        code: 'FRESH30',
        emoji: '🌿',
    },
    {
        id: '2',
        gradient: ['#FC466B', '#3F5EFB'] as const,
        discount: '50%',
        sub: 'Độc quyền hôm nay',
        code: 'EXCLUSIVE50',
        emoji: '🔥',
    },
    {
        id: '3',
        gradient: ['#FDBB2D', '#22C1C3'] as const,
        discount: '25%',
        sub: 'Siêu tiết kiệm',
        code: 'SAVE25',
        emoji: '💎',
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
    
    const [activeCat, setActiveCat] = useState('2');
    const [currentAutoBannerIndex, setCurrentAutoBannerIndex] = useState(0);
    const autoBannerRef = useRef<FlatList>(null);

    const { data: currentUser } = useGetCurrentUser();
    const { data: dataProduct } = useListProduct();
    const products = dataProduct?.data?.items ?? [];

    const filteredProducts = products;

   
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAutoBannerIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % BANNERS.length;
                autoBannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 4000); 

        return () => clearInterval(interval);
    }, []);



    const handleBannerPress = (discount: string) => {
        const percentage = parseInt(discount.replace('%', ''));
        router.push(`/(tabs)/search?sale=${percentage}`);
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
                                    <FontAwesome name="user" size={20} color="#0EA5E9" />
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.welcomeText}>Xin chào,</Text>
                                    <Text style={styles.userName}>{currentUser?.name ?? 'Guest'}</Text>
                                </View>
                            </View>
                            
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <TouchableOpacity 
                                style={styles.searchInputWrapper}
                                onPress={() => router.push('/(tabs)/search')}
                            >
                                <Ionicons name="search" size={20} color="#0EA5E9" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Tìm kiếm sản phẩm"
                                    placeholderTextColor="#9CA3AF"
                                    value=""
                                    editable={false}
                                    pointerEvents="none"
                                />
                            </TouchableOpacity>
                            
                        </View>
                    </View>
                    <FlatList
                        data={[{ type: 'categories' }, { type: 'autobanner' }, { type: 'banner' }, { type: 'products' }]}
                        renderItem={({ item }) => {
                            if (item.type === 'categories') {
                                return (
                                    <View style={[styles.categoriesSection, styles.sectionCard]}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.categoriesList}
                                        >
                                            {CATEGORIES.map((cat) => {
                                                const active = cat.id === activeCat;
                                                return (
                                                    <View
                                                        key={cat.id}
                                                        style={[styles.categoryCard, active && styles.categoryCardActive]}
                                                    >
                                                        <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                                                            <MaterialCommunityIcons
                                                                name={cat.icon}
                                                                size={24}
                                                                color={active ? '#fff' : '#0EA5E9'}
                                                            />
                                                        </View>
                                                        <Text style={[styles.categoryName, active && styles.categoryNameActive]}>
                                                            {cat.label}
                                                        </Text>
                                                    </View>
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
                                            keyExtractor={(item) => item.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    style={styles.autoBannerItem}
                                                    onPress={() => handleBannerPress(item.discount)}
                                                    activeOpacity={0.9}
                                                >
                                                    <LinearGradient
                                                        colors={item.gradient}
                                                        style={styles.autoBannerGradient}
                                                    >
                                                        <View style={styles.autoBannerContent}>
                                                            <Text style={styles.autoBannerEmoji}>{item.emoji}</Text>
                                                            <Text style={styles.autoBannerDiscount}>{item.discount}</Text>
                                                            <Text style={styles.autoBannerSub}>{item.sub}</Text>
                                                            <View style={styles.autoBannerCodeWrapper}>
                                                                <Text style={styles.autoBannerCode}>{item.code}</Text>
                                                            </View>
                                                        </View>
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            )}
                                            onMomentumScrollEnd={(event) => {
                                                const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                                                setCurrentAutoBannerIndex(index);
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

                            

                            return (
                                <View style={styles.productsSection}>
                                    {filteredProducts.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <MaterialCommunityIcons name="shopping-outline" size={60} color="rgba(255,255,255,0.2)" />
                                            <Text style={styles.emptyText}>No products found</Text>
                                        </View>
                                    ) : (
                                        <FlatList
                                            data={filteredProducts.slice(0, 6)}
                                            numColumns={2}
                                            columnWrapperStyle={styles.productRow}
                                            renderItem={({ item: product, index }) => (
                                                <ProductItem
                                                    product={product}
                                                    cardWidth={CARD_WIDTH}
                                                    style={{ marginBottom: 12 }}
                                                />
                                            )}
                                            keyExtractor={(item) => item._id}
                                            scrollEnabled={false}
                                        />
                                    )}
                                </View>
                            );
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
        backgroundColor: '#F0F9FF',
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
        backgroundColor: 'rgba(103, 232, 249, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(103, 232, 249, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
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
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        marginRight: 8,
        color: '#6B7280',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    clearBtn: {
        marginLeft: 8,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },

    // Main Content
    mainContent: {
        paddingHorizontal: 0,
        paddingBottom: 32,
        backgroundColor: '#F0F9FF',
        gap: 16,
    },

    // Section Card
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(103, 232, 249, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    // Categories Section
    categoriesSection: {
        marginBottom: 0,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0EA5E9',
        marginBottom: 16,
    },
    categoriesList: {
        gap: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    categoryCard: {
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        flex: 1,
        minWidth: 0,
    },
    categoryCardActive: {
        backgroundColor: '#0EA5E9',
        borderColor: '#0EA5E9',
    },
    categoryIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIconActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    categoryName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    categoryNameActive: {
        color: '#fff',
        fontWeight: '700',
    },

    // Auto-scroll Banner Section
    autoBannerSection: {
        marginBottom: 0,
    },
    autoBannerItem: {
        width: SCREEN_WIDTH - 32,
        marginHorizontal: 16,
    },
    autoBannerGradient: {
        borderRadius: 20,
        padding: 20,
        minHeight: 140,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    autoBannerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    autoBannerEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    autoBannerDiscount: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    autoBannerSub: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
        textAlign: 'center',
    },
    autoBannerCodeWrapper: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    autoBannerCode: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
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
        backgroundColor: '#BAE6FD',
    },
    autoBannerDotActive: {
        backgroundColor: '#0EA5E9',
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
        color: '#0EA5E9',
    },

    // Products Section
    productsSection: {
        marginBottom: 0,
    },
    productCardWrapper: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(103, 232, 249, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
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
        marginTop: -12,
    },
    seeAllText: {
        fontSize: 14,
        color: '#0EA5E9',
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
        gap: 12,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 14,
    },
});
