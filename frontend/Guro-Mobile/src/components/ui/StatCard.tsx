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
  /** Optional icon/emoji component or string */
  icon?: React.ComponentType<any> | string;
}

export function StatCard({ label, value, unit, valueColor, icon: IconOrEmoji }: StatCardProps) {
  const isComponent = typeof IconOrEmoji === 'function' || (typeof IconOrEmoji === 'object' && IconOrEmoji !== null);
  return (
    <GlassCard style={styles.card} padding={Spacing.md}>
      {isComponent ? (
        <View style={{ marginBottom: Spacing.xs }}>
          {React.createElement(IconOrEmoji as any, { size: 20, color: Colors.textDark })}
        </View>
      ) : IconOrEmoji ? (
        <Text style={styles.icon}>{IconOrEmoji as string}</Text>
      ) : null}
      <Text 
        style={[styles.value, valueColor ? { color: valueColor } : {}]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {unit ? <Text style={styles.unit} numberOfLines={1}>{unit}</Text> : null}
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  icon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  unit: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10.5,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
