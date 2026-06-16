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
    <div className="glass-panel p-6 flex flex-col gap-5 w-full">
      <div className="flex items-center gap-2.5">
        <Sparkles size={20} className="text-[#EC4899]" />
        <h3 className="text-base font-bold text-[#F8FAFC]">Bilingual AI Study Feedback</h3>
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] gap-6 items-start">
        {/* English Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🇺🇸</span>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.5px]">English Report</span>
          </div>
          <p className="text-[13px] text-[#EEF2F6] leading-5">
            Your child shows solid progress! Their strongest performance is in{' '}
            <strong className="text-[#10B981] font-bold">{strongestTopic.name} ({strongestTopic.average}%)</strong>.
            We recommend focusing practice sessions on <strong>{weakestTopic.name}</strong>, where they currently average{' '}
            <strong className="text-[#EF4444] font-bold">{weakestTopic.average}%</strong>.
          </p>
          <div className="flex gap-2 p-3 bg-pink-500/5 border border-pink-500/15 rounded-xl">
            <MessageCircle size={14} className="text-[#EC4899] mt-0.5" />
            <p className="text-xs text-[#F9A8D4] leading-[18px] font-medium">{tips.en}</p>
          </div>
        </div>

        <div className="bg-white/[0.06] h-full w-full" />

        {/* Filipino Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🇵🇭</span>
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Filipino Report</span>
          </div>
          <p className="text-[13px] text-[#EEF2F6] leading-5">
            Maganda ang pag-unlad ng iyong anak! Pinakamahusay sila sa paksang{' '}
            <strong className="text-[#10B981] font-bold">{strongestTopic.name} ({strongestTopic.average}%)</strong>.
            Inirerekomenda naming pagtuunan ng pansin ang <strong>{weakestTopic.name}</strong>, kung saan mayroon silang average na{' '}
            <strong className="text-[#EF4444] font-bold">{weakestTopic.average}%</strong>.
          </p>
          <div className="flex gap-2 p-3 bg-pink-500/5 border border-pink-500/15 rounded-xl">
            <MessageCircle size={14} className="text-[#EC4899] mt-0.5" />
            <p className="text-xs text-[#F9A8D4] leading-[18px] font-medium">{tips.fil}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


