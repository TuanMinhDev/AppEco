import { apiClient, ApiResponseList, ApiResponse } from "@/src/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { CreateAddressPayload, IAddress } from "./address.type";

const URL = '/address';

export const addressUri = {
  list:    `${URL}`,
  create:  `${URL}`,
  update:  `${URL}/:id`,
  delete:  `${URL}/:id`,
  default: `${URL}/:id/default`,
  detail: `${URL}/:id`,
};

export const addressKey = {
  LIST_ADDRESS: 'LIST_ADDRESS',
  GET_DETAIL_ADDRESS: 'GET_DETAIL_ADDRESS',
};

export const addressApis = {
  list: () =>
    apiClient.get<ApiResponseList<IAddress[]>>(addressUri.list),

  create: (payload: CreateAddressPayload) =>
    apiClient.post<IAddress>(addressUri.create, payload),

  update: (id: string, payload: CreateAddressPayload) =>
    apiClient.put<IAddress>(addressUri.update.replace(':id', id), payload),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(addressUri.delete.replace(':id', id)),

  setDefault: (id: string) =>
    apiClient.put<IAddress>(addressUri.default.replace(':id', id)),
  detail: (id: string) =>
    apiClient.get<ApiResponse<IAddress>>(addressUri.detail.replace(':id', id)),
};

export const useListAddress = () => {
  return useQuery({
    queryKey: [addressKey.LIST_ADDRESS],
    queryFn: () => addressApis.list(),
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
};

export const useCreateAddress = (props?: {
  onSuccess?: (data: IAddress) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: CreateAddressPayload) =>
      addressApis.create(payload).then((res) => res.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [addressKey.LIST_ADDRESS] });
      onSuccess?.(data);
    },
    onError,
  });
};

export const useUpdateAddress = (props?: {
  onSuccess?: (data: IAddress) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateAddressPayload }) =>
      addressApis.update(id, payload).then((res) => res.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [addressKey.LIST_ADDRESS] });
      void queryClient.invalidateQueries({ queryKey: [addressKey.GET_DETAIL_ADDRESS] });
      onSuccess?.(data);
    },
    onError,
  });
};

export const useDeleteAddress = (props?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) =>
      addressApis.delete(id).then((res) => res.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [addressKey.LIST_ADDRESS] });
      void queryClient.invalidateQueries({ queryKey: [addressKey.GET_DETAIL_ADDRESS] });
      onSuccess?.();
    },
    onError,
  });
};

export const useSetDefaultAddress = (props?: {
  onSuccess?: (data: IAddress) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) =>
      addressApis.setDefault(id).then((res) => res.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: [addressKey.LIST_ADDRESS] });
      void queryClient.invalidateQueries({ queryKey: [addressKey.GET_DETAIL_ADDRESS] });
      onSuccess?.(data);
    },
    onError,
  });
};

export const useDetailAddress = (id: string) => {
  return useQuery({
    queryKey: [addressKey.GET_DETAIL_ADDRESS, id],
    queryFn: () => addressApis.detail(id),
    select: (data) => data,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
  });
}
