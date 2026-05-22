import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  AddFavoriteResponse,
  FavoritesListResponse,
  RemoveFavoriteResponse,
} from './favorite.type';

const base = '/favorite';

export const favoriteKey = {
  list: ['favorite', 'list'] as const,
};

export const favoriteApis = {
  list: () =>
    apiClient.get<FavoritesListResponse>(base).then((r) => r.data),

  add: (productId: string) =>
    apiClient.post<AddFavoriteResponse>(base, { productId }).then((r) => r.data),

  remove: (productId: string) =>
    apiClient
      .delete<RemoveFavoriteResponse>(`${base}/${encodeURIComponent(productId)}`)
      .then((r) => r.data),
};

export const useFavoritesList = (enabled: boolean) => {
  return useQuery({
    queryKey: favoriteKey.list,
    queryFn: () => favoriteApis.list(),
    enabled,
    retry: (count, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) return false;
      return count < 2;
    },
  });
};

export const useAddFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => favoriteApis.add(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: favoriteKey.list });
    },
  });
};

export const useRemoveFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => favoriteApis.remove(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: favoriteKey.list });
    },
  });
};

/** Một mutation cho card danh sách (tránh hai hook mutate trên mỗi ô). */
export const useToggleProductFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, remove }: { productId: string; remove: boolean }) => {
      if (remove) return favoriteApis.remove(productId);
      return favoriteApis.add(productId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: favoriteKey.list });
    },
  });
};
