import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

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
  const getParentTips = (): string => {
    if (weakestTopic.name === 'N/A') {
      return 'Tip: Your child has not completed any topics yet. Ask them to pick a lesson to begin!';
    }

    if (weakestTopic.average >= 85) {
      return `Tip: Exceptional work! Your child is mastering all topics, including ${weakestTopic.name}. Ask them to "teach" you the topic to deepen their memory.`;
    }

    // Custom curriculum-based tips
    if (weakestTopic.name.toLowerCase().includes('fraction')) {
      return 'Tip: Help your child visualize fractions by cutting pizza, fruit, or bread into equal parts and naming them (e.g. "this is 1/4").';
    }

    if (weakestTopic.name.toLowerCase().includes('simile') || weakestTopic.name.toLowerCase().includes('figurative')) {
      return 'Tip: Read stories together and point out similes. Ask them to complete comparison prompts like: "as quick as a...".';
    }

    return `Tip: Review the practice explanation cards with your child for "${weakestTopic.name}" and attempt the quiz again together.`;
  };

  const tips = getParentTips();

  return (
    <div className="glass-panel p-6 flex flex-col gap-5 w-full">
      <div className="flex items-center gap-2.5">
        <Sparkles size={20} className="text-[#EC4899]" />
        <h3 className="text-base font-bold text-[var(--text-main)]">AI Study Feedback</h3>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-[var(--text-main)] leading-5">
          Your child shows solid progress! Their strongest performance is in{' '}
          <strong className="text-[#10B981] font-bold">{strongestTopic.name} ({strongestTopic.average}%)</strong>.
          We recommend focusing practice sessions on <strong>{weakestTopic.name}</strong>, where they currently average{' '}
          <strong className="text-red-500 font-bold">{weakestTopic.average}%</strong>.
        </p>
        <div className="flex gap-2 p-3 bg-pink-500/5 border border-pink-500/15 rounded-xl">
          <MessageCircle size={14} className="text-[#EC4899] mt-0.5" />
          <p className="text-xs text-pink-600 dark:text-pink-300 leading-[18px] font-medium">{tips}</p>
        </div>
      </div>
    </div>
  );
};


