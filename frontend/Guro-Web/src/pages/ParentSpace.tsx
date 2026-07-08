import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { List } from 'react-window';
import { Search, AlertCircle, Inbox, BarChart3, Calculator, BookOpen, User, Star, TrendingUp, AlertTriangle, Calendar, Trash2 } from 'lucide-react';
import { ActivityHeatmap } from '../components/parent/ActivityHeatmap';
import { TutorReport } from '../components/parent/TutorReport';
import { BadgeCase } from '../components/parent/BadgeCase';

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
        className={`relative flex gap-4 rounded-[8px] p-[6px] transition-all duration-500 ease-in-out h-[100px] box-border ${pulseClass}`}
      >
        {/* Timeline dot connector line */}
        {!isLast && (
          <div
            className="absolute left-[-16px] w-[2px] bg-[var(--border-color)]"
            style={{
              bottom: 0,
              top: '24px',
              height: 'calc(100% + 20px)' // Extends down to next item
            }}
          />
        )}
        
        {/* Bullet icon */}
        <div 
          className={`absolute left-[-22px] top-[4px] w-3.5 h-3.5 rounded-[7px] border-2 z-10 ${
            percentage >= 80 
              ? 'bg-emerald-950 border-emerald-500' 
              : percentage >= 50 
                ? 'bg-amber-950 border-amber-500' 
                 : 'bg-red-950 border-red-500'
          }`} 
        />

        <div className="flex-1 bg-[var(--bg-main)]/40 border border-[var(--border-color)] rounded-[12px] flex flex-col justify-center h-full box-border px-4 py-3">
          <div className="flex justify-between items-center mb-1.5">
            <h4 className="text-sm font-extrabold text-[var(--text-main)]">
             {log.subject === 'Mathematics' ? (
                <Calculator className="size-4 text-[var(--accent-primary)]" />
             ) : (
              <BookOpen className="size-4 text-emerald-500" />
            )}{' '}{log.topic}
            </h4>
            <span className={
              percentage >= 80 
                ? "px-2 py-0.75 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                : percentage >= 50 
                  ? "px-2 py-0.75 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                  : "px-2 py-0.75 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20"
            }>
              Score: {log.score} / {log.totalQuestions} ({percentage}%)
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Grade {log.gradeLevel} {log.subject} • Synced on {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export function ParentSpace({ lastUpdatedCell }: ParentSpaceProps) {
  const [studentIdInput, setStudentIdInput] = useState(() => {
    return localStorage.getItem('guro_parent_student_id') ?? '';
  });
  const [accessCodeInput, setAccessCodeInput] = useState(() => {
    return localStorage.getItem('guro_parent_access_code') ?? '';
  });
  const [studentLogs, setStudentLogs] = useState<SyncedEvent[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searched, setSearched] = useState(() => {
    return localStorage.getItem('guro_parent_searched') === 'true';
  });
  const [loading, setLoading] = useState(false);

  // Load initial logs on mount if already searched
  useEffect(() => {
    if (searched && studentIdInput.trim() && accessCodeInput.trim()) {
      const fetchLogsOnMount = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(studentIdInput.trim())}&accessCode=${encodeURIComponent(accessCodeInput.trim())}`);
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
      fetchLogsOnMount();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('guro_parent_student_id', studentIdInput);
  }, [studentIdInput]);

  useEffect(() => {
    localStorage.setItem('guro_parent_access_code', accessCodeInput);
  }, [accessCodeInput]);

  useEffect(() => {
    localStorage.setItem('guro_parent_searched', String(searched));
  }, [searched]);

  const handleClear = () => {
    setStudentIdInput('');
    setAccessCodeInput('');
    setStudentLogs([]);
    setSearched(false);
    setErrorMsg(null);
    localStorage.removeItem('guro_parent_student_id');
    localStorage.removeItem('guro_parent_access_code');
    localStorage.removeItem('guro_parent_searched');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim() || !accessCodeInput.trim()) return;

    setLoading(true);
    setSearched(true);
    setErrorMsg(null);
    
    try {
      const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(studentIdInput.trim())}&accessCode=${encodeURIComponent(accessCodeInput.trim())}`);
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
    <div className="fade-in flex flex-col gap-6 w-full">
      <div className="mb-2">
        <h2 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User className="size-6 text-pink-500" /> Parent Progress Explorer
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Enter your child's unique mobile identifier and 6-digit access code to view practice results and telemetry synced from their device.
        </p>
      </div>

      {/* Search Input Card */}
      <form onSubmit={handleSearch} className="glass-panel px-6 py-5">
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary px-6 cursor-pointer" style={{ height: '42px' }}>
              <span className="flex items-center justify-center gap-1.5"><Search className="size-4" /> Search Reports</span>
            </button>
            {(studentIdInput || accessCodeInput) && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear Search"
                className="px-3 border border-[var(--border-color)] text-[var(--text-muted)] rounded-[10px] cursor-pointer transition-all duration-200 hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] hover:border-[var(--danger)]/20 active:scale-[0.97] flex items-center justify-center"
                style={{ height: '42px' }}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>
        {errorMsg && (
          <div style={{ marginTop: '12px', color: 'var(--danger)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle className="size-4" /> {errorMsg}
          </div>
        )}
      </form>

      {loading ? (
        <div className="text-center px-10 py-15 flex flex-col items-center gap-3">
          <div className="spinner"></div>
          <p className="text-[var(--accent-primary)] font-semibold text-sm">Retrieving learning curves...</p>
        </div>
      ) : searched ? (
        studentLogs.length === 0 ? (
          <div className="glass-panel text-center px-10 py-15 flex flex-col items-center gap-3">
            <Inbox className="size-12 text-slate-500 opacity-40" />
            <p className="text-[15px] font-bold text-[var(--text-main)]">
              No reports registered for device ID <strong>"{studentIdInput}"</strong>.
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-[450px] leading-[18px]">
              Ensure your child has submitted quiz results in their mobile app and that you have clicked "Sync Progress Now" in the mobile Parent Space.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 fade-in">
            {/* Stats Dashboard cards */}
            <div className="grid grid-cols-3 gap-5">
              <div className="glass-panel p-5 flex flex-col gap-1.5 items-center">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px]">Completed Quests</span>
                <span className="font-['Space_Grotesk',sans-serif] text-[26px] font-bold text-[var(--text-main)]">{totalQuizzes}</span>
              </div>
              <div className="glass-panel p-5 flex flex-col gap-1.5 items-center">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px]">Average Accuracy</span>
                <span className="font-['Space_Grotesk',sans-serif] text-[26px] font-bold text-[#10B981]">{avgScore}%</span>
              </div>
              <div className="glass-panel p-5 flex flex-col gap-1.5 items-center">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.5px]">Learning Status</span>
                <span className="font-['Space_Grotesk',sans-serif] font-bold flex items-center justify-center gap-1.5" style={{ color: avgScore >= 80 ? '#10B981' : (avgScore >= 50 ? '#F59E0B' : '#EF4444'), fontFamily: 'sans-serif', fontSize: 22 }}>
                  <span>{avgScore >= 80 ? 'Advanced' : avgScore >= 50 ? 'Progressing' : 'Remedial'}</span>
                  {avgScore >= 80 ? (
                    <Star size={18} className="text-[#10B981] fill-[#10B981] shrink-0" />
                  ) : avgScore >= 50 ? (
                    <TrendingUp size={18} className="text-[#F59E0B] shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  )}
                </span>
              </div>
            </div>

            {/* AI Report Card block */}
            <TutorReport logs={studentLogs} />

            {/* Split layout block: Tracker columns on left, Timeline logs on right */}
            <div className="grid grid-cols-2 gap-6 items-start">
              <div className="flex flex-col gap-6">
                <ActivityHeatmap logs={studentLogs} />
                <BadgeCase logs={studentLogs} />
              </div>
              
              <div className="flex flex-col">
                {/* Performance Timeline feed */}
                <div className="glass-panel p-6">
                  <h3 className="text-base mb-5 flex items-center gap-2">
                    <Calendar size={18} className="text-[var(--accent-primary)] shrink-0" />
                    <span>Practice Timeline History</span>
                  </h3>
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
        <div className="glass-panel text-center px-10 py-15 flex flex-col items-center gap-3">
          <BarChart3 className="size-12 text-[var(--accent-primary)] opacity-60" />
          <p className="text-[15px] font-bold text-[var(--text-main)]">Enter a Student ID and Access Code to query performance history</p>
          <p className="text-xs text-[var(--text-muted)] max-w-[450px] leading-[18px]">
            You can find the Student ID and the 6-Digit Parent Access Code on the home dashboard settings modal of the child's mobile app.
          </p>
        </div>
      )}
    </div>
  );
}
