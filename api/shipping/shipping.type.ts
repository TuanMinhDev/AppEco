/** Trạng thái vận chuyển chi tiết từ GHTK */
export type ShippingStatus =
  | 'pending'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'cannot_pickup'
  | 'cannot_deliver'
  | 'delay_pickup'
  | 'delay_delivery'
  | 'returning'
  | 'returned'
  | 'refunded'
  | 'reconciled_return'
  | string;

/** Response GET /shipping/fee */
export interface GhtkShippingFeeResponse {
  success: boolean;
  data: {
    name?: string;
    fee: number;
    insurance_fee: number;
    delivery: boolean;
    delivery_type?: string;
    ship_fee_only?: number;
    extFees?: Array<{
      title: string;
      amount: number;
      type: string;
    }>;
    options?: {
      name?: string;
      shipMoney?: number;
      shipMoneyText?: string;
    };
  };
}

/** Response POST /shipping/create-shipment/:orderId */
export interface CreateShipmentResponse {
  message: string;
  shipment: {
    id: string;
    trackingNumber: string;
    trackingUrl: string;
    fee: number;
    estimatedPickTime?: string;
    estimatedDeliverTime?: string;
  };
}

/** Response GET /shipping/status/:orderId */
export interface ShipmentStatusResponse {
  shipment: {
    id: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShippingStatus;
    shippingFee: number;
    statusUpdatedAt: string | null;
  };
  ghtkStatus: {
    label_id: string;
    status: string;
    status_text: string;
    pick_date: string;
    deliver_date: string;
    ship_money: number;
    weight: number;
  } | null;
}

/** Response POST /shipping/cancel/:orderId */
export interface CancelShipmentResponse {
  message: string;
}

/** Params cho GET /shipping/fee */
export interface ShippingFeeParams {
  pick_province: string;
  pick_district?: string;
  pick_ward?: string;
  province: string;
  district?: string;
  ward?: string;
  weight: number; // gram
  value?: number;
}
