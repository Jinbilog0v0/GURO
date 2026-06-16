import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './src/theme/colors';
import { Fonts, FontSizes } from './src/theme/typography';

const SERVER_URL = 'http://localhost:3000';

export default function App() {
  const initializeLocalStore = useAppStore((state) => state.initializeLocalStore);
  const addLog = useAppStore((state) => state.addLog);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);

  // ── Load Google Fonts ───────────────────────────────────────────────────────
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // ── Initialize SQLite on startup ────────────────────────────────────────────
  useEffect(() => {
    initializeLocalStore();
    addLog('Offline SQLite Store successfully initialized.');
  }, []);

  // ── Auto-sync when app comes to foreground ──────────────────────────────────
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        addLog('[Sync] App foregrounded — attempting auto-sync...');
        syncProgressNow(SERVER_URL).then((result) => {
          if (result.syncedCount > 0) {
            addLog(`[Sync] Auto-synced ${result.syncedCount} events on foreground.`);
          }
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // ── Font loading gate ───────────────────────────────────────────────────────
  if (!fontsLoaded && !fontError) {
    return (
      <View style={splashStyles.screen}>
        <View style={splashStyles.badge}>
          <Text style={splashStyles.badgeText}>GURO</Text>
        </View>
        <Text style={splashStyles.loading}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const splashStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  badge: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 4,
  },
  loading: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
