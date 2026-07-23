import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
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
  type?: 'multiple-choice' | 'fill-in-the-blank' | 'drag-drop-matching' | 'true-false' | 'swipe-card';
  matchingPairs?: Record<string, string>;
}

export type AssessmentCategory = 'Figures of Speech' | 'Reading/Paragraph Comprehension';
export type DifficultyTier = 'Easy' | 'Average' | 'Difficult';

export interface StudyContent {
  introduction: string;
  definitions: Array<{
    term: string;
    definition: string;
    examples: string[];
  }>;
  summary: string[];
  refresherQuiz?: Array<{ questionText: string; options: string[]; correctAnswer: string; explanation: string; id?: string; feedback?: any }>;
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
  token: string | null;
  studentProgress: ProgressEvent[];
  studentId: string;
  classroomId: string | null;
  activeSubjects: string[];
  streakCount: number;
  bestStreak: number;
  unlockedBadges: string[];
  parentalControls: {
    dailyTimeLimit: number;
    mathBeforeEnglish: boolean;
    forcedBilingual: boolean;
    priorityTopic: string | null;
  };
  currentUser: { userId: string; email: string; name: string; role: string; classroomId?: string } | null;
  appMode: 'online' | 'offline';
  guestName: string | null;
  dailyMinutesUsed: number;
  lastActiveDay: string | null;
  avatarEmoji: string;
  soundEffectsEnabled: boolean;
  speechRate: number;
  colorTheme: string;
  xpPoints: number;
  virtualStars: number;
  mascotOutfit: string;
  ownedOutfits: string[];
  voiceGuideTheme: string;
  correctSoundTheme: string;
  preferredGrade: number;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  setAvatarEmoji: (emoji: string) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  setSpeechRate: (rate: number) => void;
  setColorTheme: (theme: string) => void;
  setMascotOutfit: (outfit: string) => void;
  purchaseOutfit: (outfit: string, cost: number) => boolean;
  setVoiceGuideTheme: (theme: string) => void;
  setCorrectSoundTheme: (theme: string) => void;
  setPreferredGrade: (grade: number) => void;
  setToken: (token: string | null) => void;
  addLog: (message: string) => void;
  clearLogs: () => void;
  loadItemBankSync: () => Promise<void>;
  setParentPin: (pin: string | null) => void;
  setStudentId: (id: string) => void;
  setClassroomId: (id: string | null) => void;
  setActiveSubjects: (subjects: string[]) => void;
  setAppMode: (mode: 'online' | 'offline') => void;
  setGuestName: (name: string | null, emailOrId?: string | null) => void;
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

export function resolveServerUrl(url: string): string {
  let cleaned = url.trim();
  
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  // Strip trailing /api so we don't end up with /api/api
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.substring(0, cleaned.length - 4);
  }

  if (Platform.OS === 'android') {
    cleaned = cleaned.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return cleaned;
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
      activeSubjects: ['Mathematics', 'English'],
      streakCount: 0,
      bestStreak: 0,
      unlockedBadges: [],
      parentalControls: {
        dailyTimeLimit: 0,
        mathBeforeEnglish: false,
        forcedBilingual: false,
        priorityTopic: null,
      },
      currentUser: null,
      token: null,
      appMode: 'offline',
      guestName: null,
      dailyMinutesUsed: 0,
      lastActiveDay: null,
      avatarEmoji: '🦉',
      soundEffectsEnabled: true,
      speechRate: 1.0,
      colorTheme: 'blue',
      xpPoints: 0,
      virtualStars: 0,
      mascotOutfit: 'default',
      ownedOutfits: ['default'],
      voiceGuideTheme: 'astronaut',
      correctSoundTheme: 'ding',
      preferredGrade: 4,
      serverUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',
      setServerUrl: (url) => set({ serverUrl: url }),
      setToken: (token) => set({ token }),
      setAppMode: (mode) => set({ appMode: mode }),
      setGuestName: (name, emailOrId) => {
        const primaryId = (emailOrId && emailOrId.trim()) ? emailOrId.trim() : (name && name.trim()) ? name.trim() : 'STUDENT-MOBILE-USER';
        const sanitized = primaryId.replace(/\s+/g, '-').toUpperCase();
        set({ guestName: name, studentId: sanitized });
      },
      setAvatarEmoji: (emoji) => set({ avatarEmoji: emoji }),
      setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
      setSpeechRate: (rate) => set({ speechRate: rate }),
      setColorTheme: (theme) => set({ colorTheme: theme }),
      setMascotOutfit: (outfit) => set({ mascotOutfit: outfit }),
      purchaseOutfit: (outfit, cost) => {
        const state = get();
        if (state.virtualStars >= cost && !state.ownedOutfits.includes(outfit)) {
          set({
            virtualStars: state.virtualStars - cost,
            ownedOutfits: [...state.ownedOutfits, outfit],
            mascotOutfit: outfit
          });
          get().addLog(`Purchased and equipped mascot outfit: ${outfit}`);
          saveParentSetting('virtual_stars', (state.virtualStars - cost).toString()).catch(console.error);
          saveParentSetting('owned_outfits', JSON.stringify([...state.ownedOutfits, outfit])).catch(console.error);
          saveParentSetting('mascot_outfit', outfit).catch(console.error);
          return true;
        }
        return false;
      },
      setVoiceGuideTheme: (theme) => {
        set({ voiceGuideTheme: theme });
        saveParentSetting('voice_guide_theme', theme).catch(console.error);
      },
      setCorrectSoundTheme: (theme) => {
        set({ correctSoundTheme: theme });
        saveParentSetting('correct_sound_theme', theme).catch(console.error);
      },
      setPreferredGrade: (grade) => set({ preferredGrade: grade }),
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
        const rawUrl = get().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
        const resolvedUrl = resolveServerUrl(rawUrl);
        try {
          const res = await fetch(`${resolvedUrl}/api/auth/promote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anonymousStudentId, email, password, name })
          });
          if (res.ok) {
            const data = await res.json();
            set({ 
              currentUser: data.user,
              studentId: data.studentId,
              token: data.token
            });
            get().addLog(`Guest account promoted. Official studentId is now: ${data.studentId}`);
            return { success: true, message: 'Account successfully registered and progress merged!' };
          } else {
            const err = await res.json().catch(() => ({}));
            return { success: false, message: err.error || 'Promotion failed.' };
          }
        } catch (e: any) {
          return { success: false, message: e.message || 'Connection error.' };
        }
      },
      loginToCloud: async (email, password) => {
        const rawUrl = get().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
        const resolvedUrl = resolveServerUrl(rawUrl);
        try {
          const res = await fetch(`${resolvedUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (res.ok) {
            const data = await res.json();
            const serverClassroomId = data.user?.classroomId || data.classroomId;
            set({
              currentUser: data.user,
              studentId: data.studentId ?? data.user.name.replace(/\s+/g, '-').toUpperCase(),
              token: data.token,
              ...(serverClassroomId ? { classroomId: serverClassroomId } : {}),
            });
            get().addLog(`Logged in as: ${data.user.email}`);
            return { success: true, message: `Successfully logged in as ${data.user.name}` };
          } else {
            const err = await res.json().catch(() => ({}));
            return { success: false, message: err.error || 'Login failed.' };
          }
        } catch (e: any) {
          return { success: false, message: e.message || 'Connection error.' };
        }
      },
      logoutFromCloud: () => {
        set({
          currentUser: null,
          token: null,
          studentId: 'GURO-STUDENT-LOCAL',
          appMode: 'offline',
          guestName: null,
          // NOTE: Preserve classroomId on logout so classroom access is not revoked
          parentalControls: {
            dailyTimeLimit: 0,
            mathBeforeEnglish: false,
            forcedBilingual: false,
            priorityTopic: null,
          },
          dailyMinutesUsed: 0,
          lastActiveDay: null,
        });
        get().addLog('Logged out of cloud account. Preserved active classroom pairing.');
        get().initializeLocalStore().catch(console.error);
      },
      addLog: (message) =>
        set((state) => ({
          logs: [`[${new Date().toLocaleTimeString()}] ${message}`, ...state.logs],
        })),
      clearLogs: () => set({ logs: ['Logs cleared.'] }),
      loadItemBankSync: async () => {
        try {
          const localBank = await getLocalItemBank();
          // Check if local bank has study content (representing the new gamified asset). If not, force reload from JSON.
          const hasAdjectiveStudy = localBank && localBank['English']?.['5']?.['Adjectives']?.studyContent;
          if (localBank && Object.keys(localBank).length > 0 && hasAdjectiveStudy) {
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
        if (!id) {
          set({ activeSubjects: ['Mathematics', 'English'] });
        }
        get().addLog(id ? `Linked device to classroom invite code: ${id}` : 'Unlinked device from classroom invite code.');
      },
      setActiveSubjects: (subjects) => {
        set({ activeSubjects: subjects });
      },
      fetchItemBankFromServer: async (serverUrl, id) => {
        const resolvedUrl = resolveServerUrl(serverUrl);
        try {
          const res = await fetch(`${resolvedUrl}/api/item-bank?classroomId=${id}`, {
            headers: { Authorization: `Bearer ${get().token ?? ''}` },
          });
          if (res.ok) {
            const bank = await res.json();
            if (bank && Object.keys(bank).length > 0) {
              set({ itemBank: bank });
              await saveLocalItemBank(bank);
              
              // Also fetch active subjects offered by the teacher
              try {
                const subRes = await fetch(`${resolvedUrl}/api/classroom/active-subjects?classroomId=${id}`);
                if (subRes.ok) {
                  const subData = await subRes.json();
                  if (subData.subjects && Array.isArray(subData.subjects)) {
                    set({ activeSubjects: subData.subjects });
                  }
                }
              } catch (subErr) {
                console.error('[Store] Failed to fetch active subjects:', subErr);
              }

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

        // Calculate XP and Stars earned
        const earnedXP = event.score * 10 + (isPerfect ? 50 : 0);
        const earnedStars = event.score * 2 + (isPerfect ? 10 : 0);

        const currentBest = get().bestStreak || 0;
        const nextBest = Math.max(currentBest, nextStreak);

        set((state) => ({
          studentProgress: [newEvent, ...state.studentProgress],
          streakCount: nextStreak,
          bestStreak: nextBest,
          unlockedBadges: nextBadges,
          lastActiveDay: today,
          xpPoints: (state.xpPoints || 0) + earnedXP,
          virtualStars: (state.virtualStars || 0) + earnedStars,
        }));

        try {
          await saveLocalProgress(newEvent);
          await saveParentSetting('streak_count', nextStreak.toString());
          await saveParentSetting('best_streak', nextBest.toString());
          await saveParentSetting('unlocked_badges', JSON.stringify(nextBadges));
          await saveParentSetting('last_active_day', today);
          await saveParentSetting('xp_points', get().xpPoints.toString());
          await saveParentSetting('virtual_stars', get().virtualStars.toString());
        } catch (e) {
          console.error('[SQLite] Failed to save progress/achievements locally:', e);
        }
        get().addLog(`Recorded local progress for "${event.topic}" (${event.score}/${event.totalQuestions}) (+${earnedXP} XP, +${earnedStars} Stars)`);

        // Trigger background sync in online mode to sync with web immediately
        const state = get();
        if (state.appMode === 'online') {
          get().syncProgressNow(state.serverUrl).catch((err) => {
            console.warn('[Sync] Background sync failed:', err);
          });
        }
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
        const resolvedUrl = resolveServerUrl(serverUrl);
        const unsyncedEvents = get().studentProgress.filter((e) => !e.synced);
        if (unsyncedEvents.length === 0) {
          return { success: true, syncedCount: 0, message: 'No new progress logs to sync.' };
        }

        get().addLog(`Starting manual sync of ${unsyncedEvents.length} events...`);
        try {
          const response = await fetch(`${resolvedUrl}/api/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${get().token ?? ''}`,
            },
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
          const bestStreakStr = await getParentSetting('best_streak');
          const badgesStr = await getParentSetting('unlocked_badges');
          const xpStr = await getParentSetting('xp_points');
          const starsStr = await getParentSetting('virtual_stars');
          const ownedOutfitsStr = await getParentSetting('owned_outfits');
          const mascotOutfitStr = await getParentSetting('mascot_outfit');
          const voiceThemeStr = await getParentSetting('voice_guide_theme');
          const correctSoundStr = await getParentSetting('correct_sound_theme');

          set({
            studentProgress: localLogs,
            itemBank: localBank || get().itemBank,
            streakCount: streakStr ? parseInt(streakStr, 10) : 0,
            bestStreak: bestStreakStr ? parseInt(bestStreakStr, 10) : 0,
            unlockedBadges: badgesStr ? JSON.parse(badgesStr) : [],
            xpPoints: xpStr ? parseInt(xpStr, 10) : get().xpPoints,
            virtualStars: starsStr ? parseInt(starsStr, 10) : get().virtualStars,
            ownedOutfits: ownedOutfitsStr ? JSON.parse(ownedOutfitsStr) : get().ownedOutfits,
            mascotOutfit: mascotOutfitStr || get().mascotOutfit,
            voiceGuideTheme: voiceThemeStr || get().voiceGuideTheme,
            correctSoundTheme: correctSoundStr || get().correctSoundTheme,
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
        xpPoints: state.xpPoints,
        virtualStars: state.virtualStars,
        mascotOutfit: state.mascotOutfit,
        ownedOutfits: state.ownedOutfits,
        voiceGuideTheme: state.voiceGuideTheme,
        correctSoundTheme: state.correctSoundTheme,
        preferredGrade: state.preferredGrade,
        serverUrl: state.serverUrl,
        avatarEmoji: state.avatarEmoji,
        speechRate: state.speechRate,
        soundEffectsEnabled: state.soundEffectsEnabled,
        colorTheme: state.colorTheme,
      }),
    }
  )
);
