/**
 * GURO Design System — Color Tokens
 * Mirrors the web's index.css :root CSS variables exactly.
 */

export const Colors = {
  // Backgrounds
  bgMain: '#060913',
  bgCard: 'rgba(16, 22, 42, 0.95)',      // Web: rgba(16, 22, 42, 0.65) — bumped for RN (no backdrop-filter)
  bgSidebar: 'rgba(10, 15, 30, 0.98)',   // Web: rgba(10, 15, 30, 0.75) — bumped for RN
  bgInput: 'rgba(9, 13, 24, 0.95)',      // Web: rgba(9, 13, 24, 0.85)

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderFocus: '#6366f1',
  borderStrong: 'rgba(255, 255, 255, 0.15)',

  // Accent — Indigo
  accentPrimary: '#6366f1',
  accentPrimaryGlow: 'rgba(99, 102, 241, 0.25)',
  accentPrimaryDeep: 'rgba(99, 102, 241, 0.15)',

  // Accent — Cyan
  accentSecondary: '#0ea5e9',
  accentSecondaryGlow: 'rgba(14, 165, 233, 0.2)',

  // Text
  textMain: '#f8fafc',
  textMuted: '#94a3b8',
  textDark: '#64748b',

  // Semantic
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  successBorder: 'rgba(16, 185, 129, 0.3)',

  warning: '#f59e0b',
  warningGlow: 'rgba(245, 158, 11, 0.15)',
  warningBorder: 'rgba(245, 158, 11, 0.3)',

  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.3)',
  dangerText: '#fca5a5',

  // Misc
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
