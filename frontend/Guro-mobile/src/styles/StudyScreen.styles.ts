import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.accentPrimary,
  },
  stepTitleText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgInput,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.accentPrimary,
  },
  scrollContainer: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  ttsIconBtn: {
    backgroundColor: Colors.bgInput,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ttsIcon: {
    color: Colors.accentSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.textMain,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  cardLabel: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  introText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    lineHeight: FontSizes.lg * 1.6,
  },
  definitionsWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  instructionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  defCard: {
    overflow: 'hidden',
  },
  defHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.bgCard,
  },
  defTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  defEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  defTerm: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    flex: 1,
  },
  expandChevron: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontFamily: Fonts.display,
  },
  defBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  defText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    lineHeight: FontSizes.md * 1.5,
    marginBottom: Spacing.md,
  },
  examplesContainer: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  examplesLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.base,
    color: Colors.accentSecondary,
    marginBottom: Spacing.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exampleBullet: {
    fontSize: 12,
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  exampleText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: FontSizes.base * 1.4,
  },
  speakerBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  speakerBtnText: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
  },
  summaryIntro: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  summaryBullet: {
    fontSize: 16,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  summaryText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    flex: 1,
    lineHeight: FontSizes.lg * 1.5,
  },
  fallbackCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  fallbackEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  fallbackTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  fallbackText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: FontSizes.md * 1.5,
  },
  fallbackButton: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.bgSidebar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  navBtnHalf: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
