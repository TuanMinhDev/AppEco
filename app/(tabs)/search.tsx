import { useListProduct } from '@/api/product/product.api';
import { GetProductQuery } from '@/api/product/product.type';
import { AppInput } from '@/components/app-input';
import { ProductItem } from '@/components/commom/ProductItem';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import {
    Dimensions,
    Platform,
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
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

export default function SearchScreen() {
    const searchInputRef = useRef<TextInput>(null);
    const methods = useForm<GetProductQuery>({
        defaultValues: {
            name: '',
            pageNumber: 1,
            pageSize: 20,
            minPrice: 0,
            maxPrice: 100000000,
        },
    });
    const { control } = methods;
    const [name, pageNumber, pageSize, minPrice, maxPrice] = useWatch({
        control,
        name: ['name', 'pageNumber', 'pageSize', 'minPrice', 'maxPrice'],
    });

    const { data: dataProduct } = useListProduct({ name, pageNumber, pageSize, minPrice, maxPrice });
    const products = dataProduct?.data?.items ?? [];

    return (
        <FormProvider {...methods}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} activeOpacity={0.8} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#6B7280" />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                name="name"
                                control={control}
                                placeholder="Tìm kiếm sản phẩm..."
                                returnKeyType="search"
                                style={styles.searchInput}
                            />
                        </View>
                    </View>

                    {/* ── Search Results Header ── */}
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsTitle}>
                            {name?.trim() ? `Kết quả tìm kiếm: "${name}"` : 'Tìm kiếm sản phẩm'}
                        </Text>
                        <Text style={styles.resultsCount}>
                            {products.length} sản phẩm
                        </Text>
                    </View>

                    {/* ── Products Grid ── */}
                    {products.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="shopping-outline" size={80} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyText}>
                                {name?.trim() ? 'Không tìm thấy sản phẩm nào' : 'Nhập từ khóa để tìm kiếm'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.productsGrid}>
                            {products.map((product: any) => (
                                <ProductItem
                                    key={product._id}
                                    product={product}
                                    cardWidth={CARD_WIDTH}
                                />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </FormProvider>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 13 : 9,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },

    // ── Results Header ──
    resultsHeader: {
        marginBottom: 16,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    resultsCount: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },

    // ── Products Grid ──
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    // ── Empty State ──
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
        textAlign: 'center',
    },
    clearSearchBtn: {
        backgroundColor: 'rgba(59,130,246,0.1)',
        borderWidth: 1,
        borderColor: '#0EA5E9',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    clearSearchText: {
        color: '#0EA5E9',
        fontSize: 14,
        fontWeight: '600',
    },
});
