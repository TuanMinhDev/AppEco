/**
 * API AI: gợi ý sản phẩm (qua NodeTS proxy → Python AI).
 */

import { apiClient } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';
import type {
  AiHealthResponse,
  RecommendResponse,
} from './ai.type';

const URL = '/ai';

export const aiKeys = {
  RECOMMEND: 'AI_RECOMMEND',
  POPULAR: 'AI_POPULAR',
  HEALTH: 'AI_HEALTH',
};

// ─── Recommendation ─────────────────────────────────────────

export const aiApis = {
  /** Gợi ý sản phẩm cá nhân hóa (cần auth) */
  getRecommendations: (limit = 10) =>
    apiClient.get<RecommendResponse>(`${URL}/recommend`, { params: { limit } }),

  /** Sản phẩm phổ biến (không cần auth) */
  getPopular: (limit = 10) =>
    apiClient.get<RecommendResponse>(`${URL}/recommend/popular`, { params: { limit } }),

  /** Kiểm tra NodeTS + Python AI (không cần auth) */
  health: () => apiClient.get<AiHealthResponse>(`${URL}/health`),
};

/** Hook: lấy sản phẩm gợi ý cá nhân */
export const useRecommendedProducts = (limit = 10) => {
  return useQuery({
    queryKey: [aiKeys.RECOMMEND, limit],
    queryFn: () => aiApis.getRecommendations(limit),
    staleTime: 1000 * 60 * 5, // cache 5 phút
    select: (res) => res.data,
  });
};

/** Hook: lấy sản phẩm phổ biến */
export const usePopularProducts = (limit = 10) => {
  return useQuery({
    queryKey: [aiKeys.POPULAR, limit],
    queryFn: () => aiApis.getPopular(limit),
    staleTime: 1000 * 60 * 5,
    select: (res) => res.data,
  });
};

/** Hook: health check AI pipeline */
export const useAiHealth = (options?: { enabled?: boolean; refetchInterval?: number }) => {
  return useQuery({
    queryKey: [aiKeys.HEALTH],
    queryFn: () => aiApis.health(),
    staleTime: 1000 * 30,
    select: (res) => res.data,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
};
