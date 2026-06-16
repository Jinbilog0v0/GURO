/**
 * syncService.ts — Dedicated sync service layer.
 * Handles network awareness and sync orchestration.
 * Extracted from useAppStore to keep the store clean.
 */

import { useAppStore } from '../store/useAppStore';

const SERVER_URL = 'http://localhost:3000';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
}

/**
 * Simple network reachability check.
 * Uses a lightweight HEAD request to a reliable endpoint.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

/**
 * Sync unsynced progress events to the server if online.
 * Falls back gracefully if offline — data stays in SQLite.
 */
export async function syncIfOnline(serverUrl: string = SERVER_URL): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) {
    return {
      success: false,
      syncedCount: 0,
      message: 'Device is offline. Progress saved locally — will sync when reconnected.',
    };
  }
  return useAppStore.getState().syncProgressNow(serverUrl);
}

/**
 * Fetch the latest item bank from server and store locally.
 * Only runs when online. Falls back to local SQLite copy silently.
 */
export async function refreshItemBankIfOnline(classroomId: string | null): Promise<boolean> {
  if (!classroomId) return false;
  const online = await isOnline();
  if (!online) return false;
  return useAppStore.getState().fetchItemBankFromServer(SERVER_URL, classroomId);
}
