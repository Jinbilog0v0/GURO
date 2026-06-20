import React from 'react';
import { Award, Lock, CheckCircle2, Medal, Pizza, Target, Coins, Shield, Theater, Zap, Ruler } from 'lucide-react';

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
  topicName: string;
  subject: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  description: string;
}

export const BadgeCase: React.FC<BadgeCaseProps> = ({ logs }) => {
  const badgeDefinitions: BadgeDef[] = [
    {
      id: 'fraction-cadet',
      name: 'Fraction Cadet',
      topicName: 'Fractions',
      subject: 'Mathematics',
      icon: Pizza,
      color: '#3B82F6',
      description: 'Achieve 80%+ accuracy on Grade 4 Fractions.',
    },
    {
      id: 'decimal-scout',
      name: 'Decimal Scout',
      topicName: 'Decimals',
      subject: 'Mathematics',
      icon: Coins,
      color: '#0EA5E9',
      description: 'Achieve 80%+ accuracy on Grade 5 Decimals.',
    },
    {
      id: 'simile-pioneer',
      name: 'Simile Pioneer',
      topicName: 'Figurative Language',
      subject: 'English',
      icon: Theater,
      color: '#8B5CF6',
      description: 'Achieve 80%+ accuracy on Grade 4 Figurative Language.',
    },
    {
      id: 'equation-master',
      name: 'Algebra Algebrator',
      topicName: 'Algebraic Equations',
      subject: 'Mathematics',
      icon: Ruler,
      color: '#F59E0B',
      description: 'Achieve 80%+ accuracy on Grade 6 Algebraic Equations.',
    },
  ];

  // Helper to determine if a badge is unlocked
  const isBadgeUnlocked = (topicName: string) => {
    const topicLogs = logs.filter((log) => log.topic.toLowerCase().includes(topicName.toLowerCase()));
    if (topicLogs.length === 0) return false;
    
    // Check if any log is >= 80% accuracy
    return topicLogs.some((log) => (log.score / log.totalQuestions) * 100 >= 80);
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2.5">
        <Award size={20} className="text-[#F59E0B]" />
        <h3 className="text-base font-bold text-[#F8FAFC]">Child's Milestone Badge Case</h3>
      </div>
      <p className="text-xs text-[#94A3B8]">Badges unlock when the student completes topics with 80%+ mastery.</p>

      <div className="grid grid-cols-2 gap-4">
        {badgeDefinitions.map((badge) => {
          const unlocked = isBadgeUnlocked(badge.topicName);
          return (
            <div
              key={badge.id}
              className={`flex gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${
                unlocked
                  ? 'bg-white/[0.02] shadow-[0_4px_15px_rgba(0,0,0,0.1)]'
                  : 'bg-white/[0.01] opacity-60'
              }`}
              style={{
                borderColor: unlocked ? `${badge.color}30` : 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center relative border border-white/[0.05]"
                style={{
                  backgroundColor: unlocked ? `${badge.color}15` : 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <badge.icon
                  size={28}
                  style={{
                    color: unlocked ? badge.color : '#64748B',
                    opacity: unlocked ? 1 : 0.4,
                  }}
                />
                {unlocked ? (
                  <CheckCircle2 size={14} className="absolute -bottom-[3px] -right-[3px] text-[#10B981] fill-[#060913]" />
                ) : (
                  <Lock size={12} className="absolute -bottom-[3px] -right-[3px] text-[#64748B]" />
                )}
              </div>
              
              <div className="flex flex-col gap-[3px] flex-1">
                <h4 className={`text-[13px] font-bold ${unlocked ? 'text-[#F8FAFC]' : 'text-[#64748B]'} flex items-center gap-1.5`}>
                  <span>{badge.name}</span>
                  {badge.id === 'fraction-cadet' && <Medal size={14} className="text-[#F59E0B] shrink-0" />}
                  {badge.id === 'decimal-scout' && <Target size={14} className="text-[#A01322] shrink-0" />}
                  {badge.id === 'simile-pioneer' && <Shield size={14} className="text-[#8B5CF6] shrink-0" />}
                  {badge.id === 'equation-master' && <Zap size={14} className="text-[#F59E0B] shrink-0" />}
                </h4>
                <p className="text-[11px] text-[#94A3B8] leading-[15px]">{badge.description}</p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.5px] mt-1 ${
                    unlocked ? 'text-[#10B981]' : 'text-[#64748B]'
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


