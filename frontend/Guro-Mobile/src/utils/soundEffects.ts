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

// Sound asset references
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

/**
 * Play audio asset via expo-av Sound object
 */
async function playExpoSound(asset: any, volume = 0.8): Promise<boolean> {
  if (!Audio || !asset) return false;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    const { sound } = await Audio.Sound.createAsync(
      asset,
      { shouldPlay: true, volume },
      (status: any) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Web Audio API fallback for browser runtime
 */
function playWebAudio(type: 'correct' | 'incorrect' | 'fanfare') {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
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
      playNote(659.25, now, 0.3);
      playNote(880.00, now + 0.08, 0.4);
      playNote(1046.50, now + 0.16, 0.5);
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
      playBuzz(220, 147, now, 0.15);
      playBuzz(196, 131, now + 0.1, 0.25);
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
 * Play Correct Answer Sound + Success Haptic
 */
export async function playCorrectSound() {
  const soundEnabled = useAppStore.getState().soundEffectsEnabled;
  if (!soundEnabled) return;

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

  // Try Expo AV native sound first
  const played = await playExpoSound(chimeAsset, 0.85);
  if (!played) {
    playWebAudio('correct');
  }
}

/**
 * Play Incorrect Answer Sound + Error Haptic
 */
export async function playIncorrectSound() {
  const soundEnabled = useAppStore.getState().soundEffectsEnabled;
  if (!soundEnabled) return;

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});

  // Try Expo AV native sound first
  const played = await playExpoSound(buzzAsset, 0.7);
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

  // Try Expo AV native sound first
  const played = await playExpoSound(fanfareAsset, 0.9);
  if (!played) {
    playWebAudio('fanfare');
  }
}
