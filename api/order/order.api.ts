import { apiClient } from '@/src/api/client';
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
};

export const orderKey = {
  LIST_ORDER: 'LIST_ORDER',
  SHIPPING_OPTIONS: 'SHIPPING_OPTIONS',
  ORDER_DETAIL: 'ORDER_DETAIL',
};

export const orderApis = {
  list: () => apiClient.get<OrderListResponse>(orderUri.list),

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
}) => {
  const { onSuccess, onError } = props ?? {};
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderBody) => orderApis.create(data),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: [orderKey.LIST_ORDER] });
      onSuccess?.(response.data);
    },
    onError,
  });
};

export const useListOrder = () => {
  return useQuery({
    queryKey: [orderKey.LIST_ORDER],
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
