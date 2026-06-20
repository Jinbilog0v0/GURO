import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  
  // ── GitHub themed header ──────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#d0d7de', // GitHub border color
    backgroundColor: '#24292f', // GitHub dark header color
    gap: Spacing.sm,
  },
  backBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: '#ffffff',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: '#ffffff',
    flex: 1,
  },
  headerSubtitleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  headerSubtitleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: '#ffffff',
    textTransform: 'uppercase',
  },

  // ── Category scroll tab bar ───────────────────────────────────────────────
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#d0d7de',
    backgroundColor: '#ffffff',
  },
  tabBarContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: 'rgba(17,66,142,0.06)',
    borderColor: Colors.accentPrimary,
  },
  tabItemText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  tabItemTextActive: {
    color: Colors.accentPrimary,
  },

  // ── Scrollable Layout Container ─────────────────────────────────────────────
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },

  // ── GitHub style settings box container at the bottom ───────────────────────
  githubBox: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: Radius.md,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  githubBoxHeader: {
    backgroundColor: '#f6f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#d0d7de',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  githubBoxTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  githubBoxSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  githubBoxBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Form styling elements inside the Box ────────────────────────────────────
  formLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.accentSecondary,
    marginBottom: Spacing.xxs,
  },
  formInputWrapper: {
    marginTop: Spacing.xs,
  },
  formBtn: {
    marginTop: Spacing.sm,
  },

  // ── Mascot selectors ────────────────────────────────────────────────────────
  avatarGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
  },
  avatarItem: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgInput,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarItemActive: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  avatarEmoji: {
    fontSize: 24,
  },

  // ── Audio & Switch Rows ─────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgInput,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: Radius.full,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: '#ffffff',
  },

  // ── Speech speed segments ───────────────────────────────────────────────────
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
  },
  segmentBtnActive: {
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.accentPrimaryDeep,
  },
  segmentText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  segmentTextActive: {
    color: Colors.accentPrimary,
  },

  // ── Theme Selection ──────────────────────────────────────────────────────────
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xxs,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
  },
  themeBtnActive: {
    borderWidth: 2,
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 4,
  },
  themeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.textMain,
    textAlign: 'center',
  },

  // ── Screen Time gauge & details ─────────────────────────────────────────────
  timeBox: {
    backgroundColor: Colors.bgInput,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  timeLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  timeProgressContainer: {
    height: 12,
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: Spacing.xxs,
  },
  timeProgressBar: {
    height: '100%',
  },
  timeInfoItalic: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    fontStyle: 'italic',
  },

  // ── Rules and stats rows ────────────────────────────────────────────────────
  statsBox: {
    backgroundColor: Colors.bgInput,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  statsLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.accentSecondary,
    marginBottom: Spacing.xxs,
  },
  statsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  logsHeading: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textDark,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  logLine: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },

  // ── Footer layout ───────────────────────────────────────────────────────────
  footerContainer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#ffffff',
  },
  // ── Gamification UI/UX Styles ──────────────────────────────────────────────
  xpBarContainer: {
    height: 16,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  closetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  closetItem: {
    width: '47%',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
  },
  closetItemActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  closetItemEmoji: {
    fontSize: 32,
    marginVertical: 4,
  },
  closetItemTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: '#1F2937',
  },
  closetItemPrice: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xxs,
    color: '#D97706',
  },
  closetItemOwned: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: '#059669',
    fontStyle: 'italic',
  },
});
