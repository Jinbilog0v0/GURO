/**
 * GURO Design System — ConfirmDialog
 * Modern, glassmorphic modal popup dialog for mobile, replacing native Alert.alert.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';
import {
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

export type DialogVariant = 'danger' | 'warning' | 'primary' | 'info' | 'success';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  icon?: LucideIcon | React.ComponentType<{ size?: number; color?: string }>;
  loading?: boolean;
  hideCancel?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  maxWidth?: DimensionValue;
}

interface VariantStyleConfig {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  confirmBg: string;
  confirmText: string;
  defaultIcon: LucideIcon;
}

const VARIANT_CONFIGS: Record<DialogVariant, VariantStyleConfig> = {
  danger: {
    iconBg: Colors.dangerGlow,
    iconBorder: Colors.dangerBorder,
    iconColor: Colors.danger,
    confirmBg: Colors.accentSecondary,
    confirmText: Colors.white,
    defaultIcon: Trash2,
  },
  warning: {
    iconBg: Colors.warningGlow,
    iconBorder: Colors.warningBorder,
    iconColor: Colors.warning,
    confirmBg: Colors.warning,
    confirmText: Colors.white,
    defaultIcon: AlertTriangle,
  },
  primary: {
    iconBg: Colors.accentPrimaryDeep,
    iconBorder: Colors.accentPrimaryGlow,
    iconColor: Colors.accentPrimary,
    confirmBg: Colors.accentPrimary,
    confirmText: Colors.white,
    defaultIcon: Info,
  },
  info: {
    iconBg: 'rgba(28, 91, 192, 0.12)',
    iconBorder: 'rgba(28, 91, 192, 0.25)',
    iconColor: Colors.accentBlue,
    confirmBg: Colors.accentBlue,
    confirmText: Colors.white,
    defaultIcon: AlertCircle,
  },
  success: {
    iconBg: Colors.successGlow,
    iconBorder: Colors.successBorder,
    iconColor: Colors.success,
    confirmBg: Colors.success,
    confirmText: Colors.white,
    defaultIcon: CheckCircle2,
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  description,
  confirmText = 'Confirm',
  confirmLabel,
  cancelText = 'Cancel',
  cancelLabel,
  variant = 'danger',
  icon: CustomIcon,
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
  maxWidth = 360,
}) => {
  const content = message ?? description;
  const resolvedConfirm = confirmLabel || confirmText;
  const resolvedCancel = cancelLabel || cancelText;
  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.danger;
  const IconComponent = CustomIcon || config.defaultIcon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <Pressable
        style={styles.backdrop}
        onPress={loading ? undefined : onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.dialogCard, { maxWidth }]}
        >
          {/* Top Close Button */}
          {!loading && (
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close dialog"
            >
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Glowing Icon Header */}
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: config.iconBg,
                borderColor: config.iconBorder,
              },
            ]}
          >
            <IconComponent size={28} color={config.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message / Description */}
          {typeof content === 'string' ? (
            <Text style={styles.message}>{content}</Text>
          ) : (
            <View style={styles.messageContainer}>{content}</View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {!hideCancel && (
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                style={[styles.button, styles.cancelBtn, loading && styles.btnDisabled]}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelBtnText}>{resolvedCancel}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={[
                styles.button,
                styles.confirmBtn,
                { backgroundColor: config.confirmBg },
                loading && styles.btnDisabled,
                hideCancel && { flex: 1 },
              ]}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color={config.confirmText} />
              ) : (
                <Text style={[styles.confirmBtnText, { color: config.confirmText }]}>
                  {resolvedConfirm}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  dialogCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xs,
  },
  messageContainer: {
    width: '100%',
    marginBottom: Spacing['2xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  confirmBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
  },
  btnDisabled: {
    opacity: 0.55,
  },
});
