/**
 * PrimaryButton / SecondaryButton / DangerButton
 * Replaces the web's .btn, .btn-primary, .btn-secondary, .btn-danger classes.
 * Uses react-native-reanimated for press animations (matching web's translateY hover).
 */

import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Buttons, Text as TextStyles } from '../../theme/styles';
import { Colors } from '../../theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function PrimaryButton({ label, onPress, disabled, loading, style, icon }: ButtonProps) {
  const isInactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.8}
      style={[
        Buttons.base,
        Buttons.primary,
        isInactive && Buttons.disabled,
        { overflow: 'hidden', position: 'relative' },
        style,
      ]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accentPrimary} />
            <Stop offset="100%" stopColor={Colors.accentBlue} />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#primaryGrad)" />
      </Svg>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <>
          {icon}
          <Text style={TextStyles.btnTextPrimary}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, disabled, loading, style, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        Buttons.base,
        Buttons.secondary,
        (disabled || loading) && Buttons.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textMuted} />
      ) : (
        <>
          {icon}
          <Text style={TextStyles.btnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function DangerButton({ label, onPress, disabled, loading, style, icon }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        Buttons.base,
        Buttons.danger,
        (disabled || loading) && Buttons.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.dangerText} />
      ) : (
        <>
          {icon}
          <Text style={[TextStyles.btnText, { color: Colors.dangerText }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
