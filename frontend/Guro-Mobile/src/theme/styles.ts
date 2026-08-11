/**
 * GURO Design System — Shared StyleSheet Utilities
 * Reusable React Native styles that mirror the web's CSS utility classes.
 * Import specific style objects — do NOT spread everything.
 */

import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Fonts, FontSizes, LetterSpacing } from './typography';
import { Spacing, Radius, Shadow } from './spacing';

// ─── Layout ──────────────────────────────────────────────────────────────────

export const Layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
});

// ─── Cards (replaces .glass-panel) ───────────────────────────────────────────

export const Cards = StyleSheet.create({
  glass: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    // Shadows applied per-platform via Shadow constants in component code
  },
  glassSubtle: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
  },
  accentBorder: {
    borderColor: Colors.accentPrimary,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
});

// ─── Buttons (replaces .btn classes) ─────────────────────────────────────────

export const Buttons = StyleSheet.create({
  // .btn base
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    minHeight: 48,
  },
  // .btn-primary
  primary: {
    backgroundColor: Colors.accentPrimary,
    // Shadows applied per-platform in PrimaryButton component
  },
  // .btn-secondary
  secondary: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // .btn-danger
  danger: {
    backgroundColor: Colors.dangerGlow,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  // .btn-disabled
  disabled: {
    opacity: 0.5,
  },
});

// ─── Text (replaces typography utility classes) ───────────────────────────────

export const Text = StyleSheet.create({
  // Headings (font-display)
  h1: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  h3: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  h4: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  // Body (font-body)
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  bodyMuted: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  small: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  // Labels (uppercase, spaced — web: text-transform uppercase on labels)
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  // Button label
  btnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  btnTextPrimary: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
});

// ─── Badges (replaces .badge classes) ────────────────────────────────────────

export const Badges = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  text: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  success: {
    backgroundColor: Colors.successGlow,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  successText: {
    color: Colors.success,
  },
  warning: {
    backgroundColor: Colors.warningGlow,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
  },
  warningText: {
    color: Colors.warning,
  },
  danger: {
    backgroundColor: Colors.dangerGlow,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  dangerText: {
    color: Colors.dangerText,
  },
  indigo: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
  },
  indigoText: {
    color: Colors.accentPrimary,
  },
});

// ─── Inputs (replaces input/select/textarea styles) ──────────────────────────

export const Inputs = StyleSheet.create({
  base: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textMain,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  focused: {
    borderColor: Colors.accentPrimary,
    // Box shadow equivalent — use in onFocus handler via state
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider = StyleSheet.create({
  horizontal: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
  },
  vertical: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
