import React from 'react';
import { styles } from '../../styles/masteryMatrixStyles';

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

interface MasteryMatrixProps {
  progressLogs: SyncedEvent[];
  lastUpdatedCell?: { studentId: string; topic: string; timestamp: number } | null;
}

export const MasteryMatrix: React.FC<MasteryMatrixProps> = ({ progressLogs, lastUpdatedCell }) => {
  // Extract all unique student IDs and topics
  const students = Array.from(new Set(progressLogs.map((log) => log.studentId)));
  const topics = Array.from(new Set(progressLogs.map((log) => log.topic)));

  // Helper to find the best score for a specific student and topic
  const getBestScore = (studentId: string, topic: string) => {
    const studentTopicLogs = progressLogs.filter(
      (log) => log.studentId === studentId && log.topic === topic
    );

    if (studentTopicLogs.length === 0) return null;

    // Find the highest accuracy percentage
    const percentages = studentTopicLogs.map((log) => (log.score / log.totalQuestions) * 100);
    return Math.max(...percentages);
  };

  const getCellStyles = (percentage: number | null) => {
    if (percentage === null) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        color: '#64748B',
        fontWeight: 500,
      };
    }
    if (percentage >= 80) {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#10B981',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        fontWeight: 700,
      };
    }
    if (percentage >= 50) {
      return {
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        color: '#F59E0B',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        fontWeight: 700,
      };
    }
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      color: '#EF4444',
      border: '1px solid rgba(239, 68, 68, 0.25)',
      fontWeight: 700,
    };
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>📊</span>
        <div>
          <h3 style={styles.title}>Classroom Mastery Matrix</h3>
          <p style={styles.subtitle}>Overview of topic mastery grades across all synced student profiles.</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div style={styles.empty}>
          <p>No student progress telemetry synced yet.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.stickyCol }}>Student / Device ID</th>
                {topics.map((topic) => (
                  <th key={topic} style={styles.th}>
                    {topic}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student} style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.stickyCol, ...styles.studentCell }}>
                    🔑 {student}
                  </td>
                  {topics.map((topic) => {
                    const bestScore = getBestScore(student, topic);
                    const cellStyle = getCellStyles(bestScore);
                    
                    // Check if this specific cell was recently updated
                    const isRecentlyUpdated =
                      lastUpdatedCell &&
                      lastUpdatedCell.studentId === student &&
                      lastUpdatedCell.topic === topic &&
                      Date.now() - lastUpdatedCell.timestamp < 5000;

                    let pulseClass = '';
                    if (isRecentlyUpdated && bestScore !== null) {
                      if (bestScore >= 80) pulseClass = 'flash-green';
                      else if (bestScore >= 50) pulseClass = 'flash-yellow';
                      else pulseClass = 'flash-red';
                    }

                    return (
                      <td key={topic} style={styles.td}>
                        <div
                          className={pulseClass}
                          style={{
                            ...styles.cellBadge,
                            ...cellStyle,
                            borderRadius: '8px',
                            transition: 'all 0.5s ease',
                          }}
                        >
                          {bestScore !== null ? `${Math.round(bestScore)}%` : '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


