import type { Product } from "@/api/product/product.type";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

const PRODUCT_CARD_IMAGE_HEIGHT = 200;
const PRODUCT_CARD_INFO_HEIGHT = 96;
const PRODUCT_CARD_HEIGHT =
  PRODUCT_CARD_IMAGE_HEIGHT + PRODUCT_CARD_INFO_HEIGHT;
const PRODUCT_NAME_LINES = 2;
const PRODUCT_NAME_LINE_HEIGHT = 22;
const PRODUCT_NAME_SLOT_HEIGHT = PRODUCT_NAME_LINES * PRODUCT_NAME_LINE_HEIGHT;

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

export type ProductItemProps = {
  product: Product;
  cardWidth: number;
  style?: ViewStyle;
};

export function ProductItem({ product, cardWidth, style }: ProductItemProps) {
  const [isLiked, setIsLiked] = useState(false);

  const originalPrice = product.variants?.[0]?.price ?? 0;
  const salePrice =
    product.sale != null && product.sale > 0
      ? originalPrice * (1 - product.sale / 100)
      : null;
  const image = product.images?.[0];

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
        onPress={() => router.push(`/product/${product._id}`)}
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
            <MaterialCommunityIcons name="truck-delivery" size={12} color="#67E8F9" />
            <Text style={styles.deliveryText}>1-3 ngày</Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        style={styles.likeBtn}
        onPress={() => setIsLiked(!isLiked)}
        hitSlop={8}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
      >
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={16}
          color={isLiked ? "#FF6B6B" : "#fff"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(103, 232, 249, 0.3)",
    shadowColor: "#67E8F9",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  likeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  nameSlot: {
    minHeight: PRODUCT_NAME_LINE_HEIGHT,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontWeight: "400",
    color: "#000000",
    textTransform: 'lowercase',
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  salePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#67E8F9",
    flexShrink: 1,
  },
  originalPrice: {
    fontSize: 14,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  normalPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#67E8F9",
    flexShrink: 1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  deliveryText: {
    fontSize: 11,
    color: '#67E8F9',
    fontWeight: '500',
  },
  priceRowNoMargin: {
    marginTop: 0,
  },
  deliveryRowNoMargin: {
    marginTop: 2,
  },
});