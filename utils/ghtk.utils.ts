/**
 * GHTK Utilities — AppEco
 *
 * Tiện ích GHTK cho mobile app: tracking URL, status message, normalize phí ship
 * Adapted from ssp_ecommerce_mobile/src/utils/ghtk.ts
 */

/** Base URL tra cứu vận đơn GHTK khách hàng */
export const GHTK_TRACKING_BASE = 'https://khachhang.giaohangtietkiem.vn/tracking';

/** Xây dựng URL tracking từ mã vận đơn */
export function getGhtkTrackingUrl(trackingNumber: string): string {
  return `${GHTK_TRACKING_BASE}/${encodeURIComponent(trackingNumber)}`;
}

/** Lấy URL tracking từ shipment object (ưu tiên trackingUrl nếu có) */
export function resolveGhtkTrackingUrl(shipment: {
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): string | null {
  const trackingNumber = shipment.trackingNumber?.trim();
  if (!trackingNumber) return null;
  const url = shipment.trackingUrl?.trim();
  return url || getGhtkTrackingUrl(trackingNumber);
}

/** Mã trạng thái GHTK → nhãn tiếng Việt */
const GHTK_STATUS_LABELS: Record<number, string> = {
  [-1]: 'Đã hủy',
  1: 'Chờ lấy hàng',
  2: 'Đã tiếp nhận',
  3: 'Đã lấy hàng',
  4: 'Đang giao hàng',
  5: 'Giao thành công',
  6: 'Đã đối soát',
  7: 'Không lấy được hàng',
  8: 'Hoãn lấy hàng',
  9: 'Không giao được',
  10: 'Delay giao hàng',
  11: 'Đã đối soát hoàn',
  12: 'Đang lấy hàng',
  13: 'Bồi hoàn',
  20: 'Đang trả hàng',
  21: 'Đã trả hàng',
  123: 'Shipper đã lấy hàng',
  127: 'Shipper báo không lấy được',
  128: 'Shipper báo hoãn lấy',
  45: 'Shipper báo đã giao',
  49: 'Shipper báo không giao được',
  410: 'Shipper báo delay giao',
};

export function getGhtkStatusMessage(
  statusId: number | string | null | undefined,
): string {
  if (statusId == null) return 'Đang cập nhật';
  const code = typeof statusId === 'string' ? parseInt(statusId, 10) : statusId;
  if (isNaN(code)) return 'Đang cập nhật';
  return GHTK_STATUS_LABELS[code] || `Trạng thái ${code}`;
}

/** Shipping status chi tiết → nhãn ngắn cho UI */
const SHIPPING_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ lấy hàng',
  in_transit: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy',
  cannot_pickup: 'Không lấy được hàng',
  cannot_deliver: 'Không giao được',
  delay_pickup: 'Hoãn lấy hàng',
  delay_delivery: 'Delay giao hàng',
  returning: 'Đang trả hàng',
  returned: 'Đã trả hàng',
  refunded: 'Bồi hoàn',
  reconciled_return: 'Đã đối soát hoàn',
};

export function getShippingStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Chưa có thông tin';
  return SHIPPING_STATUS_LABELS[status] || status;
}

/** Shipping status → màu badge */
export function getShippingStatusColor(
  status: string | null | undefined,
): string {
  if (!status) return '#999';
  const colors: Record<string, string> = {
    pending: '#f59e0b',       // amber
    in_transit: '#3b82f6',    // blue
    delivered: '#10b981',     // green
    cancelled: '#ef4444',     // red
    cannot_pickup: '#ef4444',
    cannot_deliver: '#ef4444',
    delay_pickup: '#f59e0b',
    delay_delivery: '#f59e0b',
    returning: '#8b5cf6',     // purple
    returned: '#6366f1',      // indigo
    refunded: '#ef4444',
    reconciled_return: '#10b981',
  };
  return colors[status] || '#999';
}

// ════════════════════════════════════════════════════════════════════════
// Normalize phí ship từ response
// ════════════════════════════════════════════════════════════════════════

function pickFeeNumber(obj: Record<string, unknown> | null | undefined): number | null {
  if (!obj) return null;
  const candidates = [
    obj.fee,
    obj.ship_fee_only,
    obj.ship_fee,
    obj.shippingFee,
  ];
  for (const c of candidates) {
    if (c != null && !Number.isNaN(Number(c))) return Number(c);
  }
  return null;
}

/** Trích phí ship từ response GHTK (hỗ trợ cả data.fee, data.data.fee) */
export function normalizeGhtkFee(res: unknown): number | null {
  if (res == null) return null;
  if (typeof res === 'number' && !Number.isNaN(res)) return res;
  if (typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;

  if (typeof r.data === 'number' && !Number.isNaN(r.data)) return r.data;

  let raw = pickFeeNumber(r);
  if (raw == null && r.data != null && typeof r.data === 'object') {
    raw = pickFeeNumber(r.data as Record<string, unknown>);
  }
  return raw;
}

/** Kiểm tra GHTK có giao tuyến này không (delivery: false = không giao) */
export function isGhtkDeliveryAvailable(res: unknown): boolean {
  if (res == null || typeof res !== 'object') return true;
  const r = res as Record<string, unknown>;
  const inner =
    r.data != null && typeof r.data === 'object'
      ? (r.data as Record<string, unknown>)
      : r;
  if (inner.delivery === false) return false;
  return true;
}

/** Lấy thông báo lỗi phí ship */
export function getGhtkShippingFeeError(res: unknown): string | null {
  if (res == null || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  if (r.success === false) {
    const msg = r.error ?? r.message;
    return typeof msg === 'string' && msg.trim()
      ? msg.trim()
      : 'Chưa tính được phí ship';
  }
  return null;
}

/** Format tiền VND */
export function formatVND(amount: number | null | undefined): string {
  if (amount == null) return '0₫';
  return amount.toLocaleString('vi-VN') + '₫';
}
