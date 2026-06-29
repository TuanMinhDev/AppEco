import {
  useGhtkConfig,
  useUpdateGhtkConfig,
} from '@/api/shipping/shipping-config.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useToast } from '@/components/toast/ToastProvider';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/utils/api-error-message';

export default function GhtkSettingsScreen() {
  const toast = useToast();
  const { data: user, isLoading: authLoading } = useGetCurrentUser();
  const isAdmin = user?.role === 'admin';

  const { data: config, isLoading, isError, refetch } = useGhtkConfig(isAdmin);

  const [apiToken, setApiToken] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [customerWebsite, setCustomerWebsite] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (config) {
      setApiToken(config.apiToken);
      setShopCode(config.shopCode);
      setApiUrl(config.apiUrl);
      setCustomerWebsite(config.customerWebsite);
      setIsActive(config.isActive);
      setDirty(false);
    }
  }, [config]);

  const updateConfig = useUpdateGhtkConfig({
    onSuccess: (msg) => {
      toast.showSuccess(msg || 'Đã lưu cấu hình GHTK.', { duration: 2000 });
      setDirty(false);
      void refetch();
    },
    onError: (e) => {
      toast.showError(getApiErrorMessage(e, 'Không lưu được cấu hình.'));
    },
  });

  const saving = updateConfig.isPending;

  const handleSave = () => {
    const payload: Record<string, unknown> = {};

    // Chỉ gửi token nếu user đã sửa (không phải giá trị masked)
    if (apiToken !== config?.apiToken) payload.apiToken = apiToken;
    if (shopCode !== config?.shopCode) payload.shopCode = shopCode;
    if (apiUrl !== config?.apiUrl) payload.apiUrl = apiUrl;
    if (customerWebsite !== config?.customerWebsite) payload.customerWebsite = customerWebsite;
    if (isActive !== config?.isActive) payload.isActive = isActive;

    if (Object.keys(payload).length === 0) {
      toast.showSuccess('Không có thay đổi.', { duration: 1500 });
      return;
    }

    updateConfig.mutate(payload as any);
  };

  const markDirty = () => setDirty(true);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={styles.deny}>Chỉ quản trị mới truy cập được.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt GHTK</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo + Status */}
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="truck-delivery" size={28} color="#059669" />
            <View style={styles.logoInfo}>
              <Text style={styles.logoTitle}>Giao Hàng Tiết Kiệm</Text>
              <Text style={styles.logoSub}>Tích hợp API vận chuyển</Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
              <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
              <Text style={[styles.statusText, isActive ? styles.textActive : styles.textInactive]}>
                {isActive ? 'Hoạt động' : 'Tắt'}
              </Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Kích hoạt GHTK</Text>
            <Switch
              value={isActive}
              onValueChange={(v) => { setIsActive(v); markDirty(); }}
              trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
              thumbColor={isActive ? '#059669' : '#9CA3AF'}
            />
          </View>

          {config?.source === 'env' && (
            <View style={styles.envHint}>
              <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
              <Text style={styles.envHintText}>
                Đang dùng cấu hình từ file .env. Nhập bên dưới để chuyển sang quản lý từ ứng dụng.
              </Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải cấu hình...</Text>
          </View>
        ) : isError ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>Không tải được cấu hình.</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* API Token */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin xác thực</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  <Ionicons name="key-outline" size={14} color="#64748B" /> API Token
                </Text>
                <TextInput
                  style={styles.input}
                  value={apiToken}
                  onChangeText={(v) => { setApiToken(v); markDirty(); }}
                  placeholder="Nhập API Token từ GHTK"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={apiToken.startsWith('••••')}
                />
                <Text style={styles.fieldHint}>
                  Lấy tại: GHTK Dashboard → Quản lý → API Token
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  <Ionicons name="storefront-outline" size={14} color="#64748B" /> Shop Code
                </Text>
                <TextInput
                  style={styles.input}
                  value={shopCode}
                  onChangeText={(v) => { setShopCode(v); markDirty(); }}
                  placeholder="Ví dụ: S12345678"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Text style={styles.fieldHint}>
                  Mã cửa hàng trên GHTK (X-Client-Source)
                </Text>
              </View>
            </View>

            {/* API URLs */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>URL Endpoints</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  <Ionicons name="link-outline" size={14} color="#64748B" /> API URL
                </Text>
                <TextInput
                  style={styles.input}
                  value={apiUrl}
                  onChangeText={(v) => { setApiUrl(v); markDirty(); }}
                  placeholder="https://services.giaohangtietkiem.vn"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={styles.fieldHint}>
                  Staging: https://services.ghtklab.com
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  <Ionicons name="globe-outline" size={14} color="#64748B" /> Customer Website
                </Text>
                <TextInput
                  style={styles.input}
                  value={customerWebsite}
                  onChangeText={(v) => { setCustomerWebsite(v); markDirty(); }}
                  placeholder="https://khachhang.giaohangtietkiem.vn"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Text style={styles.fieldHint}>
                  URL tra cứu vận đơn cho khách hàng
                </Text>
              </View>
            </View>

            {config?.updatedAt && (
              <Text style={styles.updatedAt}>
                Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString('vi-VN')}
              </Text>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save button */}
      {dirty && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
            )}
            <Text style={styles.saveBtnText}>
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  deny: { fontWeight: '800', color: '#475569' },
  link: { marginTop: 12, color: '#2563EB', fontWeight: '700' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },

  scroll: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Logo / Status
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  logoInfo: { flex: 1 },
  logoTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  logoSub: { fontSize: 13, color: '#64748B', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusActive: { backgroundColor: '#ECFDF5' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#059669' },
  dotInactive: { backgroundColor: '#EF4444' },
  statusText: { fontSize: 12, fontWeight: '700' },
  textActive: { color: '#059669' },
  textInactive: { color: '#EF4444' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },

  envHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
  },
  envHintText: { flex: 1, fontSize: 12, color: '#0369A1', lineHeight: 18 },

  // Fields
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: undefined,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    marginLeft: 2,
  },

  // Loading / Error
  loadingWrap: { alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: '#64748B' },
  errorText: { color: '#EF4444', textAlign: 'center' },
  retryText: { color: '#2563EB', fontWeight: '700', textAlign: 'center', marginTop: 8 },

  updatedAt: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Bottom save bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
