/**
 * GURO Design System — Color Tokens
 * Light theme matching the GURO Student App claude design.
 */

export const Colors = {
  // Backgrounds
  bgMain: '#F5F6F9',
  bgCard: '#FFFFFF',
  bgSidebar: '#FFFFFF',
  bgInput: '#F1F3F8',

  // Borders
  border: '#E7E9F0',
  borderFocus: '#11428E',
  borderStrong: '#C9CED8',

  // Accent — Navy (primary)
  accentPrimary: '#11428E',
  accentPrimaryGlow: 'rgba(17,66,142,0.25)',
  accentPrimaryDeep: 'rgba(17,66,142,0.12)',

  // Accent — Blue (primary-2 / secondary)
  accentSecondary: '#1C5BC0',
  accentSecondaryGlow: 'rgba(28,91,192,0.20)',

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

  danger: '#CE1126',
  dangerGlow: 'rgba(206,17,38,0.10)',
  dangerBorder: 'rgba(206,17,38,0.25)',
  dangerText: '#a01322',

  // Misc
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
