import { AppEco } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';

const { width: SW } = Dimensions.get('window');
const H_PAD = 16;
const IMAGE_INNER = SW - H_PAD * 2;
const THUMB_SIZE = 56;
const THUMB_GAP = 10;

/** Chiều cao vùng ảnh chính (vuông, có padding hai bên) */
export const PRODUCT_IMAGE_HEIGHT = IMAGE_INNER + 24;
/** Chiều cao dải thumbnail */
export const GALLERY_THUMB_HEIGHT = THUMB_SIZE + 28;
/** Tổng chiều cao block gallery */
export const GALLERY_TOTAL_HEIGHT = PRODUCT_IMAGE_HEIGHT + GALLERY_THUMB_HEIGHT;

type Props = {
  images: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  /** Khoảng trống phía trên — hiện nền AppEco.background, tránh dính status bar */
  topInset?: number;
};

export function ProductDetailGallery({
  images,
  activeIndex,
  onIndexChange,
  topInset = 0,
}: Props) {
  const carouselRef = useRef<GHScrollView>(null);
  const thumbRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    carouselRef.current?.scrollTo({ x: activeIndex * SW, animated: true });
    const thumbOffset = Math.max(
      0,
      activeIndex * (THUMB_SIZE + THUMB_GAP) - SW / 2 + THUMB_SIZE / 2 + H_PAD,
    );
    thumbRef.current?.scrollTo({ x: thumbOffset, animated: true });
  }, [activeIndex, images.length]);

  const selectIndex = (index: number) => {
    onIndexChange(index);
    carouselRef.current?.scrollTo({ x: index * SW, animated: true });
  };

  return (
    <View style={[styles.wrap, { paddingTop: topInset }]}>
      <View style={styles.mainArea}>
        <GHScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SW);
            onIndexChange(Math.max(0, Math.min(index, Math.max(0, images.length - 1))));
          }}
        >
          {images.length > 0 ? (
            images.map((img, i) => (
              <View key={`${img}-${i}`} style={styles.slide}>
                <View style={styles.imageFrame}>
                  <Image source={{ uri: img }} style={styles.image} resizeMode="contain" />
                </View>
              </View>
            ))
          ) : (
            <View style={styles.slide}>
              <View style={[styles.imageFrame, styles.placeholder]}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={48}
                  color={AppEco.textMuted}
                />
                <Text style={styles.placeholderText}>Chưa có hình ảnh</Text>
              </View>
            </View>
          )}
        </GHScrollView>

        {images.length > 1 && (
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        )}
      </View>

      {images.length > 1 && (
        <ScrollView
          ref={thumbRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbContent}
          style={styles.thumbScroll}
        >
          {images.map((img, i) => (
            <Pressable
              key={`thumb-${img}-${i}`}
              onPress={() => selectIndex(i)}
              style={[styles.thumb, i === activeIndex && styles.thumbActive]}
            >
              <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: AppEco.background,
  },
  mainArea: {
    height: PRODUCT_IMAGE_HEIGHT,
    position: 'relative',
  },
  carousel: {
    width: SW,
    height: PRODUCT_IMAGE_HEIGHT,
    flexGrow: 0,
  },
  slide: {
    width: SW,
    height: PRODUCT_IMAGE_HEIGHT,
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFrame: {
    width: IMAGE_INNER,
    height: IMAGE_INNER,
    borderRadius: AppEco.radiusMd,
    backgroundColor: AppEco.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: AppEco.surface,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppEco.surfaceMuted,
  },
  placeholderText: {
    color: AppEco.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  counterPill: {
    position: 'absolute',
    bottom: 8,
    right: H_PAD + 4,
    backgroundColor: 'rgba(19, 78, 74, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: AppEco.radiusFull,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  thumbScroll: {
    maxHeight: GALLERY_THUMB_HEIGHT,
  },
  thumbContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    paddingBottom: 14,
    gap: THUMB_GAP,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: AppEco.radiusSm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: AppEco.borderSoft,
    backgroundColor: AppEco.surface,
  },
  thumbActive: {
    borderColor: AppEco.primary,
    borderWidth: 2.5,
    ...AppEco.shadowCard,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    backgroundColor: AppEco.borderSoft,
  },
});
