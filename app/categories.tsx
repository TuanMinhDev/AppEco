import { useCategories } from '@/api/category/category.api';
import type { Category } from '@/api/category/category.type';
import { productApis, productKey } from '@/api/product/product.api';
import type { Product } from '@/api/product/product.type';
import { ProductItem } from '@/components/commom/ProductItem';
import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - H_PAD * 2 - GAP) / 2;

function getProductCategoryId(raw: Product['categoryId']): string {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && '_id' in raw) {
        return String((raw as { _id: string })._id);
    }
    return '';
}

function CategoryChip({
    item,
    active,
    onPress,
}: {
    item: Category;
    active: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.categoryChip, active && styles.categoryChipActive]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <MaterialCommunityIcons
                name="tag-outline"
                size={16}
                color={active ? '#fff' : AppEco.primary}
            />
            <Text style={[styles.categoryChipLabel, active && styles.categoryChipLabelActive]} numberOfLines={1}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );
}

export default function CategoriesScreen() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        data: categories = [],
        isLoading: categoriesLoading,
        isError: categoriesError,
        refetch: refetchCategories,
        isRefetching: categoriesRefetching,
    } = useCategories();

    const selectedCategory = categories.find((c) => c._id === selectedId);

    const {
        data: productRes,
        isLoading: productsLoading,
        isFetching: productsFetching,
        refetch: refetchProducts,
    } = useQuery({
        queryKey: [productKey.LIST_PRODUCT, 'categories-all'],
        queryFn: () =>
            productApis.list({
                pageNumber: 1,
                pageSize: 500,
            }),
    });

    const allProducts = productRes?.data?.items ?? [];

    const products = useMemo(() => {
        if (!selectedId) return [];
        return allProducts.filter(
            (p) => getProductCategoryId(p.categoryId) === selectedId,
        );
    }, [allProducts, selectedId]);

    const totalItems = products.length;
    const refreshing = categoriesRefetching || productsFetching;

    const onRefresh = useCallback(() => {
        void refetchCategories();
        void refetchProducts();
    }, [refetchCategories, refetchProducts]);

    const listHeader = (
        <View style={styles.headerBlock}>
            <Text style={styles.sectionLabel}>Chọn thể loại</Text>

            {categoriesLoading ? (
                <View style={styles.inlineLoader}>
                    <ActivityIndicator color={AppEco.primary} />
                    <Text style={styles.inlineLoaderText}>Đang tải thể loại...</Text>
                </View>
            ) : categoriesError ? (
                <View style={styles.emptyBlock}>
                    <Text style={styles.emptyText}>Không tải được danh sách thể loại.</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => void refetchCategories()}>
                        <Text style={styles.retryBtnText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : categories.length === 0 ? (
                <View style={styles.emptyBlock}>
                    <MaterialCommunityIcons name="shape-outline" size={48} color={AppEco.border} />
                    <Text style={styles.emptyText}>Chưa có thể loại nào</Text>
                </View>
            ) : (
                <View style={styles.categoryGrid}>
                    {categories.map((cat) => (
                        <CategoryChip
                            key={cat._id}
                            item={cat}
                            active={selectedId === cat._id}
                            onPress={() => setSelectedId(cat._id)}
                        />
                    ))}
                </View>
            )}

            {selectedCategory ? (
                <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>{selectedCategory.name}</Text>
                    <Text style={styles.resultsCount}>
                        {productsLoading
                            ? 'Đang tải...'
                            : `${totalItems} sản phẩm`}
                    </Text>
                </View>
            ) : (
                <Text style={styles.hintText}>Bấm thể loại để xem sản phẩm</Text>
            )}
        </View>
    );

    const renderEmpty = () => {
        if (!selectedId) return null;
        if (productsLoading) {
            return (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={AppEco.primary} />
                </View>
            );
        }
        return (
            <View style={styles.emptyBlock}>
                <MaterialCommunityIcons name="shopping-outline" size={56} color={AppEco.border} />
                <Text style={styles.emptyText}>Chưa có sản phẩm trong thể loại này</Text>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <SafeAreaView edges={['top']} style={styles.topBar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={22} color={AppEco.text} />
                </TouchableOpacity>
                <Text style={styles.topTitle} numberOfLines={1}>
                    Thể loại
                </Text>
                <View style={styles.iconBtn} />
            </SafeAreaView>

            <FlatList
                data={selectedId ? products : []}
                numColumns={2}
                key="grid"
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item }: { item: Product }) => (
                    <ProductItem product={item} cardWidth={CARD_WIDTH} style={styles.productCard} />
                )}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={AppEco.primary}
                        colors={[AppEco.primary]}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: AppEco.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: H_PAD,
        paddingBottom: 8,
        gap: 8,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: AppEco.text,
        textAlign: 'center',
    },
    listContent: {
        paddingHorizontal: H_PAD,
        paddingBottom: 32,
        flexGrow: 1,
    },
    headerBlock: {
        paddingBottom: 8,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: AppEco.success,
        marginBottom: 12,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: AppEco.surface,
        borderWidth: 1,
        borderColor: AppEco.border,
        maxWidth: '100%',
    },
    categoryChipActive: {
        backgroundColor: AppEco.primary,
        borderColor: AppEco.primary,
    },
    categoryChipLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: AppEco.textSecondary,
        flexShrink: 1,
    },
    categoryChipLabelActive: {
        color: '#fff',
    },
    hintText: {
        fontSize: 14,
        color: AppEco.textMuted,
        marginBottom: 8,
    },
    resultsHeader: {
        marginBottom: 12,
    },
    resultsTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: AppEco.text,
        marginBottom: 4,
    },
    resultsCount: {
        fontSize: 13,
        color: AppEco.textSecondary,
    },
    productRow: {
        justifyContent: 'space-between',
        gap: GAP,
    },
    productCard: {
        marginBottom: GAP,
    },
    inlineLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 24,
    },
    inlineLoaderText: {
        fontSize: 14,
        color: AppEco.textSecondary,
    },
    loaderWrap: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyBlock: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        color: AppEco.textSecondary,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 4,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: AppEco.primaryMuted,
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: AppEco.primary,
    },
});
