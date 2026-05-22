import { notificationKey } from '@/api/notification/notification.api';
import { apiClient } from '@/src/api/client';
import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreateOrderBody,
  Order,
  OrderDetailResponse,
  OrderListResponse,
  ShippingOptionsResponse,
  UpdateOrderStatusBody,
} from './order.type';

const URL = '/order';

export const orderUri = {
  list: URL,
  create: `${URL}/create`,
  detail: `${URL}/:id`,
  status: `${URL}/status/:id`,
  remove: `${URL}/:id`,
  shippingOptions: `${URL}/shipping-options`,
  sellerList: `${URL}/seller`,
  sellerDetail: `${URL}/seller/:id`,
};

export const orderKey = {
  LIST_ORDER: 'LIST_ORDER',
<<<<<<< HEAD
  SHIPPING_OPTIONS: 'SHIPPING_OPTIONS',
  ORDER_DETAIL: 'ORDER_DETAIL',
  LIST_SELLER_ORDERS: 'LIST_SELLER_ORDERS',
  SELLER_ORDER_DETAIL: 'SELLER_ORDER_DETAIL',
};

/** Sau khi tạo đơn (POST /order/create): làm mới danh sách đơn + thông báo. */
export function invalidateQueriesAfterOrderCreated(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: [orderKey.LIST_ORDER] }),
    qc.invalidateQueries({ queryKey: notificationKey.root }),
  ]);
}

/** Socket / realtime: cập nhật danh sách đơn và chi tiết một đơn (nếu có orderId). */
export function invalidateOrderQueriesFromRealtimeEvent(
  qc: QueryClient,
  orderId?: string,
) {
  const p: Promise<unknown>[] = [
    qc.invalidateQueries({ queryKey: [orderKey.LIST_ORDER] }),
  ];
  if (orderId) {
    p.push(qc.invalidateQueries({ queryKey: [orderKey.ORDER_DETAIL, orderId] }));
  }
  return Promise.all(p);
}

export const orderApis = {
  list: () => apiClient.get<OrderListResponse>(orderUri.list),

  listForSeller: (params?: { sellerId?: string }) =>
    apiClient.get<OrderListResponse>(orderUri.sellerList, { params }),

  getSellerById: (id: string) =>
    apiClient.get<OrderDetailResponse>(
      orderUri.sellerDetail.replace(':id', id),
    ),

  shippingOptions: (params: { addressId: string; productIds: string }) =>
    apiClient.get<ShippingOptionsResponse>(orderUri.shippingOptions, { params }),

  create: (body: CreateOrderBody) => apiClient.post<Order>(orderUri.create, body),

  getById: (id: string) =>
    apiClient.get<OrderDetailResponse>(orderUri.detail.replace(':id', id)),

  updateStatus: (id: string, body: UpdateOrderStatusBody) =>
    apiClient.put<Order>(orderUri.status.replace(':id', id), body),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(orderUri.remove.replace(':id', id)),
};

export const useCreateOrder = (props?: {
  onSuccess?: (data: Order) => void;
  onError?: (error: unknown) => void;
=======
  CREATE_ORDER: 'CREATE_ORDER',
}

export const orderApis = {
  listOrder: () => {
    return apiClient.get<OrderListResponse>(orderUri.listOrder);
  },
  createOrder: (data: CreateOrderBody) => {
    return apiClient.post<IOrder>(orderUri.createOrder, data);
  },
};

export const useCreateOrder = (props?: {
  onSuccess?: (data: IOrder) => void;
  onError?: (error: any) => void;
>>>>>>> 5fdd048d6def3ad37c8dea7356a5f96ff14d38f0
}) => {
  const { onSuccess, onError } = props ?? {};
  const queryClient = useQueryClient();

  return useMutation({
<<<<<<< HEAD
    mutationFn: (data: CreateOrderBody) => orderApis.create(data),
    onSuccess: (response) => {
      void invalidateQueriesAfterOrderCreated(queryClient);
      onSuccess?.(response.data);
=======
    mutationFn: (data: CreateOrderBody) => orderApis.createOrder(data).then(res => res.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [orderKey.LIST_ORDER],
        refetchType: 'active',
      });
      onSuccess?.(data);
>>>>>>> 5fdd048d6def3ad37c8dea7356a5f96ff14d38f0
    },
    onError,
  });
};

export const useListOrder = () => {
  return useQuery({
    queryKey: [orderKey.LIST_ORDER],
<<<<<<< HEAD
    queryFn: () => orderApis.list(),
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};

export const useShippingOptions = (
  addressId: string | undefined,
  productIds: string[]
) => {
  const csv = [...new Set(productIds.filter(Boolean))].join(',');
  return useQuery({
    queryKey: [orderKey.SHIPPING_OPTIONS, addressId ?? '', csv],
    queryFn: () =>
      orderApis.shippingOptions({
        addressId: addressId!,
        productIds: csv,
      }),
    enabled: !!addressId && csv.length > 0,
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};

export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: [orderKey.ORDER_DETAIL, id],
    queryFn: () => orderApis.getById(id),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};

export const useListSellerOrders = (
  sellerId?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [orderKey.LIST_SELLER_ORDERS, sellerId ?? ''],
    queryFn: () => orderApis.listForSeller({ sellerId: sellerId! }),
    select: (d) => d.data,
    enabled: enabled && !!sellerId,
  });
};

export const useSellerOrderDetail = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [orderKey.SELLER_ORDER_DETAIL, id],
    queryFn: () => orderApis.getSellerById(id),
    enabled: enabled && !!id,
    select: (d) => d.data,
  });
};

export const useUpdateOrderStatus = (props?: {
  onSuccess?: () => void;
  onError?: (e: unknown) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: UpdateOrderStatusBody['status'];
    }) => orderApis.updateStatus(id, { status }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [orderKey.LIST_SELLER_ORDERS] });
      void qc.invalidateQueries({ queryKey: [orderKey.SELLER_ORDER_DETAIL] });
      void qc.invalidateQueries({ queryKey: [orderKey.LIST_ORDER] });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};
=======
    queryFn: () => orderApis.listOrder(),
    select: (data) => data,
    placeholderData: (previousData) => previousData,
  });
};

>>>>>>> 5fdd048d6def3ad37c8dea7356a5f96ff14d38f0
