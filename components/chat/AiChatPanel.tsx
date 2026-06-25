/**
 * AiChatPanel – Trợ lý mua sắm AI.
 *
 * Giao diện chat gọi POST /ai/chat (TF-IDF search)
 * để tìm sản phẩm theo câu hỏi tự nhiên.
 * Hiển thị chi tiết sản phẩm + gợi ý tương tự.
 * Không cần đăng nhập.
 */

import { useChatWithAi } from '@/api/ai/ai.api';
import type { AiChatMessage, AiChatProduct } from '@/api/ai/ai.type';
import { AppEco } from '@/constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Suggestion chips ───────────────────────────────────────

const SUGGESTIONS = [
  'Áo thun nam',
  'Giày sneaker',
  'Đồ đang sale',
  'Balo laptop',
  'Đầm nữ',
  'Phụ kiện thời trang',
];

// ─── Helper ─────────────────────────────────────────────────

function formatPrice(price: number) {
  return price.toLocaleString('vi-VN') + 'đ';
}

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Welcome message ───────────────────────────────────────

const WELCOME_MESSAGE: AiChatMessage = {
  id: 'welcome',
  role: 'ai',
  text: 'Xin chào! 👋 Mình là trợ lý mua sắm AI của AppEco.\n\nMình có thể giúp bạn:\n• Tìm sản phẩm theo mô tả\n• Gợi ý sản phẩm tương tự\n• Tư vấn chọn đồ phù hợp\n\nHãy cho mình biết bạn đang tìm gì nhé!',
  createdAt: new Date().toISOString(),
};

// ─── Product Card (chi tiết) ────────────────────────────────

function ProductCard({ product, compact }: { product: AiChatProduct; compact?: boolean }) {
  const hasDiscount = product.sale && product.sale > 0;
  const discountedPrice = hasDiscount
    ? product.price * (1 - (product.sale ?? 0) / 100)
    : product.price;

  if (compact) {
    // Card nhỏ cho section "Sản phẩm tương tự"
    return (
      <TouchableOpacity
        style={styles.compactCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/product/${product._id}` as any)}
      >
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.compactImage} />
        ) : (
          <View style={[styles.compactImage, styles.productImagePlaceholder]}>
            <Ionicons name="image-outline" size={20} color={AppEco.textMuted} />
          </View>
        )}
        <Text style={styles.compactName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.compactPrice}>{formatPrice(discountedPrice)}</Text>
        {hasDiscount && (
          <View style={styles.compactSaleBadge}>
            <Text style={styles.saleBadgeText}>-{product.sale}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Card đầy đủ
  return (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.85}
      onPress={() => router.push(`/product/${product._id}` as any)}
    >
      {product.image ? (
        <Image source={{ uri: product.image }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color={AppEco.textMuted} />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Mô tả ngắn */}
        {product.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}

        {/* Giá */}
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>{formatPrice(discountedPrice)}</Text>
          {hasDiscount && (
            <>
              <Text style={styles.productOriginalPrice}>{formatPrice(product.price)}</Text>
              <View style={styles.saleBadge}>
                <Text style={styles.saleBadgeText}>-{product.sale}%</Text>
              </View>
            </>
          )}
        </View>

        {/* Màu sắc & Size */}
        {(product.colors?.length || product.sizes?.length) ? (
          <View style={styles.variantsRow}>
            {product.colors && product.colors.length > 0 && (
              <View style={styles.variantTag}>
                <Ionicons name="color-palette-outline" size={11} color={AppEco.textSecondary} />
                <Text style={styles.variantText}>
                  {product.colors.slice(0, 4).join(', ')}
                  {product.colors.length > 4 ? ` +${product.colors.length - 4}` : ''}
                </Text>
              </View>
            )}
            {product.sizes && product.sizes.length > 0 && (
              <View style={styles.variantTag}>
                <Ionicons name="resize-outline" size={11} color={AppEco.textSecondary} />
                <Text style={styles.variantText}>
                  {product.sizes.slice(0, 4).join(', ')}
                  {product.sizes.length > 4 ? ` +${product.sizes.length - 4}` : ''}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
      <View style={styles.productArrow}>
        <Text style={styles.viewText}>Xem</Text>
        <Ionicons name="chevron-forward" size={14} color={AppEco.primary} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Similar Products Section ───────────────────────────────

function SimilarSection({ products }: { products: AiChatProduct[] }) {
  if (!products.length) return null;

  return (
    <View style={styles.similarSection}>
      <View style={styles.similarHeader}>
        <MaterialCommunityIcons name="lightbulb-outline" size={16} color={AppEco.accent} />
        <Text style={styles.similarTitle}>Có thể bạn cũng thích</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.similarScroll}
      >
        {products.map((p) => (
          <ProductCard key={p._id} product={p} compact />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Props ──────────────────────────────────────────────────

type AiChatPanelProps = {
  onBack: () => void;
};

// ─── Component ──────────────────────────────────────────────

export function AiChatPanel({ onBack }: AiChatPanelProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const chatMutation = useChatWithAi();

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, []);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? inputText).trim();
      if (!msg || chatMutation.isPending) return;

      // Add user message
      const userMsg: AiChatMessage = {
        id: generateId(),
        role: 'user',
        text: msg,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      scrollToEnd();

      // Call AI
      chatMutation.mutate(msg, {
        onSuccess: (res) => {
          const data = res.data;
          const aiMsg: AiChatMessage = {
            id: generateId(),
            role: 'ai',
            text: data.reply,
            products: data.products?.length ? data.products : undefined,
            similar: data.similar?.length ? data.similar : undefined,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          scrollToEnd();
        },
        onError: () => {
          const errMsg: AiChatMessage = {
            id: generateId(),
            role: 'ai',
            text: 'Xin lỗi, mình gặp lỗi khi kết nối. Bạn thử lại nhé! 🙏',
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
          scrollToEnd();
        },
      });
    },
    [inputText, chatMutation, scrollToEnd],
  );

  const handleSuggestionPress = (text: string) => {
    handleSend(text);
  };

  // ─── Render ─────────────────────────────────────────────

  const renderMessage = ({ item }: { item: AiChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View>
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
          {!isUser && (
            <View style={styles.aiAvatar}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={AppEco.primary} />
            </View>
          )}
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
              {item.text}
            </Text>
            <Text style={[styles.msgTime, isUser && styles.msgTimeUser]}>
              {formatMsgTime(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Product cards — kết quả chính */}
        {item.products && item.products.length > 0 && (
          <View style={styles.productsContainer}>
            <View style={styles.productsHeader}>
              <Ionicons name="bag-handle-outline" size={14} color={AppEco.primary} />
              <Text style={styles.productsHeaderText}>
                Sản phẩm tìm được ({item.products.length})
              </Text>
            </View>
            {item.products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </View>
        )}

        {/* Sản phẩm tương tự */}
        {item.similar && item.similar.length > 0 && (
          <View style={styles.similarWrap}>
            <SimilarSection products={item.similar} />
          </View>
        )}

        {/* Suggestions after welcome */}
        {item.id === 'welcome' && (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsLabel}>Gợi ý tìm kiếm:</Text>
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(s)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="sparkles" size={12} color={AppEco.primary} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={24} color={AppEco.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerName} numberOfLines={1}>
              Trợ lý AI
            </Text>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {chatMutation.isPending ? 'Đang tìm kiếm...' : 'Trợ lý mua sắm thông minh'}
            </Text>
          </View>
        </View>

        <View style={styles.aiStatusDot} />
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <View style={styles.typingWrap}>
            <View style={styles.aiAvatar}>
              <MaterialCommunityIcons name="robot-outline" size={18} color={AppEco.primary} />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* ── Input ── */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Hỏi về sản phẩm bạn cần..."
              placeholderTextColor={AppEco.textMuted}
              multiline
              maxLength={500}
              onSubmitEditing={() => handleSend()}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || chatMutation.isPending) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || chatMutation.isPending}
            activeOpacity={0.85}
          >
            {chatMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: AppEco.primary,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  aiStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  // Chat area
  chatContainer: { flex: 1 },
  messagesList: { paddingHorizontal: 14, paddingVertical: 16 },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    maxWidth: '85%',
  },
  messageRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppEco.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },

  // Bubbles
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  bubbleUser: {
    backgroundColor: AppEco.primary,
    borderBottomRightRadius: 4,
    ...AppEco.shadowSoft,
  },
  bubbleAi: {
    backgroundColor: AppEco.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  messageText: { fontSize: 15, color: AppEco.text, lineHeight: 21 },
  messageTextUser: { color: '#fff' },
  msgTime: { fontSize: 10, color: AppEco.textMuted, marginTop: 4, textAlign: 'right' },
  msgTimeUser: { color: 'rgba(255,255,255,0.65)' },

  // Typing indicator
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: AppEco.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppEco.primarySubtle,
  },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.9 },

  // Product cards — kết quả chính
  productsContainer: {
    marginLeft: 36,
    marginBottom: 8,
    gap: 6,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  productsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppEco.primary,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusMd,
    padding: 12,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    gap: 10,
    ...AppEco.shadowCard,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: AppEco.radiusSm,
    backgroundColor: AppEco.surfaceMuted,
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontWeight: '700', color: AppEco.text, lineHeight: 19 },
  productDesc: {
    fontSize: 12,
    color: AppEco.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  productPrice: { fontSize: 15, fontWeight: '800', color: AppEco.primary },
  productOriginalPrice: {
    fontSize: 12,
    color: AppEco.textMuted,
    textDecorationLine: 'line-through',
  },
  saleBadge: {
    backgroundColor: AppEco.sale,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  saleBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  variantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppEco.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantText: {
    fontSize: 11,
    color: AppEco.textSecondary,
    fontWeight: '500',
  },
  productArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 8,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppEco.primary,
  },

  // Similar products — compact horizontal scroll
  similarWrap: {
    marginLeft: 36,
    marginBottom: 12,
  },
  similarSection: {
    gap: 8,
  },
  similarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  similarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppEco.accent,
  },
  similarScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  compactCard: {
    width: 120,
    backgroundColor: AppEco.surface,
    borderRadius: AppEco.radiusSm,
    padding: 8,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    gap: 4,
    ...AppEco.shadowCard,
  },
  compactImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: AppEco.surfaceMuted,
  },
  compactName: {
    fontSize: 11,
    fontWeight: '600',
    color: AppEco.text,
    lineHeight: 15,
  },
  compactPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: AppEco.primary,
  },
  compactSaleBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: AppEco.sale,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },

  // Suggestion chips
  suggestionsWrap: {
    marginLeft: 36,
    marginBottom: 16,
    gap: 8,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppEco.textMuted,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppEco.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
  },
  suggestionText: {
    fontSize: 13,
    color: AppEco.primary,
    fontWeight: '600',
  },

  // Input area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: AppEco.surface,
    borderTopWidth: 1,
    borderTopColor: AppEco.borderSoft,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: AppEco.surfaceMuted,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  textInput: { fontSize: 15, color: AppEco.text, maxHeight: 80 },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AppEco.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...AppEco.shadowSoft,
  },
  sendBtnDisabled: { backgroundColor: AppEco.border, shadowOpacity: 0, elevation: 0 },
});
