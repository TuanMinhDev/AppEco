import { useListCart } from '@/api/cart/cart.api';
import { useFavoritesList } from '@/api/favorite/favorite.api';
import { useListOrder } from '@/api/order/order.api';
import { getOrderLineProductId, toProductIdString } from '@/api/order/order.utils';
import { useMemo } from 'react';

/** Gom ID sản phẩm cần loại khỏi gợi ý theo hành vi: mua, yêu thích, giỏ hàng. */
export function useBehaviorExcludedProductIds(isLoggedIn: boolean): Set<string> {
  const { data: favRes } = useFavoritesList(isLoggedIn);
  const { data: cartItems } = useListCart(isLoggedIn);
  const { data: orderListRes } = useListOrder(isLoggedIn);

  return useMemo(() => {
    const ids = new Set<string>();
    if (!isLoggedIn) return ids;

    for (const product of favRes?.favorites ?? []) {
      if (product._id) ids.add(product._id);
    }

    for (const item of cartItems ?? []) {
      const pid = toProductIdString(item.productId);
      if (pid) ids.add(pid);
    }

    const orders = orderListRes?.data?.orders ?? [];
    for (const order of orders) {
      if (String(order.status) === 'cancelled') continue;
      for (const line of order.items ?? []) {
        ids.add(getOrderLineProductId(line));
      }
    }

    return ids;
  }, [isLoggedIn, favRes, cartItems, orderListRes]);
}
