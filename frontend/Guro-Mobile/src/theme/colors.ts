/**
 * GURO Design System — Color Tokens
 * Supports Dynamic Light & Dark Mode according to DepEd + Anti-AI-Slop taste principles.
 */

export const LightThemeColors = {
  // Backgrounds
  bgMain: '#F5F6F9',
  bgCard: '#FFFFFF',
  bgSidebar: '#FFFFFF',
  bgInput: '#F1F3F8',

  // Borders
  border: '#E7E9F0',
  borderFocus: '#11428E',
  borderStrong: '#C9CED8',

  // Accent — Navy (primary / DepEd Blue)
  accentPrimary: '#11428E',
  accentPrimaryGlow: 'rgba(17,66,142,0.25)',
  accentPrimaryDeep: 'rgba(17,66,142,0.12)',

  // Accent — Red (secondary / DepEd Red)
  accentSecondary: '#A01322',
  accentSecondaryGlow: 'rgba(160,19,34,0.20)',

  // Accent — Blue (friendly student/blue accent)
  accentBlue: '#1C5BC0',
  accentBlueGlow: 'rgba(28,91,192,0.20)',

  // Text
  textMain: '#191C24',
  textMuted: '#5B6170',
  textDark: '#9AA0AD',

  // Semantic
  success: '#16A34A',
  successGlow: 'rgba(22,163,74,0.12)',
  successBorder: 'rgba(22,163,74,0.25)',

  warning: '#E8890C',
  warningGlow: 'rgba(232,137,12,0.12)',
  warningBorder: 'rgba(232,137,12,0.25)',

  danger: '#A01322',
  dangerGlow: 'rgba(160,19,34,0.15)',
  dangerBorder: 'rgba(160,19,34,0.25)',
  dangerText: '#A01322',

  // Misc
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export const DarkThemeColors = {
  // Backgrounds — Modern Obsidian / Deep DepEd Navy
  bgMain: '#090D16',
  bgCard: '#111827',
  bgSidebar: '#0F172A',
  bgInput: '#1A2234',

  // Borders — Crisp hairline borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#3B82F6',
  borderStrong: 'rgba(255, 255, 255, 0.18)',

  // Accent — Electric Blue for vibrant readability in dark mode
  accentPrimary: '#3B82F6',
  accentPrimaryGlow: 'rgba(59,130,246,0.30)',
  accentPrimaryDeep: 'rgba(59,130,246,0.18)',

  // Accent — Crimson Red
  accentSecondary: '#EF4444',
  accentSecondaryGlow: 'rgba(239,68,68,0.25)',

  // Accent — Bright Sky
  accentBlue: '#60A5FA',
  accentBlueGlow: 'rgba(96,165,250,0.25)',

  // Text — High-contrast AAA compliant
  textMain: '#F8FAFC',
  textMuted: '#94A3B8',
  textDark: '#64748B',

  // Semantic
  success: '#22C55E',
  successGlow: 'rgba(34,197,94,0.18)',
  successBorder: 'rgba(34,197,94,0.35)',

  warning: '#F59E0B',
  warningGlow: 'rgba(245,158,11,0.18)',
  warningBorder: 'rgba(245,158,11,0.35)',

  danger: '#EF4444',
  dangerGlow: 'rgba(239,68,68,0.25)',
  dangerBorder: 'rgba(239,68,68,0.35)',
  dangerText: '#F87171',

  // Misc
  white: '#ffffff',
  transparent: 'transparent',
} as const;

// Mutable reactive singleton Colors object matching existing code imports
export const Colors = {
  ...LightThemeColors,
};

export type ColorKey = keyof typeof LightThemeColors;

export const ThemePalettes = {
  blue: {
    light: {
      accentPrimary: '#11428E',
      accentPrimaryGlow: 'rgba(17,66,142,0.25)',
      accentPrimaryDeep: 'rgba(17,66,142,0.12)',
      borderFocus: '#11428E',
    },
    dark: {
      accentPrimary: '#3B82F6',
      accentPrimaryGlow: 'rgba(59,130,246,0.30)',
      accentPrimaryDeep: 'rgba(59,130,246,0.18)',
      borderFocus: '#3B82F6',
    },
  },
  teal: {
    light: {
      accentPrimary: '#0F766E',
      accentPrimaryGlow: 'rgba(15,118,110,0.25)',
      accentPrimaryDeep: 'rgba(15,118,110,0.12)',
      borderFocus: '#0F766E',
    },
    dark: {
      accentPrimary: '#14B8A6',
      accentPrimaryGlow: 'rgba(20,184,166,0.30)',
      accentPrimaryDeep: 'rgba(20,184,166,0.18)',
      borderFocus: '#14B8A6',
    },
  },
  yellow: {
    light: {
      accentPrimary: '#D97706',
      accentPrimaryGlow: 'rgba(217,119,6,0.25)',
      accentPrimaryDeep: 'rgba(217,119,6,0.12)',
      borderFocus: '#D97706',
    },
    dark: {
      accentPrimary: '#F59E0B',
      accentPrimaryGlow: 'rgba(245,158,11,0.30)',
      accentPrimaryDeep: 'rgba(245,158,11,0.18)',
      borderFocus: '#F59E0B',
    },
  },
  purple: {
    light: {
      accentPrimary: '#6D28D9',
      accentPrimaryGlow: 'rgba(109,40,217,0.25)',
      accentPrimaryDeep: 'rgba(109,40,217,0.12)',
      borderFocus: '#6D28D9',
    },
    dark: {
      accentPrimary: '#8B5CF6',
      accentPrimaryGlow: 'rgba(139,92,246,0.30)',
      accentPrimaryDeep: 'rgba(139,92,246,0.18)',
      borderFocus: '#8B5CF6',
    },
  },
} as const;

let currentMode: 'light' | 'dark' = 'light';
let currentSkin: string = 'blue';

export function applyThemeSkin(themeName: string) {
  currentSkin = themeName;
  const palette = ThemePalettes[themeName as keyof typeof ThemePalettes] || ThemePalettes.blue;
  const variant = currentMode === 'dark' ? palette.dark : palette.light;
  (Colors as any).accentPrimary = variant.accentPrimary;
  (Colors as any).accentPrimaryGlow = variant.accentPrimaryGlow;
  (Colors as any).accentPrimaryDeep = variant.accentPrimaryDeep;
  (Colors as any).borderFocus = variant.borderFocus;
}

export function applyThemeMode(mode: 'light' | 'dark', themeName?: string) {
  currentMode = mode;
  const base = mode === 'dark' ? DarkThemeColors : LightThemeColors;
  Object.assign(Colors, base);
  applyThemeSkin(themeName || currentSkin);
}

export function getActiveThemeMode(): 'light' | 'dark' {
  return currentMode;
}
