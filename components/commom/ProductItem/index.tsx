import type { Product, ProductViewSource } from "@/api/product/product.type";
import { AppEco } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

const PRODUCT_CARD_IMAGE_HEIGHT = 200;
const PRODUCT_NAME_LINES = 2;
const PRODUCT_NAME_LINE_HEIGHT = 22;

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

function getProductBasePrice(product: Product): number {
  const prices =
    product.variants?.map((v) => v.price).filter((p) => typeof p === "number" && p > 0) ??
    [];
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export type ProductItemProps = {
  product: Product;
  cardWidth: number;
  style?: ViewStyle;
  /** Gửi lên POST /product/:id/view qua query ?from= */
  viewFrom?: Extract<ProductViewSource, 'search' | 'recommend'>;
};

export function ProductItem({
  product,
  cardWidth,
  style,
  viewFrom,
}: ProductItemProps): React.JSX.Element {
  const originalPrice = getProductBasePrice(product);
  const salePrice =
    product.sale != null && product.sale > 0
      ? originalPrice * (1 - product.sale / 100)
      : null;
  const image = product.images?.[0];

  const productHref = viewFrom
    ? (`/product/${product._id}?from=${viewFrom}` as Href)
    : (`/product/${product._id}` as Href);

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
        },
        style,
      ]}
    >
      <Pressable
        style={styles.cardPressable}
        onPress={() => router.push(productHref)}
        android_ripple={{ color: "rgba(255,255,255,0.12)" }}
      >
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={24}
                color="rgba(255,255,255,0.2)"
              />
            </View>
          )}
          {product.sale != null && product.sale > 0 && (
            <View style={styles.saleBadge} pointerEvents="none">
              <Text style={styles.saleBadgeText}>-{product.sale}%</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <View style={styles.nameSlot}>
            <Text
              style={styles.productName}
              numberOfLines={PRODUCT_NAME_LINES}
              ellipsizeMode="tail"
            >
              {product.name}
            </Text>
          </View>
          <View style={styles.priceRow}>
            {salePrice != null ? (
              <>
                <Text style={styles.salePrice} numberOfLines={1}>
                  {formatPrice(salePrice)}
                </Text>
                <Text style={styles.originalPrice} numberOfLines={1}>
                  {formatPrice(originalPrice)}
                </Text>
              </>
            ) : (
              <Text style={styles.normalPrice} numberOfLines={1}>
                {formatPrice(originalPrice)}
              </Text>
            )}
          </View>
          <View style={styles.deliveryRow}>
            <MaterialCommunityIcons name="truck-delivery" size={12} color={AppEco.primaryLight} />
            <Text style={styles.deliveryText}>1-3 ngày</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  cardPressable: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: PRODUCT_CARD_IMAGE_HEIGHT,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  saleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: AppEco.sale,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  info: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  nameSlot: {
    minHeight: PRODUCT_NAME_LINE_HEIGHT * PRODUCT_NAME_LINES,
    justifyContent: "flex-start",
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: AppEco.text,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  salePrice: {
    fontSize: 15,
    fontWeight: "700",
    color: AppEco.primary,
    flexShrink: 1,
  },
  originalPrice: {
    fontSize: 13,
    color: AppEco.textMuted,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  normalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: AppEco.primary,
    flexShrink: 1,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: AppEco.primaryLight,
    fontWeight: "600",
  },
});
