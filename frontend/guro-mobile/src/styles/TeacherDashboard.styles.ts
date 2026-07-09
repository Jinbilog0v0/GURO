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
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
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
    gap: Spacing.md,
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
    fontSize: FontSizes.md,
    color: Colors.textDark,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  // File rows
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fileBtn: {
    paddingHorizontal: Spacing.md,
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
    fontSize: FontSizes.sm,
    color: Colors.success,
    lineHeight: 20,
  },

  // Clear button
  clearBtn: {
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
});
