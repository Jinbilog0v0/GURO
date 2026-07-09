/**
 * Badge — Reusable status badge component.
 * Replaces the web's .badge, .badge-success, .badge-warning, .badge-danger classes.
 */

import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Badges } from '../../theme/styles';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'indigo';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<BadgeVariant, { bg: object; text: object }> = {
  success: { bg: Badges.success, text: Badges.successText },
  warning: { bg: Badges.warning, text: Badges.warningText },
  danger: { bg: Badges.danger, text: Badges.dangerText },
  indigo: { bg: Badges.indigo, text: Badges.indigoText },
};

export function Badge({ label, variant, style }: BadgeProps) {
  const { bg, text } = variantStyles[variant];
  return (
    <View style={[Badges.base, bg, style]}>
      <Text style={[Badges.text, text]}>{label}</Text>
    </View>
  );
}
