import { isOnline, syncIfOnline, refreshItemBankIfOnline } from './syncService';
import { useAppStore } from '../store/useAppStore';

// Mock fetch
global.fetch = jest.fn();

// Mock store
const mockSyncProgressNow = jest.fn();
const mockFetchItemBankFromServer = jest.fn();

jest.mock('../store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      syncProgressNow: mockSyncProgressNow,
      fetchItemBankFromServer: mockFetchItemBankFromServer,
    })
  }
}));

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isOnline', () => {
    test('should return true when HEAD request succeeds with 204 status', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 204,
        ok: true
      });

      const online = await isOnline();
      expect(online).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://clients3.google.com/generate_204',
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    test('should return false when request fails or throws error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const online = await isOnline();
      expect(online).toBe(false);
    });
  });

  describe('syncIfOnline', () => {
    test('should trigger store syncProgressNow when online', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ status: 204, ok: true });
      mockSyncProgressNow.mockResolvedValue({ success: true, syncedCount: 5, message: 'Sync complete' });

      const result = await syncIfOnline('http://mock-server');

      expect(mockSyncProgressNow).toHaveBeenCalledWith('http://mock-server');
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(5);
    });

    test('should return offline status and not trigger store sync when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Offline'));

      const result = await syncIfOnline('http://mock-server');

      expect(mockSyncProgressNow).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Device is offline');
    });
  });

  describe('refreshItemBankIfOnline', () => {
    test('should fetch item bank when classroomId is provided and device is online', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ status: 204, ok: true });
      mockFetchItemBankFromServer.mockResolvedValue(true);

      const result = await refreshItemBankIfOnline('CLASS-123');

      expect(mockFetchItemBankFromServer).toHaveBeenCalledWith('http://localhost:3000', 'CLASS-123');
      expect(result).toBe(true);
    });

    test('should return false immediately when classroomId is null', async () => {
      const result = await refreshItemBankIfOnline(null);

      expect(mockFetchItemBankFromServer).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should return false and not fetch when offline', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Offline'));

      const result = await refreshItemBankIfOnline('CLASS-123');

      expect(mockFetchItemBankFromServer).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
