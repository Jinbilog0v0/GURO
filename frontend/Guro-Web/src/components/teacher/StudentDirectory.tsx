import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Search, 
  User, 
  X,
  ChevronRight,
  LayoutList,
  LayoutGrid,
  Target,
  CheckCircle2,
  TrendingUp
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
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        setSelectedStudent(null);
      }
    };
    if (selectedStudent) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

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
            <span>Student Roster &amp; Profiles Directory</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Search, inspect individual telemetry curves, and review learner performance records across all classrooms.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
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

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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

          {/* Dual View Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#11428E] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Table View (Default)"
              aria-label="Table View"
            >
              <LayoutList size={14} />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-[#11428E] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Card View"
              aria-label="Card View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student List View / Cards Grid */}
      {filteredProfiles.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-[var(--text-muted)] text-sm">
          No students found matching your search or filters.
        </div>
      ) : viewMode === 'table' ? (
        /* Table View (Default) */
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Learner / LRN</th>
                  <th className="py-3.5 px-4">Grade Level</th>
                  <th className="py-3.5 px-4 text-center">Cohort Status</th>
                  <th className="py-3.5 px-4 text-center">Avg. Accuracy</th>
                  <th className="py-3.5 px-4 text-center">Quiz Records</th>
                  <th className="py-3.5 px-4">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredProfiles.map((profile) => {
                  const statusClass = 
                    profile.status === 'Mastery' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    profile.status === 'Review' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

                  const accuracyColor = 
                    profile.averageScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    profile.averageScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                    'text-rose-600 dark:text-rose-400';

                  return (
                    <tr 
                      key={profile.studentId}
                      onClick={() => setSelectedStudent(profile.studentId)}
                      className="hover:bg-[var(--bg-main)]/70 cursor-pointer transition-colors group"
                    >
                      {/* Learner ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[var(--text-main)]">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">
                            <User size={15} />
                          </div>
                          <span className="group-hover:text-indigo-500 transition-colors">
                            {profile.studentId}
                          </span>
                        </div>
                      </td>

                      {/* Grade Level */}
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-main)]">
                        <span className="px-2.5 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] font-bold">
                          Grade {profile.gradeLevel}
                        </span>
                      </td>

                      {/* Cohort Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusClass}`}>
                          {profile.status}
                        </span>
                      </td>

                      {/* Avg Accuracy */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono font-extrabold text-sm ${accuracyColor}`}>
                          {profile.averageScore}%
                        </span>
                      </td>

                      {/* Quiz Records */}
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-[var(--text-main)]">
                        {profile.totalQuizzes}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4 text-[var(--text-muted)] text-[11px]">
                        {profile.lastActive ? new Date(profile.lastActive).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(profile.studentId);
                          }}
                          className="btn btn-secondary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 inline-flex hover:border-indigo-500/40"
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
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
      {activeStudentProfile && typeof document !== 'undefined' && createPortal(
        <div 
          className="teacher-portal fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudent(null);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold shrink-0">
                  <User size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white m-0 font-mono">
                      {activeStudentProfile.studentId}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                      activeStudentProfile.status === 'Mastery' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' :
                      activeStudentProfile.status === 'Review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                    }`}>
                      {activeStudentProfile.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Grade {activeStudentProfile.gradeLevel} • {activeStudentProfile.totalQuizzes} Assessment Record{activeStudentProfile.totalQuizzes === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="size-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5 bg-white dark:bg-slate-900">
              {/* Quick Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 shadow-2xs">
                  <div 
                    className="size-10 rounded-lg flex items-center justify-center shrink-0" 
                    style={{
                      backgroundColor: activeStudentProfile.averageScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : activeStudentProfile.averageScore >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(225, 29, 72, 0.15)',
                      color: activeStudentProfile.averageScore >= 80 ? '#10B981' : activeStudentProfile.averageScore >= 50 ? '#F59E0B' : '#E11D48'
                    }}
                  >
                    <Target size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Overall Accuracy</span>
                    <div 
                      className="text-xl font-extrabold font-mono mt-0.5" 
                      style={{
                        color: activeStudentProfile.averageScore >= 80 ? '#10B981' : activeStudentProfile.averageScore >= 50 ? '#F59E0B' : '#E11D48'
                      }}
                    >
                      {activeStudentProfile.averageScore}%
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 shadow-2xs">
                  <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Completed Tests</span>
                    <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                      {activeStudentProfile.totalQuizzes}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 shadow-2xs">
                  <div 
                    className="size-10 rounded-lg flex items-center justify-center shrink-0" 
                    style={{
                      backgroundColor: activeStudentProfile.status === 'Mastery' ? 'rgba(16, 185, 129, 0.15)' : activeStudentProfile.status === 'Review' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(225, 29, 72, 0.15)',
                      color: activeStudentProfile.status === 'Mastery' ? '#10B981' : activeStudentProfile.status === 'Review' ? '#F59E0B' : '#E11D48'
                    }}
                  >
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Mastery Status</span>
                    <div 
                      className="text-base font-bold mt-0.5" 
                      style={{
                        color: activeStudentProfile.status === 'Mastery' ? '#10B981' : activeStudentProfile.status === 'Review' ? '#F59E0B' : '#E11D48'
                      }}
                    >
                      {activeStudentProfile.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attempt History Table */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider m-0">
                    Topic Assessments History
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {activeStudentProfile.logs.length} record{activeStudentProfile.logs.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300/80 dark:border-slate-700">
                        <tr className="text-[11px] uppercase tracking-wider font-extrabold">
                          <th className="py-3 px-4">Topic Assessment</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Accuracy</th>
                          <th className="py-3 px-4 text-right">Date Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                        {activeStudentProfile.logs.map((lg, idx) => {
                          const pct = Math.round((lg.score / lg.totalQuestions) * 100);
                          const accBadgeClass = 
                            pct >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' :
                            pct >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700';

                          const subjectBadge = 
                            lg.subject === 'Science' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700' :
                            lg.subject === 'Mathematics' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700' :
                            lg.subject === 'English' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700' :
                            'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';

                          const isEven = idx % 2 === 0;

                          return (
                            <tr 
                              key={lg.eventId} 
                              className={`${isEven ? 'bg-white dark:bg-slate-900/80' : 'bg-slate-50/70 dark:bg-slate-800/30'} hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 transition-colors`}
                            >
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-[#11428E] dark:bg-indigo-400 shrink-0"></span>
                                  <span>{lg.topic}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-[10.5px] font-bold border ${subjectBadge}`}>
                                  {lg.subject}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 font-mono font-bold text-slate-800 dark:text-slate-200 text-xs shadow-2xs">
                                  {lg.score} / {lg.totalQuestions}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-extrabold border ${accBadgeClass}`}>
                                  {pct}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-medium text-[11px]">
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
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/90 dark:bg-slate-900/90 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="btn btn-secondary text-xs px-4 py-2 rounded-lg cursor-pointer font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
