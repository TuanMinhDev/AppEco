import { apiClient } from "@/src/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { ApiResponseList } from "@/src/api/client";
import {
  AddToCartPayload,
  AddToCartResponse, CartLineInput,
  DeleteCartItemsPayload,
  DeleteCartResponse, ICart, UpdateCartQuantityPayload,
  UpdateCartResponse
} from "./cart.type";

const URL = "/cart";

export const cartUri = {
  get: `${URL}/get`,
  add: `${URL}/add`,
  deleteItems: `${URL}/delete`,
  updateItem:  `${URL}/update/:id`,
};

export const cartKey = {
  LIST_CART: "LIST_CART",
};

export const cartApis = {
  getCart: () => apiClient.get<ApiResponseList<ICart[]>>(cartUri.get),

  addItems: (payload: AddToCartPayload) =>
    apiClient.post<AddToCartResponse>(cartUri.add, payload),

  addLine: (item: CartLineInput) => cartApis.addItems({ items: [item] }),

  deleteItems: (payload: DeleteCartItemsPayload) =>
    apiClient.delete<DeleteCartResponse>(cartUri.deleteItems, { data: payload }),

  updateItemQuantity: (itemId: string, payload: UpdateCartQuantityPayload) =>
    apiClient.put<UpdateCartResponse>(cartUri.updateItem.replace(':id', itemId), payload),
};

export const useListCart = () => {
  return useQuery({
    queryKey: [cartKey.LIST_CART],
    queryFn: () => cartApis.getCart(),
    placeholderData: (previousData) => previousData,
    select: (response) => {
      return response},
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
    }) => cartApis.updateItemQuantity(itemId, payload).then((res) => res.data),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [cartKey.LIST_CART] });
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
      onSuccess?.(data, variables);
    },
    onError,
  });
};
