/**
 * ThemedTextInput — Styled text input matching the web's input styling.
 * Handles focus state with accentPrimary border glow.
 */

import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface ThemedInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
}

export function ThemedTextInput({
  label,
  containerStyle,
  error,
  ...props
}: ThemedInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <RNTextInput
        {...props}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : {},
          props.style,
        ]}
        placeholderTextColor={Colors.textDark}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textMain,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  inputFocused: {
    borderColor: Colors.accentPrimary,
    // Simulate box-shadow glow with border only (no native box-shadow support)
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.danger,
  },
});
