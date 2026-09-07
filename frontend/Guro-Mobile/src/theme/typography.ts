/**
 * GURO Design System — Typography Tokens
 * Matches web fonts: 'Quicksand' (rounded, clean geometric sans-serif).
 * Load these in App.tsx via useFonts().
 */

export const Fonts = {
  // Display — Quicksand (headings, logo, labels)
  display: 'Quicksand_700Bold',
  displayMedium: 'Quicksand_600SemiBold',
  displayRegular: 'Quicksand_500Medium',

  // Body — Quicksand (paragraphs, buttons, inputs)
  body: 'Quicksand_400Regular',
  bodyMedium: 'Quicksand_500Medium',
  bodySemiBold: 'Quicksand_600SemiBold',
  bodyBold: 'Quicksand_700Bold',
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
