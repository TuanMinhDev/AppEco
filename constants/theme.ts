/**
 * Theme: navigation (light/dark) + Pine design tokens (light-first UI).
 */

import { Platform } from 'react-native';

/** Palette Pine — dùng xuyên suốt UI (`AppEco` giữ tên export để tương thích mã hiện có). */
export const AppEco = {
  primary: '#0F766E',
  primaryDark: '#0D5E57',
  primaryLight: '#14B8A6',
  primarySubtle: '#5EEAD4',
  primaryMuted: 'rgba(15, 118, 110, 0.12)',

  accent: '#CA8A04',
  accentSoft: '#EAB308',

  background: '#F3FAF8',
  backgroundWarm: '#F7FAF6',
  surface: '#FFFFFF',
  surfaceMuted: '#ECFDF5',

  border: '#CFE8E4',
  borderSoft: '#E8F4F0',

  text: '#134E4A',
  textSecondary: '#5F7673',
  textMuted: '#8FA9A4',

  success: '#059669',
  danger: '#DC2626',
  sale: '#E11D48',

  /** LinearGradient tuple */
  heroGradient: ['#0F766E', '#0D9488', '#2DD4BF'] as const,
  cardGradient: ['#F0FDFA', '#FFFFFF'] as const,
  fabGradient: ['#0F766E', '#14B8A6'] as const,

  radiusSm: 12,
  radiusMd: 16,
  radiusLg: 20,
  radiusXl: 28,
  radiusFull: 999,

  shadowSoft: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  shadowCard: {
    shadowColor: '#134E4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

/** Alias Pine — cùng object với AppEco */
export const Pine = AppEco;

const tintColorLight = AppEco.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: AppEco.text,
    background: AppEco.background,
    tint: tintColorLight,
    icon: AppEco.textSecondary,
    tabIconDefault: AppEco.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
