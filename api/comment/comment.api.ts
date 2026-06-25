import { useListOrder } from '@/api/order/order.api';
import type { OrderListResponse } from '@/api/order/order.type';
import { getOrderLineProductId } from '@/api/order/order.utils';
import { invalidateRecommendationQueries } from '@/api/ai/ai.api';
import { apiClient } from '@/src/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError, AxiosResponse } from 'axios';
import { useMemo } from 'react';

import type {
    CommentsByProductResponse,
    CreateCommentBody,
    CreateCommentResponse,
    ReviewableItemsResponse,
} from './comment.type';

const base = '/comment';

export const commentUri = {
  create: `${base}/`,
  byProduct: (productId: string) => `${base}/product/${productId}`,
  reviewableItems: (orderId: string) => `${base}/order/${orderId}/reviewable-items`,
};

export const commentKey = {
  BY_PRODUCT: 'COMMENT_BY_PRODUCT',
  REVIEWABLE_ITEMS: 'REVIEWABLE_ITEMS',
};

export const commentApis = {
  listByProduct: (productId: string) =>
    apiClient.get<CommentsByProductResponse>(commentUri.byProduct(productId)).then((r) => r.data),

  create: (body: CreateCommentBody) =>
    apiClient.post<CreateCommentResponse>(commentUri.create, body).then((r) => r.data),

  getReviewableItems: (orderId: string) =>
    apiClient.get<ReviewableItemsResponse>(commentUri.reviewableItems(orderId)).then((r) => r.data),
};

export const useCommentsByProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: [commentKey.BY_PRODUCT, productId ?? ''],
    queryFn: () => commentApis.listByProduct(productId!),
    enabled: !!productId,
    placeholderData: (p) => p,
  });
};

export function useCanReviewProduct(productId: string | undefined) {
  const { data: listRes } = useListOrder();
  return useMemo(() => {
    if (!productId) return false;
    const orders =
      (listRes as AxiosResponse<OrderListResponse> | undefined)?.data?.orders ?? [];
    return orders.some(
      (o) =>
        String(o.status) === 'delivered' &&
        (o.items ?? []).some((line) => getOrderLineProductId(line) === productId)
    );
  }, [listRes, productId]);
}

export const useReviewableItems = (orderId: string | undefined) => {
  return useQuery({
    queryKey: [commentKey.REVIEWABLE_ITEMS, orderId ?? ''],
    queryFn: () => commentApis.getReviewableItems(orderId!),
    enabled: !!orderId,
  });
};

export const useCreateComment = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<CreateCommentBody, 'productId'>) =>
      commentApis.create({ ...body, productId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [commentKey.BY_PRODUCT, productId] });
      void qc.invalidateQueries({ queryKey: [commentKey.REVIEWABLE_ITEMS] });
      void invalidateRecommendationQueries(qc);
    },
    onError: (error) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 409) {
        void qc.invalidateQueries({ queryKey: [commentKey.REVIEWABLE_ITEMS] });
      }
    },
  });
};
