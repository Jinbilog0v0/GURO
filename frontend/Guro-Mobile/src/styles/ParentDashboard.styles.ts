import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.md + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accentPrimary,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 4,
    flexShrink: 0,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  exitBtn: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  exitBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
  },

  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  section: {
    // GlassCard handles background; just use as wrapper
  },

  // Time limit controls
  controlLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: LetterSpacing.wide,
    marginBottom: Spacing.sm,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  usageText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  resetTodayBtn: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  resetTodayText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.accentSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  pill: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimaryGlow,
  },
  pillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  pillTextActive: {
    color: Colors.white,
    fontVariant: ['tabular-nums'],
  },

  // Segmented Sub-Tabs
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 4,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
  },
  subTabButtonActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,66,142,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  subTabLabelActive: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.accentPrimary,
  },

  // Heatmap Grid
  heatmapContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
    gap: 6,
  },
  heatmapHeaderRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 2,
  },
  heatmapHeaderDay: {
    width: 32,
    textAlign: 'center',
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textDark,
  },
  heatmapWeekRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  heatmapDayBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },

  // Chat Bubble Styles
  chatContainer: {
    height: 280,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  chatBubbleParent: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginVertical: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderBottomRightRadius: 2,
    backgroundColor: Colors.accentPrimary,
    borderWidth: 1,
    borderColor: Colors.accentPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chatBubbleTeacher: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginVertical: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderBottomLeftRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chatSenderParent: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  chatSenderTeacher: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.accentPrimary,
  },
  chatTimestampParent: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
  },
  chatTimestampTeacher: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: Colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  chatTextParent: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  chatTextTeacher: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    lineHeight: 18,
  },
  chatInputRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  chatSendBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Toggle rows (math gate, bilingual)
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  toggleTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Progress log
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
    fontStyle: 'italic',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logLeft: {
    flex: 1,
  },
  logTopic: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  logDetail: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  logScore: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    fontVariant: ['tabular-nums'],
  },

  // Cloud account
  accountName: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  accountEmail: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Auth form
  authForm: {
    gap: Spacing.xs,
  },
  authSwitch: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  authSwitchText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.accentPrimary,
  },

  // PIN change form
  pinFormTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    marginBottom: Spacing.md,
  },
  pinActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },


  // Enhanced Dedicated Chat Tab Styles
  chatTeacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  teacherAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17,66,142,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(17,66,142,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatTeacherName: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: -0.3,
  },
  chatTeacherSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  chatRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultationHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17,66,142,0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  consultationHoursText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    flex: 1,
  },
  chatScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
  },
  chatEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  chatEmptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(17,66,142,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  chatEmptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    textAlign: 'center',
  },
  chatEmptySub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bgSidebar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: 58,
  },

  // Bottom Tab Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSidebar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyBold,
  },
  tabLabelInactive: {
    color: Colors.textDark,
  },
});
