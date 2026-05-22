import { useListAddress } from '@/api/address/address.api';
import { useFavoritesList } from '@/api/favorite/favorite.api';
import { useListOrder } from '@/api/order/order.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDialog } from '@/components/app-dialog/AppDialogProvider';
import { AppEco } from '@/constants/theme';
import { useAppDispatch } from '@/src/store';
import { clearTokens } from '@/src/store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ORDER_STATUS_ICONS: { icon: any; label: string; color: string; bg: string }[] = [
  { icon: 'hourglass-outline', label: 'Chờ xác nhận', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: 'bag-handle-outline', label: 'Đang giao', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: 'checkmark-circle-outline', label: 'Đã giao', color: '#10B981', bg: '#ECFDF5' },
  { icon: 'close-circle-outline', label: 'Đã huỷ', color: '#EF4444', bg: '#FEF2F2' },
];

type MenuItem = { icon: any; label: string; sub?: string; onPress: () => void; danger?: boolean };

const ORDER_STATUS_KEYS = ['pending', 'shipping', 'delivered', 'cancelled'] as const;

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const dialog = useAppDialog();

  const { data: user, isLoading: userLoading, isSuccess: userOk } = useGetCurrentUser();
  const { data: addressesData, isLoading: addressLoading } = useListAddress();
  const { data: orderListData } = useListOrder();
  const isLoggedIn = userOk && !!user?._id;
  const { data: favData } = useFavoritesList(isLoggedIn);
  const favCount = favData?.favorites?.length ?? 0;

  const addresses = addressesData?.data?.items ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault);
  const orders = orderListData?.data?.orders ?? [];

  const countByStatus = (status: string) => orders.filter((o) => String(o.status) === status).length;

  const handleLogout = () =>
    dialog.showConfirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc muốn đăng xuất?',
      confirmText: 'Đăng xuất',
      destructive: true,
      onConfirm: () => dispatch(clearTokens()),
    });

  const adminMenu: MenuItem[] =
    user?.role === 'admin'
      ? [
          {
            icon: 'pricetags-outline',
            label: 'Quản lý thể loại',
            sub: 'Tạo / sửa danh mục',
            onPress: () => router.push('/admin/categories' as any),
          },
          {
            icon: 'cube-outline',
            label: 'Quản lý sản phẩm',
            sub: 'Tạo / sửa cho cửa hàng',
            onPress: () => router.push('/admin/products' as any),
          },
          {
            icon: 'clipboard-outline',
            label: 'Đơn bán (xét duyệt)',
            sub: 'Xác nhận · giao · huỷ',
            onPress: () => router.push('/admin/orders' as any),
          },
        ]
      : [];

  const menuItems: MenuItem[] = [
    ...adminMenu,
    {
      icon: 'time-outline',
      label: 'Lịch sử đơn hàng',
      sub: `${orders.length} đơn`,
      onPress: () => router.push('/orders' as any),
    },
    { icon: 'location-outline', label: 'Địa chỉ của tôi', onPress: () => router.push('/addresses' as any) },
    {
      icon: 'heart-outline',
      label: 'Sản phẩm yêu thích',
      sub: isLoggedIn && favCount > 0 ? `${favCount} sản phẩm` : undefined,
      onPress: () => router.push('/favorites' as any),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'Tin nhắn',
      onPress: () => router.push('/conversations' as any),
    },
    { icon: 'notifications-outline', label: 'Thông báo', onPress: () => { } },
    { icon: 'shield-checkmark-outline', label: 'Bảo mật', onPress: () => { } },
    { icon: 'help-circle-outline', label: 'Trợ giúp & Hỗ trợ', onPress: () => { } },
    { icon: 'log-out-outline', label: 'Đăng xuất', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[...AppEco.heroGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>Tài khoản</Text>
          <Text style={styles.heroSub}>Đơn hàng, địa chỉ & cài đặt</Text>
        </LinearGradient>

        <View style={styles.contentOverhang}>
        {/* ── AVATAR CARD ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.avatarOnline} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userLoading ? 'Đang tải...' : user?.name ?? 'Người dùng'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userLoading ? '' : user?.email ?? ''}
            </Text>
            <View style={styles.roleBadge}>
              <Ionicons name="person-circle-outline" size={12} color={AppEco.primary} />
              <Text style={styles.roleText}>
                {user?.role === 'admin'
                  ? 'Quản trị viên'
                  : user?.role === 'user'
                    ? 'Khách hàng'
                    : user?.role ?? '—'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={16} color={AppEco.primary} />
          </TouchableOpacity>
        </View>

        {/* ── DEFAULT ADDRESS ── */}
        <TouchableOpacity style={styles.addressCard} activeOpacity={0.8} onPress={() => router.push('/addresses' as any)}>
          <View style={styles.addressIcon}>
            <Ionicons name="location" size={20} color={AppEco.primary} />
          </View>
          <View style={styles.addressBody}>
            <Text style={styles.addressLabel}>Địa chỉ giao hàng mặc định</Text>
            {addressLoading ? (
              <ActivityIndicator size="small" color={AppEco.primary} style={{ marginTop: 4 }} />
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {defaultAddress
                  ? [defaultAddress.street, defaultAddress.ward, defaultAddress.district, defaultAddress.province].filter(Boolean).join(', ')
                  : 'Chưa có địa chỉ mặc định'}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={AppEco.textMuted} />
        </TouchableOpacity>

        {/* ── ORDER STATUS QUICK ACCESS ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng của tôi</Text>
            <TouchableOpacity onPress={() => router.push('/orders' as any)}>
              <Text style={styles.sectionLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statusGrid}>
            {ORDER_STATUS_ICONS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.statusItem} onPress={() => router.push('/orders' as any)}>
                <View style={[styles.statusIconWrap, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                  {countByStatus(ORDER_STATUS_KEYS[i]) > 0 && (
                    <View style={styles.statusCount}>
                      <Text style={styles.statusCountText}>{countByStatus(ORDER_STATUS_KEYS[i])}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statusLabel} numberOfLines={1}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── PHONE ── */}
        {user?.phoneNumber ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={AppEco.primary} />
            <Text style={styles.infoText}>{user.phoneNumber}</Text>
          </View>
        ) : null}

        {/* ── MENU LIST ── */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
                  <Ionicons name={item.icon} size={20} color={item.danger ? AppEco.danger : AppEco.primary} />
                </View>
                <View style={styles.menuBody}>
                  <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                  {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
                </View>
                {!item.danger && <Ionicons name="chevron-forward" size={16} color={AppEco.textMuted} />}
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.version}>Pine v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppEco.background },
  scrollContent: { paddingBottom: 40 },

  hero: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderBottomLeftRadius: AppEco.radiusXl,
    borderBottomRightRadius: AppEco.radiusXl,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.88)', marginTop: 6, fontWeight: '500' },
  contentOverhang: { marginTop: -28, paddingHorizontal: 16 },

  // Avatar card
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppEco.surface,
    marginTop: 0,
    borderRadius: AppEco.radiusLg,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: AppEco.borderSoft,
    ...AppEco.shadowCard,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: AppEco.surfaceMuted, borderWidth: 2.5, borderColor: AppEco.border },
  avatarFallback: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: AppEco.surfaceMuted, borderWidth: 2.5, borderColor: AppEco.border,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '900', color: AppEco.primary },
  avatarOnline: {
    position: 'absolute', bottom: 1, right: 1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: AppEco.success, borderWidth: 2, borderColor: '#FFFFFF',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800', color: AppEco.text },
  userEmail: { fontSize: 13, color: AppEco.textSecondary, marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: AppEco.surfaceMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  roleText: { fontSize: 12, color: AppEco.primary, fontWeight: '600' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: AppEco.surfaceMuted, justifyContent: 'center', alignItems: 'center',
  },

  // Address
  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: AppEco.surface, marginTop: 10,
    borderRadius: AppEco.radiusMd, padding: 14, borderWidth: 1, borderColor: AppEco.borderSoft,
  },
  addressIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: AppEco.surfaceMuted, justifyContent: 'center', alignItems: 'center',
  },
  addressBody: { flex: 1 },
  addressLabel: { fontSize: 12, fontWeight: '700', color: AppEco.textMuted, marginBottom: 3 },
  addressText: { fontSize: 13, color: AppEco.text, lineHeight: 20 },

  // Section
  section: {
    backgroundColor: AppEco.surface, marginTop: 10,
    borderRadius: AppEco.radiusMd, padding: 16, borderWidth: 1, borderColor: AppEco.borderSoft,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: AppEco.text },
  sectionLink: { fontSize: 13, color: AppEco.primary, fontWeight: '700' },
  statusGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { flex: 1, alignItems: 'center', gap: 8 },
  statusIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  statusCount: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  statusCountText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  statusLabel: { fontSize: 11, color: AppEco.textSecondary, fontWeight: '600', textAlign: 'center' },

  // Phone info row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10,
    backgroundColor: AppEco.surface, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: AppEco.borderSoft,
  },
  infoText: { fontSize: 14, color: AppEco.text, fontWeight: '500' },

  // Menu
  menuCard: {
    backgroundColor: AppEco.surface, marginTop: 10,
    borderRadius: AppEco.radiusMd, overflow: 'hidden', borderWidth: 1, borderColor: AppEco.borderSoft,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: AppEco.surfaceMuted, justifyContent: 'center', alignItems: 'center',
  },
  menuIconDanger: { backgroundColor: 'rgba(220, 38, 38, 0.08)' },
  menuBody: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: AppEco.text },
  menuLabelDanger: { color: AppEco.danger },
  menuSub: { fontSize: 12, color: AppEco.textMuted, marginTop: 2 },
  menuDivider: { height: 1, backgroundColor: AppEco.borderSoft, marginLeft: 68 },

  version: { textAlign: 'center', fontSize: 12, color: AppEco.textMuted, marginTop: 24, fontWeight: '500' },
});
