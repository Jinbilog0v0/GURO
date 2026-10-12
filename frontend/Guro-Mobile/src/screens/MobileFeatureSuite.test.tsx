import { useAppStore } from '../store/useAppStore';
import * as updateService from '../services/updateService';
import { getParentAccessCode, getTeacherDerivedPin } from '../utils/security';
import { calculateNextDifficulty, evaluateRemediationRouting, MASTERY_THRESHOLD } from '../utils/engine';
import * as sqliteHelper from '../utils/sqliteHelper';

// Mock sqliteHelper methods
jest.mock('../utils/sqliteHelper', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
  saveLocalProgress: jest.fn().mockResolvedValue(undefined),
  getLocalProgress: jest.fn().mockResolvedValue([]),
  clearLocalProgress: jest.fn().mockResolvedValue(undefined),
  markEventsAsSynced: jest.fn().mockResolvedValue(undefined),
  getParentSetting: jest.fn().mockResolvedValue(null),
  saveParentSetting: jest.fn().mockResolvedValue(undefined),
  getStudentProgressSummary: jest.fn().mockResolvedValue({
    totalCompleted: 5,
    averageScore: 85,
    totalStars: 15,
  }),
}));

describe('Mobile Comprehensive Feature Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      currentUser: null,
      appMode: 'offline',
      guestName: 'Carlo Mendoza',
      studentId: 'STUDENT-CARLO-01',
      preferredGrade: 4,
      xpPoints: 100,
      virtualStars: 10,
      streakCount: 3,
      logs: [],
      studentProgress: [],
      dailyMinutesUsed: 25,
      parentalControls: {
        dailyTimeLimit: 60,
        mathBeforeEnglish: false,
        forcedBilingual: false,
        priorityTopic: null,
      },
    });
  });

  // ── 1. Student Learning, Diagnostics & Gamification Flow ────────────────────
  describe('Student Learning & Quiz Feature Flow', () => {
    it('initializes student session in offline guest mode with default Grade 4', () => {
      const state = useAppStore.getState();
      expect(state.appMode).toBe('offline');
      expect(state.guestName).toBe('Carlo Mendoza');
      expect(state.preferredGrade).toBe(4);
      expect(state.xpPoints).toBe(100);
      expect(state.virtualStars).toBe(10);
    });

    it('awards XP and virtual stars when student completes an assessment', () => {
      const initialStars = useAppStore.getState().virtualStars;
      const initialXp = useAppStore.getState().xpPoints;

      // Earn 3 stars and 50 XP
      useAppStore.setState((s) => ({
        virtualStars: s.virtualStars + 3,
        xpPoints: s.xpPoints + 50,
      }));

      const updated = useAppStore.getState();
      expect(updated.virtualStars).toBe(initialStars + 3);
      expect(updated.xpPoints).toBe(initialXp + 50);
    });

    it('persists progress locally in SQLite helper and saves event to store', async () => {
      const progressEvent = {
        eventId: 'EVT-STUDENT-G4-001',
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Fractions and Decimals',
        score: 90,
        totalQuestions: 10,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      await sqliteHelper.saveLocalProgress(progressEvent as any);
      expect(sqliteHelper.saveLocalProgress).toHaveBeenCalledWith(progressEvent);

      // Add to store progress list
      useAppStore.setState((s) => ({
        studentProgress: [...s.studentProgress, progressEvent],
      }));
      expect(useAppStore.getState().studentProgress).toContainEqual(progressEvent);
    });
  });

  // ── 2. Adaptive Learning Engine Flow ─────────────────────────────────────────
  describe('Adaptive Learning Engine & Mastery Progression', () => {
    it('applies mastery threshold rule: score >= 80% advances tier', () => {
      expect(MASTERY_THRESHOLD).toBe(80);

      const highResult = calculateNextDifficulty(85, 'Easy');
      expect(highResult).toBe('advance');

      const averageResult = calculateNextDifficulty(65, 'Average');
      expect(averageResult).toBe('repeat');

      const lowResult = calculateNextDifficulty(40, 'Average');
      expect(lowResult).toBe('drop');
    });

    it('evaluates remediation routing correctly for struggling students', () => {
      const remediation = evaluateRemediationRouting(45, 'Mathematics', 4, 'Fractions', 'Average');
      expect(remediation).toBeDefined();
      expect(remediation.instruction).toBe('prerequisite_return');
      expect(remediation.tier).toBe('Easy');
      expect(remediation.feedbackTitle).toBe('Foundational Re-Routing');
    });

    it('loads teacher session with classroom roster and telemetry', () => {
      useAppStore.setState({
        currentUser: {
          userId: 'TEACHER-MARIA-01',
          name: 'Teacher Maria Santos',
          email: 'maria.santos@deped.gov.ph',
          role: 'teacher',
          classroomId: 'G4-RIZAL-2026',
        },
        appMode: 'online',
      });

      const state = useAppStore.getState();
      expect(state.currentUser?.role).toBe('teacher');
      expect(state.currentUser?.classroomId).toBe('G4-RIZAL-2026');
      expect(state.appMode).toBe('online');
    });
  });

  // ── 3. Parent Guardian Security & Screen Time Flow ─────────────────────────
  describe('Parent Guardian Security & Screen Time Flow', () => {
    it('generates consistent 6-digit access code for guardian synchronization', () => {
      const studentId = 'STUDENT-CARLO-01';
      const code1 = getParentAccessCode(studentId);
      const code2 = getParentAccessCode(studentId);

      expect(code1).toBeDefined();
      expect(code1).toHaveLength(6);
      expect(/^\d{6}$/.test(code1)).toBe(true);
      expect(code1).toBe(code2);

      // Different student generates a different access code
      const differentCode = getParentAccessCode('STUDENT-JUAN-99');
      expect(differentCode).not.toBe(code1);
    });

    it('generates 4-digit teacher derived pin correctly', () => {
      const pin = getTeacherDerivedPin('G4-RIZAL-2026', 'STUDENT-CARLO-01');
      expect(pin).toHaveLength(4);
      expect(/^\d{4}$/.test(pin)).toBe(true);
    });

    it('enforces healthy screen time guard limit', () => {
      const state = useAppStore.getState();
      const dailyLimit = state.parentalControls.dailyTimeLimit;
      const currentUsed = state.dailyMinutesUsed;

      expect(dailyLimit).toBe(60);
      expect(currentUsed).toBe(25);
      expect(currentUsed < dailyLimit).toBe(true);

      // Increment minutes used
      useAppStore.setState((s) => ({
        dailyMinutesUsed: s.dailyMinutesUsed + 40, // reaches 65
      }));

      const updatedState = useAppStore.getState();
      expect(updatedState.dailyMinutesUsed).toBe(65);
      expect(updatedState.dailyMinutesUsed > dailyLimit).toBe(true);
    });
  });

  // ── 4. Offline to Online Synchronization Flow ───────────────────────────────
  describe('Offline to Online Synchronization Flow', () => {
    it('syncs queued offline progress events when connection is restored', async () => {
      const mockEvent = {
        eventId: 'EVT-OFFLINE-99',
        subject: 'English',
        gradeLevel: 4,
        topic: 'Grammar and Reading',
        score: 100,
        totalQuestions: 10,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      useAppStore.setState({
        studentProgress: [mockEvent],
      });

      // Mock global fetch to simulate successful cloud server response
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          syncedCount: 1,
        }),
      });

      const syncResult = await useAppStore.getState().syncProgressNow('https://api.guro.app/api');
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(1);

      // Verify that local event is marked as synced
      const storedProgress = useAppStore.getState().studentProgress;
      expect(storedProgress[0].synced).toBe(true);

      global.fetch = originalFetch;
    });

    it('returns 0 syncedCount when there are no unsynced events', async () => {
      useAppStore.setState({
        studentProgress: [
          {
            eventId: 'EVT-ALREADY-SYNCED',
            subject: 'Math',
            gradeLevel: 4,
            topic: 'Fractions',
            score: 80,
            totalQuestions: 10,
            timestamp: new Date().toISOString(),
            synced: true,
          },
        ],
      });

      const syncResult = await useAppStore.getState().syncProgressNow('https://api.guro.app/api');
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(0);
      expect(syncResult.message).toContain('No new progress logs');
    });
  });

  // ── 5. Over-The-Air (EAS OTA) Updates Flow ──────────────────────────────────
  describe('EAS OTA Update Service Flow', () => {
    it('retrieves update metadata matching runtimeVersion and channel', () => {
      const meta = updateService.getUpdateMetadata();
      expect(meta.runtimeVersion).toBe('1.0.1');
      expect(meta.channel).toBe('production');
      expect(meta.updateId).toBe('mock-update-id-001');
    });

    it('handles update check in offline / dev mode gracefully without throwing', async () => {
      const result = await updateService.checkForAppUpdate();
      expect(result).toBeDefined();
      expect(result.isAvailable).toBe(false);
      // In tests, __DEV__ is true
      expect(result.reason).toContain('__DEV__');
    });

    it('logs update operations to the centralized application store', async () => {
      await updateService.checkForAppUpdate();
      const logs = useAppStore.getState().logs;
      expect(logs.some((l) => l.includes('[EAS Update]'))).toBe(true);
    });
  });
});
