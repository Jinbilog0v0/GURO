/**
 * GlassCard — Reusable glassmorphism-style container.
 * Replaces the web's .glass-panel CSS class.
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { Cards } from '../../theme/styles';
import { Spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use 'subtle' for nested inner cards */
  variant?: 'default' | 'subtle' | 'accent';
  padding?: number;
}

export function GlassCard({
  children,
  style,
  variant = 'default',
  padding = Spacing.lg,
}: GlassCardProps) {
  const cardStyle =
    variant === 'subtle'
      ? Cards.glassSubtle
      : variant === 'accent'
      ? Cards.accentBorder
      : Cards.glass;

  return (
    <View style={[cardStyle, { padding }, style]}>
      {children}
    </View>
  );
}
