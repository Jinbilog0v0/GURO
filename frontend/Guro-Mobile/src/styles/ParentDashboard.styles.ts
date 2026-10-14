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
    gap: Spacing.md,
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
  },
  resetTodayBtn: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: Radius.sm,
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
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: Radius.sm,
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
  },
  pillTextActive: {
    color: Colors.white,
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
