import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
  },
  inner: {
    flex: 1,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoBadge: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  logoText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.white,
    letterSpacing: LetterSpacing.wide,
  },
  logoTagline: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Cards
  sectionCard: {
     marginBottom: 0,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.xs,
  },

  // Roles Pill
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePillSelected: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  rolePillEmoji: {
     fontSize: 20,
     marginBottom: Spacing.xs,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
  },
  rolePillTextSelected: {
     color: Colors.accentPrimary,
  },

  formGroup: {},
  passwordFormGroup: {
    marginTop: Spacing.md,
  },
  cloudLoginButton: {
    marginTop: Spacing.xl,
  },
  offlineButton: {
    marginTop: Spacing.xl,
  },

  offlineHint: {
     fontFamily: Fonts.body,
     fontSize: FontSizes.xs,
     color: Colors.textMuted,
     textAlign: 'center',
     marginTop: Spacing.md,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
  },

  // Footer
  footer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },
});
