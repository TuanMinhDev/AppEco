import { useListProduct } from '@/api/product/product.api';
import { GetProductQuery } from '@/api/product/product.type';
import { useGetCurrentUser } from '@/api/user/user.api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
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

export default function SearchScreen() {
    const { q, sale } = useLocalSearchParams<{ q?: string; sale?: string }>();
    const methods = useForm<GetProductQuery>({
        defaultValues: {
            name: q || '',
            pageNumber: 1,
            pageSize: 20,
            minPrice: 0,
            maxPrice: 100000000,
        },
    });
    const { control, setValue, getValues } = methods;
    const [name, pageNumber, pageSize, minPrice, maxPrice] = useWatch({
        control,
        name: ['name', 'pageNumber', 'pageSize', 'minPrice', 'maxPrice'],
    });
    const [searchText, setSearchText] = useState(q || '');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');
    const [saleFilter, setSaleFilter] = useState<number | null>(sale ? parseInt(sale) : null);

    const { data: currentUser } = useGetCurrentUser();
    const { data: dataProduct } = useListProduct({ name, pageNumber, pageSize, minPrice, maxPrice });
    const products = dataProduct?.data?.products ?? [];

    // Filter products based on sale filter
    const filteredProducts = saleFilter !== null 
        ? products.filter((p: any) => p.sale === saleFilter)
        : products;

    useEffect(() => {
        if (q) {
            setSearchText(q);
            setValue('name', q);
        }
    }, [q, setValue]);

    useEffect(() => {
        // Nếu không có từ khóa tìm kiếm và không có sale filter, quay về trang home
        if (!searchText.trim() && saleFilter === null) {
            router.replace('/');
        }
    }, [searchText, saleFilter]);

    const handleSearch = (text: string) => {
        setSearchText(text);
        setValue('name', text);
    };

    const handleSearchSubmit = () => {
        if (searchText.trim()) {
            // Cập nhật URL với từ khóa tìm kiếm mới
            router.replace(`/(tabs)/search?q=${encodeURIComponent(searchText.trim())}`);
        }
    };

    const clearSaleFilter = () => {
        setSaleFilter(null);
        if (searchText.trim()) {
            router.replace(`/(tabs)/search?q=${encodeURIComponent(searchText.trim())}`);
        } else {
            router.replace('/');
        }
    };

    const openFilterModal = () => {
        setTempMinPrice(minPrice?.toString() || '');
        setTempMaxPrice(maxPrice?.toString() || '');
        setShowFilterModal(true);
    };

    const applyFilter = () => {
        const min = tempMinPrice ? parseInt(tempMinPrice) : 0;
        const max = tempMaxPrice ? parseInt(tempMaxPrice) : 100000000;
        setValue('minPrice', min);
        setValue('maxPrice', max);
        setShowFilterModal(false);
    };

    const clearFilter = () => {
        setTempMinPrice('');
        setTempMaxPrice('');
        setValue('minPrice', 0);
        setValue('maxPrice', 100000000);
        setShowFilterModal(false);
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
                            <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <View style={styles.searchBox}>
                                <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Tìm kiếm sản phẩm..."
                                    placeholderTextColor="#aaa"
                                    value={searchText}
                                    onChangeText={handleSearch}
                                    onSubmitEditing={handleSearchSubmit}
                                    returnKeyType="search"
                                    autoFocus={true}
                                />
                                {searchText.length > 0 && (
                                    <TouchableOpacity onPress={() => handleSearch('')}>
                                        <Ionicons name="close-circle" size={18} color="#aaa" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8} onPress={openFilterModal}>
                                <Ionicons name="options-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* ── Search Results Header ── */}
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                {saleFilter !== null 
                                    ? `Sản phẩm giảm ${saleFilter}%`
                                    : searchText.trim() 
                                        ? `Kết quả tìm kiếm: "${searchText}"`
                                        : 'Tìm kiếm sản phẩm'
                                }
                            </Text>
                            <Text style={styles.resultsCount}>
                                {filteredProducts.length} sản phẩm
                            </Text>
                            {saleFilter !== null && (
                                <TouchableOpacity style={styles.clearSaleFilterBtn} onPress={clearSaleFilter}>
                                    <Text style={styles.clearSaleFilterText}>Xóa bộ lọc</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── Products Grid ── */}
                        {filteredProducts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="shopping-outline" size={80} color="rgba(255,255,255,0.2)" />
                                <Text style={styles.emptyText}>
                                    {saleFilter !== null 
                                        ? `Không tìm thấy sản phẩm nào giảm ${saleFilter}%`
                                        : searchText.trim() 
                                            ? 'Không tìm thấy sản phẩm nào'
                                            : 'Nhập từ khóa để tìm kiếm'
                                    }
                                </Text>
                                {(searchText.trim() || saleFilter !== null) && (
                                    <TouchableOpacity style={styles.clearSearchBtn} onPress={() => {
                                        if (saleFilter !== null) {
                                            clearSaleFilter();
                                        } else {
                                            handleSearch('');
                                        }
                                    }}>
                                        <Text style={styles.clearSearchText}>
                                            {saleFilter !== null ? 'Xóa bộ lọc' : 'Xóa tìm kiếm'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.productsGrid}>
                                {filteredProducts.map((product: any) => (
                                    <ProductCard 
                                        key={product._id} 
                                        product={product} 
                                    />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Bộ lọc giá</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.modalContent}>
                        <Text style={styles.filterLabel}>Giá tối thiểu</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="0"
                            placeholderTextColor="#999"
                            value={tempMinPrice}
                            onChangeText={setTempMinPrice}
                            keyboardType="numeric"
                        />
                        
                        <Text style={[styles.filterLabel, { marginTop: 20 }]}>Giá tối đa</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="100000000"
                            placeholderTextColor="#999"
                            value={tempMaxPrice}
                            onChangeText={setTempMaxPrice}
                            keyboardType="numeric"
                        />
                    </View>
                    
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilter}>
                            <Text style={styles.clearBtnText}>Xóa bộ lọc</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                            <Text style={styles.applyBtnText}>Áp dụng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
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
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Results Header ──
    resultsHeader: {
        marginBottom: 16,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    resultsCount: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 8,
    },
    clearSaleFilterBtn: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignSelf: 'flex-start',
    },
    clearSaleFilterText: {
        color: '#FFD700',
        fontSize: 12,
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
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 16,
        textAlign: 'center',
    },
    clearSearchBtn: {
        backgroundColor: 'rgba(255,215,0,0.2)',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    clearSearchText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Filter Modal ──
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    filterInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    clearBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    clearBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    applyBtn: {
        flex: 1,
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
    },
});
