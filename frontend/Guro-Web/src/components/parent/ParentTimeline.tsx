import React, { useState } from 'react';
import { List } from 'react-window';
import { Calendar, Calculator, BookOpen, Clock } from 'lucide-react';
import type { SyncedEvent } from './ParentOverview';

export interface ParentTimelineProps {
  logs: SyncedEvent[];
  lastUpdatedCell?: { studentId: string; topic: string; timestamp: number } | null;
  currentTime?: number;
}

const TimelineRow = ({
  index,
  style,
  filteredLogs,
  lastUpdatedCell,
  currentTime
}: {
  index: number;
  style: React.CSSProperties;
  filteredLogs: SyncedEvent[];
  lastUpdatedCell?: { studentId: string; topic: string; timestamp: number } | null;
  currentTime?: number;
}) => {
  const log = filteredLogs[index];
  if (!log) return null;
  const percentage = Math.round((log.score / log.totalQuestions) * 100);
  const isLast = index === filteredLogs.length - 1;
  const now = currentTime ?? (lastUpdatedCell ? lastUpdatedCell.timestamp : 0);
  const isRecentlyUpdated =
    Boolean(
      lastUpdatedCell &&
      lastUpdatedCell.studentId.toLowerCase() === log.studentId.toLowerCase() &&
      lastUpdatedCell.topic === log.topic &&
      now - lastUpdatedCell.timestamp < 5000
    );

  let pulseClass = '';
  if (isRecentlyUpdated) {
    pulseClass = percentage >= 80 ? 'flash-green' : percentage >= 50 ? 'flash-yellow' : 'flash-red';
  }

  const isMath = log.subject.toLowerCase() === 'mathematics' || log.subject.toLowerCase() === 'math';

  return (
    <div
      style={{
        ...style,
        paddingLeft: '28px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className={`relative flex gap-4 rounded-xl p-1.5 transition-all duration-500 ease-in-out h-[105px] box-border ${pulseClass}`}
      >
        {/* Timeline connector line */}
        {!isLast && (
          <div
            className="absolute left-[-16px] w-[2px] bg-[var(--border-color)]"
            style={{
              bottom: 0,
              top: '24px',
              height: 'calc(100% + 20px)'
            }}
          />
        )}
        
        {/* Bullet indicator */}
        <div 
          className={`absolute left-[-22px] top-[6px] size-3.5 rounded-full border-2 z-10 ${
            percentage >= 80 
              ? 'bg-emerald-950 border-emerald-500' 
              : percentage >= 50 
                ? 'bg-amber-950 border-amber-500' 
                : 'bg-red-950 border-red-500'
          }`} 
        />

        <div className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex flex-col justify-center h-full box-border px-4 py-3 shadow-2xs hover:border-[var(--text-muted)] transition-colors">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5 truncate">
              {isMath ? (
                <Calculator className="size-4 text-sky-500 shrink-0" />
              ) : (
                <BookOpen className="size-4 text-purple-400 shrink-0" />
              )}
              <span className="truncate">{log.topic}</span>
            </h4>
            <span className={
              percentage >= 80 
                ? "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0" 
                : percentage >= 50 
                  ? "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0" 
                  : "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 shrink-0"
            }>
              Score: {log.score} / {log.totalQuestions} ({percentage}%)
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="shrink-0" />
            <span>
              Grade {log.gradeLevel} {log.subject} &bull; Synced on {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ParentTimeline: React.FC<ParentTimelineProps> = ({
  logs,
  lastUpdatedCell = null,
  currentTime = Date.now(),
}) => {
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');

  const filteredLogs = logs.filter(l => {
    if (subjectFilter === 'All') return true;
    const subj = l.subject.toLowerCase();
    if (subjectFilter === 'Mathematics') return subj === 'mathematics' || subj === 'math';
    if (subjectFilter === 'English') return subj === 'english';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header and Filter */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">
              Practice Timeline History
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Chronological log of diagnostic sessions, quizzes, and completed lessons.
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-center">
          {(['All', 'Mathematics', 'English'] as const).map(sub => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subjectFilter === sub
                  ? 'bg-[var(--text-main)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {sub === 'Mathematics' ? 'Math' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed Container */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-color)] pb-3">
          <span className="text-xs font-bold text-[var(--text-main)]">
            Showing {filteredLogs.length} session{filteredLogs.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> &ge; 80% Mastery
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" /> 50–79% Progressing
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" /> &lt; 50% Remedial
            </span>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm italic">
            No practice sessions recorded for this filter.
          </div>
        ) : (
          <List<{
            filteredLogs: SyncedEvent[];
            lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
            currentTime: number;
          }>
            style={{ overflowX: 'hidden', height: 520, width: '100%' }}
            rowCount={filteredLogs.length}
            rowHeight={115}
            rowComponent={TimelineRow}
            rowProps={{ filteredLogs, lastUpdatedCell, currentTime }}
          />
        )}
      </div>
    </div>
  );
};
