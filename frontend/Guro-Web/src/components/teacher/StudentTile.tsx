import React from 'react';
import { Trophy, BookOpen, Clock, Award, Key, Star, TrendingUp, AlertTriangle } from 'lucide-react';

interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

interface StudentTileProps {
  studentId: string;
  logs: SyncedEvent[];
  onSelect: (studentId: string) => void;
  isSelected: boolean;
}

export const StudentTile: React.FC<StudentTileProps> = ({
  studentId,
  logs,
  onSelect,
  isSelected,
}) => {
  const totalQuizzes = logs.length;
  
  // Calculate average score
  const getAverageScore = () => {
    if (totalQuizzes === 0) return 0;
    const sum = logs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    return Math.round(sum / totalQuizzes);
  };

  const avgScore = getAverageScore();

  // Get status color based on average
  const getStatusColor = () => {
    if (avgScore >= 80) return '#10B981'; // Green
    if (avgScore >= 50) return '#F59E0B'; // Yellow
    return '#A01322'; // Red
  };

  // Find most recent topic completed
  const lastActive = logs.length > 0
    ? new Date(Math.max(...logs.map(l => new Date(l.timestamp).getTime()))).toLocaleDateString()
    : 'Never';

  return (
    <button
      onClick={() => onSelect(studentId)}
      className={`glass-panel p-5 flex flex-col gap-4 text-left cursor-pointer w-full transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] border ${
        isSelected
          ? 'border-[#11428E] shadow-[0_0_15px_rgba(17,66,142,0.15)] bg-[#11428E]/5'
          : 'border-[var(--border-color)] hover:border-[#11428E]/50'
      }`}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="w-9 h-9 rounded-[10px] bg-[var(--border-color)] flex items-center justify-center border border-[var(--border-color)]">
          <Key size={16} className="text-[#F59E0B]" />
        </div>
        <div className="flex-1 flex flex-col">
          <h4 className="text-sm font-bold text-[var(--text-main)] font-mono truncate max-w-[120px]">{studentId}</h4>
          <span className="text-[10px] text-[var(--text-muted)] mt-0.5 font-semibold uppercase">Active student</span>
        </div>
        <div
          className="px-2 py-1 rounded-md text-xs font-extrabold"
          style={{
            backgroundColor: `${getStatusColor()}15`,
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}30`,
          }}
        >
          {avgScore}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Trophy size={14} style={{ color: '#F59E0B' }} />
          <span className="text-[11px] text-[var(--text-muted)] font-semibold">{totalQuizzes} Quizzes</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: '#0EA5E9' }} />
          <span className="text-[11px] text-[var(--text-muted)] font-semibold">
            {new Set(logs.map(l => l.topic)).size} Topics
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: '#94A3B8' }} />
          <span className="text-[11px] text-[var(--text-muted)] font-semibold">Active {lastActive}</span>
        </div>
        <div className="flex items-center gap-2">
          <Award size={14} style={{ color: '#A855F7' }} />
          <span className="text-[11px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
            <span>{avgScore >= 80 ? 'Mastery' : avgScore >= 50 ? 'Progressing' : 'Needs Aid'}</span>
            {avgScore >= 80 ? (
              <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
            ) : avgScore >= 50 ? (
              <TrendingUp size={11} className="text-[#10B981]" />
            ) : (
               <AlertTriangle size={11} className="text-[#A01322]" />
            )}
          </span>
        </div>
      </div>
    </button>
  );
};


