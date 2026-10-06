import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  User, 
  X,
  ChevronRight
} from 'lucide-react';

export interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  classroomId?: string | null;
}

export interface StudentDirectoryProps {
  progressLogs: SyncedEvent[];
  activeClassroomId?: string | null;
}

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ progressLogs, activeClassroomId: _activeClassroomId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'All' | 4 | 5 | 6>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Mastery' | 'Review' | 'Remediation'>('All');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Group unique students
  const allStudentIds = Array.from(new Set(progressLogs.map(l => l.studentId)));

  const studentProfiles = allStudentIds.map(stId => {
    const logs = progressLogs.filter(l => l.studentId === stId);
    const totalScore = logs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    const avgScore = logs.length > 0 ? Math.round(totalScore / logs.length) : 0;
    const latestLog = logs.reduce((latest, curr) => 
      new Date(curr.timestamp) > new Date(latest.timestamp) ? curr : latest, logs[0]);
    const gradeLevel = latestLog?.gradeLevel || 4;
    const status = avgScore >= 80 ? 'Mastery' : avgScore >= 50 ? 'Review' : 'Remediation';

    return {
      studentId: stId,
      logs,
      totalQuizzes: logs.length,
      averageScore: avgScore,
      gradeLevel,
      status,
      lastActive: latestLog?.timestamp || '',
    };
  });

  // Filter profiles
  const filteredProfiles = studentProfiles.filter(p => {
    if (gradeFilter !== 'All' && p.gradeLevel !== gradeFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.studentId.toLowerCase().includes(q);
    }
    return true;
  });

  // Count aggregates
  const highMasteryCount = studentProfiles.filter(p => p.averageScore >= 80).length;
  const remedialCount = studentProfiles.filter(p => p.averageScore < 50).length;

  const activeStudentProfile = selectedStudent ? studentProfiles.find(p => p.studentId === selectedStudent) : null;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Banner / Summary */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
            <Users className="size-6 text-[#11428E]" />
            <span>Student Roster & Profiles Directory</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Search, inspect individual telemetry curves, and review learner performance records across all classrooms.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Total Learners:</span>
            <strong className="text-[var(--text-main)] font-mono">{studentProfiles.length}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-500">
            <span>High Mastery (≥ 80%):</span>
            <strong className="font-mono">{highMasteryCount}</strong>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-center gap-2 text-rose-500">
            <span>Remedial (&lt; 50%):</span>
            <strong className="font-mono">{remedialCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-3.5 size-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student identifier, device code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value === 'All' ? 'All' : Number(e.target.value) as any)}
            className="py-2 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Grades (4–6)</option>
            <option value={4}>Grade 4</option>
            <option value={5}>Grade 5</option>
            <option value={6}>Grade 6</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Mastery">Mastery (≥ 80%)</option>
            <option value="Review">Review Needed (50–79%)</option>
            <option value="Remediation">Remediation (&lt; 50%)</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-[var(--text-muted)] text-sm">
          No students found matching your search or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile) => {
            const statusClass = 
              profile.status === 'Mastery' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              profile.status === 'Review' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20';

            return (
              <div
                key={profile.studentId}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md cursor-pointer group"
                onClick={() => setSelectedStudent(profile.studentId)}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-sm">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-main)] m-0 font-mono group-hover:text-indigo-400 transition-colors">
                          {profile.studentId}
                        </h4>
                        <span className="text-[11px] text-[var(--text-muted)]">Grade {profile.gradeLevel}</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusClass}`}>
                      {profile.status}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Accuracy</span>
                      <div className="text-base font-extrabold text-[var(--text-main)] mt-0.5" style={{
                        color: profile.averageScore >= 80 ? '#10B981' : profile.averageScore >= 50 ? '#F59E0B' : '#A01322'
                      }}>
                        {profile.averageScore}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Attempts</span>
                      <div className="text-base font-extrabold text-[var(--text-main)] mt-0.5">
                        {profile.totalQuizzes}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                  <span>Last active: {profile.lastActive ? new Date(profile.lastActive).toLocaleDateString() : 'N/A'}</span>
                  <span className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student Detailed Telemetry Modal */}
      {activeStudentProfile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-sidebar)]">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-main)] m-0 font-mono">
                    {activeStudentProfile.studentId}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Grade {activeStudentProfile.gradeLevel} • {activeStudentProfile.totalQuizzes} Total Quiz Records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="size-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Quick Summary Pill */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-center">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Overall Accuracy</span>
                  <div className="text-lg font-bold mt-1" style={{
                    color: activeStudentProfile.averageScore >= 80 ? '#10B981' : activeStudentProfile.averageScore >= 50 ? '#F59E0B' : '#A01322'
                  }}>
                    {activeStudentProfile.averageScore}%
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Completed Tests</span>
                  <div className="text-lg font-bold text-[var(--text-main)] mt-1">
                    {activeStudentProfile.totalQuizzes}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Mastery Status</span>
                  <div className="text-lg font-bold text-indigo-400 mt-1">
                    {activeStudentProfile.status}
                  </div>
                </div>
              </div>

              {/* Attempt History Table */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider m-0">
                  Topic Assessments History
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
                      <tr className="border-b border-[var(--border-color)]">
                        <th className="py-2.5 px-3 font-bold">Topic</th>
                        <th className="py-2.5 px-3 font-bold">Subject</th>
                        <th className="py-2.5 px-3 font-bold">Score</th>
                        <th className="py-2.5 px-3 font-bold">Accuracy</th>
                        <th className="py-2.5 px-3 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStudentProfile.logs.map((lg) => {
                        const pct = Math.round((lg.score / lg.totalQuestions) * 100);
                        return (
                          <tr key={lg.eventId} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)]">
                            <td className="py-2.5 px-3 font-semibold text-[var(--text-main)]">{lg.topic}</td>
                            <td className="py-2.5 px-3 text-[var(--text-muted)]">{lg.subject}</td>
                            <td className="py-2.5 px-3 text-[var(--text-main)] font-mono">{lg.score} / {lg.totalQuestions}</td>
                            <td className="py-2.5 px-3 font-bold">
                              <span style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#A01322' }}>
                                {pct}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[var(--text-muted)]">
                              {new Date(lg.timestamp).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-color)] flex justify-end bg-[var(--bg-sidebar)]">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
