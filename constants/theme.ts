import { Platform } from 'react-native';

/**
 * Uygulama renk teması.
 * Dark mode: eski koyu yeşil tema
 * Light mode: beyaz arka planlı aydınlık tema
 */

export interface AppColors {
  primary: string;
  white: string;
  black: string;
  red: string;
  yellow: string;
  backgroundDark: string;  // Ana arka plan
  sheetDark: string;       // Bottom sheet arka plan
  textLight: string;       // Ana metin rengi
  textMuted: string;       // İkincil metin rengi
  border: string;          // Kenarlık rengi
  inputBg: string;         // Input arka planı
  cardBg: string;          // Kart arka planı
}

export const DarkColors: AppColors = {
  primary: '#33c758',
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF453A',
  yellow: '#FFD60A',
  backgroundDark: '#0F0F12',
  sheetDark: '#132016',
  textLight: '#EDEDED',
  textMuted: '#6E6E73',
  border: '#FFFFFF',
  inputBg: '#1A1A1A',
  cardBg: '#1C1C1E',
};

export const LightColors: AppColors = {
  primary: '#28a745',       // Biraz daha koyu yeşil, beyaz üzerinde okunabilir
  white: '#FFFFFF',
  black: '#000000',
  red: '#FF3B30',
  yellow: '#FF9500',
  backgroundDark: '#F2F2F7', // iOS system background (açık gri-beyaz)
  sheetDark: '#FFFFFF',      // Bottom sheet beyaz
  textLight: '#1C1C1E',      // Koyu metin (siyaha yakın)
  textMuted: '#8E8E93',      // Gri metinler
  border: '#000000',
  inputBg: '#FFFFFF',
  cardBg: '#FFFFFF',
};

// Backwards compatibility — export edilmiş statik Colors (varsayılan dark)
// plus light/dark sub-objects for legacy Expo components
export const Colors = {
  ...DarkColors,
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
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
