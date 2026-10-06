import React, { useState } from 'react';
import { Key, Check, Copy, Sliders } from 'lucide-react';
import { toast } from '../../utils/toast';

interface StudentSettingsProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null;
  parentAccessCode?: string;
  selectedGrade?: number;
  onUpdateProfile?: (name: string) => Promise<boolean>;
}

export const StudentSettings: React.FC<StudentSettingsProps> = ({
  currentUser,
  parentAccessCode = 'GURO-P-7492',
  selectedGrade = 4,
  onUpdateProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [studentName, setStudentName] = useState(currentUser?.name || 'Learner');
  const [fontScale, setFontScale] = useState<string>(() => localStorage.getItem('guro_font_scale') || 'normal');
  const [speechSpeed, setSpeechSpeed] = useState<string>(() => localStorage.getItem('guro_speech_speed') || '1.0');
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => localStorage.getItem('guro_reduced_motion') === 'true');
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(parentAccessCode);
    setCopied(true);
    toast.success('Parent Access Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('guro_font_scale', fontScale);
    localStorage.setItem('guro_speech_speed', speechSpeed);
    localStorage.setItem('guro_reduced_motion', String(reducedMotion));

    if (onUpdateProfile && studentName.trim() && studentName !== currentUser?.name) {
      await onUpdateProfile(studentName.trim());
    } else {
      toast.success('Student learning preferences saved!');
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Learner Profile Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-4 mb-5">
          <div className="size-14 rounded-2xl bg-gradient-to-tr from-[#11428E] to-[#A01322] flex items-center justify-center text-white font-black text-xl shadow-md">
            {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">{studentName}</h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">Learner Reference Number: {currentUser?.userId || 'LRN-1092837482'}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Grade {selectedGrade}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                DepEd Enrolled
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-w-md">
          <label htmlFor="student-display-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Learner Display Name
          </label>
          <input
            id="student-display-name"
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            placeholder="Your name"
          />
        </div>
      </div>

      {/* Parent Code Sharing Capsule */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
              <Key className="size-4 text-amber-500" />
              <span>Share Access with Parent or Guardian</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md leading-relaxed">
              Give this code to your parent or guardian. When they enter it in their Parent Space, they can follow your quizzes, achievements, and attendance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            {copied ? <Check className="size-4 text-emerald-950" /> : <Copy className="size-4" />}
            <span>{copied ? 'Copied!' : parentAccessCode}</span>
          </button>
        </div>
      </div>

      {/* Learning Accommodations & Accessibility */}
      <form onSubmit={handleSavePreferences} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Learning Accommodations & Display</h3>
            <p className="text-xs text-[var(--text-muted)]">Customize text sizing and audio assistance for easier reading.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Text Size Scale */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="font-scale-select" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Reading Text Size
            </label>
            <select
              id="font-scale-select"
              value={fontScale}
              onChange={(e) => setFontScale(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="normal">Standard (100%)</option>
              <option value="large">Large Text (125%)</option>
              <option value="xlarge">Extra Large (150%)</option>
            </select>
          </div>

          {/* Voice Narration Speed */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="speech-speed-select" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Read-Aloud Voice Speed
            </label>
            <select
              id="speech-speed-select"
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(e.target.value)}
              className="px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="0.8">Gentle / Slower (0.8x)</option>
              <option value="1.0">Standard Speed (1.0x)</option>
              <option value="1.2">Fast Pace (1.2x)</option>
            </select>
          </div>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-main)]">Calm Motion Mode</span>
            <span className="text-xs text-[var(--text-muted)]">Disables bouncing card animations during lessons.</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              reducedMotion ? 'bg-indigo-600' : 'bg-[var(--border-color)]'
            }`}
          >
            <div
              className={`size-5 rounded-full bg-white transition-transform ${
                reducedMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs w-fit cursor-pointer active:scale-95"
        >
          {isSaving ? 'Saving...' : 'Save Learning Preferences'}
        </button>
      </form>
    </div>
  );
};
