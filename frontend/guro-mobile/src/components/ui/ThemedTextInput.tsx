import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { Eye, EyeOff } from 'lucide-react-native';

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
  const [secureTextVisible, setSecureTextVisible] = useState(false);

  const isSecure = props.secureTextEntry;

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error ? styles.inputError : {},
        ]}
      >
        <RNTextInput
          {...props}
          secureTextEntry={isSecure && !secureTextVisible}
          style={[
            styles.input,
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
        {isSecure && (
          <TouchableOpacity
            onPress={() => setSecureTextVisible(!secureTextVisible)}
            activeOpacity={0.7}
            style={styles.toggleButton}
          >
            {secureTextVisible ? (
              <EyeOff size={20} color={Colors.textMuted} />
            ) : (
              <Eye size={20} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    color: Colors.textMain,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  inputFocused: {
    borderColor: Colors.accentPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  toggleButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.danger,
  },
});
