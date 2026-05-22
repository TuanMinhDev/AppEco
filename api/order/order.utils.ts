import type {
  OrderLineItemResolved,
  OrderProductPopulated,
  OrderShippingAddressSnapshot,
  ShippingOptionRow,
  ShippingOptionsResponse,
} from './order.type';
import type { ShippingInfo } from '@/src/store/slices/checkoutSlice';

export function getShippingOptionRows(
  r: ShippingOptionsResponse | undefined
): ShippingOptionRow[] {
  if (!r) return [];
  if ('combinedOptions' in r && Array.isArray(r.combinedOptions) && r.combinedOptions.length > 0) {
    return r.combinedOptions;
  }
  if ('options' in r && Array.isArray(r.options) && r.options.length > 0) {
    return r.options;
  }
  return [];
}

export function isMultiShippingResponse(
  r: ShippingOptionsResponse | undefined
): r is Extract<ShippingOptionsResponse, { multiSeller: boolean }> {
  return !!r && 'multiSeller' in r;
}

/** Map state checkout → body shippingAddress (doc.md). */
export function getOrderLineProductId(line: OrderLineItemResolved): string {
  const p = line.productId;
  if (typeof p === 'string') return p;
  return p._id;
}

/** productId populate hoặc string — dùng khi so khớp reviewable-items */
export function toProductIdString(
  productId: string | OrderProductPopulated | null | undefined
): string {
  if (productId == null) return '';
  if (typeof productId === 'object' && '_id' in productId) {
    return String(productId._id);
  }
  return String(productId);
}

export function getOrderLineItemId(line: OrderLineItemResolved): string | undefined {
  const id = line._id;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

/**
 * Khi BE chưa trả _id trên từng dòng đơn: chỉ an toàn nếu đúng một dòng reviewable trùng productId.
 */
export function resolveReviewableOrderItemId(
  line: OrderLineItemResolved,
  reviewable: Array<{ orderItemId: string; productId: string | OrderProductPopulated }>
): string | undefined {
  const fromLine = getOrderLineItemId(line);
  if (fromLine) return fromLine;
  const pid = getOrderLineProductId(line);
  const matches = reviewable.filter((r) => toProductIdString(r.productId) === pid);
  if (matches.length === 1) return matches[0].orderItemId;
  return undefined;
}

export function toShippingAddress(
  info: Partial<ShippingInfo>
): OrderShippingAddressSnapshot | null {
  const fullName = info.fullName?.trim();
  const phone = info.phone?.trim();
  const province = (info.province ?? info.city)?.trim();
  const district = info.district?.trim();
  const ward = info.ward?.trim();
  const line = (info.street ?? info.address ?? '').trim();
  if (!fullName || !phone || !province || !ward || !line) return null;
  const snap: OrderShippingAddressSnapshot = {
    fullName,
    phoneNumber: phone,
    address: line,
    province,
    ward,
  };
  if (info.city?.trim()) snap.city = info.city.trim();
  if (district) snap.district = district;
  return snap;
}
