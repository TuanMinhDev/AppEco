import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateOrderBody, IOrder, OrderListResponse } from './order.type';

const URI = '/api/v1/order';

export const orderUri = {
  listOrder: `${URI}/get`,
  createOrder: `${URI}/create`,
};

export const orderKey = {
  LIST_ORDER: 'LIST_ORDER',
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
}) => {
  const { onSuccess, onError } = props ?? {};
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderBody) => orderApis.createOrder(data).then(res => res.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [orderKey.LIST_ORDER],
        refetchType: 'active',
      });
      onSuccess?.(data);
    },
    onError,
  });
};

export const useListOrder = () => {
  return useQuery({
    queryKey: [orderKey.LIST_ORDER],
    queryFn: () => orderApis.listOrder(),
    select: (data) => data,
    placeholderData: (previousData) => previousData,
  });
};

