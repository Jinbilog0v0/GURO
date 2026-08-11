/**
 * SyncBadge — Network + sync status indicator for dashboard headers.
 * Uses expo-network for real-time LAN-aware connectivity detection,
 * not a google.com ping which breaks on airgapped classroom networks.
 *
 * Fixes applied (UX Audit):
 * - O4: Child-friendly label copy ("No Internet", "Connected", "Saving…")
 * - A1: accessibilityLabel, accessibilityRole, and accessibilityHint added
 * - A3: Minimum 44px touch target via minHeight
 * - O11: Animated dot pulse when status is 'pending'; color-flash on status change
 * - Tappable: opens an info modal explaining sync state in plain language
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import * as Network from 'expo-network';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAppStore } from '../../store/useAppStore';

type SyncState = 'synced' | 'pending' | 'offline';

export function SyncBadge() {
  const studentProgress = useAppStore((s) => s.studentProgress);
  const [status, setStatus] = useState<SyncState>('offline');
  const [infoVisible, setInfoVisible] = useState(false);
  const prevStatus = useRef<SyncState>('offline');

  // Animated pulse for pending dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Animated flash for status change
  const flashAnim = useRef(new Animated.Value(0)).current;

  const pendingCount = (studentProgress || []).filter((e) => !e.synced).length;

  const checkNetworkStatus = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      if (isConnected) {
        setStatus(pendingCount > 0 ? 'pending' : 'synced');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkNetworkStatus();
    const timer = setInterval(checkNetworkStatus, 10_000);
    return () => clearInterval(timer);
  }, [pendingCount]);

  // Flash badge when status changes
  useEffect(() => {
    if (prevStatus.current !== status) {
      prevStatus.current = status;
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [status]);

  // Pulse dot animation when pending
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (status === 'pending') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => loop?.stop();
  }, [status]);

  // Child-friendly labels (O4)
  const config: Record<SyncState, { color: string; label: string; dot: string; modalTitle: string; modalBody: string }> = {
    synced: {
      color: Colors.success,
      label: 'Connected ✓',
      dot: Colors.success,
      modalTitle: '✅ Connected',
      modalBody: 'Your answers are being shared with your teacher. Great job!',
    },
    pending: {
      color: Colors.warning,
      label: `Saving… (${pendingCount})`,
      dot: Colors.warning,
      modalTitle: '🔄 Saving Your Work',
      modalBody: `You have ${pendingCount} quiz result${pendingCount !== 1 ? 's' : ''} waiting to be sent to your teacher. They will be sent automatically when your internet is working.`,
    },
    offline: {
      color: Colors.textDark,
      label: 'No Internet 📵',
      dot: Colors.textDark,
      modalTitle: '📵 No Internet',
      modalBody: 'You are working offline. Don\'t worry — your answers are saved on this device and will be shared with your teacher once you\'re back online.',
    },
  };

  const { color, label, dot, modalTitle, modalBody } = config[status];

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)'],
  });

  return (
    <>
      <TouchableOpacity
        onPress={() => setInfoVisible(true)}
        activeOpacity={0.75}
        accessibilityLabel={`Network status: ${label}. Tap for more information.`}
        accessibilityRole="button"
        accessibilityHint="Opens a description of your current connection status"
        style={styles.touchArea}
      >
        <Animated.View style={[styles.container, { backgroundColor: flashBg }]}>
          <Animated.View style={[styles.dot, { backgroundColor: dot, opacity: pulseAnim }]} />
          <Text style={[styles.label, { color }]}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Info modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInfoVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalBody}>{modalBody}</Text>
            <TouchableOpacity
              onPress={() => setInfoVisible(false)}
              style={styles.modalCloseBtn}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    minHeight: 44,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.bgSidebar,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
  },
  modalBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: Colors.accentPrimary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
});
