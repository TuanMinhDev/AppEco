/** Trạng thái đơn theo backend (doc.md) */
export type OrderStatus =
  | 'pending'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | string;

export type ShippingMethod = 'economy' | 'fast' | 'express';

export interface OrderItemVariant {
  color: string;
  size: string;
}

export interface OrderLineItem {
  productId: string;
  variant: OrderItemVariant;
  quantity: number;
  price: number;
}

/** Populate từ GET list/detail */
export type OrderProductPopulated = {
  _id: string;
  name?: string;
  images?: string[];
  price?: number;
  sale?: number;
};

export interface OrderLineItemResolved {
  productId: string | OrderProductPopulated;
  variant: OrderItemVariant;
  quantity: number;
  price: number;
}

/** Snapshot gửi khi POST /order/create — khớp doc.md */
export interface OrderShippingAddressSnapshot {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  district: string;
  ward: string;
}

export interface CreateOrderBody {
  sellerId: string;
  items: OrderLineItem[];
  shippingAddress: OrderShippingAddressSnapshot;
  shippingMethod: ShippingMethod;
  notes?: string;
}

export interface SellerOrderSummary {
  _id: string;
  name: string;
  email: string;
}

export interface Order {
  _id: string;
  userId?: string;
  sellerId: string | SellerOrderSummary;
  orderCode: string;
  items: OrderLineItemResolved[];
  totalPrice: number;
  shippingFee?: number;
  shippingMethod?: ShippingMethod | string;
  shippingAddress: OrderShippingAddressSnapshot | Record<string, unknown>;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  /** Có thể có từ bản API cũ */
  paymentMethod?: string;
}

export interface OrderListResponse {
  message: string;
  orders: Order[];
}

export interface OrderDetailResponse {
  message: string;
  order: Order;
}

export interface UpdateOrderStatusBody {
  status: OrderStatus;
}

export type ShippingOptionRow = {
  method: ShippingMethod | string;
  label: string;
  fee: number;
  estimatedDays: string;
  distanceKm?: number;
  note?: string;
};

/** Legacy: 1 sản phẩm + productId */
export type ShippingOptionsLegacyResponse = {
  sellerId?: string;
  sellerProvince?: string;
  buyerProvince?: string;
  isSameProvince?: boolean;
  options: ShippingOptionRow[];
};

/** Giỏ: productIds CSV */
export type ShippingOptionsMultiResponse = {
  multiSeller: boolean;
  expressAvailable: boolean;
  expressUnavailableReason?: string;
  sellers: Array<{
    sellerId: string;
    productIds: string[];
    sellerProvince: string;
    buyerProvince: string;
    isSameProvince: boolean;
    options: ShippingOptionRow[];
  }>;
  combined: { economy: number; fast: number; express: number | null };
  combinedOptions: ShippingOptionRow[];
};

export type ShippingOptionsResponse =
  | ShippingOptionsLegacyResponse
  | ShippingOptionsMultiResponse;
