import { StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF3FB', // Matches web page base gradient start color
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
  logoText: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: '#11428E', // Navy color same as web logo text
    letterSpacing: LetterSpacing.tight,
    fontWeight: '900',
    marginTop: Spacing.sm,
  },
  logoTagline: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: '#A01322', // Red color same as web tagline
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 2,
  },
  logoDescription: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#94A3B8', // Slate-400 color same as web description
    textAlign: 'center',
    marginTop: 2,
  },

  // Cards
  sectionCard: {
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Matches rounded-3xl on web
    borderWidth: 1,
    borderColor: '#E2E8F0', // slate-200 same as web border
    shadowColor: '#11428E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
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
    backgroundColor: '#F8FAFC', // slate-50 same as web input bg
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E2E8F0', // slate-200
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: '#94A3B8', // slate-400
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
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    shadowColor: '#11428E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
    backgroundColor: '#E2E8F0', // slate-200
  },
  dividerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: '#94A3B8', // slate-400
  },

  // Footer
  footer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: '#94A3B8', // slate-400
    textAlign: 'center',
    marginTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },

  // Network Indicator
  networkIndicatorRelative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    shadowColor: '#11428E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
