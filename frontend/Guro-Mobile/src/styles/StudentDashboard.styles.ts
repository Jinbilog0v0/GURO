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
    marginTop: 2,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },

  // ── Time-limit banner ────────────────────────────────────────────────────────
  timeBanner: {
    gap: Spacing.sm,
    borderColor: Colors.dangerBorder,
  },
  timeBannerText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.dangerText,
    lineHeight: FontSizes.sm * 1.5,
  },

  // ── Hero Mascot Bento ────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'column',
    gap: Spacing.md,
    shadowColor: Colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarCapsule: {
    position: 'relative',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTextContainer: {
    flex: 1,
    gap: 3,
  },
  roleTag: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleTagText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroLevelText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.9)',
    fontVariant: ['tabular-nums'],
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
  speechBubble: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  speechText: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
    lineHeight: 16,
  },
  speechQuote: {
    fontFamily: Fonts.bodyMedium,
    color: '#FEF3C7',
  },
  xpBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 6,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.white,
  },
  xpValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },

  // ── Stats Row ───────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // ── Action Buttons & Labels ──────────────────────────────────────────────────
  ctaButton: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.accentPrimary,
    borderRadius: Radius.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  ctaButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
