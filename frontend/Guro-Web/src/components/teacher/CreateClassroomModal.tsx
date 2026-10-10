import React, { useState, useEffect } from 'react';
import { X, School, Lock, AlertCircle, ShieldAlert, Sparkles, Calculator, BookOpen } from 'lucide-react';
import { toast } from '../../utils/toast';

export interface ClassroomCreationData {
  teacherName: string;
  sectionName?: string;
  subject: string;
  gradeLevel: number;
  schoolYear: string;
  term: string;
  duration: number;
}

export interface CreateClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassroomCreationData) => Promise<boolean | void>;
  defaultTeacherName?: string;
  isPendingVerification?: boolean;
  isRejectedVerification?: boolean;
}

export const CreateClassroomModal: React.FC<CreateClassroomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTeacherName = '',
  isPendingVerification = false,
  isRejectedVerification = false,
}) => {
  const [teacherName, setTeacherName] = useState(defaultTeacherName);
  const [sectionName, setSectionName] = useState('');
  const [subject, setSubject] = useState<'Mathematics' | 'English'>('Mathematics');
  const [gradeLevel, setGradeLevel] = useState<number>(4);
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [term, setTerm] = useState('Quarter 1');
  const [duration, setDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTeacherName(defaultTeacherName);
      setSectionName('');
      setSubject('Mathematics');
      setGradeLevel(4);
      setSchoolYear('2026-2027');
      setTerm('Quarter 1');
      setDuration(0);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultTeacherName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isPendingVerification) {
      toast.error('Classroom generation is restricted until teacher verification is approved by an administrator.');
      return;
    }
    if (isRejectedVerification) {
      toast.error('Classroom generation is disabled for rejected accounts. Please contact support.');
      return;
    }

    if (!teacherName.trim()) {
      toast.error('Please enter the teacher name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        teacherName: teacherName.trim(),
        sectionName: sectionName.trim() || undefined,
        subject,
        gradeLevel,
        schoolYear,
        term,
        duration,
      });
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create classroom.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-[#11428E] to-blue-600 flex items-center justify-center text-white shadow-md">
              <School size={22} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)] m-0">
                Set Up New Classroom
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Generate a live pairing code and link student devices to your curriculum.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Verification Warning Banners */}
        {isPendingVerification && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-500 font-bold">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Teacher Verification Pending: Classroom code generation will remain locked until account approval.</span>
          </div>
        )}

        {isRejectedVerification && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-500 font-bold">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>Account Verification Rejected: Unable to generate active classroom sessions.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Teacher Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)]">
              Teacher Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Teacher Maria Santos"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
            />
          </div>

          {/* Section Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)] flex items-center justify-between">
              <span>Section / Class Name</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rizal, Mabini, Emerald, Section A"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
            />
            <span className="text-[11px] text-[var(--text-muted)]">
              Generates a dedicated section slug in the code (e.g., <code className="font-mono text-[var(--text-main)]">ENG-G6-RIZAL</code>).
            </span>
          </div>

          {/* Subject Focus Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-main)]">
              Subject Focus <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSubject('Mathematics')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  subject === 'Mathematics'
                    ? 'bg-[#11428E]/10 border-[#11428E] text-[#11428E] shadow-xs'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Calculator size={16} className={subject === 'Mathematics' ? 'text-[#11428E]' : 'text-slate-400'} />
                <span>Mathematics</span>
              </button>

              <button
                type="button"
                onClick={() => setSubject('English')}
                className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  subject === 'English'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BookOpen size={16} className={subject === 'English' ? 'text-purple-500' : 'text-slate-400'} />
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Grade Level & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
              >
                <option value={4}>Grade 4</option>
                <option value={5}>Grade 5</option>
                <option value={6}>Grade 6</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">Session Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
              >
                <option value={0}>No Limit (Always Open)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
                <option value={1440}>24 Hours</option>
              </select>
            </div>
          </div>

          {/* School Year & Academic Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">School Year (S.Y.)</label>
              <select
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">Academic Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
              >
                <option value="Quarter 1">Quarter 1 (Term 1)</option>
                <option value="Quarter 2">Quarter 2 (Term 2)</option>
                <option value="Quarter 3">Quarter 3 (Term 3)</option>
                <option value="Quarter 4">Quarter 4 (Term 4)</option>
              </select>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPendingVerification || isRejectedVerification}
              className="btn btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Generating Code...</span>
              ) : isPendingVerification || isRejectedVerification ? (
                <>
                  <Lock size={14} />
                  <span>Generation Locked</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate Classroom Invite Code</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
