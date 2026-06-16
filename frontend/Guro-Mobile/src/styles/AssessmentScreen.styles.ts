import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';

export const styles = StyleSheet.create({
  // ── Screen ────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // ── Centered utility (error / finished) ───────────────────────────────────
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // ── Header / progress ─────────────────────────────────────────────────────
  header: {
    marginBottom: Spacing.lg,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerBadgeGap: {
    marginLeft: Spacing.xs,
  },
  headerTopic: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // ── Question card ─────────────────────────────────────────────────────────
  questionCard: {
    marginBottom: Spacing.lg,
  },
  questionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  questionLabelNoMargin: {
    marginBottom: 0,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
    borderRadius: Radius.full,
  },
  listenButtonText: {
    fontSize: 13,
    fontFamily: Fonts.bodyBold,
  },
  questionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    lineHeight: FontSizes.xl * 1.45,
    letterSpacing: -0.3,
  },

  // ── Options ───────────────────────────────────────────────────────────────
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
    ...Shadow.card,
  },
  // Default state
  optionDefault: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  // Selected (not yet submitted)
  optionSelected: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  // Correct answer revealed
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.success,
  },
  // Wrong selected answer revealed
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.danger,
  },
  // Letter badge
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetter: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  // Option text
  optionText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    flex: 1,
    lineHeight: FontSizes.md * 1.5,
  },
  optionTextSelected: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyMedium,
  },
  optionTextCorrect: {
    color: Colors.success,
    fontFamily: Fonts.bodyMedium,
  },
  optionTextWrong: {
    color: Colors.danger,
    fontFamily: Fonts.bodyMedium,
  },

  // ── Feedback card ─────────────────────────────────────────────────────────
  feedbackCard: {
    marginBottom: Spacing.lg,
    borderColor: Colors.accentSecondary,
    borderWidth: 1,
  },
  langToggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  langPill: {
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
  },
  langPillActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  langPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: 0.8,
  },
  langPillTextActive: {
    color: Colors.white,
  },
  feedbackResultTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.accentSecondary,
    marginBottom: Spacing.sm,
  },
  feedbackSectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xxs,
  },
  feedbackSectionGap: {
    marginTop: Spacing.md,
  },
  feedbackText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: FontSizes.base * 1.7,
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionsRow: {
    marginBottom: Spacing.md,
  },
  actionBtn: {
    width: '100%',
  },

  // ── Error screen ──────────────────────────────────────────────────────────
  errorCard: {
    alignItems: 'center',
    width: '100%',
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.6,
    marginBottom: Spacing['2xl'],
  },
  errorHighlight: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodySemiBold,
  },
  errorBtn: {
    width: '100%',
  },

  // ── Finished / results screen ─────────────────────────────────────────────
  finishedScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  finishedCard: {
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  finishedBadge: {
    marginBottom: Spacing.lg,
  },
  finishedTopic: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  finishedSubLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
  },
  scoreRow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['4xl'],
    color: Colors.textMain,
    letterSpacing: -1,
  },
  scoreDivider: {
    fontSize: FontSizes['2xl'],
    color: Colors.textMuted,
  },
  percentageText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  finishedBtn: {
    width: '100%',
    marginTop: Spacing['2xl'],
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
