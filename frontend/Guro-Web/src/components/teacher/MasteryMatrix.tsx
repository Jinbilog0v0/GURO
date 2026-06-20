import React, { useState } from 'react';
import { BarChart3, Key, Search, Filter, Inbox } from 'lucide-react';

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
  onGoToClassroomSetup?: () => void;
}

export const MasteryMatrix: React.FC<MasteryMatrixProps> = ({ progressLogs, lastUpdatedCell, onGoToClassroomSetup }) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('All');

  const allStudents = Array.from(new Set(progressLogs.map((log) => log.studentId)));
  const allTopics = Array.from(new Set(progressLogs.map((log) => log.topic)));

  const filteredStudents = studentSearch.trim()
    ? allStudents.filter((s) => s.toLowerCase().includes(studentSearch.toLowerCase()))
    : allStudents;

  const visibleTopics = topicFilter === 'All' ? allTopics : allTopics.filter((t) => t === topicFilter);

  const getBestScore = (studentId: string, topic: string) => {
    const logs = progressLogs.filter((l) => l.studentId === studentId && l.topic === topic);
    if (logs.length === 0) return null;
    return Math.max(...logs.map((l) => (l.score / l.totalQuestions) * 100));
  };

  const getCellStyles = (percentage: number | null) => {
    if (percentage === null) return { backgroundColor: 'rgba(255,255,255,0.02)', color: '#64748B', fontWeight: 500 };
    if (percentage >= 80) return { backgroundColor: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700 };
    if (percentage >= 50) return { backgroundColor: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', fontWeight: 700 };
    return { backgroundColor: 'rgba(160,19,34,0.12)', color: '#A01322', border: '1px solid rgba(160,19,34,0.25)', fontWeight: 700 };
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 w-full overflow-hidden">
      <div className="flex items-center gap-3">
        <BarChart3 className="size-6 text-blue-500" aria-hidden="true" />
        <div>
          <h3 className="text-base font-bold text-[var(--text-main)]">Classroom Mastery Matrix</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Overview of topic mastery grades across all synced student profiles.</p>
        </div>
      </div>

      {allStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-10 gap-4 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-main)]">
          <Inbox className="size-10 text-[var(--text-dark)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-[var(--text-main)]">No student progress telemetry synced yet.</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Pair a classroom first so students can sync progress.</p>
          </div>
          {onGoToClassroomSetup && (
            <button
              onClick={onGoToClassroomSetup}
              className="btn btn-primary text-xs px-4 py-2"
            >
              Go to Classroom Setup
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search student ID…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                aria-label="Search student by ID"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-dark)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary-glow)]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" aria-hidden="true" />
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                aria-label="Filter by topic"
                className="pl-8 pr-3 py-2 text-xs rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
              >
                <option value="All">All Topics</option>
                {allTopics.map((t) => <option key={t} value={t}>Topic: {t}</option>)}
              </select>
            </div>
            {(studentSearch || topicFilter !== 'All') && (
              <button
                onClick={() => { setStudentSearch(''); setTopicFilter('All'); }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic text-center py-6">No students match "{studentSearch}".</p>
          ) : (
            <div className="overflow-x-auto w-full max-h-[400px] overflow-y-auto border border-[var(--border-color)] rounded-xl">
              <table className="w-full border-collapse text-[13px] text-left" role="grid" aria-label="Student mastery matrix">
                <thead>
                  <tr>
                    <th scope="col" className="p-3.5 px-4.5 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold whitespace-nowrap sticky left-0 z-10 border-r border-[var(--border-color)]">Student / Device ID</th>
                    {visibleTopics.map((topic) => (
                      <th scope="col" key={topic} className="p-3.5 px-4.5 bg-[var(--bg-main)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold whitespace-nowrap">
                        {topic}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student} className="border-b border-[var(--border-color)] hover:bg-white/[0.02]">
                      <td className="p-3 px-4.5 text-[var(--text-main)] whitespace-nowrap sticky left-0 z-10 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] font-semibold font-mono text-xs">
                        <span className="inline-flex items-center gap-1.5"><Key className="size-3 text-slate-400" aria-hidden="true" />{student}</span>
                      </td>
                      {visibleTopics.map((topic) => {
                        const bestScore = getBestScore(student, topic);
                        const cellStyle = getCellStyles(bestScore);
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

                        const label = bestScore !== null
                          ? `Score ${Math.round(bestScore)}% for ${student} on ${topic}`
                          : `No data for ${student} on ${topic}`;

                        return (
                          <td key={topic} className="p-3 px-4.5 whitespace-nowrap">
                            <div
                              className={`${pulseClass} inline-flex items-center justify-center py-1.5 px-3 min-w-[55px] text-xs`}
                              style={{ ...cellStyle, borderRadius: '8px', transition: 'all 0.5s ease' }}
                              aria-label={label}
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
        </>
      )}
    </div>
  );
};
