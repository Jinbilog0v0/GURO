import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

export interface CheckboxProps {
  checked: boolean;
  onPress: (nextChecked: boolean) => void;
  label?: React.ReactNode;
  sublabel?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: StyleProp<ViewStyle>;
  boxStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Checkbox({
  checked,
  onPress,
  label,
  sublabel,
  disabled = false,
  accessibilityLabel,
  size = 'md',
  containerStyle,
  boxStyle,
  labelStyle,
}: CheckboxProps) {
  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not available in test or unsupported env
    }
    onPress(!checked);
  };

  const boxDimensions = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  const accessibleText = typeof label === 'string' ? label : accessibilityLabel || 'Checkbox';

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={accessibleText}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.container,
        disabled && styles.disabledContainer,
        containerStyle,
      ]}
    >
      <View
        style={[
          styles.boxBase,
          {
            width: boxDimensions,
            height: boxDimensions,
            borderRadius: size === 'sm' ? Radius.xs : Radius.sm,
            borderColor: checked ? Colors.accentPrimary : Colors.borderStrong,
            backgroundColor: checked ? Colors.accentPrimary : 'transparent',
          },
          boxStyle,
        ]}
      >
        {checked && (
          <Check
            size={iconSize}
            color="#FFFFFF"
            strokeWidth={3}
          />
        )}
      </View>

      {(label || sublabel) && (
        <View style={styles.labelCol}>
          {typeof label === 'string' ? (
            <Text
              style={[
                styles.labelText,
                disabled && styles.disabledText,
                labelStyle,
              ]}
            >
              {label}
            </Text>
          ) : (
            label
          )}
          {sublabel && (
            <Text style={styles.sublabelText}>{sublabel}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    gap: Spacing.sm,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  boxBase: {
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelCol: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  sublabelText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  disabledText: {
    color: Colors.textDark,
  },
});
