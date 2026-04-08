import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CheckoutItem {
  _id: string;
  /** Theo API đặt hàng: một đơn một seller */
  sellerId?: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    sale?: number;
  };
  variant?: {
    color?: string;
    size?: string;
  };
  quantity: number;
  price: number;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  /** Hiển thị: địa chỉ đầy đủ */
  address: string;
  /** Dòng địa chỉ chi tiết gửi API (số nhà, đường) — ưu tiên khi có */
  street?: string;
  ward?: string;
  city: string;
  district: string;
  /** _id địa chỉ — dùng GET shipping-options */
  addressId?: string;
  postalCode?: string;
  addressType?: 'home' | 'office' | 'warehouse';
}

export interface PaymentMethod {
  type: 'cod' | 'card' | 'bank_transfer';
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  bankName?: string;
}

export interface CheckoutState {
  items: CheckoutItem[];
  shippingInfo: Partial<ShippingInfo>;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  notes: string;
  isProcessing: boolean;
  error: string | null;
}

const initialState: CheckoutState = {
  items: [],
  shippingInfo: {},
  paymentMethod: {
    type: 'cod',
  },
  subtotal: 0,
  shippingFee: 0,
  discount: 0,
  total: 0,
  notes: '',
  isProcessing: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCheckoutItems: (state, action: PayloadAction<CheckoutItem[]>) => {
      state.items = action.payload;
      calculateTotals(state);
    },
    
    addCheckoutItem: (state, action: PayloadAction<CheckoutItem>) => {
      const existingItemIndex = state.items.findIndex(
        item => item.productId._id === action.payload.productId._id &&
        item.variant?.color === action.payload.variant?.color &&
        item.variant?.size === action.payload.variant?.size
      );
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      
      calculateTotals(state);
    },
    
    removeCheckoutItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item._id !== action.payload);
      calculateTotals(state);
    },
    
    updateItemQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const item = state.items.find(item => item._id === action.payload.itemId);
      if (item) {
        item.quantity = action.payload.quantity;
        calculateTotals(state);
      }
    },
    
    setShippingInfo: (state, action: PayloadAction<Partial<ShippingInfo>>) => {
      state.shippingInfo = { ...state.shippingInfo, ...action.payload };
    },
    
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethod = action.payload;
    },
    
    setShippingFee: (state, action: PayloadAction<number>) => {
      state.shippingFee = action.payload;
      calculateTotals(state);
    },
    
    setDiscount: (state, action: PayloadAction<number>) => {
      state.discount = action.payload;
      calculateTotals(state);
    },
    
    setNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    
    clearCheckout: (state) => {
      return initialState;
    },
    
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

function calculateTotals(state: CheckoutState) {
  state.subtotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  state.total = Math.max(0, state.subtotal + state.shippingFee - state.discount);
}

export const {
  setCheckoutItems,
  addCheckoutItem,
  removeCheckoutItem,
  updateItemQuantity,
  setShippingInfo,
  setPaymentMethod,
  setShippingFee,
  setDiscount,
  setNotes,
  clearCheckout,
  setProcessing,
  setError,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;

// Selectors
export const selectCheckoutItems = (state: { checkout: CheckoutState }) => state.checkout.items;
export const selectShippingInfo = (state: { checkout: CheckoutState }) => state.checkout.shippingInfo;
export const selectPaymentMethod = (state: { checkout: CheckoutState }) => state.checkout.paymentMethod;
export const selectCheckoutTotals = (state: { checkout: CheckoutState }) => ({
  subtotal: state.checkout.subtotal,
  shippingFee: state.checkout.shippingFee,
  discount: state.checkout.discount,
  total: state.checkout.total,
});
export const selectCheckoutNotes = (state: { checkout: CheckoutState }) => state.checkout.notes;
export const selectCheckoutProcessing = (state: { checkout: CheckoutState }) => state.checkout.isProcessing;
export const selectCheckoutError = (state: { checkout: CheckoutState }) => state.checkout.error;
