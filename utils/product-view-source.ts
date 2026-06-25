import type { ProductViewSource } from '@/api/product/product.type';

/** Map query `?from=search|recommend` → source gửi POST /product/:id/view */
export function resolveProductViewSource(
  from: string | string[] | undefined,
): ProductViewSource {
  const raw = Array.isArray(from) ? from[0] : from;
  if (raw === 'search' || raw === 'recommend') return raw;
  return 'detail_page';
}
