/**
 * GURO — App Update State Machine Context
 * Provides centralized management for Over-The-Air (OTA) updates,
 * version patch banners, and zero-downtime hot reloading via expo-updates and EAS.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION, APP_BUILD_NUMBER } from '../constants/appVersion';
import { PATCH_NOTES_HISTORY, PatchNoteItem } from '../constants/patchNotes';
import { useAppStore } from '../store/useAppStore';

const LAST_SEEN_VERSION_KEY = '@guro_last_seen_patch_version';

export interface AppUpdateContextValue {
  currentVersion: string;
  buildNumber: string;
  isChecking: boolean;
  isDownloading: boolean;
  updateAvailable: boolean;
  updateManifest: any;
  showUpdateModal: boolean;
  setShowUpdateModal: (show: boolean) => void;
  showNewPatchBanner: boolean;
  markPatchNotesAsSeen: () => Promise<void>;
  checkForAppUpdate: (isManual?: boolean) => Promise<{ isAvailable: boolean; manifest?: any; error?: any }>;
  applyUpdateNow: () => Promise<void>;
  activePatchNotes: PatchNoteItem;
  patchHistory: PatchNoteItem[];
}

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

export interface AppUpdateProviderProps {
  children: ReactNode;
}

export function AppUpdateProvider({ children }: AppUpdateProviderProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateManifest, setUpdateManifest] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showNewPatchBanner, setShowNewPatchBanner] = useState(false);
  const [activePatchNotes, setActivePatchNotes] = useState<PatchNoteItem>(
    PATCH_NOTES_HISTORY.find((p) => p.version === APP_VERSION) || PATCH_NOTES_HISTORY[0]
  );

  const addLog = useAppStore((state) => state.addLog);

  // Check if a new version patch was applied or never seen before
  useEffect(() => {
    (async () => {
      try {
        const lastSeen = await AsyncStorage.getItem(LAST_SEEN_VERSION_KEY);
        if (!lastSeen || lastSeen !== APP_VERSION) {
          setShowNewPatchBanner(true);
        }
      } catch (_e) {
        // Ignored
      }
    })();
  }, []);

  const markPatchNotesAsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
      setShowNewPatchBanner(false);
    } catch (_e) {
      // Ignored
    }
  }, []);

  // Check for EAS OTA updates silently (on launch) or on manual button press
  const checkForAppUpdate = useCallback(async (isManual: boolean = false) => {
    // 1. Guard against local development servers and Expo Go
    if (__DEV__) {
      addLog(`[EAS Update] Check skipped in __DEV__ environment. Current version: v${APP_VERSION}`);
      if (isManual) {
        Alert.alert(
          'Dev Environment',
          `Running on Expo Dev Server. EAS Updates operate on standalone APK / Preview builds. Current version: v${APP_VERSION} (Build ${APP_BUILD_NUMBER}).`
        );
      }
      return { isAvailable: false };
    }

    // 2. Guard against environments where Updates is disabled
    if (!Updates.isEnabled) {
      addLog(`[EAS Update] Updates not enabled in current runtime. Current version: v${APP_VERSION}`);
      if (isManual) {
        Alert.alert(
          'Updates Disabled',
          `EAS Updates are not enabled in this runtime. Current version: v${APP_VERSION}.`
        );
      }
      return { isAvailable: false };
    }

    setIsChecking(true);
    addLog(`[EAS Update] Checking for updates on channel: ${Updates.channel || 'default'}...`);

    try {
      const checkResult = await Updates.checkForUpdateAsync();
      if (checkResult.isAvailable) {
        addLog('[EAS Update] Remote update bundle available!');
        setUpdateAvailable(true);
        setUpdateManifest(checkResult.manifest || null);
        
        // Find matching notes if available in manifest
        const manifestVersion = (checkResult.manifest as any)?.metadata?.appVersion;
        if (manifestVersion) {
          const matchedNote = PATCH_NOTES_HISTORY.find((n) => n.version === manifestVersion);
          if (matchedNote) setActivePatchNotes(matchedNote);
        }

        setShowUpdateModal(true);
        return { isAvailable: true, manifest: checkResult.manifest };
      } else {
        addLog(`[EAS Update] App is already up-to-date on v${APP_VERSION}.`);
        setUpdateAvailable(false);
        if (isManual) {
          Alert.alert(
            'App Up to Date',
            `You are running the latest version of GURO (v${APP_VERSION} Build ${APP_BUILD_NUMBER}).`
          );
        }
        return { isAvailable: false };
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Could not reach update server. Check your internet connection.';
      addLog(`[EAS Update Error] ${errMsg}`);
      if (isManual) {
        Alert.alert('Update Check Failed', errMsg);
      }
      return { isAvailable: false, error };
    } finally {
      setIsChecking(false);
    }
  }, [addLog]);

  // Download and apply the update immediately
  const applyUpdateNow = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      setShowUpdateModal(false);
      return;
    }

    setIsDownloading(true);
    addLog('[EAS Update] Downloading new update bundle...');

    try {
      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        addLog('[EAS Update] Bundle downloaded. Storing version marker and reloading...');
        await AsyncStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
        // Reload JS runtime with the new bundle (0s downtime)
        await Updates.reloadAsync();
      } else {
        setShowUpdateModal(false);
        Alert.alert('Update Staged', 'The update will apply automatically on the next launch.');
      }
    } catch (error: any) {
      const errMsg = error?.message || 'Could not download the update. Please try again later.';
      addLog(`[EAS Update Error] ${errMsg}`);
      Alert.alert('Download Failed', errMsg);
    } finally {
      setIsDownloading(false);
      setShowUpdateModal(false);
    }
  }, [addLog]);

  // Auto-check once on app launch (delayed 4s so UI is responsive first)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForAppUpdate(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, [checkForAppUpdate]);

  return (
    <AppUpdateContext.Provider
      value={{
        currentVersion: APP_VERSION,
        buildNumber: APP_BUILD_NUMBER,
        isChecking,
        isDownloading,
        updateAvailable,
        updateManifest,
        showUpdateModal,
        setShowUpdateModal,
        showNewPatchBanner,
        markPatchNotesAsSeen,
        checkForAppUpdate,
        applyUpdateNow,
        activePatchNotes,
        patchHistory: PATCH_NOTES_HISTORY,
      }}
    >
      {children}
    </AppUpdateContext.Provider>
  );
}

export function useAppUpdate(): AppUpdateContextValue {
  const context = useContext(AppUpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
}
