jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../utils/sqliteHelper', () => ({
  getLocalItemBank: jest.fn().mockResolvedValue(null),
  saveLocalItemBank: jest.fn().mockResolvedValue(undefined),
  saveLocalProgress: jest.fn().mockResolvedValue(undefined),
  getLocalProgress: jest.fn().mockResolvedValue([]),
  clearLocalProgress: jest.fn().mockResolvedValue(undefined),
  markEventsAsSynced: jest.fn().mockResolvedValue(undefined),
  getParentSetting: jest.fn().mockResolvedValue(null),
  saveParentSetting: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

import { useAppStore } from './useAppStore';

// Mock fetch for API testing
global.fetch = jest.fn();

describe('AppStore (Mobile Online Flows)', () => {
  beforeEach(() => {
    // Reset store state before each test if possible, or clear mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Account Promotion Flow', () => {
    test('registerAndPromote should migrate anonymous studentId to registered studentId', async () => {
      // 1. Initial guest state
      const store = useAppStore.getState();
      const guestId = 'GUEST-123';
      store.setStudentId(guestId);
      
      // 2. Mock success response from server
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { userId: 'USR-789', email: 'juan@example.com', name: 'Juan Dela Cruz', role: 'student' },
          studentId: 'JUAN-DELA-CRUZ'
        })
      });

      // 3. Trigger promotion
      const result = await store.registerAndPromote('juan@example.com', 'password123', 'Juan Dela Cruz');

      expect(result.success).toBe(true);
      expect(useAppStore.getState().currentUser?.email).toBe('juan@example.com');
      expect(useAppStore.getState().studentId).toBe('JUAN-DELA-CRUZ');
    });
  });

  describe('Sync Flow', () => {
    test('syncProgressNow should send unsynced events and mark them synced on success', async () => {
      const store = useAppStore.getState();
      
      // Add a mock unsynced event
      await store.recordProgress({
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Fractions',
        score: 10,
        totalQuestions: 10
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await store.syncProgressNow('http://localhost:3000');

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      
      // Verify local state was updated to synced: true
      const syncedEvent = useAppStore.getState().studentProgress.find(e => e.topic === 'Fractions');
      expect(syncedEvent?.synced).toBe(true);
    });
  });

  describe('Classroom Linking Flow', () => {
    test('fetchItemBankFromServer should download and update local itemBank', async () => {
      const store = useAppStore.getState();
      const mockCustomBank = { 'Mathematics': { '4': { 'Custom Topic': {} } } };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockCustomBank
      });

      const success = await store.fetchItemBankFromServer('http://localhost:3000', 'MATH-G4-TEST');

      expect(success).toBe(true);
      expect(useAppStore.getState().itemBank).toEqual(mockCustomBank);
    });
  });
});
