import React, { useState } from 'react';
import { Palette, Volume2, Sparkles, Sun, Moon, Sliders, Check, Play, VolumeX, GraduationCap } from 'lucide-react';
import { toast } from '../../utils/toast';

interface ThemePreferencesSectionProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  role?: string;
}

export const ThemePreferencesSection: React.FC<ThemePreferencesSectionProps> = ({
  isDarkMode,
  onToggleTheme,
  role = 'student',
}) => {
  const isStudent = role.toLowerCase() === 'student';

  // Accent Theme
  const [accentTheme, setAccentTheme] = useState<string>(() => {
    return localStorage.getItem('guro_accent_theme') || 'blue';
  });

  // Sound Effects
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
    return localStorage.getItem('guro_sfx_enabled') !== 'false';
  });
  const [sfxStyle, setSfxStyle] = useState<string>(() => {
    return localStorage.getItem('guro_sfx_style') || 'classic';
  });
  const [voiceGuide, setVoiceGuide] = useState<string>(() => {
    return localStorage.getItem('guro_voice_guide') || 'owl';
  });

  // Text Scaling & Motion
  const [fontScale, setFontScale] = useState<string>(() => {
    return localStorage.getItem('guro_font_scale') || 'normal';
  });
  const [speechSpeed, setSpeechSpeed] = useState<string>(() => {
    return localStorage.getItem('guro_speech_speed') || '1.0';
  });
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('guro_reduced_motion') === 'true';
  });

  // Language
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('guro_language') || 'en';
  });

  // Student Mascot Game Mode
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => {
    return localStorage.getItem('guro_student_avatar') || '🦉';
  });
  const [activeOutfit, setActiveOutfit] = useState<string>(() => {
    return localStorage.getItem('guro_student_outfit') || 'default';
  });

  // Active testing audio states
  const [testingChime, setTestingChime] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [testingSpeed, setTestingSpeed] = useState(false);

  const OUTFIT_OPTIONS = [
    { id: 'default', label: 'Classic Casual', emoji: '' },
    { id: 'graduation_cap', label: 'Graduation Cap', emoji: '🎓' },
    { id: 'space_visor', label: 'Space Helmet', emoji: '🧑‍🚀' },
    { id: 'wizard_cape', label: 'Wizard Hat', emoji: '🧙‍♂️' },
    { id: 'crown', label: 'Golden Crown', emoji: '👑' },
    { id: 'detective_hat', label: 'Detective Hat', emoji: '🕵️‍♂️' },
    { id: 'superhero_cape', label: 'Hero Cape', emoji: '🦸' },
    { id: 'party_hat', label: 'Party Hat', emoji: '🥳' },
    { id: 'scientist_goggles', label: 'Lab Goggles', emoji: '🔬' },
  ];

  const AVATAR_EMOJIS = ['🦉', '🦊', '🐼', '🦁', '🦄', '🚀', '🤖', '👾', '🦖', '🐬', '🐝', '🐯', '🐶', '🐱', '🐸', '🎓'];

  const ACCENT_COLORS = [
    { id: 'blue', label: 'DepEd Royal Blue', color: '#11428E', preview: 'from-[#11428E] to-[#2563EB]' },
    { id: 'teal', label: 'Ocean Teal', color: '#0F766E', preview: 'from-[#0F766E] to-[#14B8A6]' },
    { id: 'purple', label: 'Cosmic Nebula', color: '#6D28D9', preview: 'from-[#6D28D9] to-[#8B5CF6]' },
    { id: 'amber', label: 'Sunny Gold', color: '#D97706', preview: 'from-[#D97706] to-[#F59E0B]' },
  ];

  // ── Instant Handlers (Immediate live storage and effect) ──
  const handleSelectAccent = (themeId: string, label: string) => {
    setAccentTheme(themeId);
    localStorage.setItem('guro_accent_theme', themeId);
    toast.success(`Color skin updated to ${label}!`);
  };

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    localStorage.setItem('guro_sfx_enabled', String(next));
    if (next) playChimeAudio(sfxStyle);
  };

  const handleChangeSfxStyle = (val: string) => {
    setSfxStyle(val);
    localStorage.setItem('guro_sfx_style', val);
    playChimeAudio(val);
  };

  const handleChangeVoiceGuide = (val: string) => {
    setVoiceGuide(val);
    localStorage.setItem('guro_voice_guide', val);
  };

  const handleChangeSpeechSpeed = (val: string) => {
    setSpeechSpeed(val);
    localStorage.setItem('guro_speech_speed', val);
  };

  const handleChangeFontScale = (val: string) => {
    setFontScale(val);
    localStorage.setItem('guro_font_scale', val);
    toast.success('Text scale adjusted!');
  };

  const handleToggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem('guro_reduced_motion', String(next));
  };

  const handleChangeLanguage = (val: string) => {
    setLanguage(val);
    localStorage.setItem('guro_language', val);
    toast.success(val === 'fil' ? 'Inilipat sa Filipino / Taglish!' : 'Switched to English!');
  };

  const handleSelectAvatar = (emoji: string) => {
    setAvatarEmoji(emoji);
    localStorage.setItem('guro_student_avatar', emoji);
    window.dispatchEvent(new CustomEvent('guro_avatar_updated', {
      detail: { avatar: emoji, outfit: activeOutfit }
    }));
    toast.success(`Selected ${emoji} avatar!`);
  };

  const handleSelectOutfit = (outfitId: string, label: string) => {
    setActiveOutfit(outfitId);
    localStorage.setItem('guro_student_outfit', outfitId);
    window.dispatchEvent(new CustomEvent('guro_avatar_updated', {
      detail: { avatar: avatarEmoji, outfit: outfitId }
    }));
    toast.success(`Equipped ${label}!`);
  };

  // ── Audio Test Preview Functions (Web Audio API & Web Speech) ──
  const playChimeAudio = (styleToPlay: string) => {
    setTestingChime(true);
    setTimeout(() => setTestingChime(false), 900);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (styleToPlay === 'arcade') {
        // 8-Bit Arcade rising arpeggio: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.16);
        });
      } else if (styleToPlay === 'laser') {
        // Sci-Fi Laser sweep (1200 Hz down to 250 Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.23);
      } else if (styleToPlay === 'fanfare') {
        // Royal Brass Fanfare (3 triumphant notes: C4 -> G4 -> C5)
        const notes = [261.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.24, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + (idx === 2 ? 0.45 : 0.2));
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + (idx === 2 ? 0.46 : 0.22));
        });
      } else if (styleToPlay === 'magic') {
        // Magic Sparkle pentatonic glissando (C5 -> D5 -> E5 -> G5 -> A5)
        const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.26);
        });
      } else {
        // Classic Bell dual harmonic chime (659.25 Hz & 880 Hz)
        [659.25, 880].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.25, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.46);
        });
      }
    } catch {
      // Audio not supported in test environment
    }
  };

  const playVoiceGuideAudio = () => {
    setTestingVoice(true);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let sampleText = 'Hoo-hoo! Hello learner. I am your Wise Owl study guide ready to help you on every question.';
        let pitch = 0.95;

        if (voiceGuide === 'astronaut') {
          sampleText = 'Houston, all systems nominal! Astronaut guide ready for mission learning and quiz exploration!';
          pitch = 1.15;
        } else if (voiceGuide === 'robot') {
          sampleText = 'Beep boop! Greetings learner. Robot assistant activated and ready for lesson equations.';
          pitch = 1.35;
        } else if (voiceGuide === 'mentor') {
          sampleText = 'Greetings young scholar! Every question is a step toward true mastery. Let us begin!';
          pitch = 0.85;
        } else if (voiceGuide === 'superhero') {
          sampleText = 'Keep going hero! You have the power to solve this problem. Believe in yourself!';
          pitch = 1.20;
        } else if (voiceGuide === 'fox') {
          sampleText = "Aha! Let's examine this puzzle together and find the secret clue!";
          pitch = 1.05;
        }

        const utter = new SpeechSynthesisUtterance(sampleText);
        utter.rate = parseFloat(speechSpeed) || 1.0;
        utter.pitch = pitch;
        utter.onend = () => setTestingVoice(false);
        utter.onerror = () => setTestingVoice(false);
        window.speechSynthesis.speak(utter);
      } else {
        setTimeout(() => setTestingVoice(false), 1500);
      }
    } catch {
      setTimeout(() => setTestingVoice(false), 1000);
    }
  };

  const playSpeedAudio = () => {
    setTestingSpeed(true);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance('This is how fast I will read your lesson questions and explanations aloud.');
        utter.rate = parseFloat(speechSpeed) || 1.0;
        utter.onend = () => setTestingSpeed(false);
        utter.onerror = () => setTestingSpeed(false);
        window.speechSynthesis.speak(utter);
      } else {
        setTimeout(() => setTestingSpeed(false), 1500);
      }
    } catch {
      setTimeout(() => setTestingSpeed(false), 1000);
    }
  };

  const currentOutfitObj = OUTFIT_OPTIONS.find((o) => o.id === activeOutfit);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* ── Teacher Accommodation Preview Badge (When viewing as Teacher / Admin / Parent) ── */}
      {!isStudent && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-main)]">Teacher Accommodation & Module Testing Preview</h4>
              <p className="text-xs text-[var(--text-muted)]">
                You can test and preview how lesson narration, voice speeds, and quiz victory chimes will sound for Grade 4–6 learners.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
            Preview Mode
          </span>
        </div>
      )}

      {/* ── 1. Color Theme Mode (Dark / Light) ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Palette className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Theme Mode & Appearance</h3>
            <p className="text-xs text-[var(--text-muted)]">Click to switch instantly between light and dark modes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => {
              if (isDarkMode) onToggleTheme();
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              !isDarkMode
                ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-zinc-400'
            }`}
          >
            <div className="size-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-amber-500 shadow-xs shrink-0">
              <Sun className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text-main)]">Light Workspace</span>
                {!isDarkMode && <Check className="size-4 text-indigo-500" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">High contrast daylight canvas</p>
            </div>
          </button>

          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => {
              if (!isDarkMode) onToggleTheme();
            }}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              isDarkMode
                ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-zinc-400'
            }`}
          >
            <div className="size-10 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-indigo-400 shadow-xs shrink-0">
              <Moon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text-main)]">Dark Workspace</span>
                {isDarkMode && <Check className="size-4 text-indigo-500" />}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Calming dim room environment</p>
            </div>
          </button>
        </div>

        {/* Accent Color Themes */}
        <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-3">
            Primary Accent Color Skin
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ACCENT_COLORS.map((item) => {
              const active = accentTheme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAccent(item.id, item.label)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    active
                      ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <div className={`size-4 rounded-full bg-gradient-to-tr ${item.preview} shrink-0 shadow-xs`} />
                  <span className="text-xs text-[var(--text-main)] truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. Student Mascot Game Mode (Student Role Only) ── */}
      {isStudent && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Mascot Buddy & Game Mode Customization</h3>
                <p className="text-xs text-[var(--text-muted)]">Select your study companion avatar and accessory outfit!</p>
              </div>
            </div>

            {/* Mascot Live Visual Card */}
            <div className="flex items-center gap-3 bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-2 rounded-xl">
              <div className="relative text-3xl">
                <span>{avatarEmoji}</span>
                {currentOutfitObj?.emoji && (
                  <span className="absolute -top-3.5 -right-2 text-lg">{currentOutfitObj.emoji}</span>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block">Buddy Preview</span>
                <span className="text-[11px] text-[var(--text-muted)]">{currentOutfitObj?.label || 'Classic'}</span>
              </div>
            </div>
          </div>

          {/* Mascot Emoji Base Grid */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
              Choose Avatar Base Character:
            </label>
            <div className="grid grid-cols-8 sm:grid-cols-8 gap-2">
              {AVATAR_EMOJIS.map((emoji) => {
                const active = avatarEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectAvatar(emoji)}
                    className={`size-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-105 shadow-sm'
                        : 'bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outfit Accessory Closet */}
          <div>
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
              Outfit Accessories Closet:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {OUTFIT_OPTIONS.map((item) => {
                const active = activeOutfit === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectOutfit(item.id, item.label)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      active
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20 font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <span className="text-xl shrink-0">{item.emoji || '👕'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--text-main)] block truncate">{item.label}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{active ? 'Equipped' : 'Unlocked'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Audio & Sound FX Section with TEST BUTTONS ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Volume2 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Audio & Narration Feedback</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {isStudent
                ? 'Configure quiz victory chimes and test narration companion voices.'
                : 'Preview and calibrate question voice read-aloud speed and victory sounds for your modules.'}
            </p>
          </div>
        </div>

        {/* Master Sound Effects Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            {sfxEnabled ? <Volume2 className="size-5 text-emerald-500" /> : <VolumeX className="size-5 text-zinc-500" />}
            <div>
              <span className="text-sm font-bold text-[var(--text-main)]">Correct / Wrong Answer SFX</span>
              <p className="text-xs text-[var(--text-muted)]">Plays pleasant audio chimes on quiz answers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleSfx}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              sfxEnabled ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
          >
            <div
              className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${
                sfxEnabled ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Victory Sound Style with Test Button (5 STYLES) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <label htmlFor="sound-style" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Victory Chime
              </label>
              <button
                type="button"
                disabled={!sfxEnabled}
                onClick={() => playChimeAudio(sfxStyle)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  testingChime
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
                title="Play sound effect preview"
              >
                <Play className="size-3 fill-current" />
                <span>{testingChime ? 'Playing' : 'Test'}</span>
              </button>
            </div>
            <select
              id="sound-style"
              disabled={!sfxEnabled}
              value={sfxStyle}
              onChange={(e) => handleChangeSfxStyle(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="classic">🔔 Classic Bell</option>
              <option value="arcade">👾 8-Bit Arcade</option>
              <option value="laser">⚡ Sci-Fi Laser</option>
              <option value="fanfare">🎺 Royal Fanfare</option>
              <option value="magic">✨ Magic Sparkle</option>
            </select>
          </div>

          {/* Voice Narrator Companion with Test Button (6 PERSONAS) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <label htmlFor="voice-companion" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Narrator Voice
              </label>
              <button
                type="button"
                onClick={playVoiceGuideAudio}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  testingVoice
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20'
                }`}
                title="Test narrator voice preview"
              >
                <Play className="size-3 fill-current" />
                <span>{testingVoice ? 'Speaking' : 'Test'}</span>
              </button>
            </div>
            <select
              id="voice-companion"
              value={voiceGuide}
              onChange={(e) => handleChangeVoiceGuide(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="owl">🦉 Wise Owl Guide</option>
              <option value="astronaut">👨‍🚀 Astro Explorer</option>
              <option value="robot">🤖 Friendly Robot</option>
              <option value="mentor">🧙 Master Guro Mentor</option>
              <option value="superhero">🦸 Super Hero Champion</option>
              <option value="fox">🦊 Clever Fox Guide</option>
            </select>
          </div>

          {/* Read Aloud Speed with Test Button (5 SPEEDS) */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <label htmlFor="read-speed" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Voice Speed
              </label>
              <button
                type="button"
                onClick={playSpeedAudio}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  testingSpeed
                    ? 'bg-sky-500 text-white animate-pulse'
                    : 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20'
                }`}
                title="Test read-aloud speed"
              >
                <Play className="size-3 fill-current" />
                <span>{testingSpeed ? 'Speaking' : 'Test'}</span>
              </button>
            </div>
            <select
              id="read-speed"
              value={speechSpeed}
              onChange={(e) => handleChangeSpeechSpeed(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-xs font-semibold text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="0.6">🐢 0.6x (Very Gentle / Remedial)</option>
              <option value="0.8">🚶 0.8x (Relaxed Pace)</option>
              <option value="1.0">🗣️ 1.0x (Standard Speed)</option>
              <option value="1.2">🏃 1.2x (Brisk Pace)</option>
              <option value="1.5">⚡ 1.5x (Speedy Review)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Display, Typography & Accessibility ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Typography & Accessibility</h3>
            <p className="text-xs text-[var(--text-muted)]">Changes apply immediately across all lesson and quiz screens.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="font-scale" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Reading Text Size
            </label>
            <select
              id="font-scale"
              value={fontScale}
              onChange={(e) => handleChangeFontScale(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="normal">Standard (100%)</option>
              <option value="large">Large Text (125%)</option>
              <option value="xlarge">Extra Large (150%)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="language-select" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Interface Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => handleChangeLanguage(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="en">English (DepEd Standard)</option>
              <option value="fil">Filipino / Taglish</option>
            </select>
          </div>
        </div>

        {/* Calm Motion Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div>
            <span className="text-sm font-bold text-[var(--text-main)]">Calm Motion / Reduced Animations</span>
            <p className="text-xs text-[var(--text-muted)]">Minimizes spring effects and confetti for high focus</p>
          </div>
          <button
            type="button"
            onClick={handleToggleReducedMotion}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              reducedMotion ? 'bg-sky-500' : 'bg-zinc-600'
            }`}
          >
            <div
              className={`size-4 rounded-full bg-white transition-transform absolute top-1 ${
                reducedMotion ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
