import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const getSettingsStyles = (isDark: boolean = false, colors: any = Colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: isDark ? '#090D16' : colors.bgMain,
  },
  
  // ── Standard Modern Header ───────────────────────────────────────────────
  headerBar: {
    backgroundColor: isDark ? '#111827' : colors.bgCard,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
    gap: 6,
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accentPrimary,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 2,
  },
  headerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: Radius.full,
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(17,66,142,0.08)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(17,66,142,0.18)',
  },
  backBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: colors.accentPrimary,
  },
  headerUtilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    minHeight: 32,
    borderRadius: Radius.md,
    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217,119,6,0.08)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(217,119,6,0.22)',
  },
  headerUtilityText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    color: isDark ? '#F59E0B' : '#D97706',
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginLeft: 2,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: isDark ? '#F8FAFC' : colors.textMain,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: isDark ? '#94A3B8' : colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(17,66,142,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(17,66,142,0.18)',
  },
  roleBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    color: colors.accentPrimary,
    letterSpacing: 0.6,
  },
  headerManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(17,66,142,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(17,66,142,0.2)',
    minHeight: 36,
  },
  headerManualBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: colors.accentPrimary,
  },
  termBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(17,66,142,0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(17,66,142,0.15)',
  },
  termBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: colors.accentPrimary,
  },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentPrimary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    shadowColor: colors.accentPrimary,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  headerSaveBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: '#ffffff',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: isDark ? '#F8FAFC' : colors.textMain,
    flex: 1,
  },
  headerSubtitleBadge: {
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(17,66,142,0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  headerSubtitleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: colors.accentPrimary,
    textTransform: 'uppercase',
  },

  // ── Category scroll tab bar ───────────────────────────────────────────────
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    backgroundColor: isDark ? '#111827' : colors.bgCard,
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
    backgroundColor: isDark ? '#1A2234' : '#ffffff',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
  },
  tabItemActive: {
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(17,66,142,0.06)',
    borderColor: colors.accentPrimary,
  },
  tabItemText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: isDark ? '#94A3B8' : colors.textMuted,
  },
  tabItemTextActive: {
    color: colors.accentPrimary,
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
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#d0d7de',
    borderRadius: Radius.md,
    backgroundColor: isDark ? '#111827' : '#ffffff',
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  githubBoxHeader: {
    backgroundColor: isDark ? '#1A2234' : '#f6f8fa',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#d0d7de',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  githubBoxTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: isDark ? '#F8FAFC' : colors.textMain,
  },
  githubBoxSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: isDark ? '#94A3B8' : colors.textMuted,
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
    color: isDark ? '#F87171' : colors.accentSecondary,
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
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarItemActive: {
    backgroundColor: colors.accentPrimaryDeep,
    borderColor: colors.accentPrimary,
  },
  avatarEmoji: {
    fontSize: 24,
  },

  // ── Audio & Switch Rows ─────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
  },
  switchLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: isDark ? '#F8FAFC' : colors.textMain,
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
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
    alignItems: 'center',
  },
  segmentBtnActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryDeep,
  },
  segmentText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: isDark ? '#94A3B8' : colors.textMuted,
  },
  segmentTextActive: {
    color: colors.accentPrimary,
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
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
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
    color: isDark ? '#F8FAFC' : colors.textMain,
    textAlign: 'center',
  },

  // ── Screen Time gauge & details ─────────────────────────────────────────────
  timeBox: {
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    gap: Spacing.xs,
  },
  timeLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: isDark ? '#94A3B8' : colors.textMuted,
  },
  timeProgressContainer: {
    height: 12,
    width: '100%',
    backgroundColor: isDark ? '#334155' : colors.border,
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
    color: isDark ? '#64748B' : colors.textDark,
    fontStyle: 'italic',
  },

  // ── Rules and stats rows ────────────────────────────────────────────────────
  statsBox: {
    backgroundColor: isDark ? '#1A2234' : colors.bgInput,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    gap: Spacing.xs,
  },
  statsLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: isDark ? '#F87171' : colors.accentSecondary,
    marginBottom: Spacing.xxs,
  },
  statsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: isDark ? '#94A3B8' : colors.textMuted,
  },
  logsHeading: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: isDark ? '#64748B' : colors.textDark,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
  },
  logLine: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: isDark ? '#94A3B8' : colors.textMuted,
  },

  // ── Footer layout ───────────────────────────────────────────────────────────
  footerContainer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    backgroundColor: isDark ? '#111827' : '#ffffff',
  },
  // ── Gamification UI/UX Styles ──────────────────────────────────────────────
  xpBarContainer: {
    height: 16,
    width: '100%',
    backgroundColor: isDark ? '#1E293B' : '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#D1D5DB',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.accentPrimary,
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
    backgroundColor: isDark ? '#1A2234' : '#F3F4F6',
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxs,
  },
  closetItemActive: {
    borderColor: colors.accentPrimary,
    backgroundColor: colors.accentPrimaryDeep,
  },
  closetItemEmoji: {
    fontSize: 32,
    marginVertical: 4,
  },
  closetItemTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: isDark ? '#F8FAFC' : '#1F2937',
  },
  closetItemPrice: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: isDark ? '#F59E0B' : '#D97706',
  },
  closetItemOwned: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: isDark ? '#34D399' : '#059669',
    fontStyle: 'italic',
  },
});

export const styles = getSettingsStyles(false, Colors);
