import { invalidateRecommendationQueries } from '@/api/ai/ai.api';
import { apiClient, type ApiResponse } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import {
  AddToCartPayload,
  AddToCartResponse,
  Cart,
  CartLineInput,
  DeleteCartItemsPayload,
  DeleteCartResponse,
  GetCartResponse,
  ICart,
  UpdateCartQuantityPayload,
  UpdateCartResponse,
} from './cart.type';

const URL = '/cart';

export const cartUri = {
  get: `${URL}/get`,
  add: `${URL}/add`,
  deleteItems: `${URL}/delete`,
  updateItem: `${URL}/update/:id`,
};

export const cartKey = {
  LIST_CART: 'LIST_CART',
};

export const cartApis = {
  getCart: () => apiClient.get<GetCartResponse | ApiResponse<GetCartResponse>>(cartUri.get),

  addItems: (payload: AddToCartPayload) =>
    apiClient.post<AddToCartResponse>(cartUri.add, payload),

  addLine: (item: CartLineInput) => cartApis.addItems({ items: [item] }),

  deleteItems: (payload: DeleteCartItemsPayload) =>
    apiClient.delete<DeleteCartResponse>(cartUri.deleteItems, { data: payload }),

  updateItemQuantity: (itemId: string, payload: UpdateCartQuantityPayload) =>
    apiClient
      .put<UpdateCartResponse>(cartUri.updateItem.replace(':id', itemId), payload)
      .then((r) => r.data),
};

/** Chuẩn hoá items từ nhiều dạng body API có thể trả về */
export function extractCartItems(body: unknown): ICart[] {
  if (!body || typeof body !== 'object') return [];

  const root = body as Record<string, unknown>;

  if (root.cart && typeof root.cart === 'object') {
    const items = (root.cart as Cart).items;
    if (Array.isArray(items)) return items as ICart[];
  }

  if (root.data && typeof root.data === 'object') {
    return extractCartItems(root.data);
  }

  if (Array.isArray(root.items)) {
    return root.items as ICart[];
  }

  return [];
}

export const useListCart = (enabled: boolean = true) => {
  return useQuery({
    queryKey: [cartKey.LIST_CART],
    queryFn: () => cartApis.getCart().then((res) => res.data),
    enabled,
    select: (body) => extractCartItems(body),
  });
};

export const useCreateCart = (props?: {
  onSuccess?: (data: AddToCartResponse, variables: CartLineInput) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (item: CartLineInput) =>
      cartApis.addLine(item).then((res) => res.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [cartKey.LIST_CART] });
      void invalidateRecommendationQueries(queryClient);
      onSuccess?.(data, variables);
    },
    onError,
  });
};

export const useUpdateCartQuantity = (props?: {
  onSuccess?: (
    data: UpdateCartResponse,
    variables: { itemId: string; payload: UpdateCartQuantityPayload },
  ) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateCartQuantityPayload;
    }) => cartApis.updateItemQuantity(itemId, payload),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [cartKey.LIST_CART] });
      void invalidateRecommendationQueries(queryClient);
      onSuccess?.(data, variables);
    },
    onError,
  });
};

export const useDeleteCart = (props?: {
  onSuccess?: (
    data: DeleteCartResponse,
    variables: DeleteCartItemsPayload,
  ) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: DeleteCartItemsPayload) =>
      cartApis.deleteItems(payload).then((res) => res.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [cartKey.LIST_CART] });
      void invalidateRecommendationQueries(queryClient);
      onSuccess?.(data, variables);
    },
    onError,
  });
};
