/**
 * GlassCard — Reusable glassmorphism-style container.
 * Replaces the web's .glass-panel CSS class.
 * Automatically adapts to active Light Mode and Dark Mode themes.
 */

import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { Cards } from '../../theme/styles';
import { Spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/useTheme';

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
  const { isDark, colors } = useTheme();

  const cardStyle =
    variant === 'subtle'
      ? Cards.glassSubtle
      : variant === 'accent'
      ? Cards.accentBorder
      : Cards.glass;

  const dynamicBg = variant === 'subtle' ? colors.bgInput : colors.bgCard;
  const dynamicBorder = variant === 'accent' ? colors.accentPrimary : colors.border;

  return (
    <View style={[cardStyle, { backgroundColor: dynamicBg, borderColor: dynamicBorder, padding }, style]}>
      {children}
    </View>
  );
}
