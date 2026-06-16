/**
 * SyncBadge — Network + sync status indicator for dashboard headers.
 * Shows online/offline state and pending unsynced progress count.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { useAppStore } from '../../store/useAppStore';

type SyncState = 'synced' | 'pending' | 'offline';

export function SyncBadge() {
  const studentProgress = useAppStore((s) => s.studentProgress);
  const [status, setStatus] = useState<SyncState>('offline');

  const pendingCount = studentProgress.filter((e) => !e.synced).length;

  useEffect(() => {
    checkNetworkStatus();
  }, [pendingCount]);

  const checkNetworkStatus = async () => {
    try {
      // Simple reachability check — expo-network is imported in syncService
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      if (response.ok) {
        setStatus(pendingCount > 0 ? 'pending' : 'synced');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    }
  };

  const config: Record<SyncState, { color: string; label: string; dot: string }> = {
    synced: { color: Colors.success, label: 'Synced', dot: Colors.success },
    pending: { color: Colors.warning, label: `${pendingCount} Pending`, dot: Colors.warning },
    offline: { color: Colors.textDark, label: 'Offline', dot: Colors.textDark },
  };

  const { color, label, dot } = config[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
