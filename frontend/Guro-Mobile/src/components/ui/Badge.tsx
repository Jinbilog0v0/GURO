/**
 * Badge — Reusable status badge component.
 * Replaces the web's .badge, .badge-success, .badge-warning, .badge-danger classes.
 */

import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Badges } from '../../theme/styles';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'indigo' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  icon?: React.ComponentType<any>;
}

const variantStyles: Record<BadgeVariant, { bg: object; text: object }> = {
  success: { bg: Badges.success, text: Badges.successText },
  warning: { bg: Badges.warning, text: Badges.warningText },
  danger: { bg: Badges.danger, text: Badges.dangerText },
  indigo: { bg: Badges.indigo, text: Badges.indigoText },
  info: { bg: Badges.indigo, text: Badges.indigoText },
  neutral: { bg: Badges.indigo, text: Badges.indigoText },
};

export function Badge({ label, variant, style, icon: Icon }: BadgeProps) {
  const { bg, text } = variantStyles[variant];
  const iconColor = (text as any).color;
  return (
    <View style={[Badges.base, bg, style, Icon ? { gap: 4 } : {}]}>
      {Icon && <Icon size={12} color={iconColor} />}
      <Text style={[Badges.text, text]}>{label}</Text>
    </View>
  );
}
