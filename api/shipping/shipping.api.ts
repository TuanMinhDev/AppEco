/**
 * Shipping API — GHTK Integration
 *
 * API client + React Query hooks cho luồng vận chuyển GHTK
 * Adapted from ssp_ecommerce_mobile checkout.api + vendor-orders.api
 */

import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderKey } from '@/api/order/order.api';

import type {
  GhtkShippingFeeResponse,
  CreateShipmentResponse,
  ShipmentStatusResponse,
  CancelShipmentResponse,
  ShippingFeeParams,
} from './shipping.type';

const BASE = '/shipping';

export const shippingUri = {
  fee: `${BASE}/fee`,
  createShipment: `${BASE}/create-shipment/:orderId`,
  cancel: `${BASE}/cancel/:orderId`,
  status: `${BASE}/status/:orderId`,
};

export const shippingKey = {
  SHIPPING_FEE: 'GHTK_SHIPPING_FEE',
  SHIPMENT_STATUS: 'SHIPMENT_STATUS',
};

// ════════════════════════════════════════════════════════════════════════
// API functions
// ════════════════════════════════════════════════════════════════════════

export const shippingApis = {
  /** Tính phí vận chuyển GHTK */
  getShippingFee: (params: Record<string, string | number | undefined>) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
    ) as Record<string, string | number>;
    return apiClient.get<GhtkShippingFeeResponse>(shippingUri.fee, {
      params: clean,
    });
  },

  /** Tạo vận đơn GHTK (seller action) */
  createShipment: (orderId: string) =>
    apiClient.post<CreateShipmentResponse>(
      shippingUri.createShipment.replace(':orderId', orderId),
      {},
    ),

  /** Hủy vận đơn GHTK (seller action) */
  cancelShipment: (orderId: string) =>
    apiClient.post<CancelShipmentResponse>(
      shippingUri.cancel.replace(':orderId', orderId),
      {},
    ),

  /** Tra cứu trạng thái shipment */
  getShipmentStatus: (orderId: string) =>
    apiClient.get<ShipmentStatusResponse>(
      shippingUri.status.replace(':orderId', orderId),
    ),
};

// ════════════════════════════════════════════════════════════════════════
// React Query hooks
// ════════════════════════════════════════════════════════════════════════

/** Tính phí ship GHTK — dùng ở Checkout screen */
export const useGhtkShippingFee = (
  params: Partial<ShippingFeeParams> & { sellerId?: string },
  enabled: boolean = true,
) => {
  // pick_province hoặc sellerId đều được — server tự resolve từ sellerId
  const hasPickOrigin = !!(params.pick_province || params.sellerId);
  const hasRequired = !!(hasPickOrigin && params.province && params.weight);
  return useQuery({
    queryKey: [
      shippingKey.SHIPPING_FEE,
      params.sellerId ?? params.pick_province,
      params.province,
      params.weight,
      params.ward,
    ],
    queryFn: () => shippingApis.getShippingFee(params as any),
    enabled: enabled && hasRequired,
    select: (res) => res.data,
    staleTime: 60_000, // Cache 1 phút
  });
};

/** Tra cứu trạng thái shipment — dùng ở Order Detail screen */
export const useShipmentStatus = (orderId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [shippingKey.SHIPMENT_STATUS, orderId],
    queryFn: () => shippingApis.getShipmentStatus(orderId),
    enabled: enabled && !!orderId,
    select: (res) => res.data,
    refetchInterval: 30_000, // Tự refresh mỗi 30s
  });
};

/** Tạo vận đơn GHTK — seller bấm "Gửi hàng" */
export const useCreateShipment = (props?: {
  onSuccess?: (data: CreateShipmentResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      shippingApis.createShipment(orderId),
    onSuccess: (response, variables) => {
      // Invalidate order queries to refresh UI
      void qc.invalidateQueries({ queryKey: [orderKey.LIST_ORDER] });
      void qc.invalidateQueries({ queryKey: [orderKey.LIST_SELLER_ORDERS] });
      void qc.invalidateQueries({
        queryKey: [orderKey.SELLER_ORDER_DETAIL, variables.orderId],
      });
      void qc.invalidateQueries({
        queryKey: [shippingKey.SHIPMENT_STATUS, variables.orderId],
      });
      props?.onSuccess?.(response.data);
    },
    onError: props?.onError,
  });
};

/** Hủy vận đơn GHTK */
export const useCancelShipment = (props?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      shippingApis.cancelShipment(orderId),
    onSuccess: (_res, variables) => {
      void qc.invalidateQueries({ queryKey: [orderKey.LIST_SELLER_ORDERS] });
      void qc.invalidateQueries({
        queryKey: [orderKey.SELLER_ORDER_DETAIL, variables.orderId],
      });
      void qc.invalidateQueries({
        queryKey: [shippingKey.SHIPMENT_STATUS, variables.orderId],
      });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};
