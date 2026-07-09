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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgSidebar,
    gap: 2,
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
    minHeight: 36,
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
  },
  gradePillTextActive: {
    color: Colors.accentPrimary,
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
