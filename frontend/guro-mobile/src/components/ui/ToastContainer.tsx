import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { create } from 'zustand';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'success', duration),
  error: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'error', duration),
  info: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'info', duration),
  warning: (message: string, duration?: number) => useToastStore.getState().addToast(message, 'warning', duration),
};

interface ToastItemProps {
  item: ToastMessage;
  onDismiss: (id: string) => void;
}

function ToastItem({ item, onDismiss }: ToastItemProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade/Slide In
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Auto dismiss timer
    const timer = setTimeout(() => {
      handleDismiss();
    }, item.duration || 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(item.id);
    });
  };

  const getStyle = () => {
    switch (item.type) {
      case 'success':
        return {
          bg: '#ECFDF5',
          border: '#A7F3D0',
          text: '#064E3B',
          iconColor: Colors.success,
          Icon: CheckCircle,
        };
      case 'error':
        return {
          bg: '#FEF2F2',
          border: '#FECACA',
          text: '#7F1D1D',
          iconColor: Colors.danger,
          Icon: AlertCircle,
        };
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#78350F',
          iconColor: Colors.warning,
          Icon: AlertTriangle,
        };
      case 'info':
      default:
        return {
          bg: '#EFF6FF',
          border: '#BFDBFE',
          text: '#1E3A8A',
          iconColor: Colors.accentPrimary,
          Icon: Info,
        };
    }
  };

  const config = getStyle();
  const Icon = config.Icon;

  const translate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.toastCard,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          opacity,
          transform: [{ translateY: translate }],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Icon size={20} color={config.iconColor} style={styles.icon} />
        <Text style={[styles.toastText, { color: config.text }]}>{item.message}</Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
        <X size={16} color={config.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + 8 }]}>
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={removeToast} />
      ))}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width - 32,
    maxWidth: 500,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  toastText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
    opacity: 0.6,
  },
});
