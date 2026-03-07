import { useGetAddressesByUser } from '@/api/address/address.api';
import { useGetCurrentUser } from '@/api/user/user.api';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  clearTokens,
} from '@/src/store/slices/authSlice';
import {
  selectOrders,
} from '@/src/store/slices/ordersSlice';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.accessToken);
  const orders = useAppSelector(selectOrders);

  const {
    data: userData,
    isLoading: userLoading,
  } = useGetCurrentUser();

  const {
    data: addressesData,
    isLoading: addressesLoading,
  } = useGetAddressesByUser(userData?.data?._id || '');


  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => dispatch(clearTokens()),
        },
      ]
    );
  };


  
  
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Info Card */}
          <View style={styles.userCard}>
            <View style={styles.userInfoRow}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: 'https://via.placeholder.com/80' }} 
                  style={styles.avatar} 
                />
                <View style={styles.avatarBadge}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {userLoading ? 'Đang tải...' : userData?.data?.name || 'Tên người dùng'}
                </Text>
                <Text style={styles.userEmail}>
                  {userLoading ? 'Đang tải...' : userData?.data?.email || 'user@example.com'}
                </Text>
                <View style={styles.userMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="call-outline" size={14} color="#FFD700" />
                    <Text style={styles.metaText}>
                      {userLoading ? '...' : userData?.data?.phoneNumber || 'Chưa cập nhật'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#FFD700" />
                    <Text style={styles.metaText}>
                      {userLoading ? '...' : userData?.data?.role || 'Khách hàng'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Default Address Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Địa chỉ giao hàng mặc định</Text>
            </View>
            {addressesLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#FFD700" />
                <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
              </View>
            ) : (
              <Text style={styles.addressText}>
                {(() => {
                  const defaultAddress = addressesData?.data?.addresses?.find(addr => addr.isDefault);
                  return defaultAddress ? (
                    `${defaultAddress.streetAddress}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.province}`
                  ) : (
                    'Chưa có địa chỉ mặc định'
                  );
                })()}
              </Text>
            )}
          </View>

          {/* Orders Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
            </View>
            <ScrollView 
              style={styles.ordersList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {orders.map((item: any) => (
                <View key={item._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderTitle}>Đơn hàng #{item._id.slice(-8)}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Text style={[styles.statusText, styles.statusPending]}>
                        Chờ xác nhận
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetails}>
                    <View style={styles.orderRow}>
                      <MaterialCommunityIcons name="package-variant-closed" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.orderDetailText}>
                        {item.products.length} sản phẩm
                      </Text>
                    </View>
                    <View style={styles.orderRow}>
                      <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.orderDetailText} numberOfLines={2}>
                        {item.user.address}
                      </Text>
                    </View>
                    <View style={styles.orderRow}>
                      <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.orderDetailText}>{item.user.name}</Text>
                    </View>
                    <View style={styles.orderRow}>
                      <Ionicons name="call-outline" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.orderDetailText}>{item.user.phone}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>đ{item.totalPrice.toLocaleString('vi-VN')}</Text>
                  </View>
                </View>
              ))}
              {orders.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={48} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
                  <Text style={styles.emptySubtitle}>Các đơn hàng của bạn sẽ hiển thị ở đây</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,107,0.1)',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 0,
  },

  // User Card
  userCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginBottom: 16,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  metaText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  addressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },

  // Loading
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },

  // Orders
  ordersList: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPending: {
    backgroundColor: 'rgba(255,165,0,0.2)',
    color: '#FFA500',
    borderWidth: 1,
    borderColor: 'rgba(255,165,0,0.3)',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  orderFooter: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
