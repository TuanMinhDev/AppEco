/** Trạng thái đơn theo backend (doc.md) */
export type OrderStatus =
  | 'pending'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | string;

export type ShippingMethod = 'economy' | 'fast' | 'express' | 'ghtk' | 'pickup';

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
  /** _id subdocument dòng đơn — bắt buộc cho flow đánh giá (POST comment + reviewable-items) */
  _id?: string;
  productId: string | OrderProductPopulated;
  variant: OrderItemVariant;
  quantity: number;
  price: number;
}

/** Snapshot gửi khi POST /order/create — khớp FE_AI_API.md */
export interface OrderShippingAddressSnapshot {
  fullName: string;
  phoneNumber: string;
  /** Địa chỉ chi tiết / số nhà */
  address: string;
  province: string;
  ward: string;
  /** Legacy: map sang province nếu chỉ có city */
  city?: string;
  /** Optional */
  district?: string;
}

export interface CreateOrderBody {
  sellerId: string;
  items: OrderLineItem[];
  /** Chỉ gửi khi đặt từ giỏ — id dòng giỏ khớp từng item */
  cartItemIds?: string[];
  shippingAddress: OrderShippingAddressSnapshot;
  shippingMethod: ShippingMethod;
  /** Phí ship từ GHTK hoặc 0 (pickup). Server xác nhận lại. */
  shippingFee?: number;
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
  /** Trạng thái vận chuyển chi tiết từ GHTK (pending, in_transit, delivered, ...) */
  shippingStatus?: string | null;
  /** Thông tin vận đơn GHTK (nếu có) */
  shipment?: {
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: string;
    shippingFee?: number;
  } | null;
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
