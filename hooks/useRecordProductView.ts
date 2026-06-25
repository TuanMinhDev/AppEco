import { productApis } from '@/api/product/product.api';
import type { ProductViewSource } from '@/api/product/product.type';
import { useEffect } from 'react';

const VIEW_DELAY_MS = 3000;

/** Ghi lượt xem chi tiết SP sau khi user ở lại trang ~3s (chỉ khi đã login). */
export function useRecordProductView(
  productId: string | undefined,
  enabled: boolean,
  source: ProductViewSource = 'detail_page',
) {
  useEffect(() => {
    if (!enabled || !productId) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void productApis
        .recordView(productId, { source }, { signal: controller.signal })
        .catch(() => undefined);
    }, VIEW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [productId, enabled, source]);
}
