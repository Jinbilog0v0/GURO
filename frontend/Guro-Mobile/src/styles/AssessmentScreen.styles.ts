import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  // ── Screen ────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
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
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerMetaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  headerBadgeGap: {
    marginLeft: 0,
  },
  headerTopic: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  questionCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#D0E1FD',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  questionCounterCurrent: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    fontVariant: ['tabular-nums'],
  },
  questionCounterTotal: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 2,
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
    fontVariant: ['tabular-nums'],
  },

  // ── Question card ─────────────────────────────────────────────────────────
  questionCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    paddingVertical: 6,
    minHeight: 34,
    borderRadius: Radius.full,
    gap: 6,
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
    gap: 12,
    marginBottom: Spacing.xl,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    // DO NOT use Android elevation here! Elevation on semi-transparent backgrounds
    // causes Android to render an opaque dark gray rectangle artifact behind text.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 0,
  },
  // Default state
  optionDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  // Selected (not yet submitted)
  optionSelected: {
    backgroundColor: '#EEF4FF',
    borderColor: Colors.accentPrimary,
    borderWidth: 2,
  },
  // Correct answer revealed
  optionCorrect: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.success,
    borderWidth: 2,
  },
  // Wrong selected answer revealed
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: Colors.danger,
    borderWidth: 2,
  },
  // Letter badge
  optionLetterBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
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
    color: '#475569',
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
    marginBottom: Spacing.md,
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    width: '100%',
    minHeight: 52,
    borderRadius: Radius.md,
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
    height: Spacing['2xl'],
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
