import * as Updates from 'expo-updates';
import {
  checkForAppUpdate,
  fetchAndApplyAppUpdate,
  getUpdateMetadata,
  isUpdatesEnabled,
  performBackgroundUpdateCheck,
} from './updateService';
import { useAppStore } from '../store/useAppStore';

describe('updateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({ logs: [] });
  });

  describe('isUpdatesEnabled', () => {
    it('returns false in __DEV__ mode', () => {
      // In jest test environment, __DEV__ is true
      expect(isUpdatesEnabled()).toBe(false);
    });
  });

  describe('getUpdateMetadata', () => {
    it('returns active update metadata and default fallbacks', () => {
      const meta = getUpdateMetadata();
      expect(meta).toHaveProperty('isEnabled');
      expect(meta).toHaveProperty('channel');
      expect(meta).toHaveProperty('runtimeVersion');
      expect(meta).toHaveProperty('updateId');
      expect(meta).toHaveProperty('isEmbeddedLaunch');
    });
  });

  describe('checkForAppUpdate', () => {
    it('gracefully reports updates disabled when in development environment', async () => {
      const result = await checkForAppUpdate();
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('__DEV__');
      expect(Updates.checkForUpdateAsync).not.toHaveBeenCalled();
    });

    it('checks for updates when enabled and handles available updates', async () => {
      // Temporarily mock isUpdatesEnabled behavior by overriding __DEV__ or Updates
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;
      (Updates as any).isEnabled = true;
      (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
        isAvailable: true,
        manifest: { id: 'new-bundle-123' },
      });

      const result = await checkForAppUpdate();
      expect(result.isAvailable).toBe(true);
      expect(result.manifest).toEqual({ id: 'new-bundle-123' });
      expect(Updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);

      (global as any).__DEV__ = originalDev;
      (Updates as any).isEnabled = false;
    });

    it('handles errors during update checking without throwing', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;
      (Updates as any).isEnabled = true;
      (Updates.checkForUpdateAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const result = await checkForAppUpdate();
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toContain('Network request failed');

      (global as any).__DEV__ = originalDev;
      (Updates as any).isEnabled = false;
    });
  });

  describe('fetchAndApplyAppUpdate', () => {
    it('returns error when updates are disabled', async () => {
      const result = await fetchAndApplyAppUpdate();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Updates disabled');
    });

    it('downloads and reloads app when update is new', async () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = false;
      (Updates as any).isEnabled = true;
      (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce({ isNew: true });

      const result = await fetchAndApplyAppUpdate();
      expect(result.success).toBe(true);
      expect(Updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
      expect(Updates.reloadAsync).toHaveBeenCalledTimes(1);

      (global as any).__DEV__ = originalDev;
      (Updates as any).isEnabled = false;
    });
  });

  describe('performBackgroundUpdateCheck', () => {
    it('runs silently and does not throw in dev environment', async () => {
      await expect(performBackgroundUpdateCheck()).resolves.not.toThrow();
    });
  });
});
