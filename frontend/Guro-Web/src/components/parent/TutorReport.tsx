import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';
import { styles } from '../../styles/tutorReportStyles';

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

interface TutorReportProps {
  logs: SyncedEvent[];
}

export const TutorReport: React.FC<TutorReportProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  // Calculate subject stats
  const subjectAverages: { [subject: string]: { sum: number; count: number } } = {};
  logs.forEach((log) => {
    const pct = (log.score / log.totalQuestions) * 100;
    if (!subjectAverages[log.subject]) {
      subjectAverages[log.subject] = { sum: 0, count: 0 };
    }
    subjectAverages[log.subject].sum += pct;
    subjectAverages[log.subject].count += 1;
  });



  // Strongest vs struggling topics
  const topicAverages: { [topic: string]: { sum: number; count: number } } = {};
  logs.forEach((log) => {
    const pct = (log.score / log.totalQuestions) * 100;
    if (!topicAverages[log.topic]) {
      topicAverages[log.topic] = { sum: 0, count: 0 };
    }
    topicAverages[log.topic].sum += pct;
    topicAverages[log.topic].count += 1;
  });

  const sortedTopics = Object.keys(topicAverages).map((top) => ({
    name: top,
    average: Math.round(topicAverages[top].sum / topicAverages[top].count),
  })).sort((a, b) => b.average - a.average);

  const strongestTopic = sortedTopics[0] || { name: 'N/A', average: 0 };
  const weakestTopic = sortedTopics[sortedTopics.length - 1] || { name: 'N/A', average: 0 };

  // Generate recommendations
  const getParentTips = () => {
    if (weakestTopic.name === 'N/A') {
      return {
        en: 'Your child has not completed any topics yet. Ask them to pick a lesson to begin!',
        fil: 'Wala pang natapos na aralin ang iyong anak. Hikayatin silang pumili ng aralin para magsimula!',
      };
    }

    if (weakestTopic.average >= 85) {
      return {
        en: `Exceptional work! Your child is mastering all topics, including ${weakestTopic.name}. Ask them to "teach" you the topic to deepen their memory.`,
        fil: `Napakahusay! Nakuha ng iyong anak ang lahat ng paksa, kabilang ang ${weakestTopic.name}. Hayaan silang "turuan" ka tungkol dito para lalong tumibay ang kanilang kaalaman.`,
      };
    }

    // Custom curriculum-based tips
    if (weakestTopic.name.toLowerCase().includes('fraction')) {
      return {
        en: 'Tip: Help your child visualize fractions by cutting pizza, fruit, or bread into equal parts and naming them (e.g. "this is 1/4").',
        fil: 'Payo: Tulungan silang maunawaan ang fraction sa pamamagitan ng paghahati ng pagkain (tulad ng tinapay o prutas) sa pantay na bahagi.',
      };
    }

    if (weakestTopic.name.toLowerCase().includes('simile') || weakestTopic.name.toLowerCase().includes('figurative')) {
      return {
        en: 'Tip: Read stories together and point out similes. Ask them to complete comparison prompts like: "as quick as a...".',
        fil: 'Payo: Magbasa ng kuwento nang sabay at hanapin ang simile (pagtutulad). Tanungin sila ng mga pariralang tulad ng: "mabilis pa sa...".',
      };
    }

    return {
      en: `Tip: Review the practice explanation cards with your child for "${weakestTopic.name}" and attempt the quiz again together.`,
      fil: `Payo: Sabay na basahin ang mga paliwanag sa araling "${weakestTopic.name}" at subukang sagutan muli ang quiz nang magkasama.`,
    };
  };

  const tips = getParentTips();

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.header}>
        <Sparkles size={20} style={{ color: '#EC4899' }} />
        <h3 style={styles.title}>Bilingual AI Study Feedback</h3>
      </div>

      <div style={styles.content}>
        {/* English Section */}
        <div style={styles.langBlock}>
          <div style={styles.langHeader}>
            <span style={styles.flag}>🇺🇸</span>
            <span style={styles.langName}>English Report</span>
          </div>
          <p style={styles.reportText}>
            Your child shows solid progress! Their strongest performance is in{' '}
            <strong style={{ color: '#10B981' }}>{strongestTopic.name} ({strongestTopic.average}%)</strong>.
            We recommend focusing practice sessions on <strong>{weakestTopic.name}</strong>, where they currently average{' '}
            <strong style={{ color: '#EF4444' }}>{weakestTopic.average}%</strong>.
          </p>
          <div style={styles.tipBox}>
            <MessageCircle size={14} style={{ color: '#EC4899', marginTop: '2px' }} />
            <p style={styles.tipText}>{tips.en}</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Filipino Section */}
        <div style={styles.langBlock}>
          <div style={styles.langHeader}>
            <span style={styles.flag}>🇵🇭</span>
            <span style={styles.langName}>Filipino Report</span>
          </div>
          <p style={styles.reportText}>
            Maganda ang pag-unlad ng iyong anak! Pinakamahusay sila sa paksang{' '}
            <strong style={{ color: '#10B981' }}>{strongestTopic.name} ({strongestTopic.average}%)</strong>.
            Inirerekomenda naming pagtuunan ng pansin ang <strong>{weakestTopic.name}</strong>, kung saan mayroon silang average na{' '}
            <strong style={{ color: '#EF4444' }}>{weakestTopic.average}%</strong>.
          </p>
          <div style={styles.tipBox}>
            <MessageCircle size={14} style={{ color: '#EC4899', marginTop: '2px' }} />
            <p style={styles.tipText}>{tips.fil}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


