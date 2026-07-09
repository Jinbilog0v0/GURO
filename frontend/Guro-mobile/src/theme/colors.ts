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

export type ColorKey = keyof typeof Colors;
