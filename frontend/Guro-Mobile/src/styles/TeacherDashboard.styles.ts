import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    paddingTop: Spacing.md + 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Colors.accentPrimary,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 4,
    flexShrink: 0,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 0,
  },

  // Back button
  backBtn: {
    alignSelf: 'flex-start',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  // Sections
  section: {
    // GlassCard provides its own styling
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actionBtn: {
    marginTop: Spacing.xs,
  },

  // Empty state
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // File rows
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.xs,
    minWidth: 0,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    flex: 1,
    minWidth: 0,
  },
  fileActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  fileBtn: {
    paddingHorizontal: Spacing.sm,
  },

  // Terminal log
  terminal: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
    gap: Spacing.xs,
  },
  logLine: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontSize: FontSizes.xs,
    color: Colors.success,
    lineHeight: 18,
  },

  // Clear button
  clearBtn: {
    paddingHorizontal: Spacing.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
});
