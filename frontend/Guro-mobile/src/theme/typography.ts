/**
 * GURO Design System — Typography Tokens
 * Matches web fonts: 'Space Grotesk' (display) and 'Plus Jakarta Sans' (body).
 * Load these in App.tsx via useFonts().
 */

export const Fonts = {
  // Display — Space Grotesk (headings, logo, labels)
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  displayRegular: 'SpaceGrotesk_400Regular',

  // Body — Plus Jakarta Sans (paragraphs, buttons, inputs)
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

export const FontSizes = {
  xs: 12,   // badge text
  sm: 12,   // labels, captions
  base: 13, // secondary body
  md: 14,   // primary body, buttons
  lg: 16,   // subheadings
  xl: 18,   // section titles
  '2xl': 22,
  '3xl': 28,
  '4xl': 36,
} as const;

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const LetterSpacing = {
  tight: -0.5,   // Web: -0.02em on headings
  normal: 0,
  wide: 0.5,     // Web: 0.05em on labels/badges
} as const;
