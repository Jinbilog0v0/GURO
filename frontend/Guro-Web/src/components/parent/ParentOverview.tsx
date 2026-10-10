import React from 'react';
import { Star, TrendingUp, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { TutorReport } from './TutorReport';

export interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

export interface ParentOverviewProps {
  logs: SyncedEvent[];
  studentNameOrId: string;
}

export const ParentOverview: React.FC<ParentOverviewProps> = ({ logs, studentNameOrId }) => {
  const totalQuizzes = logs.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(logs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / totalQuizzes)
    : 0;

  const statusLabel = avgScore >= 80 ? 'Advanced' : avgScore >= 50 ? 'Progressing' : 'Remedial';
  const statusColor = avgScore >= 80 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

  const mathLogs = logs.filter(l => l.subject.toLowerCase() === 'mathematics' || l.subject.toLowerCase() === 'math');
  const englishLogs = logs.filter(l => l.subject.toLowerCase() === 'english');

  const mathAvg = mathLogs.length > 0
    ? Math.round(mathLogs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / mathLogs.length)
    : null;
  const englishAvg = englishLogs.length > 0
    ? Math.round(englishLogs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / englishLogs.length)
    : null;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Overview Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">
              Learning Overview for {studentNameOrId || 'Student'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Synced telemetry and AI-driven mastery summary based on {totalQuizzes} completed quest{totalQuizzes !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
            Math: {mathAvg !== null ? `${mathAvg}%` : 'No data'}
          </span>
          <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
            English: {englishAvg !== null ? `${englishAvg}%` : 'No data'}
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Completed Quests
          </span>
          <span className="text-3xl font-black text-[var(--text-main)]">
            {totalQuizzes}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Verified submissions
          </span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Average Accuracy
          </span>
          <span className="text-3xl font-black text-emerald-500">
            {avgScore}%
          </span>
          <div className="w-24 bg-[var(--border-color)]/50 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, avgScore))}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-1.5 shadow-xs">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Learning Status
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-black" style={{ color: statusColor }}>
              {statusLabel}
            </span>
            {avgScore >= 80 ? (
              <Star size={20} className="text-emerald-500 fill-emerald-500 shrink-0" />
            ) : avgScore >= 50 ? (
              <TrendingUp size={20} className="text-amber-500 shrink-0" />
            ) : (
              <AlertTriangle size={20} className="text-red-500 shrink-0" />
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {avgScore >= 80 ? 'Excelling in core competencies' : avgScore >= 50 ? 'Steady practice progress' : 'Targeted review advised'}
          </span>
        </div>
      </div>

      {/* AI Tutor Diagnostic Report */}
      <TutorReport logs={logs} />
    </div>
  );
};
