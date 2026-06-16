import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import itemBankData from '../../assets/item_bank.json';
import {
  getLocalItemBank,
  saveLocalItemBank,
  saveLocalProgress,
  getLocalProgress,
  clearLocalProgress,
  markEventsAsSynced,
  getParentSetting,
  saveParentSetting,
} from '../utils/sqliteHelper';

export interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  feedback: {
    en: string;
    fil: string;
  };
}

export type AssessmentCategory = 'Multiple-Choice' | 'Paragraph Comprehension' | 'Figures of Speech';
export type DifficultyTier = 'Easy' | 'Average' | 'Difficult';

export interface StudyContent {
  introduction: string;
  definitions: Array<{
    term: string;
    definition: string;
    examples: string[];
  }>;
  summary: string[];
}

export interface TopicData {
  studyContent?: StudyContent;
  [difficulty: string]: {
    [category: string]: Question[];
  } | StudyContent | undefined;
}

export interface GradeData {
  [topic: string]: TopicData;
}

export interface SubjectData {
  [grade: string]: GradeData;
}

export interface ItemBank {
  [subject: string]: SubjectData;
}

export interface ProgressEvent {
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  synced: boolean;
}

interface AppState {
  itemBank: ItemBank | null;
  logs: string[];
  parentPin: string | null;
  studentProgress: ProgressEvent[];
  studentId: string;
  classroomId: string | null;
  streakCount: number;
  unlockedBadges: string[];
  parentalControls: {
    dailyTimeLimit: number;
    mathBeforeEnglish: boolean;
    forcedBilingual: boolean;
    priorityTopic: string | null;
  };
  currentUser: { userId: string; email: string; name: string; role: string } | null;
  appMode: 'online' | 'offline';
  guestName: string | null;
  dailyMinutesUsed: number;
  lastActiveDay: string | null;
  addLog: (message: string) => void;
  clearLogs: () => void;
  loadItemBankSync: () => Promise<void>;
  setParentPin: (pin: string | null) => void;
  setStudentId: (id: string) => void;
  setClassroomId: (id: string | null) => void;
  setAppMode: (mode: 'online' | 'offline') => void;
  setGuestName: (name: string | null) => void;
  fetchItemBankFromServer: (serverUrl: string, classroomId: string) => Promise<boolean>;
  recordProgress: (event: Omit<ProgressEvent, 'eventId' | 'timestamp' | 'synced'>) => Promise<void>;
  clearProgress: () => Promise<void>;
  syncProgressNow: (serverUrl: string) => Promise<{ success: boolean; syncedCount: number; message: string }>;
  updateParentalControls: (controls: Partial<AppState['parentalControls']>) => void;
  registerAndPromote: (email: string, password: string, name: string) => Promise<{ success: boolean; message: string }>;
  loginToCloud: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutFromCloud: () => void;
  trackActiveMinutes: (minutes: number) => void;
  resetDailyMinutes: () => void;
  initializeLocalStore: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      itemBank: null,
      logs: [],
      parentPin: null,
      studentProgress: [],
      studentId: 'GURO-STUDENT-LOCAL',
      classroomId: null,
      streakCount: 0,
      unlockedBadges: [],
      parentalControls: {
        dailyTimeLimit: 0,
        mathBeforeEnglish: false,
        forcedBilingual: false,
        priorityTopic: null,
      },
      currentUser: null,
      appMode: 'offline',
      guestName: null,
      dailyMinutesUsed: 0,
      lastActiveDay: null,
      setAppMode: (mode) => set({ appMode: mode }),
      setGuestName: (name) => set({ guestName: name }),
      trackActiveMinutes: (minutes) => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastActiveDay !== today) {
          set({ lastActiveDay: today, dailyMinutesUsed: minutes });
        } else {
          set({ dailyMinutesUsed: state.dailyMinutesUsed + minutes });
        }
      },
      resetDailyMinutes: () => {
        set({ dailyMinutesUsed: 0 });
      },
      updateParentalControls: (controls) => {
        set((state) => ({
          parentalControls: { ...state.parentalControls, ...controls },
        }));
        get().addLog('Parental control settings updated.');
      },
      registerAndPromote: async (email, password, name) => {
        const anonymousStudentId = get().studentId;
        const serverUrl = 'http://localhost:3000'; // Default serverUrl
        try {
          const res = await fetch(`${serverUrl}/api/auth/promote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymousStudentId, email, password, name })
          });
          if (res.ok) {
            const data = await res.json();
            set({ 
              currentUser: data.user,
              studentId: data.studentId
            });
            get().addLog(`Guest account promoted. Official studentId is now: ${data.studentId}`);
            return { success: true, message: 'Account successfully registered and progress merged!' };
          } else {
            const err = await res.json();
            return { success: false, message: err.error || 'Promotion failed.' };
          }
        } catch (e: any) {
          return { success: false, message: e.message || 'Connection error.' };
        }
      },
      loginToCloud: async (email, password) => {
        const serverUrl = 'http://localhost:3000';
        try {
          const res = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (res.ok) {
            const data = await res.json();
            set({ 
              currentUser: data.user,
              studentId: data.user.name.replace(/\s+/g, '-').toUpperCase()
            });
            get().addLog(`Logged in as: ${data.user.email}`);
            return { success: true, message: `Successfully logged in as ${data.user.name}` };
          } else {
            const err = await res.json();
            return { success: false, message: err.error || 'Login failed.' };
          }
        } catch (e: any) {
          return { success: false, message: e.message || 'Connection error.' };
        }
      },
      logoutFromCloud: () => {
        set({
          currentUser: null,
          studentId: 'GURO-STUDENT-LOCAL',
          appMode: 'offline',
          guestName: null,
        });
        get().addLog('Logged out of cloud account. Reverted to GURO-STUDENT-LOCAL.');
      },
      addLog: (message) =>
        set((state) => ({
          logs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...state.logs],
        })),
      clearLogs: () => set({ logs: ['Logs cleared.'] }),
      loadItemBankSync: async () => {
        try {
          const localBank = await getLocalItemBank();
          if (localBank && Object.keys(localBank).length > 0) {
            set({ itemBank: localBank });
          } else {
            const fallbackBank = itemBankData as ItemBank;
            set({ itemBank: fallbackBank });
            await saveLocalItemBank(fallbackBank);
          }
        } catch (e) {
          console.error('[SQLite] Failed to load local item bank:', e);
          set({ itemBank: itemBankData as ItemBank });
        }
      },
      setParentPin: (pin) => {
        set({ parentPin: pin });
        get().addLog(pin ? 'Parent PIN updated.' : 'Parent PIN reset.');
      },
      setStudentId: (id) => {
        const sanitized = id.replace(/\s+/g, '-').toUpperCase();
        set({ studentId: sanitized });
        get().addLog(`Student Device ID configured to: ${sanitized}`);
      },
      setClassroomId: (id) => {
        set({ classroomId: id });
        get().addLog(id ? `Linked device to classroom invite code: ${id}` : 'Unlinked device from classroom invite code.');
      },
      fetchItemBankFromServer: async (serverUrl, id) => {
        try {
          const res = await fetch(`${serverUrl}/api/item-bank?classroomId=${id}`);
          if (res.ok) {
            const bank = await res.json();
            if (bank && Object.keys(bank).length > 0) {
              set({ itemBank: bank });
              await saveLocalItemBank(bank);
              get().addLog(`Downloaded custom classroom item bank from server for: ${id}`);
              return true;
            }
          }
        } catch (e: any) {
          get().addLog(`Failed to fetch online item bank: ${e.message}`);
        }
        return false;
      },
      recordProgress: async (event) => {
        const newEvent: ProgressEvent = {
          ...event,
          eventId: `EVT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          synced: false,
        };

        const today = new Date().toISOString().split('T')[0];
        const lastDay = get().lastActiveDay;
        let nextStreak = get().streakCount;

        if (!lastDay) {
          nextStreak = 1;
        } else if (lastDay !== today) {
          const yesterdayObj = new Date();
          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
          const yesterday = yesterdayObj.toISOString().split('T')[0];
          if (lastDay === yesterday) {
            nextStreak += 1;
          } else {
            nextStreak = 1;
          }
        }

        const nextBadges = [...(get().unlockedBadges || [])];
        const isPerfect = event.score === event.totalQuestions;

        if (!nextBadges.includes('first_step')) {
          nextBadges.push('first_step');
        }
        if (isPerfect && !nextBadges.includes('perfect_score')) {
          nextBadges.push('perfect_score');
        }
        if (isPerfect && event.subject === 'Mathematics' && !nextBadges.includes('math_wizard')) {
          nextBadges.push('math_wizard');
        }
        if (isPerfect && event.subject === 'English' && !nextBadges.includes('english_champion')) {
          nextBadges.push('english_champion');
        }
        if (nextStreak >= 3 && !nextBadges.includes('streak_starter')) {
          nextBadges.push('streak_starter');
        }
        if (nextStreak >= 5 && !nextBadges.includes('streak_master')) {
          nextBadges.push('streak_master');
        }

        set((state) => ({
          studentProgress: [newEvent, ...state.studentProgress],
          streakCount: nextStreak,
          unlockedBadges: nextBadges,
          lastActiveDay: today,
        }));

        try {
          await saveLocalProgress(newEvent);
          await saveParentSetting('streak_count', nextStreak.toString());
          await saveParentSetting('unlocked_badges', JSON.stringify(nextBadges));
          await saveParentSetting('last_active_day', today);
        } catch (e) {
          console.error('[SQLite] Failed to save progress/achievements locally:', e);
        }
        get().addLog(`Recorded local progress for "${event.topic}" (${event.score}/${event.totalQuestions})`);
      },
      clearProgress: async () => {
        set({ studentProgress: [] });
        try {
          await clearLocalProgress();
        } catch (e) {
          console.error('[SQLite] Failed to clear local progress:', e);
        }
        get().addLog('Local student progress logs cleared.');
      },
      syncProgressNow: async (serverUrl) => {
        const unsyncedEvents = get().studentProgress.filter((e) => !e.synced);
        if (unsyncedEvents.length === 0) {
          return { success: true, syncedCount: 0, message: 'No new progress logs to sync.' };
        }

        get().addLog(`Starting manual sync of ${unsyncedEvents.length} events...`);
        try {
          const response = await fetch(`${serverUrl}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: get().studentId || 'GURO-STUDENT-LOCAL',
              classroomId: get().classroomId,
              events: unsyncedEvents,
            }),
          });

          if (!response.ok) {
            throw new Error(`Sync server responded with status: ${response.status}`);
          }

          const result = await response.json();
          
          set((state) => ({
            studentProgress: state.studentProgress.map((e) => {
              if (!e.synced) {
                return { ...e, synced: true };
              }
              return e;
            }),
          }));

          try {
            const eventIds = unsyncedEvents.map(e => e.eventId);
            await markEventsAsSynced(eventIds);
          } catch (sqliteErr) {
            console.error('[SQLite] Failed to mark events as synced in SQLite:', sqliteErr);
          }

          get().addLog(`Sync completed successfully. Uploaded ${unsyncedEvents.length} events.`);
          return {
            success: true,
            syncedCount: unsyncedEvents.length,
            message: `Successfully synchronized ${unsyncedEvents.length} progress events.`,
          };
        } catch (error: any) {
          const errMsg = error.message || 'Network error';
          get().addLog(`Sync failed: ${errMsg}`);
          return {
            success: false,
            syncedCount: 0,
            message: `Sync failed: ${errMsg}. Logs are preserved locally.`,
          };
        }
      },
       initializeLocalStore: async () => {
        try {
          const localLogs = await getLocalProgress();
          const localBank = await getLocalItemBank();
          const streakStr = await getParentSetting('streak_count');
          const badgesStr = await getParentSetting('unlocked_badges');

          set({
            studentProgress: localLogs,
            itemBank: localBank || get().itemBank,
            streakCount: streakStr ? parseInt(streakStr, 10) : 0,
            unlockedBadges: badgesStr ? JSON.parse(badgesStr) : [],
          });
          get().addLog('[SQLite] Loaded state from local SQLite database.');
        } catch (e: any) {
          get().addLog(`[SQLite] Error initializing local database: ${e.message}`);
        }
      },
    }),
    {
      name: 'guro-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist logs, progress, parent PIN, student ID, classroom ID, parental controls, and user session
      partialize: (state) => ({
        logs: state.logs,
        parentPin: state.parentPin,
        studentProgress: state.studentProgress,
        studentId: state.studentId,
        classroomId: state.classroomId,
        streakCount: state.streakCount,
        unlockedBadges: state.unlockedBadges,
        parentalControls: state.parentalControls,
        currentUser: state.currentUser,
        appMode: state.appMode,
        guestName: state.guestName,
        dailyMinutesUsed: state.dailyMinutesUsed,
        lastActiveDay: state.lastActiveDay,
      }),
    }
  )
);
