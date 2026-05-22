import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import type {
  Category,
  CategoryDetailResponse,
  CreateCategoryPayload,
  CreateCategoryResponse,
  UpdateCategoryPayload,
  UpdateCategoryResponse,
} from './category.type';

const base = '/category';

export const categoryKey = {
  list: ['category', 'list'] as const,
  detail: (id: string) => ['category', 'detail', id] as const,
};

export const categoryApis = {
  list: () =>
    apiClient
      .get<{ message: string; categories: Category[] }>(`${base}/`)
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<CategoryDetailResponse>(`${base}/${id}`).then((r) => r.data),

  create: (body: CreateCategoryPayload) =>
    apiClient.post<CreateCategoryResponse>(`${base}/`, body).then((r) => r.data),

  update: (id: string, body: UpdateCategoryPayload) =>
    apiClient.put<UpdateCategoryResponse>(`${base}/${id}`, body).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`${base}/${id}`).then((r) => r.data),
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKey.list,
    queryFn: () => categoryApis.list().then((res) => res.categories ?? []),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCategory(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: categoryKey.detail(id),
    queryFn: () => categoryApis.getById(id),
    enabled: !!id && enabled,
  });
}

export function useCreateCategory(props?: {
  onSuccess?: (data: CreateCategoryResponse) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryPayload) => categoryApis.create(body),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: categoryKey.list });
      props?.onSuccess?.(data);
    },
    onError: props?.onError,
  });
}

export function useUpdateCategory(props?: {
  onSuccess?: (data: UpdateCategoryResponse) => void;
  onError?: (error: AxiosError<unknown>) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryPayload }) =>
      categoryApis.update(id, body),
    onSuccess: (data, vars) => {
      void qc.invalidateQueries({ queryKey: categoryKey.list });
      void qc.invalidateQueries({ queryKey: categoryKey.detail(vars.id) });
      props?.onSuccess?.(data);
    },
    onError: props?.onError,
  });
}

export function useDeleteCategory(props?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError<unknown>) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApis.remove(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: categoryKey.list });
      void qc.removeQueries({ queryKey: categoryKey.detail(id) });
      props?.onSuccess?.();
    },
    onError: props?.onError,
  });
}
