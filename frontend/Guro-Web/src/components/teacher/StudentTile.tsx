import React from 'react';
import { Trophy, BookOpen, Clock, Award, User, Star, TrendingUp, AlertTriangle } from 'lucide-react';

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
    if (totalQuizzes === 0) return '#94A3B8'; // Neutral Gray
    if (avgScore >= 80) return '#10B981'; // Green
    if (avgScore >= 50) return '#F59E0B'; // Yellow
    return '#A01322'; // Red
  };

  const statusColor = getStatusColor();

  const parseStudentId = (id: string) => {
    let cleaned = id.replace(/-/g, ' ').trim();
    cleaned = cleaned.replace(/\s+GUEST$/i, '');
    cleaned = cleaned.replace(/\s+LOCAL$/i, '');
    cleaned = cleaned.trim();

    const sectionMatch = cleaned.match(/(.*)\s*\(([^)]+)\)/);
    if (sectionMatch) {
      const name = toTitleCase(sectionMatch[1].trim());
      const section = sectionMatch[2].trim().toUpperCase();
      return { name, section };
    }
    
    return { name: toTitleCase(cleaned), section: '' };
  };

  const toTitleCase = (str: string) => {
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const { name, section } = parseStudentId(studentId);

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
          <User size={16} className="text-[#11428E]" />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <h4 className="text-sm font-bold text-[var(--text-main)] truncate" title={name}>{name}</h4>
          <span className="text-[10px] text-[var(--text-muted)] mt-0.5 font-semibold uppercase truncate">
            {section ? `Section: ${section}` : 'Student'}
          </span>
        </div>
        <div
          className="px-2 py-1 rounded-md text-xs font-extrabold shrink-0"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
            border: `1px solid ${statusColor}30`,
          }}
        >
          {totalQuizzes === 0 ? 'N/A' : `${avgScore}%`}
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
          <Award size={14} style={{ color: totalQuizzes === 0 ? '#94A3B8' : '#A855F7' }} />
          <span className="text-[11px] text-[var(--text-muted)] font-semibold flex items-center gap-1">
            <span>{totalQuizzes === 0 ? 'Joined' : avgScore >= 80 ? 'Mastery' : avgScore >= 50 ? 'Progressing' : 'Needs Aid'}</span>
            {totalQuizzes === 0 ? (
              <User size={11} className="text-[#94A3B8]" />
            ) : avgScore >= 80 ? (
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


