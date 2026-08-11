/**
 * GURO Design System — Spacing & Border Radius Tokens
 */

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  sm: 8,
  md: 10,   // Web: border-radius 10px on inputs/buttons
  lg: 16,   // Web: border-radius 16px on .glass-panel
  xl: 20,
  full: 999, // Web: border-radius 99px on badges
} as const;

export const Shadow = {
  // iOS shadow
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Android elevation
  android: {
    elevation: 8,
  },
  // Primary accent glow (indigo) — for primary buttons
  primaryGlow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  // Subtle card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
