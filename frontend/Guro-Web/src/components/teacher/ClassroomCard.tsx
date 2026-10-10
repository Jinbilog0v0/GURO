import React, { useState } from 'react';
import { Calculator, BookOpen, Copy, Check, ArrowRight, Calendar, User } from 'lucide-react';
import { toast } from '../../utils/toast';

export interface ClassroomItem {
  id: string;
  teacherName: string;
  subject: string;
  gradeLevel: number;
  sectionName?: string;
  schoolYear?: string;
  term?: string;
  expiresAt?: string | null;
}

export interface ClassroomCardProps {
  classroom: ClassroomItem;
  isActive: boolean;
  onSelectActive?: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  isActive,
  onViewDetails,
}) => {
  const [copied, setCopied] = useState(false);
  const isMath = classroom.subject.toLowerCase() === 'mathematics' || classroom.subject.toLowerCase() === 'math';

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.id);
    setCopied(true);
    toast.success(`Copied classroom code ${classroom.id}!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onViewDetails(classroom.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails(classroom.id);
        }
      }}
      className={`bg-[var(--bg-card)] border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 shadow-xs hover:shadow-lg cursor-pointer active:scale-[0.99] group text-left ${
        isActive
          ? 'border-[#11428E] ring-2 ring-[#11428E]/20 bg-[var(--accent-primary-glow)]/40 hover:border-[#11428E]'
          : 'border-[var(--border-color)] hover:border-[#11428E]'
      }`}
    >
      {/* Top Header: Subject Icon & Active Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`size-11 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 ${
              isMath ? 'bg-gradient-to-br from-[#11428E] to-blue-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'
            }`}
          >
            {isMath ? <Calculator size={20} /> : <BookOpen size={20} />}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs font-bold text-[var(--text-muted)] truncate flex items-center gap-1.5">
              <span>{isMath ? 'Mathematics' : 'English'}</span>
              <span>&bull;</span>
              <span>Grade {classroom.gradeLevel}</span>
            </span>
            <h4 className="text-base font-extrabold text-[var(--text-main)] truncate mt-0.5 group-hover:text-[#11428E] transition-colors">
              {classroom.sectionName ? `Section ${classroom.sectionName}` : `${classroom.subject} Class`}
            </h4>
          </div>
        </div>

        {/* Active Pill Badge */}
        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0 animate-pulse">
            <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            <span>Active</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-[var(--text-muted)] shrink-0 bg-[var(--bg-main)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
            G{classroom.gradeLevel}
          </span>
        )}
      </div>

      {/* Classroom Code Box */}
      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-3 flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
            Pairing Code
          </span>
          <code className="text-sm font-black font-mono tracking-wider text-[var(--text-main)] truncate">
            {classroom.id}
          </code>
        </div>
        <button
          type="button"
          onClick={handleCopyCode}
          className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Copy classroom code"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Metadata Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
        <span className="flex items-center gap-1 font-semibold">
          <User size={12} className="text-indigo-400" />
          <span className="truncate">{classroom.teacherName}</span>
        </span>
        <span>&bull;</span>
        <span className="flex items-center gap-1 font-semibold">
          <Calendar size={12} className="text-amber-400" />
          <span>S.Y. {classroom.schoolYear || '2026-2027'} ({classroom.term || 'Q1'})</span>
        </span>
      </div>

      {/* Clickable Card Footer Cue */}
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-main)] pt-2 border-t border-[var(--border-color)]/60 transition-colors">
        <span className="text-[11px]">Classroom Dashboard & Roster</span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-[#11428E] group-hover:translate-x-1 transition-transform">
          <span>Details</span>
          <ArrowRight size={12} />
        </span>
      </div>
    </div>
  );
};
