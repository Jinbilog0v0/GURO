import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, TrendingDown, CheckCircle2, ChevronDown, ChevronUp, Award } from 'lucide-react';

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
  timestamp: string;
}

interface DiagnosticAlertsProps {
  progressLogs: SyncedEvent[];
}

export const DiagnosticAlerts: React.FC<DiagnosticAlertsProps> = ({ progressLogs }) => {
  const [selectedGrade, setSelectedGrade] = useState<'All' | 4 | 5 | 6>('All');
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Mathematics' | 'English'>('All');

  // Filter logs by Grade and Subject
  const filteredLogs = progressLogs.filter((log) => {
    if (selectedGrade !== 'All' && log.gradeLevel !== selectedGrade) return false;
    if (selectedSubject !== 'All') {
      const isMath = selectedSubject === 'Mathematics';
      const logSubj = log.subject === 'Math' ? 'Mathematics' : log.subject;
      if (isMath && logSubj !== 'Mathematics') return false;
      if (!isMath && logSubj !== 'English') return false;
    }
    return true;
  });

  // Calculate topic performance across cohort
  const topicStats: { [topic: string]: { sum: number; totalQ: number; totalScore: number; count: number; subject: string; grade: number } } = {};
  filteredLogs.forEach((log) => {
    const subj = log.subject === 'Math' ? 'Mathematics' : log.subject;
    if (!topicStats[log.topic]) {
      topicStats[log.topic] = { sum: 0, totalQ: 0, totalScore: 0, count: 0, subject: subj, grade: log.gradeLevel };
    }
    const pct = log.totalQuestions > 0 ? (log.score / log.totalQuestions) * 100 : 0;
    topicStats[log.topic].sum += pct;
    topicStats[log.topic].totalScore += log.score;
    topicStats[log.topic].totalQ += log.totalQuestions;
    topicStats[log.topic].count += 1;
  });

  const topicSummaryList = Object.keys(topicStats).map((topic) => {
    const item = topicStats[topic];
    const avgPct = Math.round(item.sum / Math.max(1, item.count));
    return {
      topic,
      average: avgPct,
      subject: item.subject,
      grade: item.grade,
      attempts: item.count,
    };
  });

  const strongTopics = topicSummaryList.filter((t) => t.average >= 80).sort((a, b) => b.average - a.average);
  const progressingTopics = topicSummaryList.filter((t) => t.average >= 50 && t.average < 80).sort((a, b) => b.average - a.average);
  const weakTopics = topicSummaryList.filter((t) => t.average < 50).sort((a, b) => a.average - b.average);

  const lowAverageTopics = [...weakTopics, ...progressingTopics];
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-panel overflow-hidden w-full shadow-md border border-[var(--border-color)]">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 text-left border-b border-[var(--border-color)] cursor-pointer hover:bg-white/[0.02] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <TrendingDown size={18} className={weakTopics.length > 0 ? 'text-[#A01322]' : 'text-[var(--text-muted)]'} aria-hidden="true" />
          <span className="text-[14.5px] font-bold text-[var(--text-main)]">
            Curriculum Health &amp; Strong/Weak Lessons Tally
          </span>
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[var(--bg-main)] border border-[var(--border-color)]">
            <span className="text-emerald-500 inline-flex items-center gap-1"><CheckCircle2 size={11} className="text-emerald-500" /> {strongTopics.length} Strong</span>
            <span className="text-amber-500 inline-flex items-center gap-1"><AlertCircle size={11} className="text-amber-500" /> {progressingTopics.length} In-Progress</span>
            <span className="text-red-500 inline-flex items-center gap-1"><AlertTriangle size={11} className="text-red-500" /> {weakTopics.length} Bottlenecks</span>
          </span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-[var(--text-muted)] shrink-0" /> : <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" />}
      </button>

      {isOpen && (
        <div className="p-5 flex flex-col gap-5">
          {/* Grade & Subject Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-[var(--border-color)]/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[var(--text-muted)] mr-1">Grade:</span>
              {(['All', 4, 5, 6] as const).map((gr) => {
                const active = selectedGrade === gr;
                return (
                  <button
                    key={gr}
                    onClick={() => setSelectedGrade(gr)}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {gr === 'All' ? 'All Grades' : `Grade ${gr}`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--text-muted)] mr-1">Subject:</span>
              {(['All', 'Mathematics', 'English'] as const).map((subj) => {
                const active = selectedSubject === subj;
                return (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-secondary)] text-white shadow-sm'
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {subj === 'All' ? 'All Subjects' : subj === 'Mathematics' ? 'Math' : 'English'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tally Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-[var(--bg-main)]/60 border border-[var(--border-color)] rounded-xl p-3.5 flex flex-col gap-1 items-center justify-center">
              <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Evaluated Topics</span>
              <span className="text-xl font-black text-[var(--text-main)]">{topicSummaryList.length}</span>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 flex flex-col gap-1 items-center justify-center">
              <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-500" /> Strong Topics (≥80%)
              </span>
              <span className="text-xl font-black text-emerald-500">{strongTopics.length}</span>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 flex flex-col gap-1 items-center justify-center">
              <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={13} className="text-amber-500" /> Moderate (50-79%)
              </span>
              <span className="text-xl font-black text-amber-500">{progressingTopics.length}</span>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 flex flex-col gap-1 items-center justify-center">
              <span className="text-[10.5px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={13} className="text-red-500" /> Bottlenecks (&lt;50%)
              </span>
              <span className="text-xl font-black text-red-500">{weakTopics.length}</span>
            </div>
          </div>

          {/* Side-by-side Top Strengths vs Struggling Bottlenecks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Top Cohort Strengths */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-500" aria-hidden="true" />
                <h4 className="text-[13.5px] font-bold text-[var(--text-main)]">Top Mastered Topics (Cohort Strengths)</h4>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                {strongTopics.length === 0 ? (
                  <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] text-xs italic text-center">
                    No topics have reached 80%+ cohort mastery for this filter yet.
                  </div>
                ) : (
                  strongTopics.slice(0, 3).map((item) => (
                    <div key={item.topic} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-[var(--text-main)] truncate" title={item.topic}>
                          {item.topic} (G{item.grade} {item.subject})
                        </span>
                      </div>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 shrink-0">
                        {item.average}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Critical Bottlenecks */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-[#A01322]" aria-hidden="true" />
                <h4 className="text-[13.5px] font-bold text-[var(--text-main)]">Priority Bottlenecks (Needs Review)</h4>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
                {lowAverageTopics.length === 0 ? (
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-1.5 justify-center">
                    <CheckCircle2 size={14} /> All topics are above mastery threshold!
                  </div>
                ) : (
                  lowAverageTopics.slice(0, 3).map((item) => {
                    const isCritical = item.average < 50;
                    return (
                      <div key={item.topic} className={`flex items-center justify-between p-3 rounded-xl border ${isCritical ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <AlertCircle size={15} className={isCritical ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
                          <span className="text-xs font-bold text-[var(--text-main)] truncate" title={item.topic}>
                            {item.topic} (G{item.grade} {item.subject})
                          </span>
                        </div>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded shrink-0 ${isCritical ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}`}>
                          {item.average}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
