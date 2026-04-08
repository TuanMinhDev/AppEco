import type {
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
export function toShippingAddress(
  info: Partial<ShippingInfo>
): OrderShippingAddressSnapshot | null {
  const fullName = info.fullName?.trim();
  const phone = info.phone?.trim();
  const city = info.city?.trim();
  const district = info.district?.trim();
  const ward = info.ward?.trim();
  const line = (info.street ?? info.address ?? '').trim();
  if (!fullName || !phone || !city || !district || !ward || !line) return null;
  return {
    fullName,
    phoneNumber: phone,
    address: line,
    city,
    district,
    ward,
  };
}
