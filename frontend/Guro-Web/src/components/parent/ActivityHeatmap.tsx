import React from 'react';
import { Calendar } from 'lucide-react';

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
    <div className="glass-panel p-6 flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-[#8B5CF6]" />
        <h3 className="text-[15px] font-bold text-[var(--text-main)]">Practice Consistency Tracker</h3>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-2">Daily activity calendar (past 4 weeks) tracking synced study quests.</p>
      
      <div className="flex justify-center py-2">
        <div className="grid grid-cols-7 gap-2 max-w-[220px]">
          {past28Days.map((date, idx) => {
            const count = getEventCountForDate(date);
            const title = `${date.toLocaleDateString()}: ${count} activity log${count === 1 ? '' : 's'}`;
            return (
              <div
                key={idx}
                title={title}
                className="w-6 h-6 rounded-[6px] border border-white/5 transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110"
                style={{
                  backgroundColor: getHeatmapColor(count),
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[10px] text-[var(--text-dark)] mx-1">Less consistency</span>
        <div className="w-6 h-6 rounded-[6px] border border-white/5 transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110" style={{ backgroundColor: getHeatmapColor(0) }} />
        <div className="w-6 h-6 rounded-[6px] border border-white/5 transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110" style={{ backgroundColor: getHeatmapColor(1) }} />
        <div className="w-6 h-6 rounded-[6px] border border-white/5 transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110" style={{ backgroundColor: getHeatmapColor(2) }} />
        <div className="w-6 h-6 rounded-[6px] border border-white/5 transition-transform duration-100 ease-in-out cursor-pointer hover:scale-110" style={{ backgroundColor: getHeatmapColor(3) }} />
        <span className="text-[10px] text-[var(--text-dark)] mx-1">More practice</span>
      </div>
    </div>
  );
};



