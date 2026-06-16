/**
 * PinPad — Reusable 4-digit PIN entry modal.
 * Extracted from StudentDashboard to be shared across all dashboards.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface PinPadProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Called when user submits a PIN. Return true if correct, false if wrong. */
  onSubmit: (pin: string) => Promise<boolean> | boolean;
  onCancel: () => void;
}

export function PinPad({ visible, title, subtitle, onSubmit, onCancel }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError('');
      if (next.length === 4) {
        handleSubmit(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  const handleSubmit = async (submittedPin: string) => {
    setLoading(true);
    const correct = await onSubmit(submittedPin);
    setLoading(false);
    if (!correct) {
      setPin('');
      setError('Incorrect PIN. Try again.');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onCancel();
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable onPress={() => {}} style={styles.modalContainer}>
          <GlassCard padding={Spacing['2xl']}>
            {/* Header */}
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            {/* PIN Dots */}
            <View style={styles.dotsRow}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    pin.length > i && styles.dotFilled,
                    error ? styles.dotError : {},
                  ]}
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Numpad */}
            <View style={styles.numpad}>
              {digits.map((d, idx) => {
                if (d === '') return <View key={idx} style={styles.digitPlaceholder} />;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => (d === '⌫' ? handleBackspace() : handleDigit(d))}
                    style={[styles.digitBtn, d === '⌫' && styles.backspaceBtn]}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.digitText, d === '⌫' && styles.backspaceText]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancel */}
            <TouchableOpacity onPress={handleClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.transparent,
  },
  dotFilled: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  dotError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  digitBtn: {
    width: 72,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitPlaceholder: {
    width: 72,
    height: 56,
  },
  backspaceBtn: {
    backgroundColor: Colors.dangerGlow,
    borderColor: Colors.dangerBorder,
  },
  digitText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
  },
  backspaceText: {
    color: Colors.dangerText,
  },
  cancelBtn: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
});
