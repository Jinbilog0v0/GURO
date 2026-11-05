import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 56,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },

  // ── Subject tabs ──────────────────────────────────────────────────────────────
  subjectTabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSidebar,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  subjectTab: {
    minHeight: 46,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subjectTabActive: {
    borderBottomColor: Colors.accentPrimary,
  },
  subjectTabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  subjectTabTextActive: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyBold,
  },

  // ── Grade pills ───────────────────────────────────────────────────────────────
  gradePillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSidebar,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gradePill: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradePillActive: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  gradePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  gradePillTextActive: {
    color: Colors.accentPrimary,
    fontVariant: ['tabular-nums'],
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSizes.sm * 1.6,
  },
});
