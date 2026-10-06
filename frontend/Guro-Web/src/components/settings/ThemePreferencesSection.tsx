import React, { useState } from 'react';
import { Palette, Volume2, Sparkles, Sun, Moon, Sliders, Check } from 'lucide-react';
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

  const handleSelectAccent = (themeId: string, label: string) => {
    setAccentTheme(themeId);
    localStorage.setItem('guro_accent_theme', themeId);
    toast.success(`Color skin updated to ${label}!`);
  };

  const handleSaveAllPreferences = () => {
    localStorage.setItem('guro_sfx_enabled', String(sfxEnabled));
    localStorage.setItem('guro_sfx_style', sfxStyle);
    localStorage.setItem('guro_voice_guide', voiceGuide);
    localStorage.setItem('guro_font_scale', fontScale);
    localStorage.setItem('guro_speech_speed', speechSpeed);
    localStorage.setItem('guro_reduced_motion', String(reducedMotion));
    localStorage.setItem('guro_language', language);
    if (isStudent) {
      localStorage.setItem('guro_student_avatar', avatarEmoji);
      localStorage.setItem('guro_student_outfit', activeOutfit);
    }
    toast.success('Theme and preferences saved!');
  };

  const currentOutfitObj = OUTFIT_OPTIONS.find((o) => o.id === activeOutfit);

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* ── 1. Color Theme Mode (Dark / Light) ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Palette className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Theme Mode & Appearance</h3>
            <p className="text-xs text-[var(--text-muted)]">Choose your visual environment for maximum readability.</p>
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
                    onClick={() => {
                      setAvatarEmoji(emoji);
                      localStorage.setItem('guro_student_avatar', emoji);
                      toast.success(`Selected ${emoji} avatar!`);
                    }}
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
                    onClick={() => {
                      setActiveOutfit(item.id);
                      localStorage.setItem('guro_student_outfit', item.id);
                      toast.success(`Equipped ${item.label}!`);
                    }}
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

      {/* ── 3. Audio & Sound FX Section ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Volume2 className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Audio & Narration Feedback</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure quiz victory chimes and text-to-speech companion speeds.</p>
          </div>
        </div>

        {/* Master Sound Effects Switch */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div>
            <span className="text-sm font-bold text-[var(--text-main)]">Correct / Wrong Answer SFX</span>
            <p className="text-xs text-[var(--text-muted)]">Plays pleasant audio chimes on quiz answers</p>
          </div>
          <button
            type="button"
            onClick={() => setSfxEnabled(!sfxEnabled)}
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
          {/* Victory Sound Style */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sound-style" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Victory Chime Style
            </label>
            <select
              id="sound-style"
              disabled={!sfxEnabled}
              value={sfxStyle}
              onChange={(e) => setSfxStyle(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="classic">🔔 Classic Bell</option>
              <option value="arcade">👾 8-Bit Arcade</option>
              <option value="laser">⚡ Laser Chime</option>
            </select>
          </div>

          {/* Voice Narrator Companion */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="voice-companion" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Narrator Voice Guide
            </label>
            <select
              id="voice-companion"
              value={voiceGuide}
              onChange={(e) => setVoiceGuide(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            >
              <option value="owl">🦉 Wise Owl Guide</option>
              <option value="astronaut">👨‍🚀 Astro Explorer</option>
              <option value="robot">🤖 Friendly Robot</option>
            </select>
          </div>

          {/* Read Aloud Speed */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="read-speed" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Voice Read-Aloud Speed
            </label>
            <select
              id="read-speed"
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            >
              <option value="0.8">Gentle Pace (0.8x)</option>
              <option value="1.0">Standard Speed (1.0x)</option>
              <option value="1.2">Fast Pace (1.2x)</option>
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
            <p className="text-xs text-[var(--text-muted)]">Fine-tune font scaling and motion preferences.</p>
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
              onChange={(e) => setFontScale(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
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
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
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
            onClick={() => setReducedMotion(!reducedMotion)}
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

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveAllPreferences}
        className="py-2.5 px-6 bg-gradient-to-tr from-[#11428E] to-[#2563EB] hover:from-[#0d3470] hover:to-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 w-fit cursor-pointer flex items-center gap-2"
      >
        <Check className="size-4" />
        <span>Save Theme & Preferences</span>
      </button>
    </div>
  );
};
