import React from 'react';
import { Trophy, BookOpen, Clock, Award } from 'lucide-react';
import { styles } from '../../styles/studentTileStyles';

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
    return '#EF4444'; // Red
  };

  // Find most recent topic completed
  const lastActive = logs.length > 0
    ? new Date(Math.max(...logs.map(l => new Date(l.timestamp).getTime()))).toLocaleDateString()
    : 'Never';

  return (
    <button
      onClick={() => onSelect(studentId)}
      className="glass-panel"
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
      }}
    >
      <div style={styles.header}>
        <div style={styles.avatar}>🔑</div>
        <div style={styles.nameContainer}>
          <h4 style={styles.name}>{studentId}</h4>
          <span style={styles.badge}>Active student</span>
        </div>
        <div
          style={{
            ...styles.scoreBadge,
            backgroundColor: `${getStatusColor()}15`,
            color: getStatusColor(),
            border: `1px solid ${getStatusColor()}30`,
          }}
        >
          {avgScore}%
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <Trophy size={14} style={{ color: '#F59E0B' }} />
          <span style={styles.statVal}>{totalQuizzes} Quizzes</span>
        </div>
        <div style={styles.statItem}>
          <BookOpen size={14} style={{ color: '#0EA5E9' }} />
          <span style={styles.statVal}>
            {new Set(logs.map(l => l.topic)).size} Topics
          </span>
        </div>
        <div style={styles.statItem}>
          <Clock size={14} style={{ color: '#94A3B8' }} />
          <span style={styles.statVal}>Active {lastActive}</span>
        </div>
        <div style={styles.statItem}>
          <Award size={14} style={{ color: '#A855F7' }} />
          <span style={styles.statVal}>
            {avgScore >= 80 ? 'Mastery ⭐' : avgScore >= 50 ? 'Progressing 📈' : 'Needs Aid ⚠️'}
          </span>
        </div>
      </div>
    </button>
  );
};


