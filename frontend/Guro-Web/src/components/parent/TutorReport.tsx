import React from 'react';
import { Sparkles, MessageCircle, TrendingUp, Award, AlertTriangle, CheckCircle, Brain, BookOpen, Calculator } from 'lucide-react';

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

interface TutorReportProps {
  logs: SyncedEvent[];
}

export const TutorReport: React.FC<TutorReportProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  // 1. Calculate subject stats (Mathematics vs English)
  const subjectStats: Record<string, { score: number; total: number; count: number }> = {};
  logs.forEach((log) => {
    const subj = log.subject === 'Math' ? 'Mathematics' : log.subject;
    if (!subjectStats[subj]) {
      subjectStats[subj] = { score: 0, total: 0, count: 0 };
    }
    subjectStats[subj].score += log.score;
    subjectStats[subj].total += log.totalQuestions;
    subjectStats[subj].count += 1;
  });

  // 2. Strongest vs Struggling Topics Tally
  const topicStats: Record<string, { score: number; total: number; count: number; subject: string; grade: number }> = {};
  logs.forEach((log) => {
    const subj = log.subject === 'Math' ? 'Mathematics' : log.subject;
    if (!topicStats[log.topic]) {
      topicStats[log.topic] = { score: 0, total: 0, count: 0, subject: subj, grade: log.gradeLevel };
    }
    topicStats[log.topic].score += log.score;
    topicStats[log.topic].total += log.totalQuestions;
    topicStats[log.topic].count += 1;
  });

  const topicList = Object.keys(topicStats).map((tName) => {
    const item = topicStats[tName];
    const pct = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;
    return {
      topic: tName,
      subject: item.subject,
      grade: item.grade,
      accuracy: pct,
      attempts: item.count,
    };
  });

  const strongTopics = topicList.filter((t) => t.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
  const progressingTopics = topicList.filter((t) => t.accuracy >= 50 && t.accuracy < 80).sort((a, b) => b.accuracy - a.accuracy);
  const weakTopics = topicList.filter((t) => t.accuracy < 50).sort((a, b) => a.accuracy - b.accuracy);

  const strongestTopic = strongTopics[0] || topicList.sort((a, b) => b.accuracy - a.accuracy)[0] || { topic: 'N/A', accuracy: 0, subject: 'Mathematics', grade: 4 };
  const weakestTopic = weakTopics[0] || progressingTopics[progressingTopics.length - 1] || topicList.sort((a, b) => a.accuracy - b.accuracy)[0] || { topic: 'N/A', accuracy: 0, subject: 'Mathematics', grade: 4 };

  // 3. Pre-Test vs Post-Test Growth & Normalized Gain (Hake's Gain g)
  let totalPrePct = 0;
  let preCount = 0;
  let totalPostPct = 0;
  let postCount = 0;

  logs.forEach((log) => {
    const pct = log.totalQuestions > 0 ? Math.round((log.score / log.totalQuestions) * 100) : 0;
    if (log.assessmentType === 'pre-test') {
      totalPrePct += pct;
      preCount += 1;
    } else if (log.assessmentType === 'post-test') {
      totalPostPct += pct;
      postCount += 1;
    }
  });

  const avgPre = preCount > 0 ? Math.round(totalPrePct / preCount) : null;
  const avgPost = postCount > 0 ? Math.round(totalPostPct / postCount) : null;
  let normalizedGain: number | null = null;
  let absoluteGain: number | null = null;

  if (avgPre !== null && avgPost !== null) {
    absoluteGain = avgPost - avgPre;
    if (avgPre < 100) {
      normalizedGain = Math.round(((avgPost - avgPre) / (100 - avgPre)) * 100);
    } else {
      normalizedGain = absoluteGain;
    }
  }

  // 4. Bloom's Cognitive Difficulty Accuracy (Easy, Average, Difficult)
  const diffStats: Record<string, { score: number; total: number }> = {
    Easy: { score: 0, total: 0 },
    Average: { score: 0, total: 0 },
    Difficult: { score: 0, total: 0 },
  };

  logs.forEach((log) => {
    const diff = log.difficulty || 'Average';
    if (diffStats[diff]) {
      diffStats[diff].score += log.score;
      diffStats[diff].total += log.totalQuestions;
    }
  });

  const getDiffPct = (d: string) => {
    const item = diffStats[d];
    return item.total > 0 ? Math.round((item.score / item.total) * 100) : null;
  };

  // 5. Generate Home Action Plan recommendations
  const getParentTips = (): string => {
    if (weakestTopic.topic === 'N/A') {
      return 'Ask your child to pick a lesson on their mobile app to begin practice.';
    }

    if (weakestTopic.accuracy >= 85) {
      return `Exceptional work! Your child is mastering all topics, including ${weakestTopic.topic}. Ask them to "teach" you the topic during dinner to cement deep retention.`;
    }

    if (weakestTopic.topic.toLowerCase().includes('fraction')) {
      return 'Help your child visualize fractions by cutting bread, fruit, or pizza into equal slices and asking them to identify numerators and denominators (e.g., "1 slice of 4 is 1/4").';
    }

    if (weakestTopic.topic.toLowerCase().includes('decimal')) {
      return 'Practice decimals with grocery receipts or coins (e.g., 25 centavos = 0.25 pesos). Compare prices to practice greater than and less than.';
    }

    if (weakestTopic.topic.toLowerCase().includes('simile') || weakestTopic.topic.toLowerCase().includes('figurative')) {
      return 'Read a bedtime story together and hunt for similes. Challenge your child with fun comparison prompts like "as fast as a..." or "as bright as...".';
    }

    if (weakestTopic.topic.toLowerCase().includes('verb') || weakestTopic.topic.toLowerCase().includes('grammar')) {
      return 'Play a sentence game: say a subject (e.g. "The dogs...") and ask your child to quickly choose the correct verb ("bark" vs "barks").';
    }

    return `Spend 10 minutes reviewing the explanation feedback on "${weakestTopic.topic}" together and try the practice quiz one more time.`;
  };

  const tips = getParentTips();

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 w-full shadow-lg border border-[var(--border-color)]">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={20} className="text-[#EC4899]" />
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Child Learning Pulse &amp; Progress Insights</h3>
            <p className="text-xs text-[var(--text-muted)]">Comprehensive mastery analytics and home guidance</p>
          </div>
        </div>

        {normalizedGain !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Learning Growth: +{absoluteGain}% (g = {normalizedGain > 0 ? (normalizedGain / 100).toFixed(2) : 0})</span>
          </div>
        )}
      </div>

      {/* Grid: Subject Mastery + Strengths/Weaknesses Tally */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject Mastery Progress Bars */}
        <div className="bg-[var(--bg-main)]/50 border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Brain size={14} className="text-[var(--accent-primary)]" /> Subject Mastery Breakdown
          </h4>

          <div className="flex flex-col gap-3">
            {['Mathematics', 'English'].map((subj) => {
              const data = subjectStats[subj] || { score: 0, total: 0, count: 0 };
              const pct = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
              const isMath = subj === 'Mathematics';
              const Icon = isMath ? Calculator : BookOpen;
              const color = isMath ? '#11428E' : '#10B981';

              return (
                <div key={subj} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Icon size={14} style={{ color }} /> {subj}
                    </span>
                    <span className="font-bold" style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444' }}>
                      {pct}% ({data.count} {data.count === 1 ? 'quiz' : 'quizzes'})
                    </span>
                  </div>
                  <div className="w-full bg-[var(--border-color)]/40 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, pct))}%`,
                        backgroundColor: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cognitive Depth (Bloom's Taxonomy) */}
          <div className="border-t border-[var(--border-color)]/60 pt-3 flex justify-between items-center text-[11px] text-[var(--text-muted)]">
            <span>Cognitive Accuracy:</span>
            <span className="flex items-center gap-3 font-semibold">
              <span className="text-emerald-500">Easy: {getDiffPct('Easy') !== null ? `${getDiffPct('Easy')}%` : 'N/A'}</span>
              <span className="text-amber-500">Avg: {getDiffPct('Average') !== null ? `${getDiffPct('Average')}%` : 'N/A'}</span>
              <span className="text-pink-500">Hard: {getDiffPct('Difficult') !== null ? `${getDiffPct('Difficult')}%` : 'N/A'}</span>
            </span>
          </div>
        </div>

        {/* Strengths & Weaknesses Tally */}
        <div className="bg-[var(--bg-main)]/50 border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" /> Topic Performance Tally
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Strengths */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle size={12} /> Top Strengths ({strongTopics.length})
              </span>
              {strongTopics.length === 0 ? (
                <span className="text-[11px] text-[var(--text-muted)] italic">Keep practicing to reach 80%+</span>
              ) : (
                strongTopics.slice(0, 2).map((t) => (
                  <div key={t.topic} className="text-[11px] text-[var(--text-main)] truncate" title={t.topic}>
                    • <strong>{t.topic}</strong> ({t.accuracy}%)
                  </div>
                ))
              )}
            </div>

            {/* Needs Focus */}
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} /> Needs Support ({weakTopics.length + progressingTopics.length})
              </span>
              {(weakTopics.length === 0 && progressingTopics.length === 0) ? (
                <span className="text-[11px] text-[var(--text-muted)] italic">No weak topics detected!</span>
              ) : (
                [...weakTopics, ...progressingTopics].slice(0, 2).map((t) => (
                  <div key={t.topic} className="text-[11px] text-[var(--text-main)] truncate" title={t.topic}>
                    • <strong>{t.topic}</strong> ({t.accuracy}%)
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-[11.5px] text-[var(--text-muted)] mt-1 leading-4">
            Strongest: <strong className="text-emerald-500 font-bold">{strongestTopic.topic} ({strongestTopic.accuracy}%)</strong> · Priority Review: <strong className="text-red-500 font-bold">{weakestTopic.topic} ({weakestTopic.accuracy}%)</strong>
          </p>
        </div>
      </div>

      {/* Home Action Plan Banner */}
      <div className="flex items-start gap-3 p-3.5 bg-pink-500/5 border border-pink-500/15 rounded-xl">
        <MessageCircle size={16} className="text-[#EC4899] shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-pink-600 dark:text-pink-400">Home Study Recommendation for Parents</span>
          <p className="text-xs text-[var(--text-main)] leading-relaxed m-0 font-medium">{tips}</p>
        </div>
      </div>
    </div>
  );
};


