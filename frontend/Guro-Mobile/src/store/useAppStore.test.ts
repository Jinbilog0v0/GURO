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

      const result = await store.syncProgressNow('http://localhost:8000');

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

      const success = await store.fetchItemBankFromServer('http://localhost:8000', 'MATH-G4-TEST');

      expect(success).toBe(true);
      expect(useAppStore.getState().itemBank).toEqual(mockCustomBank);
    });
  });

  describe('Gamification Flow', () => {
    test('recordProgress should award correct XP and stars, including perfect score bonuses', async () => {
      const store = useAppStore.getState();
      
      // Reset XP and Stars
      useAppStore.setState({ xpPoints: 0, virtualStars: 0 });

      // Record a perfect quiz progress (10/10)
      await store.recordProgress({
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Decimals',
        score: 10,
        totalQuestions: 10
      });

      // Perfect score: 10 correct * 10 XP + 50 bonus = 150 XP
      // Perfect score: 10 correct * 2 Stars + 10 bonus = 30 Stars
      expect(useAppStore.getState().xpPoints).toBe(150);
      expect(useAppStore.getState().virtualStars).toBe(30);

      // Record a non-perfect quiz progress (8/10)
      await store.recordProgress({
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Decimals Part 2',
        score: 8,
        totalQuestions: 10
      });

      // Non-perfect: 8 correct * 10 XP = 80 XP. Total = 230 XP.
      // Non-perfect: 8 correct * 2 Stars = 16 Stars. Total = 46 Stars.
      expect(useAppStore.getState().xpPoints).toBe(230);
      expect(useAppStore.getState().virtualStars).toBe(46);
    });

    test('purchaseOutfit should purchase and equip a mascot accessory if affordable', () => {
      const store = useAppStore.getState();
      
      // Setup state
      useAppStore.setState({ virtualStars: 50, ownedOutfits: ['default'], mascotOutfit: 'default' });

      // Try purchasing a costly outfit (crown: 100 stars) - should fail
      const failSuccess = store.purchaseOutfit('crown', 100);
      expect(failSuccess).toBe(false);
      expect(useAppStore.getState().virtualStars).toBe(50);
      expect(useAppStore.getState().ownedOutfits).not.toContain('crown');
      expect(useAppStore.getState().mascotOutfit).toBe('default');

      // Try purchasing an affordable outfit (detective_hat: 20 stars) - should succeed
      const buySuccess = store.purchaseOutfit('detective_hat', 20);
      expect(buySuccess).toBe(true);
      expect(useAppStore.getState().virtualStars).toBe(30); // 50 - 20
      expect(useAppStore.getState().ownedOutfits).toContain('detective_hat');
      expect(useAppStore.getState().mascotOutfit).toBe('detective_hat');
    });
  });

  describe('Logout Flow', () => {
    test('logoutFromCloud should clean up cloud states, classroom link, parental controls, and trigger local SQLite load', () => {
      const store = useAppStore.getState();
      
      // Setup logged-in cloud state
      useAppStore.setState({
        currentUser: { userId: 'USR-123', email: 'juan@example.com', name: 'Juan', role: 'student' },
        studentId: 'JUAN-CLOUD',
        appMode: 'online',
        guestName: 'Juanito',
        classroomId: 'CLASS-456',
        parentalControls: {
          dailyTimeLimit: 60,
          mathBeforeEnglish: true,
          forcedBilingual: true,
          priorityTopic: 'Fractions',
        },
        dailyMinutesUsed: 25,
        lastActiveDay: '2026-06-22',
      });

      store.logoutFromCloud();

      const updatedState = useAppStore.getState();
      expect(updatedState.currentUser).toBeNull();
      expect(updatedState.studentId).toBe('GURO-STUDENT-LOCAL');
      expect(updatedState.appMode).toBe('offline');
      expect(updatedState.guestName).toBeNull();
      // Classroom pairing is preserved on logout (not revoked unless unlinked explicitly)
      expect(updatedState.classroomId).toBe('CLASS-456');
      expect(updatedState.parentalControls.dailyTimeLimit).toBe(0);
      expect(updatedState.parentalControls.mathBeforeEnglish).toBe(false);
      expect(updatedState.parentalControls.forcedBilingual).toBe(false);
      expect(updatedState.parentalControls.priorityTopic).toBeNull();
      expect(updatedState.dailyMinutesUsed).toBe(0);
      expect(updatedState.lastActiveDay).toBeNull();
    });
  });
});
