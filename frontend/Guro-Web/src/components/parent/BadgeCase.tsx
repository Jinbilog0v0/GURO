import React from 'react';
import { Award, Lock, CheckCircle2, Calculator, BookOpen, Flame, Zap } from 'lucide-react';

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
interface BadgeCaseProps {
  logs: SyncedEvent[];
}

interface BadgeDef {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  description: string;
}

export const BadgeCase: React.FC<BadgeCaseProps> = ({ logs }) => {
  const badgeDefinitions: BadgeDef[] = [
    {
      id: 'first_step',
      name: 'First Step',
      icon: Award,
      color: '#3B82F6',
      description: 'Completed your first lesson.',
    },
    {
      id: 'perfect_score',
      name: 'Perfect 100%',
      icon: CheckCircle2,
      color: '#10B981',
      description: 'Got 100% on any quiz.',
    },
    {
      id: 'math_wizard',
      name: 'Math Wizard',
      icon: Calculator,
      color: '#F59E0B',
      description: 'Perfect score in Mathematics.',
    },
    {
      id: 'english_champion',
      name: 'English Champ',
      icon: BookOpen,
      color: '#8B5CF6',
      description: 'Perfect score in English.',
    },
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      icon: Flame,
      color: '#EF4444',
      description: 'Achieved a 3-day study streak.',
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      icon: Zap,
      color: '#EAB308',
      description: 'Achieved a 5-day study streak.',
    },
  ];

  const calculateMaxStreak = (logs: SyncedEvent[]): number => {
    if (logs.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(logs.map(log => new Date(log.timestamp).toISOString().split('T')[0]))
    ).sort();
    
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of uniqueDates) {
      const currentDate = new Date(dateStr);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      prevDate = currentDate;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
    return maxStreak;
  };

  const isBadgeUnlocked = (badgeId: string) => {
    if (logs.length === 0) return false;
    if (badgeId === 'first_step') return true;
    if (badgeId === 'perfect_score') {
      return logs.some((log) => log.score === log.totalQuestions);
    }
    if (badgeId === 'math_wizard') {
      return logs.some((log) => log.score === log.totalQuestions && log.subject.toLowerCase() === 'mathematics');
    }
    if (badgeId === 'english_champion') {
      return logs.some((log) => log.score === log.totalQuestions && log.subject.toLowerCase() === 'english');
    }
    if (badgeId === 'streak_starter' || badgeId === 'streak_master') {
      const streak = calculateMaxStreak(logs);
      return badgeId === 'streak_starter' ? streak >= 3 : streak >= 5;
    }
    return false;
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <Award size={20} className="text-[#F59E0B]" />
        <h3 className="text-base font-bold text-[var(--text-main)]">Child's Milestone Badge Case</h3>
      </div>
      <p className="text-xs text-[var(--text-muted)]">Badges unlock when the student completes topics with 80%+ mastery.</p>

      <div className="grid grid-cols-2 gap-4">
        {badgeDefinitions.map((badge) => {
          const unlocked = isBadgeUnlocked(badge.id);
          return (
            <div
              key={badge.id}
              className={`flex gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${
                unlocked
                  ? 'bg-[var(--bg-main)]/30 dark:bg-white/[0.02] shadow-[0_4px_15px_rgba(0,0,0,0.1)]'
                  : 'bg-[var(--bg-main)]/20 dark:bg-white/[0.01] opacity-60'
              }`}
              style={{
                borderColor: unlocked ? `${badge.color}30` : 'var(--border-color)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative border border-[var(--border-color)]"
                style={{
                  backgroundColor: unlocked ? `${badge.color}15` : 'rgba(128, 128, 128, 0.05)',
                }}
              >
                <badge.icon
                  size={28}
                  style={{
                    color: unlocked ? badge.color : 'var(--text-dark)',
                    opacity: unlocked ? 1 : 0.4,
                  }}
                />
                {unlocked ? (
                  <CheckCircle2 size={14} className="absolute -bottom-[3px] -right-[3px] text-[#10B981] fill-[#060913]" />
                ) : (
                  <Lock size={12} className="absolute -bottom-[3px] -right-[3px] text-[var(--text-dark)]" />
                )}
              </div>
              
              <div className="flex flex-col gap-[3px] flex-1">
                <h4 className={`text-[13px] font-bold ${unlocked ? 'text-[var(--text-main)]' : 'text-[var(--text-dark)]'} flex items-center gap-1.5`}>
                  <span>{badge.name}</span>
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">{badge.description}</p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.5px] mt-1 ${
                    unlocked ? 'text-[var(--success)]' : 'text-[var(--text-dark)]'
                  }`}
                >
                  {unlocked ? '✓ Completed' : 'Locked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
