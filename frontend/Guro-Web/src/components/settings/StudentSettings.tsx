import React, { useState } from 'react';
import { Key, Check, Copy, Palette, Sparkles, UserCheck } from 'lucide-react';
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
  onNavigateToPreferences?: () => void;
}

export const StudentSettings: React.FC<StudentSettingsProps> = ({
  currentUser,
  parentAccessCode = 'GURO-P-7492',
  selectedGrade = 4,
  onUpdateProfile,
  onNavigateToPreferences,
}) => {
  const [copied, setCopied] = useState(false);
  const [studentName, setStudentName] = useState(currentUser?.name || 'Learner');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(parentAccessCode);
    setCopied(true);
    toast.success('Parent Access Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error('Learner name cannot be empty.');
      return;
    }
    setIsSavingName(true);
    localStorage.setItem('guro_student_name', studentName.trim());

    if (onUpdateProfile && studentName.trim() !== currentUser?.name) {
      const success = await onUpdateProfile(studentName.trim());
      if (success) {
        toast.success('Learner display name updated successfully!');
      }
    } else {
      toast.success('Learner display name saved!');
    }
    setIsSavingName(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* ── 1. Learner Profile Card with Dedicated Name Save ── */}
      <form onSubmit={handleSaveName} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-4">
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

        <div className="flex flex-col gap-1.5 max-w-md mt-2">
          <label htmlFor="student-display-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Learner Display Name
          </label>
          <div className="flex gap-2">
            <input
              id="student-display-name"
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex-1 px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
              placeholder="Enter your name"
            />
            <button
              type="submit"
              disabled={isSavingName}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <UserCheck className="size-3.5" />
              <span>{isSavingName ? 'Saving...' : 'Save Name'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ── 2. Parent Code Sharing Capsule ── */}
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

      {/* ── 3. Appearance, Mascot & Audio Customization Direct Capsule ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <Palette className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>Mascot Outfits, Theme & Voice Audio</span>
              <Sparkles className="size-3.5 text-amber-500" />
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-md">
              Customize your mascot study buddy, victory chime sounds, text sizes, and reading narration speeds in the Theme & Preferences tab.
            </p>
          </div>
        </div>

        {onNavigateToPreferences && (
          <button
            type="button"
            onClick={onNavigateToPreferences}
            className="px-4 py-2 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-primary-text)] font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <Palette className="size-3.5" />
            <span>Open Preferences</span>
          </button>
        )}
      </div>
    </div>
  );
};
