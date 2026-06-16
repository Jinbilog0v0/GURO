import React from 'react';
import { AlertCircle, Lightbulb, TrendingDown, BookOpen } from 'lucide-react';
import { styles } from '../../styles/diagnosticAlertsStyles';

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
    <div style={styles.container}>
      {/* Commonly Struggling Topics */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.cardHeader}>
          <TrendingDown size={20} style={{ color: '#EF4444' }} />
          <h3 style={styles.title}>Struggling Topics (Class Average &lt; 65%)</h3>
        </div>
        <div style={styles.list}>
          {lowAverageTopics.length === 0 ? (
            <div style={styles.empty}>
              <p>🟢 No topic averages fall below mastery thresholds currently.</p>
            </div>
          ) : (
            lowAverageTopics.map((item) => (
              <div key={item.topic} style={styles.alertItem}>
                <AlertCircle size={16} style={{ color: '#EF4444', marginTop: '2px' }} />
                <div style={styles.alertText}>
                  <span style={styles.alertTitle}>
                    {item.topic} (Grade {item.grade} {item.subject})
                  </span>
                  <p style={styles.alertDesc}>
                    The class has an average accuracy of only{' '}
                    <strong style={{ color: '#EF4444' }}>{item.average}%</strong> on this topic.
                    Remediation exercises are recommended.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Lesson Recommendations */}
      <div className="glass-panel" style={styles.card}>
        <div style={styles.cardHeader}>
          <Lightbulb size={20} style={{ color: '#F59E0B' }} />
          <h3 style={styles.title}>AI Curriculum Recommendations</h3>
        </div>
        <div style={styles.list}>
          {lowAverageTopics.length === 0 ? (
            <div style={styles.alertItem}>
              <BookOpen size={16} style={{ color: '#10B981' }} />
              <div style={styles.alertText}>
                <span style={styles.alertTitle}>Keep building standard lessons!</span>
                <p style={styles.alertDesc}>
                  Everything looks stable. Consider creating a new Grade 5 Decimals or Fractions lesson to extend the curriculum bank.
                </p>
              </div>
            </div>
          ) : (
            lowAverageTopics.map((item) => (
              <div key={item.topic} style={styles.alertItem}>
                <Lightbulb size={16} style={{ color: '#F59E0B', marginTop: '2px' }} />
                <div style={styles.alertText}>
                  <span style={styles.alertTitle}>Targeted Lesson Boost: {item.topic}</span>
                  <p style={styles.alertDesc}>
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


