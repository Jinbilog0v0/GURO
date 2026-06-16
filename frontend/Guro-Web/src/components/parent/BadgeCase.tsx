import React from 'react';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { styles } from '../../styles/badgeCaseStyles';

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
  icon: string;
  color: string;
  description: string;
}

export const BadgeCase: React.FC<BadgeCaseProps> = ({ logs }) => {
  const badgeDefinitions: BadgeDef[] = [
    {
      id: 'fraction-cadet',
      name: 'Fraction Cadet 🎖️',
      topicName: 'Fractions',
      subject: 'Mathematics',
      icon: '🍕',
      color: '#3B82F6',
      description: 'Achieve 80%+ accuracy on Grade 4 Fractions.',
    },
    {
      id: 'decimal-scout',
      name: 'Decimal Scout 🎯',
      topicName: 'Decimals',
      subject: 'Mathematics',
      icon: '🪙',
      color: '#0EA5E9',
      description: 'Achieve 80%+ accuracy on Grade 5 Decimals.',
    },
    {
      id: 'simile-pioneer',
      name: 'Simile Pioneer 🛡️',
      topicName: 'Figurative Language',
      subject: 'English',
      icon: '🎭',
      color: '#8B5CF6',
      description: 'Achieve 80%+ accuracy on Grade 4 Figurative Language.',
    },
    {
      id: 'equation-master',
      name: 'Algebra Algebrator ⚡',
      topicName: 'Algebraic Equations',
      subject: 'Mathematics',
      icon: '📐',
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
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <Award size={20} style={{ color: '#F59E0B' }} />
        <h3 style={styles.title}>Child's Milestone Badge Case</h3>
      </div>
      <p style={styles.subtitle}>Badges unlock when the student completes topics with 80%+ mastery.</p>

      <div style={styles.grid}>
        {badgeDefinitions.map((badge) => {
          const unlocked = isBadgeUnlocked(badge.topicName);
          return (
            <div
              key={badge.id}
              style={{
                ...styles.badgeCard,
                ...(unlocked ? styles.unlockedCard : styles.lockedCard),
                borderColor: unlocked ? `${badge.color}30` : 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <div
                style={{
                  ...styles.iconWrapper,
                  backgroundColor: unlocked ? `${badge.color}15` : 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <span
                  style={{
                    ...styles.emoji,
                    filter: unlocked ? 'none' : 'grayscale(100%) opacity(40%)',
                  }}
                >
                  {badge.icon}
                </span>
                {unlocked ? (
                  <CheckCircle2 size={14} style={styles.checkIcon} />
                ) : (
                  <Lock size={12} style={styles.lockIcon} />
                )}
              </div>
              
              <div style={styles.badgeInfo}>
                <h4 style={{ ...styles.badgeName, color: unlocked ? '#F8FAFC' : '#64748B' }}>
                  {badge.name}
                </h4>
                <p style={styles.badgeDesc}>{badge.description}</p>
                <span
                  style={{
                    ...styles.statusText,
                    color: unlocked ? '#10B981' : '#64748B',
                  }}
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


