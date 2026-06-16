/**
 * StatCard — Metric display tile used across all dashboards.
 * Used for: Score %, Questions Answered, Sessions Today, Time Used, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional unit shown below the value (e.g. "min", "%", "pts") */
  unit?: string;
  /** Optional accent color for the value text */
  valueColor?: string;
  /** Optional icon/emoji shown at the top */
  icon?: string;
}

export function StatCard({ label, value, unit, valueColor, icon }: StatCardProps) {
  return (
    <GlassCard style={styles.card} padding={Spacing.lg}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.value, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    minWidth: 90,
    flex: 1,
  },
  icon: {
    fontSize: 22,
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  unit: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
