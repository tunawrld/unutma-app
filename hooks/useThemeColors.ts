import { AppColors, DarkColors, LightColors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

/**
 * Cihazın renk moduna (dark/light) göre doğru renk setini döndürür.
 * Dark mode → eski koyu yeşil tema
 * Light mode → beyaz arka planlı aydınlık tema
 */
export function useThemeColors(): AppColors {
    const colorScheme = useColorScheme();
    return colorScheme === 'dark' ? DarkColors : LightColors;
}
