import React from 'react';
import { Radio, Lightbulb, Key, Rocket, Flame, TrendingUp, AlertTriangle } from 'lucide-react';

interface TickerEvent {
  studentId: string;
  subject: string;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

interface LiveActivityTickerProps {
  events: TickerEvent[];
}

export const LiveActivityTicker: React.FC<LiveActivityTickerProps> = ({ events }) => {
  // Take last 5 events
  const displayEvents = events.slice(0, 5);

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {displayEvents.length === 0 ? (
          <>
            <span className="ticker__item inline-flex items-center gap-1.5">
              <Radio className="size-3.5 text-emerald-500 animate-pulse" /> Live Telemetry Stream Active. Awaiting student practice events...
            </span>
            <span className="ticker__item inline-flex items-center gap-1.5">
              <Lightbulb className="size-3.5 text-amber-500" /> Tip: Teachers can define lessons and customize diagnostic questions manually.
            </span>
            <span className="ticker__item inline-flex items-center gap-1.5">
              <Key className="size-3.5 text-blue-500" /> Student logs will automatically push and sync to this console in real time.
            </span>
            <span className="ticker__item inline-flex items-center gap-1.5">
              <Rocket className="size-3.5 text-purple-500 animate-bounce" /> Offline-resilient: Mobile app stores learning curves locally and flushes on connection.
            </span>
          </>
        ) : (
          displayEvents.map((evt, idx) => {
            const pct = Math.round((evt.score / evt.totalQuestions) * 100);
            return (
              <span key={evt.timestamp + idx} className="ticker__item inline-flex items-center gap-1.5">
                {pct >= 80 ? (
                  <Flame className="size-3.5 text-[#A01322]" />
                ) : pct >= 50 ? (
                  <TrendingUp className="size-3.5 text-amber-500" />
                ) : (
                  <AlertTriangle className="size-3.5 text-orange-500" />
                )}{' '}
                Student <span style={{ color: 'var(--accent-primary-text)', fontWeight: 700 }}>{evt.studentId}</span> completed{' '}
                <span style={{ fontWeight: 700 }}>{evt.topic}</span> ({evt.subject}) with{' '}
                <span style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#A01322', fontWeight: 800 }}>
                  {pct}% Accuracy
                </span> ({evt.score}/{evt.totalQuestions}){' '}
                • {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};
