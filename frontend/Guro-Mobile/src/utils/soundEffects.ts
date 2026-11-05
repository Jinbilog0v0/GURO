import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';

// Safely require expo-av if present in runtime
let Audio: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}

// Sound asset references matching web synthesizer frequencies
let chimeAsset: any = null;
let buzzAsset: any = null;
let fanfareAsset: any = null;

try {
  chimeAsset = require('../../assets/sounds/chime.wav');
  buzzAsset = require('../../assets/sounds/buzz.wav');
  fanfareAsset = require('../../assets/sounds/fanfare.wav');
} catch {
  // Sound assets optional fallback
}

// In-memory sound cache to eliminate playback latency on mobile devices
const soundObjectCache: Record<string, any> = {};
let isAudioModeConfigured = false;

async function ensureAudioMode() {
  if (isAudioModeConfigured || !Audio) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    isAudioModeConfigured = true;
  } catch {
    // Audio mode configuration fallback
  }
}

/**
 * Play audio asset via expo-av Sound object with instant replay caching
 */
async function playExpoSound(key: string, asset: any, volume = 0.85): Promise<boolean> {
  if (!Audio || !asset) return false;
  try {
    await ensureAudioMode();

    let cached = soundObjectCache[key];
    if (cached) {
      try {
        const status = await cached.getStatusAsync();
        if (status.isLoaded) {
          await cached.setPositionAsync(0);
          await cached.setVolumeAsync(volume);
          await cached.playAsync();
          return true;
        }
      } catch {
        soundObjectCache[key] = null;
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, volume },
      (status: any) => {
        // Keep sound loaded for fast repeated play
      }
    );
    soundObjectCache[key] = sound;
    return true;
  } catch {
    return false;
  }
}

/**
 * Web Audio API synthesis matching the exact web student sound design
 * - Correct: Bright, ascending game-like chime (E5 -> A5 -> C6)
 * - Incorrect: Softer, quick retro double-bloop (A3 -> D3, G3 -> C3)
 * - Fanfare: Ascending arpeggio (C5 -> E5 -> G5 -> C6)
 */
function playWebAudio(type: 'correct' | 'incorrect' | 'fanfare') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume();
    setTimeout(() => ctx.close().catch(() => {}), 1500);

    const now = ctx.currentTime;
    if (type === 'correct') {
      const playNote = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      playNote(659.25, now, 0.3);         // E5
      playNote(880.00, now + 0.08, 0.4);   // A5
      playNote(1046.50, now + 0.16, 0.5);  // C6
    } else if (type === 'incorrect') {
      const playBuzz = (startFreq: number, endFreq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startFreq, start);
        osc.frequency.linearRampToValueAtTime(endFreq, start + dur);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.1, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      playBuzz(220, 147, now, 0.15);        // A3 -> D3
      playBuzz(196, 131, now + 0.1, 0.25);  // G3 -> C3
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.12;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    }
  } catch {
    // AudioContext fallback failed silently
  }
}

/**
 * Play Correct Answer Sound (bright ascending chime) + Success Haptic
 */
export async function playCorrectSound() {
  const soundEnabled = useAppStore.getState().soundEffectsEnabled;
  if (!soundEnabled) return;

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  // Try Expo AV native sound first (chime.wav E5->A5->C6)
  const played = await playExpoSound('chime', chimeAsset, 0.85);
  if (!played) {
    playWebAudio('correct');
  }
}

/**
 * Play Incorrect Answer Sound (retro double-bloop buzz) + Error Haptic
 */
export async function playIncorrectSound() {
  const soundEnabled = useAppStore.getState().soundEffectsEnabled;
  if (!soundEnabled) return;

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

  // Try Expo AV native sound first (buzz.wav A3->D3, G3->C3)
  const played = await playExpoSound('buzz', buzzAsset, 0.75);
  if (!played) {
    playWebAudio('incorrect');
  }
}

/**
 * Play Quiz Completed Fanfare Sound + Celebration Haptics
 */
export async function playFanfareSound() {
  const soundEnabled = useAppStore.getState().soundEffectsEnabled;
  if (!soundEnabled) return;

  // Celebration haptic
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

  // Try Expo AV native sound first (fanfare.wav)
  const played = await playExpoSound('fanfare', fanfareAsset, 0.9);
  if (!played) {
    playWebAudio('fanfare');
  }
}
