import { useRecommendedProducts } from '@/api/ai/ai.api';
import type { RecommendResponse } from '@/api/ai/ai.type';
import { useMemo } from 'react';

import { useBehaviorExcludedProductIds } from './useBehaviorExcludedProductIds';

const FETCH_MULTIPLIER = 2;

/** Gợi ý sản phẩm đã loại SP theo hành vi user (mua, yêu thích, giỏ). */
export function useFilteredRecommendations(limit: number, isLoggedIn: boolean) {
  const fetchLimit = limit * FETCH_MULTIPLIER;
  const query = useRecommendedProducts(fetchLimit, { enabled: isLoggedIn });
  const excludeIds = useBehaviorExcludedProductIds(isLoggedIn);

  const filteredData = useMemo((): RecommendResponse | undefined => {
    if (!query.data) return undefined;

    const products = query.data.products
      .filter((p) => !excludeIds.has(p._id))
      .slice(0, limit);

    return { ...query.data, products };
  }, [query.data, excludeIds, limit]);

  return {
    ...query,
    data: filteredData,
    excludeIds,
  };
}
