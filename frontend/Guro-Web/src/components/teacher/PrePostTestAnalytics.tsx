import React, { useState } from 'react';
import { Target, Search, Filter, Inbox, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  difficulty?: string;
  assessmentType?: string;
  schoolYear?: string;
  term?: string;
  timestamp: string;
}

interface PrePostTestAnalyticsProps {
  progressLogs: SyncedEvent[];
  activeClassroomId?: string | null;
  onGoToClassroomSetup?: () => void;
}

export const PrePostTestAnalytics: React.FC<PrePostTestAnalyticsProps> = ({
  progressLogs,
  activeClassroomId,
  onGoToClassroomSetup
}) => {
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Group logs by student and topic
  const allStudents = Array.from(new Set(progressLogs.map(l => l.studentId)));
  const allTopics = Array.from(new Set(progressLogs.map(l => l.topic)));
  const allSubjects = Array.from(new Set(progressLogs.map(l => l.subject)));

  // Calculate pre vs post comparisons per (student, topic)
  interface GrowthRecord {
    studentId: string;
    subject: string;
    gradeLevel: number;
    topic: string;
    preScore: number | null;
    preTotal: number | null;
    prePercent: number | null;
    postScore: number | null;
    postTotal: number | null;
    postPercent: number | null;
    absoluteGain: number | null;
    normalizedGain: number | null;
    lastTested: string;
  }

  const growthRecords: GrowthRecord[] = [];

  allStudents.forEach(studentId => {
    const studentLogs = progressLogs.filter(l => l.studentId === studentId);
    const topicsForStudent = Array.from(new Set(studentLogs.map(l => l.topic)));

    topicsForStudent.forEach(topic => {
      const topicLogs = studentLogs.filter(l => l.topic === topic);
      const preLogs = topicLogs.filter(l => l.assessmentType === 'pre-test');
      const postLogs = topicLogs.filter(l => l.assessmentType === 'post-test');

      if (preLogs.length === 0 && postLogs.length === 0) return;

      const subject = topicLogs[0]?.subject || 'Mathematics';
      const gradeLevel = topicLogs[0]?.gradeLevel || 4;

      // Use latest pre-test and latest post-test
      const latestPre = preLogs.length > 0 ? preLogs[preLogs.length - 1] : null;
      const latestPost = postLogs.length > 0 ? postLogs[postLogs.length - 1] : null;

      const prePercent = latestPre ? Math.round((latestPre.score / Math.max(1, latestPre.totalQuestions)) * 100) : null;
      const postPercent = latestPost ? Math.round((latestPost.score / Math.max(1, latestPost.totalQuestions)) * 100) : null;

      let absoluteGain: number | null = null;
      let normalizedGain: number | null = null;

      if (prePercent !== null && postPercent !== null) {
        absoluteGain = postPercent - prePercent;
        if (prePercent < 100) {
          normalizedGain = Math.round(((postPercent - prePercent) / (100 - prePercent)) * 100);
        } else {
          normalizedGain = absoluteGain;
        }
      }

      const latestLog = topicLogs.reduce((latest, curr) => 
        new Date(curr.timestamp) > new Date(latest.timestamp) ? curr : latest, topicLogs[0]);

      growthRecords.push({
        studentId,
        subject,
        gradeLevel,
        topic,
        preScore: latestPre ? latestPre.score : null,
        preTotal: latestPre ? latestPre.totalQuestions : null,
        prePercent,
        postScore: latestPost ? latestPost.score : null,
        postTotal: latestPost ? latestPost.totalQuestions : null,
        postPercent,
        absoluteGain,
        normalizedGain,
        lastTested: latestLog.timestamp,
      });
    });
  });

  // Filter records
  const filteredRecords = growthRecords.filter(r => {
    if (studentSearch.trim() && !r.studentId.toLowerCase().includes(studentSearch.toLowerCase())) {
      return false;
    }
    if (selectedSubject !== 'All' && r.subject !== selectedSubject) {
      return false;
    }
    if (selectedTopic !== 'All' && r.topic !== selectedTopic) {
      return false;
    }
    return true;
  });

  // Overall class growth metrics
  const recordsWithBoth = filteredRecords.filter(r => r.prePercent !== null && r.postPercent !== null);
  const avgPre = recordsWithBoth.length > 0 
    ? Math.round(recordsWithBoth.reduce((acc, r) => acc + (r.prePercent || 0), 0) / recordsWithBoth.length) 
    : null;
  const avgPost = recordsWithBoth.length > 0 
    ? Math.round(recordsWithBoth.reduce((acc, r) => acc + (r.postPercent || 0), 0) / recordsWithBoth.length) 
    : null;
  const avgGain = (avgPre !== null && avgPost !== null) ? avgPost - avgPre : null;
  const avgNormalizedGain = recordsWithBoth.length > 0
    ? Math.round(recordsWithBoth.reduce((acc, r) => acc + (r.normalizedGain || 0), 0) / recordsWithBoth.length) 
    : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2.5">
            <Target className="size-6 text-[#11428E] shrink-0" />
            <span>Pre-Test vs Post-Test Growth Analysis</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Track student diagnostic baseline vs post-instructional summative mastery and measure normalized learning gain.
          </p>
        </div>
        {activeClassroomId && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 text-[var(--text-main)] font-mono">
            Classroom: {activeClassroomId}
          </span>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Avg Baseline (Pre-Test)</div>
          <div className="text-3xl font-extrabold mt-2 text-slate-400">
            {avgPre !== null ? `${avgPre}%` : '—'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Diagnostic baseline score</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Avg Summative (Post-Test)</div>
          <div className="text-3xl font-extrabold mt-2 text-[#10B981]">
            {avgPost !== null ? `${avgPost}%` : '—'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Post-lesson quiz score</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Mean Learning Gain (Δ%)</div>
          <div className={`text-3xl font-extrabold mt-2 ${avgGain !== null && avgGain >= 0 ? 'text-[#16A34A]' : 'text-[#CE1126]'}`}>
            {avgGain !== null ? `${avgGain >= 0 ? '+' : ''}${avgGain}%` : '—'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Absolute score improvement</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Normalized Gain (g)</div>
          <div className="text-3xl font-extrabold mt-2 text-[#11428E]">
            {avgNormalizedGain !== null ? `${avgNormalizedGain}%` : '—'}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Relative instructional gain</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4.5 flex items-center gap-3 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search student ID..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#11428E]"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[#11428E] cursor-pointer"
          >
            <option value="All">All Subjects</option>
            {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="relative">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[#11428E] cursor-pointer"
          >
            <option value="All">All Topics</option>
            {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {(studentSearch || selectedSubject !== 'All' || selectedTopic !== 'All') && (
          <button
            onClick={() => {
              setStudentSearch('');
              setSelectedSubject('All');
              setSelectedTopic('All');
            }}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Comparison Table */}
      {filteredRecords.length === 0 ? (
        <div className="glass-panel p-10 text-center border border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#11428E]/10 flex items-center justify-center text-[#11428E]">
            <Inbox size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)]">No Assessment Growth Records Found</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
              Students automatically take a Diagnostic Pre-Test when beginning a study module, and a Summative Post-Test upon finishing the module. As students practice on the mobile app, their growth metrics will populate here.
            </p>
          </div>
          {onGoToClassroomSetup && (
            <button
              onClick={onGoToClassroomSetup}
              className="btn btn-primary text-xs px-4 py-2"
            >
              Classroom Setup
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm" role="table" aria-label="Pre-Test vs Post-Test Growth Table">
              <thead>
                <tr className="bg-[var(--bg-sidebar)] border-b border-[var(--border-color)]">
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase">Student</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase">Subject & Topic</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Diagnostic Pre-Test</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Summative Post-Test</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Score Gain (Δ)</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Normalized Gain (g)</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase">Growth Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredRecords.map((rec, idx) => {
                  const hasBoth = rec.prePercent !== null && rec.postPercent !== null;
                  const gain = rec.absoluteGain;
                  const normGain = rec.normalizedGain;

                  let gainBadgeBg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                  let gainStatusText = 'Incomplete';
                  if (hasBoth) {
                    if (normGain !== null && normGain >= 70) {
                      gainBadgeBg = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
                      gainStatusText = 'High Gain (Mastery)';
                    } else if (normGain !== null && normGain >= 30) {
                      gainBadgeBg = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
                      gainStatusText = 'Medium Gain (Progressing)';
                    } else if (normGain !== null && normGain >= 0) {
                      gainBadgeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
                      gainStatusText = 'Low Gain (Needs Review)';
                    } else {
                      gainBadgeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
                      gainStatusText = 'Needs Remediation';
                    }
                  } else if (rec.prePercent !== null) {
                    gainStatusText = 'Post-Test Pending';
                  } else if (rec.postPercent !== null) {
                    gainStatusText = 'Pre-Test Skipped';
                  }

                  return (
                    <tr key={`${rec.studentId}-${rec.topic}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-xs text-[var(--text-main)]">
                        {rec.studentId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-xs text-[var(--text-main)]">{rec.topic}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{rec.subject} • Grade {rec.gradeLevel}</div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {rec.prePercent !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-xs text-slate-300">{rec.prePercent}%</span>
                            <span className="text-[10px] text-[var(--text-muted)]">({rec.preScore}/{rec.preTotal})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">Not taken</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {rec.postPercent !== null ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-xs text-emerald-400">{rec.postPercent}%</span>
                            <span className="text-[10px] text-[var(--text-muted)]">({rec.postScore}/{rec.postTotal})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)] italic">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {gain !== null ? (
                          <span className={`inline-flex items-center gap-1 font-bold text-xs ${gain > 0 ? 'text-[#10B981]' : gain < 0 ? 'text-[#CE1126]' : 'text-slate-400'}`}>
                            {gain > 0 ? <ArrowUpRight size={13} /> : gain < 0 ? <ArrowDownRight size={13} /> : <ArrowRight size={13} />}
                            {gain > 0 ? `+${gain}%` : `${gain}%`}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {normGain !== null ? (
                          <span className="font-mono font-extrabold text-xs text-[#11428E]">
                            {normGain}%
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${gainBadgeBg}`}>
                          {gainStatusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
