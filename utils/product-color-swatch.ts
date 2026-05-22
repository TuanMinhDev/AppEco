import { AppEco } from '@/constants/theme';

/** API thường gửi tên màu (VN/EN); RN chỉ vẽ được CSS color hợp lệ. */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  đỏ: '#EF4444',
  'đỏ đậm': '#B91C1C',
  'đỏ tươi': '#F43F5E',
  trắng: '#FFFFFF',
  đen: '#171717',
  xanh: '#22C55E',
  'xanh lá': '#16A34A',
  'xanh lục': '#15803D',
  'xanh dương': '#2563EB',
  'xanh da trời': '#2563EB',
  'xanh navy': '#1E3A8A',
  'xanh ngọc': AppEco.primaryLight,
  'xanh mint': '#6EE7B7',
  vàng: AppEco.accentSoft,
  'vàng nhạt': '#FDE047',
  cam: '#EA580C',
  'cam đất': '#C2410C',
  hồng: '#EC4899',
  'hồng phấn': '#F9A8D4',
  tím: '#9333EA',
  'tím than': '#4C1D95',
  nâu: '#78350F',
  'nâu đất': '#92400E',
  xám: AppEco.textSecondary,
  'xám đậm': AppEco.text,
  be: '#D6C0A8',
  kem: '#FFF8E7',
  bạc: '#C0C0C0',
  'vàng kim': '#D4AF37',
  red: '#EF4444',
  white: '#FFFFFF',
  black: '#171717',
  green: '#22C55E',
  blue: '#2563EB',
  navy: '#1E3A8A',
  yellow: AppEco.accentSoft,
  orange: '#EA580C',
  pink: '#EC4899',
  purple: '#9333EA',
  brown: '#78350F',
  gray: AppEco.textSecondary,
  grey: AppEco.textSecondary,
  silver: '#C0C0C0',
  gold: '#D4AF37',
};

function normalizeColorKey(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function expandShortHex(hex: string) {
  if (hex.length === 4 && hex.startsWith('#')) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

export function resolveSwatchFill(raw: string): string {
  const t = raw.trim();
  if (!t) return AppEco.border;
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(t)) return expandShortHex(t);
  if (/^rgba?\(/i.test(t)) return t;
  const mapped = COLOR_NAME_TO_HEX[normalizeColorKey(t)];
  if (mapped) return mapped;
  return AppEco.border;
}

export function isLightFill(fill: string): boolean {
  if (!fill.startsWith('#')) return false;
  const h = expandShortHex(fill).replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.82;
}
