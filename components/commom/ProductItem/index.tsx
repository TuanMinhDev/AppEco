import type { Product } from "@/api/product/product.type";
import {
  useFavoritesList,
  useToggleProductFavorite,
} from "@/api/favorite/favorite.api";
import { useGetCurrentUser } from "@/api/user/user.api";
import { useToast } from "@/components/toast/ToastProvider";
import { AppEco } from "@/constants/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { getApiErrorMessage } from "@/utils/api-error-message";

const PRODUCT_CARD_IMAGE_HEIGHT = 200;
const PRODUCT_NAME_LINES = 2;
const PRODUCT_NAME_LINE_HEIGHT = 22;

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + "đ";
}

export type ProductItemProps = {
  product: Product;
  cardWidth: number;
  style?: ViewStyle;
};

export function ProductItem({ product, cardWidth, style }: ProductItemProps) {
  const toast = useToast();
  const { data: me, isSuccess: meOk } = useGetCurrentUser();
  const isLoggedIn = meOk && !!me?._id;
  const { data: favRes, isLoading: favListLoading } = useFavoritesList(isLoggedIn);
  const { mutate: toggleFavorite, isPending: favMutating } = useToggleProductFavorite();

  const isFavorite = useMemo(() => {
    if (!isLoggedIn) return false;
    const list = favRes?.favorites ?? [];
    return list.some((p) => p._id === product._id);
  }, [isLoggedIn, favRes?.favorites, product._id]);

  const handleLikePress = useCallback(() => {
    const pid = product._id;
    if (!pid) return;
    if (!isLoggedIn) {
      const path = `/(auth)/login?redirect=${encodeURIComponent(`/product/${pid}`)}`;
      router.push(path as Href);
      return;
    }
    if (favListLoading || favMutating) return;
    toggleFavorite(
      { productId: pid, remove: isFavorite },
      {
        onError: (e: unknown) => {
          toast.showError(
            getApiErrorMessage(
              e,
              isFavorite ? "Không thể bỏ yêu thích." : "Không thể thêm yêu thích."
            )
          );
        },
      }
    );
  }, [
    product._id,
    isLoggedIn,
    favListLoading,
    favMutating,
    isFavorite,
    toggleFavorite,
  ]);

  const originalPrice = product.variants?.[0]?.price ?? 0;
  const salePrice =
    product.sale != null && product.sale > 0
      ? originalPrice * (1 - product.sale / 100)
      : null;
  const image = product.images?.[0];

  const likeLabel = isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích";

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
        onPress={() => router.push(`/product/${product._id}` as Href)}
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

      <Pressable
        style={styles.likeBtn}
        onPress={handleLikePress}
        disabled={isLoggedIn && (favListLoading || favMutating)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${likeLabel}, ${product.name}`}
        android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
      >
        {isLoggedIn && (favListLoading || favMutating) ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={16}
            color={isFavorite ? AppEco.sale : "#fff"}
          />
        )}
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
