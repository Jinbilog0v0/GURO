import React from 'react';
import { Calendar } from 'lucide-react';
import { styles } from '../../styles/activityHeatmapStyles';

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

interface ActivityHeatmapProps {
  logs: SyncedEvent[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ logs }) => {
  // Generate the last 28 days
  const getPast28Days = () => {
    const dates = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const past28Days = getPast28Days();

  // Helper to count events on a specific date
  const getEventCountForDate = (date: Date) => {
    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return (
        logDate.getDate() === date.getDate() &&
        logDate.getMonth() === date.getMonth() &&
        logDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.03)';
    if (count === 1) return 'rgba(139, 92, 246, 0.2)'; // Light violet
    if (count === 2) return 'rgba(139, 92, 246, 0.5)'; // Medium violet
    return 'rgba(139, 92, 246, 0.9)'; // Intense violet
  };

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <Calendar size={18} style={{ color: '#8B5CF6' }} />
        <h3 style={styles.title}>Practice Consistency Tracker</h3>
      </div>
      <p style={styles.subtitle}>Daily activity calendar (past 4 weeks) tracking synced study quests.</p>
      
      <div style={styles.gridWrapper}>
        <div style={styles.grid}>
          {past28Days.map((date, idx) => {
            const count = getEventCountForDate(date);
            const title = `${date.toLocaleDateString()}: ${count} activity log${count === 1 ? '' : 's'}`;
            return (
              <div
                key={idx}
                title={title}
                style={{
                  ...styles.cell,
                  backgroundColor: getHeatmapColor(count),
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={styles.legend}>
        <span style={styles.legendText}>Less consistency</span>
        <div style={{ ...styles.cell, backgroundColor: getHeatmapColor(0) }} />
        <div style={{ ...styles.cell, backgroundColor: getHeatmapColor(1) }} />
        <div style={{ ...styles.cell, backgroundColor: getHeatmapColor(2) }} />
        <div style={{ ...styles.cell, backgroundColor: getHeatmapColor(3) }} />
        <span style={styles.legendText}>More practice</span>
      </div>
    </div>
  );
};


