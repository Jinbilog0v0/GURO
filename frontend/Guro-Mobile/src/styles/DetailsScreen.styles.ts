import { StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    letterSpacing: LetterSpacing.tight,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  contentBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: Colors.textMain,
  },
  backButton: {
    backgroundColor: Colors.bgInput,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.textMain,
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.md,
  },
});
