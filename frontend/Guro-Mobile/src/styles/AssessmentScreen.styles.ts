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
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    height: 8,
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
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
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
    minHeight: 34,
    borderRadius: Radius.full,
  },
  listenButtonText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bodyBold,
  },
  questionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.accentPrimary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  questionText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // ── Options ───────────────────────────────────────────────────────────────
  optionsContainer: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetterBadgeSelected: {
    backgroundColor: Colors.accentPrimary,
  },
  optionLetterBadgeCorrect: {
    backgroundColor: Colors.success,
  },
  optionLetterBadgeWrong: {
    backgroundColor: Colors.danger,
  },
  optionLetter: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  optionLetterActive: {
    color: Colors.white,
    fontFamily: Fonts.bodyBold,
  },
  // Option text
  optionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyBold,
  },
  optionTextCorrect: {
    color: Colors.success,
    fontFamily: Fonts.bodyBold,
  },
  optionTextWrong: {
    color: Colors.danger,
    fontFamily: Fonts.bodyBold,
  },

  // ── Feedback card ─────────────────────────────────────────────────────────
  feedbackCard: {
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.lg || 16,
  },
  feedbackCardCorrect: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderColor: 'rgba(22, 163, 74, 0.35)',
  },
  feedbackCardWrong: {
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderColor: 'rgba(220, 38, 38, 0.35)',
  },
  langToggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  langPill: {
    paddingHorizontal: Spacing.md,
    minHeight: 36,
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
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  feedbackResultTitleCorrect: {
    color: Colors.success,
  },
  feedbackResultTitleWrong: {
    color: Colors.danger,
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
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    lineHeight: FontSizes.sm * 1.45,
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
    height: Spacing.md,
  },
  illustrationContainer: {
    width: '100%',
    maxHeight: 130,
    backgroundColor: '#fff',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginVertical: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  illustration: {
    width: '100%',
    height: 110,
  },
});
