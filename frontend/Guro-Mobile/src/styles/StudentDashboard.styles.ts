import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';

export const styles = StyleSheet.create({
  // ── Screen ──────────────────────────────────────────────────────────────────
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
    backgroundColor: Colors.bgSidebar,
    gap: Spacing.sm,
  },
  welcomeText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
  },
  subWelcomeText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xxs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 16,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: Shadow.primaryGlow,
      android: Shadow.primaryGlow,
    }),
  },
  avatarEmoji: {
    fontSize: 20,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },

  // ── Sections ─────────────────────────────────────────────────────────────────
  section: {
    gap: Spacing.sm,
  },

  // ── Time-limit banner ────────────────────────────────────────────────────────
  timeBanner: {
    gap: Spacing.sm,
    borderColor: Colors.dangerBorder,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
  },
  timeBannerText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.dangerText,
    lineHeight: FontSizes.sm * 1.5,
  },

  // ── Grade pills ───────────────────────────────────────────────────────────────
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  pillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
  },
  pillTextActive: {
    color: Colors.accentPrimary,
  },

  // ── Subject grid ──────────────────────────────────────────────────────────────
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subjectCard: {
    // Each card takes ~half width minus gap
    flexBasis: '47.5%',
    flexGrow: 1,
  },
  subjectCardActive: {
    ...Platform.select({
      ios: Shadow.primaryGlow,
      android: Shadow.primaryGlow,
    }),
  },
  subjectCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    gap: Spacing.xs,
  },
  subjectEmoji: {
    fontSize: 28,
  },
  subjectLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  subjectLabelActive: {
    color: Colors.accentPrimary,
  },

  // ── English lock banner ───────────────────────────────────────────────────────
  lockBanner: {
    gap: Spacing.sm,
    borderColor: Colors.warningBorder,
  },
  lockBannerText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.warning,
    lineHeight: FontSizes.sm * 1.6,
  },

  // ── Topic topics ───────────────────────────────────────────────────────────────
  topicCard: {
    elevation: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.accentPrimary,
  },
  topicTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    marginBottom: Spacing.xxs,
  },
  topicSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  topicArrow: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textDark,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
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

  // ── Back button ───────────────────────────────────────────────────────────────
  backBtn: {
    marginTop: Spacing.sm,
  },

  // ── Classroom modal overlay ───────────────────────────────────────────────────
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  classModal: {
    gap: Spacing.md,
  },
  classInput: {
    marginTop: Spacing.xs,
  },
  classBtn: {
    marginTop: Spacing.xs,
  },
  currentClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  currentClassText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    flex: 1,
  },
  // ── Settings / Profile modal custom styles ──
  profileBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: Spacing.xs,
  },
  profileLabel: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.accentPrimary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  profileName: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
  },
  profileEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statsBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    gap: 6,
  },
  statsLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.base,
    color: Colors.accentSecondary,
    marginBottom: 2,
  },
  statsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
});
