import React from 'react';
import { AlertCircle, Lightbulb, TrendingDown, BookOpen, CheckCircle } from 'lucide-react';

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

interface DiagnosticAlertsProps {
  progressLogs: SyncedEvent[];
}

export const DiagnosticAlerts: React.FC<DiagnosticAlertsProps> = ({ progressLogs }) => {


  // 2. Identify topics where overall average accuracy is low (< 65%)
  const topicStats: { [topic: string]: { sum: number; count: number; subject: string; grade: number } } = {};
  progressLogs.forEach((log) => {
    const pct = (log.score / log.totalQuestions) * 100;
    if (!topicStats[log.topic]) {
      topicStats[log.topic] = { sum: 0, count: 0, subject: log.subject, grade: log.gradeLevel };
    }
    topicStats[log.topic].sum += pct;
    topicStats[log.topic].count += 1;
  });

  const lowAverageTopics = Object.keys(topicStats)
    .map((topic) => ({
      topic,
      average: Math.round(topicStats[topic].sum / topicStats[topic].count),
      subject: topicStats[topic].subject,
      grade: topicStats[topic].grade,
    }))
    .filter((stat) => stat.average < 65);

  return (
    <div className="grid grid-cols-2 gap-5 w-full">
      {/* Commonly Struggling Topics */}
      <div className="glass-panel p-6 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2.5">
          <TrendingDown size={20} className="text-[#A01322]" />
          <h3 className="text-[15px] font-bold text-[var(--text-main)]">Struggling Topics (Class Average &lt; 65%)</h3>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px]">
          {lowAverageTopics.length === 0 ? (
            <div className="p-4 text-[#10B981] text-[13px] font-semibold flex items-center gap-1.5">
              <CheckCircle size={16} className="text-[#10B981] shrink-0" />
              <span>No topic averages fall below mastery thresholds currently.</span>
            </div>
          ) : (
            lowAverageTopics.map((item) => (
              <div key={item.topic} className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                <AlertCircle size={16} className="text-[#A01322] mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-[var(--text-main)]">
                    {item.topic} (Grade {item.grade} {item.subject})
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                    The class has an average accuracy of only{' '}
                    <strong className="text-[#A01322] font-extrabold">{item.average}%</strong> on this topic.
                    Remediation exercises are recommended.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Lesson Recommendations */}
      <div className="glass-panel p-6 flex flex-col gap-4 h-full">
        <div className="flex items-center gap-2.5">
          <Lightbulb size={20} className="text-[#F59E0B]" />
          <h3 className="text-[15px] font-bold text-[var(--text-main)]">AI Curriculum Recommendations</h3>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px]">
          {lowAverageTopics.length === 0 ? (
            <div className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
              <BookOpen size={16} className="text-[#10B981]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-[var(--text-main)]">Keep building standard lessons!</span>
                <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                  Everything looks stable. Consider creating a new Grade 5 Decimals or Fractions lesson to extend the curriculum bank.
                </p>
              </div>
            </div>
          ) : (
            lowAverageTopics.map((item) => (
              <div key={item.topic} className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                <Lightbulb size={16} className="text-[#F59E0B] mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-[var(--text-main)]">Targeted Lesson Boost: {item.topic}</span>
                  <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                    Go to the <strong>Lesson Ingestor</strong> tab, set Grade to <strong>{item.grade}</strong>, Subject to <strong>{item.subject}</strong>, and parse an extension lesson about <em>"{item.topic}"</em> with more simplified questions and detailed step-by-step explanations.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


