import type { Product, ProductVariant } from '@/api/product/product.type';
import { AppEco } from '@/constants/theme';
import { isLightFill, resolveSwatchFill } from '@/utils/product-color-swatch';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  qty: number;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
  onQtyChange: (qty: number) => void;
  embedded?: boolean;
};

export function ProductVariantPicker({
  product,
  selectedColor,
  selectedSize,
  qty,
  onColorChange,
  onSizeChange,
  onQtyChange,
  embedded = false,
}: Props) {
  const allColors = useMemo(
    () =>
      Array.from(
        new Set(product.variants?.map((v) => v.color).filter(Boolean) ?? []),
      ) as string[],
    [product.variants],
  );

  const allSizes = useMemo(
    () =>
      Array.from(
        new Set(product.variants?.map((v) => v.size).filter(Boolean) ?? []),
      ) as string[],
    [product.variants],
  );

  const variant = product.variants?.find(
    (v) => v.color === selectedColor && v.size === selectedSize,
  );

  if (!product.variants?.length) return null;

  const handleSelectColor = (color: string) => {
    onColorChange(color);
    const sizes = [
      ...new Set(
        product.variants
          ?.filter((v) => v.color === color && v.stock > 0)
          .map((v) => v.size)
          .filter(Boolean) ?? [],
      ),
    ];
    onSizeChange(sizes.length === 1 ? sizes[0] : '');
  };

  const handleSelectSize = (size: string) => {
    const ok = product.variants?.some(
      (v: ProductVariant) =>
        v.color === selectedColor && v.size === size && v.stock > 0,
    );
    if (!ok) return;
    onSizeChange(size);
  };

  return (
    <View style={[styles.root, embedded && styles.rootEmbedded]}>
      {!embedded && <Text style={styles.sectionTitle}>Phân loại</Text>}

      {allColors.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.label}>
            Màu sắc{selectedColor ? `: ${selectedColor}` : ''}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorList}
          >
            {allColors.map((color) => {
              const fill = resolveSwatchFill(color);
              const light = isLightFill(fill);
              const active = color === selectedColor;

              return (
                <TouchableOpacity
                  key={color}
                  style={[styles.swatch, active && styles.swatchActive]}
                  onPress={() => handleSelectColor(color)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: fill },
                      light && styles.colorDotLightBorder,
                    ]}
                  />
                  {active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={AppEco.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {allSizes.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.label}>
            Kích cỡ{selectedSize ? `: ${selectedSize}` : ''}
          </Text>
          <View style={styles.sizeWrap}>
            {allSizes.map((size) => {
              const avail =
                product.variants?.some(
                  (v) =>
                    v.color === selectedColor &&
                    v.size === size &&
                    v.stock > 0,
                ) ?? false;
              const active = size === selectedSize;

              return (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeChip,
                    active && styles.sizeChipActive,
                    !avail && styles.sizeChipDis,
                  ]}
                  disabled={!avail}
                  onPress={() => handleSelectSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      active && styles.sizeChipTextActive,
                      !avail && styles.sizeChipTextDis,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.qtyRow}>
        <View>
          <Text style={styles.label}>Số lượng</Text>
          <Text style={styles.stockHint}>
            {variant
              ? `Còn ${variant.stock} sản phẩm`
              : 'Chọn phân loại để xem tồn kho'}
          </Text>
        </View>
        <View style={styles.qtyCtrl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onQtyChange(Math.max(1, qty - 1))}
          >
            <Ionicons name="remove" size={18} color={AppEco.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onQtyChange(Math.min(variant?.stock ?? 99, qty + 1))}
          >
            <Ionicons name="add" size={18} color={AppEco.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: AppEco.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: AppEco.radiusMd,
    padding: 16,
    ...AppEco.shadowCard,
  },
  rootEmbedded: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    padding: 0,
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppEco.text,
    marginBottom: 14,
  },
  block: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppEco.textSecondary,
    marginBottom: 10,
  },
  colorList: { flexDirection: 'row', gap: 10 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: AppEco.radiusFull,
    borderWidth: 2,
    borderColor: AppEco.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
  },
  swatchActive: {
    borderColor: AppEco.primary,
    backgroundColor: AppEco.primaryMuted,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: AppEco.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  colorDotLightBorder: { borderColor: AppEco.textMuted },
  checkIcon: { position: 'absolute', bottom: -2, right: -2 },
  sizeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip: {
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: AppEco.radiusFull,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    backgroundColor: AppEco.surfaceMuted,
    alignItems: 'center',
  },
  sizeChipActive: {
    borderColor: AppEco.primary,
    backgroundColor: AppEco.primaryMuted,
  },
  sizeChipDis: { opacity: 0.35 },
  sizeChipText: { fontSize: 14, fontWeight: '600', color: AppEco.textSecondary },
  sizeChipTextActive: { color: AppEco.primaryDark, fontWeight: '800' },
  sizeChipTextDis: { color: AppEco.textMuted },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
    marginTop: 4,
    paddingTop: 16,
  },
  stockHint: {
    fontSize: 12,
    color: AppEco.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  qtyCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: AppEco.radiusFull,
    borderWidth: 1.5,
    borderColor: AppEco.border,
    overflow: 'hidden',
    backgroundColor: AppEco.surfaceMuted,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyVal: {
    fontSize: 16,
    fontWeight: '800',
    color: AppEco.text,
    minWidth: 40,
    textAlign: 'center',
  },
});
