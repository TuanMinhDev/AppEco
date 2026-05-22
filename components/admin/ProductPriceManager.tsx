import type { ProductVariant } from '@/api/product/product.type';
import { AppInput } from '@/components/app-input';
import { useToast } from '@/components/toast/ToastProvider';
import { AppEco } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Control,
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export type ProductAttribute = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariantForm = ProductVariant;

export type ProductPriceFormSlice = {
  attributes: ProductAttribute[];
  variants: ProductVariantForm[];
};

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (!arrays.length) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}

export function generateVariantsFromAttributes(
  attributes: ProductAttribute[],
): ProductVariantForm[] {
  const valid = attributes.filter(
    (a) => a.name.trim() && a.values.some((v) => v.trim()),
  );
  if (!valid.length) return [];

  const combos = cartesian(valid.map((a) => a.values.filter((v) => v.trim())));
  return combos.map((combo) => ({
    color: combo[0]?.trim() ?? '',
    size:
      combo.length > 1
        ? combo
            .slice(1)
            .map((v) => v.trim())
            .join(' / ')
        : 'Mặc định',
    stock: 0,
    sold: 0,
    price: 0,
  }));
}

export function mergeVariantsByKey(
  existing: ProductVariantForm[],
  generated: ProductVariantForm[],
): ProductVariantForm[] {
  return generated.map((g) => {
    const match = existing.find(
      (e) => e.color === g.color && e.size === g.size,
    );
    if (!match) return g;
    return {
      ...g,
      stock: match.stock,
      sold: match.sold,
      price: match.price,
    };
  });
}

export function inferAttributesFromVariants(
  variants: ProductVariant[],
): ProductAttribute[] {
  const colors = [
    ...new Set(variants.map((v) => v.color.trim()).filter(Boolean)),
  ];
  const sizes = [...new Set(variants.map((v) => v.size.trim()).filter(Boolean))];
  const attrs: ProductAttribute[] = [];
  if (colors.length) {
    attrs.push({ id: uid(), name: 'Màu sắc', values: colors });
  }
  if (sizes.length && !(sizes.length === 1 && sizes[0] === 'Mặc định')) {
    attrs.push({ id: uid(), name: 'Kích cỡ', values: sizes });
  }
  return attrs;
}

function formatVnd(value: number) {
  if (!value || Number.isNaN(value)) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
}

function variantTitle(index: number, variant: ProductVariantForm) {
  const parts = [variant.color, variant.size !== 'Mặc định' ? variant.size : '']
    .filter(Boolean)
    .join(', ');
  return `Biến thể ${index + 1}${parts ? `: ${parts}` : ''}`;
}

const viTextInputProps = {
  autoCorrect: false,
  spellCheck: false,
  autoCapitalize: 'none' as const,
};

function AttributeCard({
  index,
  control,
  onRemove,
}: {
  index: number;
  control: Control<ProductPriceFormSlice>;
  onRemove: () => void;
}) {
  const { setValue } = useFormContext<ProductPriceFormSlice>();
  const toast = useToast();
  const values = useWatch({ control, name: `attributes.${index}.values` }) ?? [];
  const [draftValue, setDraftValue] = useState('');

  const removeValue = (valueIndex: number) => {
    const next = [...values];
    next.splice(valueIndex, 1);
    setValue(`attributes.${index}.values`, next, { shouldDirty: true });
  };

  const addValue = () => {
    const v = draftValue.trim();
    if (!v) return;
    if (values.includes(v)) {
      toast.showError('Giá trị này đã tồn tại.');
      return;
    }
    setValue(`attributes.${index}.values`, [...values, v], { shouldDirty: true });
    setDraftValue('');
  };

  return (
    <View style={styles.attrCard}>
      <View style={styles.attrTop}>
        <Ionicons name="reorder-three" size={22} color={AppEco.textMuted} />
        <Controller
          control={control}
          name={`attributes.${index}.name`}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.attrNameInput}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Tên thuộc tính (VD: Màu sắc)"
              placeholderTextColor={AppEco.textMuted}
              {...viTextInputProps}
            />
          )}
        />
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={20} color={AppEco.danger} />
        </TouchableOpacity>
      </View>

      <Text style={styles.attrValuesLabel}>Giá trị thuộc tính:</Text>

      <View style={styles.chipRow}>
        {values.map((val, vi) => (
          <View key={`${val}-${vi}`} style={styles.chip}>
            <Text style={styles.chipText}>{val}</Text>
            <TouchableOpacity onPress={() => removeValue(vi)} hitSlop={6}>
              <Ionicons name="trash-outline" size={14} color={AppEco.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.addValueRow}>
        <TextInput
          style={styles.addValueInput}
          value={draftValue}
          onChangeText={setDraftValue}
          placeholder="Nhập giá trị (VD: Xanh, Nâu...)"
          placeholderTextColor={AppEco.textMuted}
          returnKeyType="done"
          onSubmitEditing={addValue}
          {...viTextInputProps}
        />
        <TouchableOpacity style={styles.addValueBtn} onPress={addValue}>
          <Text style={styles.addValueBtnText}>Thêm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VariantCard({
  index,
  control,
  expanded,
  onToggle,
  onRemove,
  canRemove,
}: {
  index: number;
  control: Control<ProductPriceFormSlice>;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const variant = useWatch({ control, name: `variants.${index}` });

  return (
    <View style={styles.variantCard}>
      <TouchableOpacity style={styles.variantHeader} onPress={onToggle}>
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={AppEco.textSecondary}
        />
        <View style={styles.variantHeaderText}>
          <Text style={styles.variantTitle}>
            {variantTitle(
              index,
              variant ?? { color: '', size: '', stock: 0, sold: 0, price: 0 },
            )}
          </Text>
          {!expanded && (
            <Text style={styles.variantSummary}>
              Giá: {formatVnd(Number(variant?.price))} | Kho: {variant?.stock ?? 0}
            </Text>
          )}
        </View>
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={AppEco.danger} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.variantBody}>
          <AppInput
            label="Màu / Thuộc tính 1"
            name={`variants.${index}.color`}
            control={control}
            rules={{ required: 'Bắt buộc' }}
            placeholder="VD: Xanh"
            autoCorrect={false}
            spellCheck={false}
          />
          <AppInput
            label="Size / Thuộc tính 2"
            name={`variants.${index}.size`}
            control={control}
            rules={{ required: 'Bắt buộc' }}
            placeholder="VD: M, L..."
            autoCorrect={false}
            spellCheck={false}
          />
          <AppInput
            label="Tồn kho"
            name={`variants.${index}.stock`}
            control={control}
            rules={{ required: 'Bắt buộc' }}
            keyboardType="number-pad"
          />
          <AppInput
            label="Giá gốc (VNĐ)"
            name={`variants.${index}.price`}
            control={control}
            rules={{ required: 'Bắt buộc' }}
            keyboardType="number-pad"
            placeholder="VD: 410200"
          />
        </View>
      )}
    </View>
  );
}

export function ProductPriceManager() {
  const { control, getValues, setValue } =
    useFormContext<ProductPriceFormSlice>();
  const toast = useToast();

  const {
    fields: attrFields,
    append: appendAttr,
    remove: removeAttr,
  } = useFieldArray({ control, name: 'attributes' });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
    replace: replaceVariants,
  } = useFieldArray({ control, name: 'variants' });

  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const allExpanded =
    variantFields.length > 0 &&
    variantFields.every((_, i) => expandedSet.has(i));

  const toggleVariant = useCallback((index: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleAllVariants = () => {
    if (allExpanded) {
      setExpandedSet(new Set());
      return;
    }
    setExpandedSet(new Set(variantFields.map((_, i) => i)));
  };

  const handleAutoGenerate = () => {
    const attrs = getValues('attributes');
    const existing = getValues('variants');
    const generated = generateVariantsFromAttributes(attrs);
    if (!generated.length) {
      toast.showError(
        'Thêm ít nhất một thuộc tính có tên và giá trị trước khi tự động tạo biến thể.',
      );
      return;
    }
    const merged = mergeVariantsByKey(existing, generated);
    replaceVariants(merged);
    setExpandedSet(new Set());
  };

  const handleAddVariant = () => {
    const nextIndex = variantFields.length;
    appendVariant({
      color: '',
      size: '',
      stock: 0,
      sold: 0,
      price: 0,
    });
    setExpandedSet((prev) => new Set(prev).add(nextIndex));
  };

  const handleAddAttribute = () => {
    appendAttr({ id: uid(), name: '', values: [] });
  };

  return (
    <View style={styles.root}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Thuộc tính sản phẩm</Text>
        <TouchableOpacity style={styles.linkBtn} onPress={handleAddAttribute}>
          <Text style={styles.linkBtnText}>+ Thêm thuộc tính</Text>
        </TouchableOpacity>
      </View>

      {attrFields.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            Thêm thuộc tính (màu sắc, kích cỡ...) để tự động tạo biến thể.
          </Text>
        </View>
      ) : (
        attrFields.map((field, index) => (
          <AttributeCard
            key={field.id}
            index={index}
            control={control}
            onRemove={() => removeAttr(index)}
          />
        ))
      )}

      <View style={styles.variantSection}>
        <Text style={styles.sectionTitle}>Biến thể sản phẩm</Text>
        <Text style={styles.sectionDesc}>
          Tạo các biến thể với giá gốc và tồn kho. Mỗi biến thể phải chọn đầy đủ
          giá trị từ các thuộc tính.
        </Text>

        <View style={styles.variantActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={toggleAllVariants}>
            <Ionicons
              name={allExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={AppEco.primary}
            />
            <Text style={styles.secondaryBtnText}>
              {allExpanded ? 'Ẩn tất cả' : 'Mở tất cả'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleAutoGenerate}>
            <Text style={styles.secondaryBtnText}>Tự động tạo từ thuộc tính</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryOutlineBtn} onPress={handleAddVariant}>
            <Ionicons name="add" size={18} color={AppEco.primary} />
            <Text style={styles.primaryOutlineText}>Thêm biến thể</Text>
          </TouchableOpacity>
        </View>

        {variantFields.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Chưa có biến thể. Tự động tạo từ thuộc tính hoặc thêm thủ công.
            </Text>
          </View>
        ) : (
          variantFields.map((field, index) => (
            <VariantCard
              key={field.id}
              index={index}
              control={control}
              expanded={expandedSet.has(index)}
              onToggle={() => toggleVariant(index)}
              onRemove={() => removeVariant(index)}
              canRemove={variantFields.length > 1}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppEco.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: AppEco.textSecondary,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  linkBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  linkBtnText: {
    color: AppEco.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  attrCard: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: AppEco.border,
    padding: 12,
    marginBottom: 4,
    ...AppEco.shadowCard,
  },
  attrTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  attrNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: AppEco.text,
    borderWidth: 1,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppEco.surfaceMuted,
  },
  attrValuesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppEco.textSecondary,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppEco.radiusSm,
    borderWidth: 1,
    borderColor: AppEco.border,
    backgroundColor: AppEco.surfaceMuted,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: AppEco.text },
  addValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addValueInput: {
    flex: 1,
    fontSize: 15,
    color: AppEco.text,
    borderWidth: 1,
    borderColor: AppEco.border,
    borderRadius: AppEco.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: AppEco.surfaceMuted,
  },
  addValueBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.primaryMuted,
    borderWidth: 1,
    borderColor: AppEco.primary,
  },
  addValueBtnText: {
    color: AppEco.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  variantSection: { marginTop: 8 },
  variantActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppEco.radiusSm,
    borderWidth: 1,
    borderColor: AppEco.border,
    backgroundColor: AppEco.surfaceMuted,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppEco.primary,
  },
  primaryOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: AppEco.radiusSm,
    borderWidth: 1,
    borderColor: AppEco.primary,
    backgroundColor: AppEco.primaryMuted,
  },
  primaryOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppEco.primary,
  },
  variantCard: {
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: AppEco.border,
    marginBottom: 10,
    overflow: 'hidden',
    ...AppEco.shadowCard,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  variantHeaderText: { flex: 1 },
  variantTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppEco.text,
  },
  variantSummary: {
    fontSize: 12,
    color: AppEco.textMuted,
    marginTop: 4,
  },
  variantBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
    paddingTop: 12,
    gap: 4,
  },
  emptyBox: {
    padding: 16,
    borderRadius: AppEco.radiusMd,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    borderStyle: 'dashed',
    backgroundColor: AppEco.surfaceMuted,
  },
  emptyText: {
    fontSize: 13,
    color: AppEco.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
