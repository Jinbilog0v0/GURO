import React from 'react';

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
    <div className="glass-panel p-6 flex flex-col gap-5 w-full overflow-hidden">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📊</span>
        <div>
          <h3 className="text-base font-bold text-[var(--text-main)]">Classroom Mastery Matrix</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Overview of topic mastery grades across all synced student profiles.</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center p-10 text-[var(--text-muted)] text-sm italic">
          <p>No student progress telemetry synced yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto border border-[var(--border-color)] rounded-xl">
          <table className="w-full border-collapse text-[13px] text-left">
            <thead>
              <tr>
                <th className="p-3.5 px-4.5 bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold whitespace-nowrap sticky left-0 z-10 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]">Student / Device ID</th>
                {topics.map((topic) => (
                  <th key={topic} className="p-3.5 px-4.5 bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold whitespace-nowrap">
                    {topic}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student} className="border-b border-[var(--border-color)] hover:bg-white/[0.02]">
                  <td className="p-3 px-4.5 text-[var(--text-main)] whitespace-nowrap sticky left-0 z-10 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] font-semibold font-mono text-xs">
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
                      <td key={topic} className="p-3 px-4.5 text-[var(--text-main)] whitespace-nowrap">
                        <div
                          className={pulseClass + " inline-flex items-center justify-center py-1.5 px-3 min-w-[55px] text-xs"}
                          style={{
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
