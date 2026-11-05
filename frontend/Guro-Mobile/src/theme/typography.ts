/**
 * GURO Design System — Typography Tokens
 * Matches web fonts: 'Quicksand' (rounded, clean geometric sans-serif).
 * Load these in App.tsx via useFonts().
 */

import { Platform } from 'react-native';

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

  // Monospace
  mono: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }) as string,
} as const;

export const FontSizes = {
  xs: 11,   // badge text, micro chips, counter pills
  sm: 12,   // labels, captions, subtitles, helper text
  base: 13, // secondary body, compact meta
  md: 14,   // primary body, buttons, options, form inputs
  lg: 16,   // subheadings, card titles, large buttons
  xl: 18,   // screen header titles, section titles
  '2xl': 22, // primary page titles, modal titles
  '3xl': 28, // stats counters, celebration titles
  '4xl': 36, // hero numbers
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
