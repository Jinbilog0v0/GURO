import * as Updates from 'expo-updates';
import { useAppStore } from '../store/useAppStore';

export interface UpdateMetadata {
  isEnabled: boolean;
  channel: string | null;
  runtimeVersion: string | null;
  updateId: string | null;
  isEmbeddedLaunch: boolean;
}

export interface CheckUpdateResult {
  isAvailable: boolean;
  reason?: string;
  manifest?: any;
}

export interface ApplyUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Checks whether OTA updates are supported in the current runtime environment.
 * Updates are disabled in local development mode (__DEV__) and in Expo Go.
 */
export function isUpdatesEnabled(): boolean {
  return Updates.isEnabled && !__DEV__;
}

/**
 * Retrieves current EAS Update metadata for diagnostic and display purposes.
 */
export function getUpdateMetadata(): UpdateMetadata {
  return {
    isEnabled: Updates.isEnabled ?? false,
    channel: Updates.channel ?? 'development',
    runtimeVersion: Updates.runtimeVersion ?? '1.0.1',
    updateId: Updates.updateId ?? null,
    isEmbeddedLaunch: Updates.isEmbeddedLaunch ?? true,
  };
}

/**
 * Checks the EAS Update server for an available update bundle matching the active runtime version.
 */
export async function checkForAppUpdate(): Promise<CheckUpdateResult> {
  const addLog = useAppStore.getState().addLog;

  if (!isUpdatesEnabled()) {
    const reason = __DEV__
      ? 'OTA updates disabled in development (__DEV__ mode)'
      : 'OTA updates are not enabled for this build configuration';
    addLog(`[EAS Update] ${reason}`);
    return { isAvailable: false, reason };
  }

  try {
    addLog('[EAS Update] Checking for updates on channel: ' + (Updates.channel || 'default'));
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      addLog('[EAS Update] New update available on remote channel.');
      return { isAvailable: true, manifest: update.manifest };
    } else {
      addLog('[EAS Update] App is already on the latest available bundle.');
      return { isAvailable: false, reason: 'Latest version already installed' };
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to check for updates';
    addLog(`[EAS Update Error] ${errorMsg}`);
    return { isAvailable: false, reason: errorMsg };
  }
}

/**
 * Downloads the latest update bundle and immediately reloads the React Native runtime.
 */
export async function fetchAndApplyAppUpdate(): Promise<ApplyUpdateResult> {
  const addLog = useAppStore.getState().addLog;

  if (!isUpdatesEnabled()) {
    return { success: false, error: 'Updates disabled in current environment' };
  }

  try {
    addLog('[EAS Update] Downloading update bundle...');
    const result = await Updates.fetchUpdateAsync();

    if (result.isNew) {
      addLog('[EAS Update] Bundle downloaded successfully. Reloading runtime...');
      await Updates.reloadAsync();
      return { success: true };
    } else {
      addLog('[EAS Update] Downloaded bundle matches active version.');
      return { success: true };
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to download or apply update';
    addLog(`[EAS Update Error] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Safe background check for app startup or foreground event.
 * Never throws and never interrupts user experience.
 */
export async function performBackgroundUpdateCheck(): Promise<void> {
  if (!isUpdatesEnabled()) return;

  try {
    const checkResult = await checkForAppUpdate();
    if (checkResult.isAvailable) {
      const applyResult = await fetchAndApplyAppUpdate();
      if (applyResult.success) {
        useAppStore.getState().addLog('[EAS Update] Applied update in background.');
      }
    }
  } catch (err: any) {
    // Non-blocking background catch
    useAppStore.getState().addLog(`[EAS Update Background Check] Ignored non-fatal error: ${err?.message}`);
  }
}
