import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { Eye, EyeOff } from 'lucide-react-native';

export interface ThemedInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  helperText?: string;
}

export const ThemedTextInput = forwardRef<RNTextInput, ThemedInputProps>(function ThemedTextInput(
  {
    label,
    containerStyle,
    error,
    helperText,
    ...props
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [secureTextVisible, setSecureTextVisible] = useState(false);
  const innerRef = useRef<RNTextInput>(null);

  useImperativeHandle(ref, () => innerRef.current as RNTextInput);

  const isSecure = props.secureTextEntry;

  const handleContainerPress = () => {
    innerRef.current?.focus();
  };

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={handleContainerPress}
        style={[
          styles.inputContainer,
          props.multiline && styles.inputContainerMultiline,
          focused && styles.inputFocused,
          error ? styles.inputError : {},
        ]}
      >
        <RNTextInput
          {...props}
          ref={innerRef}
          secureTextEntry={isSecure && !secureTextVisible}
          style={[
            styles.input,
            props.multiline && styles.inputMultiline,
            props.style,
          ]}
          textAlignVertical={props.multiline ? 'top' : 'center'}
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={secureTextVisible ? 'Hide password' : 'Show password'}
            style={styles.toggleButton}
          >
            {secureTextVisible ? (
              <EyeOff size={20} color={Colors.textMuted} />
            ) : (
              <Eye size={20} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </Pressable>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  group: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  inputContainerMultiline: {
    minHeight: 88,
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textMain,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: 15,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 76,
    paddingTop: Spacing.xs,
  },
  inputFocused: {
    borderColor: Colors.accentPrimary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  toggleButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.danger,
    marginTop: 2,
  },
  helperText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
