import React from 'react';

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
            <span className="ticker__item">🟢 Live Telemetry Stream Active. Awaiting student practice events...</span>
            <span className="ticker__item">💡 Tip: Teachers can define lessons and customize diagnostic questions manually.</span>
            <span className="ticker__item">🔑 Student logs will automatically push and sync to this console in real time.</span>
            <span className="ticker__item">🚀 Offline-resilient: Mobile app stores learning curves locally and flushes on connection.</span>
          </>
        ) : (
          displayEvents.map((evt, idx) => {
            const pct = Math.round((evt.score / evt.totalQuestions) * 100);
            const status = pct >= 80 ? '🔥' : pct >= 50 ? '📈' : '⚠️';
            return (
              <span key={evt.timestamp + idx} className="ticker__item">
                {status} Student <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{evt.studentId}</span> completed{' '}
                <span style={{ fontWeight: 700 }}>{evt.topic}</span> ({evt.subject}) with{' '}
                <span style={{ color: pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444', fontWeight: 800 }}>
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
