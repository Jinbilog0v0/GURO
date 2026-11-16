import { useAppStore } from '../store/useAppStore';
import { LightThemeColors, DarkThemeColors, ThemePalettes, Colors } from './colors';

export function useTheme() {
  const themeMode = useAppStore((state) => state.themeMode || 'light');
  const colorTheme = useAppStore((state) => state.colorTheme || 'blue');
  const isDark = themeMode === 'dark';
  const base = isDark ? DarkThemeColors : LightThemeColors;
  const palette = ThemePalettes[colorTheme as keyof typeof ThemePalettes] || ThemePalettes.blue;
  const variant = isDark ? palette.dark : palette.light;

  return {
    isDark,
    themeMode,
    colorTheme,
    colors: {
      ...base,
      accentPrimary: variant.accentPrimary,
      accentPrimaryGlow: variant.accentPrimaryGlow,
      accentPrimaryDeep: variant.accentPrimaryDeep,
      borderFocus: variant.borderFocus,
    },
  };
}
