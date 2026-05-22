import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import {
  AdminUserListItem,
  GetMeResponse,
  SellerPublicShop,
  UpdateUserInfoPayload,
  UpdateUserInfoResponse,
} from './user.type';

const userBase = '/user';

export const userUri = {
  me: `${userBase}/me`,
  sellerPublic: (sellerId: string) => `${userBase}/seller/${sellerId}`,
  updateInfo: `${userBase}/update-info`,
  all: `${userBase}/all`,
  delete: (id: string) => `${userBase}/delete/${id}`,
};

export const userQueryKey = {
  me: ['user', 'me'] as const,
  sellerPublic: (sellerId: string) => ['user', 'seller', sellerId] as const,
  adminList: (search: string, role: string) =>
    ['user', 'admin', 'all', search, role] as const,
};

export const userApis = {
  getMe: () =>
    apiClient.get<GetMeResponse>(userUri.me).then((r) => r.data),

  getSellerPublic: (sellerId: string) =>
    apiClient
      .get<{ data: SellerPublicShop }>(userUri.sellerPublic(sellerId))
      .then((r) => r.data.data),

  updateInfo: (payload: UpdateUserInfoPayload) =>
    apiClient
      .put<UpdateUserInfoResponse>(userUri.updateInfo, payload)
      .then((r) => r.data),

  /** Admin: danh sách user — query: search | keyword | q | name, role */
  getAll: (params?: { search?: string; keyword?: string; q?: string; name?: string; role?: string }) =>
    apiClient.get<AdminUserListItem[]>(userUri.all, { params }).then((r) => r.data),

  /** Admin */
  deleteById: (id: string) =>
    apiClient.delete<{ message: string }>(userUri.delete(id)).then((r) => r.data),
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: userQueryKey.me,
    queryFn: () => userApis.getMe(),
  });
};

export const useSellerPublicShop = (sellerId: string) => {
  return useQuery({
    queryKey: userQueryKey.sellerPublic(sellerId),
    queryFn: () => userApis.getSellerPublic(sellerId),
    enabled: !!sellerId,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return count < 2;
    },
  });
};

export const useUpdateUserInfo = (props?: {
  onSuccess?: (data: UpdateUserInfoResponse) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserInfoPayload) => userApis.updateInfo(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: userQueryKey.me });
      props?.onSuccess?.(data);
    },
    onError: props?.onError,
  });
};

/** Admin */
export const useAdminUserList = (
  params?: { search?: string; role?: string },
  enabled: boolean = true,
) => {
  const search = params?.search?.trim() ?? '';
  const role = params?.role ?? '';
  return useQuery({
    queryKey: userQueryKey.adminList(search, role),
    queryFn: () =>
      userApis.getAll(
        search
          ? { search, ...(role ? { role } : {}) }
          : role
            ? { role }
            : undefined,
      ),
    enabled,
  });
};

export const useDeleteUserByAdmin = (props?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<unknown>) => void;
}) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApis.deleteById(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user', 'admin'] });
      void qc.invalidateQueries({ queryKey: userQueryKey.me });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
};
