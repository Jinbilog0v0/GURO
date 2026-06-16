import React, { useState } from 'react';
import { List } from 'react-window';
import { ActivityHeatmap } from '../components/parent/ActivityHeatmap';
import { TutorReport } from '../components/parent/TutorReport';
import { BadgeCase } from '../components/parent/BadgeCase';
import { styles } from '../styles/parentSpaceStyles';

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

interface ParentSpaceProps {
  progressLogs?: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
}

const RowRenderer = ({
  index,
  style,
  studentLogs,
  lastUpdatedCell
}: {
  index: number;
  style: React.CSSProperties;
  studentLogs: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
}) => {
  const log = studentLogs[index];
  if (!log) return null;
  const percentage = Math.round((log.score / log.totalQuestions) * 100);
  const isLast = index === studentLogs.length - 1;
  const isRecentlyUpdated =
    lastUpdatedCell &&
    lastUpdatedCell.studentId.toLowerCase() === log.studentId.toLowerCase() &&
    lastUpdatedCell.topic === log.topic &&
    Date.now() - lastUpdatedCell.timestamp < 5000;

  let pulseClass = '';
  if (isRecentlyUpdated) {
    pulseClass = percentage >= 80 ? 'flash-green' : percentage >= 50 ? 'flash-yellow' : 'flash-red';
  }

  return (
    <div
      style={{
        ...style,
        paddingLeft: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        className={pulseClass}
        style={{
          ...styles.timelineItem,
          borderRadius: '8px',
          padding: '6px',
          transition: 'all 0.5s ease',
          height: '100px',
          boxSizing: 'border-box'
        }}
      >
        {/* Timeline dot connector line */}
        {!isLast && (
          <div
            style={{
              ...styles.timelineLine,
              bottom: 0,
              top: '24px',
              height: 'calc(100% + 20px)' // Extends down to next item
            }}
          />
        )}
        
        {/* Bullet icon */}
        <div style={{
          ...styles.timelineDot,
          ...(percentage >= 80 ? styles.dotGreen : percentage >= 50 ? styles.dotYellow : styles.dotRed)
        }} />

        <div style={{ ...styles.timelineContent, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', boxSizing: 'border-box', padding: '12px 16px' }}>
          <div style={styles.timelineHeader}>
            <h4 style={styles.topicName}>
              {log.subject === 'Mathematics' ? '🧮' : '📚'} {log.topic}
            </h4>
            <span style={percentage >= 80 ? styles.badgeSuccess : percentage >= 50 ? styles.badgeWarning : styles.badgeDanger}>
              Score: {log.score} / {log.totalQuestions} ({percentage}%)
            </span>
          </div>
          <p style={styles.logMeta}>
            Grade {log.gradeLevel} {log.subject} • Synced on {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export function ParentSpace({ lastUpdatedCell }: ParentSpaceProps) {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [studentLogs, setStudentLogs] = useState<SyncedEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !accessCodeInput.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg(null);
    
    try {
      const response = await fetch(`/api/progress?studentId=${encodeURIComponent(studentIdInput.trim())}&accessCode=${encodeURIComponent(accessCodeInput.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setStudentLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to retrieve logs. Please verify the credentials.');
        setStudentLogs([]);
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
      setStudentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Math calculations
  const totalQuizzes = studentLogs.length;
  const getAverageScore = () => {
    if (totalQuizzes === 0) return 0;
    const sum = studentLogs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    return Math.round(sum / totalQuizzes);
  };

  const avgScore = getAverageScore();

  return (
    <div className="fade-in" style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ color: 'var(--text-main)' }}>👪 Parent Progress Explorer</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Enter your child's unique mobile identifier and 6-digit access code to view practice results and telemetry synced from their device.
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="glass-panel" style={styles.searchCard}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Child's Device or Student ID
            </label>
            <input
              type="text"
              placeholder="e.g. GURO-STUDENT-LOCAL"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              6-Digit Parent Access Code
            </label>
            <input
              type="text"
              placeholder="e.g. 123456"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
              maxLength={6}
              required
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <button type="submit" className="btn btn-primary" style={{ ...styles.searchBtn, width: '100%', height: '42px' }}>
              🔍 Search Reports
            </button>
          </div>
        </div>
        {errorMsg && (
          <div style={{ marginTop: '12px', color: '#EF4444', fontSize: '13px', fontWeight: 600 }}>
            ❌ {errorMsg}
          </div>
        )}
      </form>

      {loading ? (
        <div style={styles.centered}>
          <div className="spinner"></div>
          <p style={styles.loadingText}>Retrieving learning curves...</p>
        </div>
      ) : searched ? (
        studentLogs.length === 0 ? (
          <div className="glass-panel" style={styles.centered}>
            <TextEmoji>☁️</TextEmoji>
            <p style={styles.emptyText}>
              No reports registered for device ID <strong>"{studentIdInput}"</strong>.
            </p>
            <p style={styles.emptySubText}>
              Ensure your child has submitted quiz results in their mobile app and that you have clicked "Sync Progress Now" in the mobile Parent Space.
            </p>
          </div>
        ) : (
          <div style={styles.resultsContainer} className="fade-in">
            {/* Stats Dashboard cards */}
            <div style={styles.statsRow}>
              <div className="glass-panel" style={styles.statBox}>
                <span style={styles.statLbl}>Completed Quests</span>
                <span style={styles.statVal}>{totalQuizzes}</span>
              </div>
              <div className="glass-panel" style={styles.statBox}>
                <span style={styles.statLbl}>Average Accuracy</span>
                <span style={{ ...styles.statVal, color: '#10B981' }}>{avgScore}%</span>
              </div>
              <div className="glass-panel" style={styles.statBox}>
                <span style={styles.statLbl}>Learning Status</span>
                <span style={{ ...styles.statVal, color: avgScore >= 80 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444', fontFamily: 'sans-serif', fontSize: 22 }}>
                  {avgScore >= 80 ? '⭐ Advanced' : avgScore >= 50 ? '📈 Progressing' : '⚠️ Remedial'}
                </span>
              </div>
            </div>

            {/* AI Report Card block */}
            <TutorReport logs={studentLogs} />

            {/* Split layout block: Tracker columns on left, Timeline logs on right */}
            <div style={styles.splitLayout}>
              <div style={styles.leftCol}>
                <ActivityHeatmap logs={studentLogs} />
                <BadgeCase logs={studentLogs} />
              </div>
              
              <div style={styles.rightCol}>
                {/* Performance Timeline feed */}
                <div className="glass-panel" style={styles.feedCard}>
                  <h3 style={styles.cardTitle}>📅 Practice Timeline History</h3>
                    <List<{ studentLogs: SyncedEvent[]; lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null }>
                      style={{ overflowX: 'hidden', height: 500, width: '100%' }}
                      rowCount={studentLogs.length}
                      rowHeight={115}
                      rowComponent={RowRenderer}
                      rowProps={{ studentLogs, lastUpdatedCell }}
                    />
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Prompt to search */
        <div className="glass-panel" style={styles.centered}>
          <TextEmoji>📊</TextEmoji>
          <p style={styles.emptyText}>Enter a Student ID and Access Code to query performance history</p>
          <p style={styles.emptySubText}>
            You can find the Student ID and the 6-Digit Parent Access Code on the home dashboard settings modal of the child's mobile app.
          </p>
        </div>
      )}
    </div>
  );
}

function TextEmoji({ children }: { children: React.ReactNode }) {
  return <span style={styles.emojiIcon}>{children}</span>;
}
