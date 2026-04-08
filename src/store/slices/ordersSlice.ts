import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '@/api/order/order.type';

export interface OrdersState {
  orders: Order[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  type: 'order_success' | 'order_cancelled' | 'order_delivered' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

const initialState: OrdersState = {
  orders: [],
  notifications: [],
  isLoading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(order => order._id === action.payload._id);
      if (index >= 0) {
        state.orders[index] = action.payload;
      }
    },
    
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
      };
      state.notifications.unshift(notification);
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setOrders,
  addOrder,
  updateOrder,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setLoading,
  setError,
} = ordersSlice.actions;

export default ordersSlice.reducer;

// Selectors
export const selectOrders = (state: { orders: OrdersState }) => state.orders.orders;
export const selectNotifications = (state: { orders: OrdersState }) => state.orders.notifications;
export const selectUnreadNotificationsCount = (state: { orders: OrdersState }) => 
  state.orders.notifications.filter(n => !n.read).length;
export const selectOrdersLoading = (state: { orders: OrdersState }) => state.orders.isLoading;
export const selectOrdersError = (state: { orders: OrdersState }) => state.orders.error;
