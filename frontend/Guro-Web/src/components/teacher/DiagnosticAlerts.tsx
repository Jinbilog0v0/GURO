import React, { useState } from 'react';
import { AlertCircle, Lightbulb, TrendingDown, BookOpen, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
    .filter((stat) => stat.average < 80);

  const hasAlerts = lowAverageTopics.length > 0;
  const [isOpen, setIsOpen] = useState(hasAlerts);

  return (
    <div className="glass-panel overflow-hidden w-full">
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 text-left border-b border-[var(--border-color)] cursor-pointer hover:bg-white/[0.02] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <TrendingDown size={18} className={hasAlerts ? 'text-[#A01322]' : 'text-[var(--text-muted)]'} aria-hidden="true" />
          <span className="text-[14.5px] font-bold text-[var(--text-main)]">Diagnostic Alerts &amp; Recommendations</span>
          {hasAlerts ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--danger-glow)] text-[var(--danger)] border border-[var(--danger)]/20">
              {lowAverageTopics.length} alert{lowAverageTopics.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--success-glow)] text-[var(--success)] border border-[var(--success)]/20">
              <CheckCircle size={10} /> All clear
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-[var(--text-muted)] shrink-0" /> : <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" />}
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-5 p-5">
          {/* Struggling Topics */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-[#A01322]" aria-hidden="true" />
              <h4 className="text-[13.5px] font-bold text-[var(--text-main)]">Struggling Topics (avg &lt; 80%)</h4>
            </div>
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[220px]">
              {lowAverageTopics.length === 0 ? (
                <div className="p-4 bg-[var(--success-glow)] border border-[var(--success)]/20 rounded-xl text-[#10B981] text-[13px] font-semibold flex items-center gap-1.5">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>No topic averages fall below mastery thresholds currently.</span>
                </div>
              ) : (
                lowAverageTopics.map((item) => {
                  const isCritical = item.average < 50;
                  return (
                    <div key={item.topic} className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                      <AlertCircle size={15} className={isCritical ? 'text-[#A01322] mt-0.5 shrink-0' : 'text-[#F59E0B] mt-0.5 shrink-0'} aria-hidden="true" />
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-bold text-[var(--text-main)]">
                            {item.topic} (Grade {item.grade} {item.subject})
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${isCritical ? 'bg-[#A01322]/15 text-[#A01322] border border-[#A01322]/30' : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'}`}>
                            {isCritical ? 'Critical (<50%)' : 'Borderline (50-79%)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                          Class average: <strong className="text-[#A01322] font-extrabold">{item.average}%</strong>. {isCritical ? 'Prerequisite lesson return recommended.' : 'Guided micro-practice boost recommended.'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#F59E0B]" aria-hidden="true" />
              <h4 className="text-[13.5px] font-bold text-[var(--text-main)]">AI Curriculum Recommendations</h4>
            </div>
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[220px]">
              {lowAverageTopics.length === 0 ? (
                <div className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                  <BookOpen size={15} className="text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-[var(--text-main)]">Keep building standard lessons!</span>
                    <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                      Everything looks stable. Consider creating a Grade 5 Decimals or Fractions lesson to extend the curriculum bank.
                    </p>
                  </div>
                </div>
              ) : (
                lowAverageTopics.map((item) => {
                  const isCritical = item.average < 50;
                  return (
                    <div key={item.topic} className="flex gap-2.5 p-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                      <Lightbulb size={15} className="text-[#F59E0B] mt-0.5 shrink-0" aria-hidden="true" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-bold text-[var(--text-main)]">Targeted Boost: {item.topic}</span>
                        <p className="text-[11px] text-[var(--text-muted)] leading-[15px]">
                          {isCritical
                            ? <>Go to <strong>Lesson Ingestor</strong> → Grade <strong>{item.grade}</strong> → <strong>{item.subject}</strong> → parse a prerequisite fallback module for <em>"{item.topic}"</em> with foundational step-by-step guidance.</>
                            : <>Go to <strong>Lesson Ingestor</strong> → Grade <strong>{item.grade}</strong> → <strong>{item.subject}</strong> → parse an extension lesson for <em>"{item.topic}"</em> with simplified Q&amp;A.</>}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
