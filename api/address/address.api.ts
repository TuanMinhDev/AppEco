const URI = '/api/v1/address';

import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { 
  CreateAddressPayload, 
  UpdateAddressPayload,
  GetAddressResponse, 
  GetAddressesByUserResponse,
  CreateAddressResponse, 
  UpdateAddressResponse, 
  DeleteAddressResponse,
  SetDefaultAddressResponse
} from './address.type';

export const addressUri = {
  getAddress: (id: string) => `${URI}/${id}`,
  getAddressesByUser: (userId: string) => `${URI}/user/${userId}`,
  createAddress: `${URI}`,
  updateAddress: (id: string) => `${URI}/${id}`,
  deleteAddress: (id: string) => `${URI}/${id}`,
  setDefaultAddress: (id: string) => `${URI}/${id}/default`,
};

export const addressKey = {
  GET_ADDRESS: 'GET_ADDRESS',
  GET_ADDRESSES_BY_USER: 'GET_ADDRESSES_BY_USER',
  CREATE_ADDRESS: 'CREATE_ADDRESS',
  UPDATE_ADDRESS: 'UPDATE_ADDRESS',
  DELETE_ADDRESS: 'DELETE_ADDRESS',
  SET_DEFAULT_ADDRESS: 'SET_DEFAULT_ADDRESS',
};

export const addressApis = {
  getAddress: (id: string) => {
    return apiClient.get<GetAddressResponse>(addressUri.getAddress(id));
  },
  getAddressesByUser: (userId: string) => {
    return apiClient.get<GetAddressesByUserResponse>(addressUri.getAddressesByUser(userId));
  },
  createAddress: (payload: CreateAddressPayload) => {
    return apiClient.post<CreateAddressResponse>(addressUri.createAddress, payload);
  },
  updateAddress: (id: string, payload: UpdateAddressPayload) => {
    return apiClient.put<UpdateAddressResponse>(addressUri.updateAddress(id), payload);
  },
  deleteAddress: (id: string) => {
    return apiClient.delete<DeleteAddressResponse>(addressUri.deleteAddress(id));
  },
  setDefaultAddress: (id: string) => {
    return apiClient.patch<SetDefaultAddressResponse>(addressUri.setDefaultAddress(id));
  },
};

export const useGetAddress = (id: string) => {
  return useQuery({
    queryKey: [addressKey.GET_ADDRESS, id],
    queryFn: () => addressApis.getAddress(id),
    select: (data) => data,
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetAddressesByUser = (userId: string) => {
  return useQuery({
    queryKey: [addressKey.GET_ADDRESSES_BY_USER, userId],
    queryFn: () => addressApis.getAddressesByUser(userId),
    select: (data) => data,
    enabled: !!userId,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateAddress = (props?: {
  onSuccess?: (data: CreateAddressResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => addressApis.createAddress(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: [addressKey.GET_ADDRESSES_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useUpdateAddress = (props?: {
  onSuccess?: (data: UpdateAddressResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAddressPayload }) => 
      addressApis.updateAddress(id, payload),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [addressKey.GET_ADDRESS, variables.id],
        refetchType: 'active',
      });
      void queryClient.invalidateQueries({
        queryKey: [addressKey.GET_ADDRESSES_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};

export const useDeleteAddress = (props?: {
  onSuccess?: (data: DeleteAddressResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) => addressApis.deleteAddress(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({
        queryKey: [addressKey.GET_ADDRESSES_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(_.data);
    },
    onError,
  });
};

export const useSetDefaultAddress = (props?: {
  onSuccess?: (data: SetDefaultAddressResponse) => void;
  onError?: (error: AxiosError<null>) => void;
}) => {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = props ?? {};

  return useMutation({
    mutationFn: (id: string) => addressApis.setDefaultAddress(id),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [addressKey.GET_ADDRESSES_BY_USER],
        refetchType: 'active',
      });
      onSuccess?.(data.data);
    },
    onError,
  });
};