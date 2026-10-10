import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Search, AlertCircle, Trash2, User, Users, BarChart3, Inbox } from 'lucide-react';
import { ParentOverview } from '../components/parent/ParentOverview';
import { ParentActivityBadges } from '../components/parent/ParentActivityBadges';
import { ParentTimeline } from '../components/parent/ParentTimeline';
import { ParentStudentRegistration } from '../components/parent/ParentStudentRegistration';
import type { SyncedEvent } from '../components/parent/ParentOverview';
import type { LinkedStudentProfile } from '../components/parent/ParentStudentRegistration';

export interface ParentSpaceProps {
  progressLogs?: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
  activeSubTab?: string;
  setActiveSubTab?: (tab: any) => void;
}

export function ParentSpace({
  lastUpdatedCell,
  activeSubTab = 'parent-explorer',
  setActiveSubTab
}: ParentSpaceProps) {
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
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Linked children list from localStorage for quick child switcher
  const [linkedChildren, setLinkedChildren] = useState<LinkedStudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('guro_parent_linked_children');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('guro_parent_linked_children');
      if (saved) setLinkedChildren(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [activeSubTab]);

  useEffect(() => {
    if (!lastUpdatedCell) return;
    setCurrentTime(Date.now());
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastUpdatedCell]);

  // Load initial logs on mount if already searched
  useEffect(() => {
    let isMounted = true;
    if (searched && studentIdInput.trim() && accessCodeInput.trim()) {
      const fetchLogsOnMount = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(studentIdInput.trim())}&accessCode=${encodeURIComponent(accessCodeInput.trim())}`);
          if (response.ok) {
            const data = await response.json();
            if (isMounted) setStudentLogs(data);
          } else {
            const errData = await response.json().catch(() => ({}));
            if (isMounted) {
              setErrorMsg(errData.error || 'Failed to retrieve logs. Please verify the credentials.');
              setStudentLogs([]);
            }
          }
        } catch (err) {
          console.error('[ParentSpace] Fetch logs error:', err);
          if (isMounted) {
            setErrorMsg('A network error occurred. Please try again.');
            setStudentLogs([]);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchLogsOnMount();
    }
    return () => {
      isMounted = false;
    };
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

  const handleSearch = async (e?: React.FormEvent, customId?: string, customCode?: string) => {
    if (e) e.preventDefault();
    const idToUse = (customId ?? studentIdInput).trim();
    const codeToUse = (customCode ?? accessCodeInput).trim();
    if (!idToUse || !codeToUse) return;

    if (customId) setStudentIdInput(customId);
    if (customCode) setAccessCodeInput(customCode);

    setLoading(true);
    setSearched(true);
    setErrorMsg(null);

    try {
      const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(idToUse)}&accessCode=${encodeURIComponent(codeToUse)}`);
      if (response.ok) {
        const data = await response.json();
        setStudentLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to retrieve logs. Please verify the credentials.');
        setStudentLogs([]);
      }
    } catch (err) {
      console.error('[ParentSpace] Search logs error:', err);
      setErrorMsg('A network error occurred. Please try again.');
      setStudentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChildFromLinked = (childId: string, childCode: string) => {
    handleSearch(undefined, childId, childCode);
    if (activeSubTab === 'create-student' || activeSubTab === 'parent-create-student' || activeSubTab === 'parent-students') {
      setActiveSubTab?.('parent-overview');
    }
  };

  // Render registration view if on student registration sub-tab
  if (activeSubTab === 'create-student' || activeSubTab === 'parent-create-student' || activeSubTab === 'parent-students') {
    return (
      <ParentStudentRegistration
        onSelectStudentForExplorer={(sId, aCode) => {
          handleSelectChildFromLinked(sId, aCode);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
          <User className="size-6 text-pink-500" />
          <span>Parent Progress Explorer</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Enter your child's mobile identifier or full name and 6-digit access code to view learning analytics.
        </p>
      </div>

      {/* Top Credentials & Child Switcher Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-end gap-3 w-full">
          <div className="flex-1 min-w-[200px] w-full flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
              <User size={13} className="text-pink-500" />
              <span>Child's Name (Last Name, First Name) or Student ID</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Cruz, Juan or Student ID"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
              required
            />
          </div>

          <div className="w-full sm:w-48 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-muted)]">
              6-Digit Access Code
            </label>
            <input
              type="text"
              placeholder="e.g. 123456"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              maxLength={6}
              className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 font-mono tracking-wider transition-colors"
              required
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="btn btn-primary flex-1 sm:flex-initial text-xs py-2.5 px-5 flex items-center justify-center gap-1.5 rounded-xl font-bold cursor-pointer shadow-xs"
            >
              <Search size={14} />
              <span>Search Reports</span>
            </button>
            {(studentIdInput || accessCodeInput) && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear Search"
                className="size-9.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Child Switcher Pills (if parents have linked children stored) */}
        {linkedChildren.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)] flex-wrap">
            <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Users size={12} className="text-indigo-400" />
              <span>Switch Child:</span>
            </span>
            {linkedChildren.map(child => {
              const isSelected = studentIdInput.toLowerCase() === child.studentId.toLowerCase();
              return (
                <button
                  key={child.studentId}
                  type="button"
                  onClick={() => handleSelectChildFromLinked(child.studentId, child.accessCode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-pink-500/40'
                  }`}
                >
                  <span>{child.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-pink-100' : 'text-[var(--text-muted)]'}`}>
                    ({child.studentId})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <div className="spinner" />
          <p className="text-xs font-bold text-[var(--text-muted)]">
            Retrieving learning curves...
          </p>
        </div>
      ) : searched ? (
        studentLogs.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
            <Inbox className="size-12 text-slate-500 opacity-40" />
            <h4 className="text-base font-bold text-[var(--text-main)] m-0">
              No reports registered for "{studentIdInput}"
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Ensure your child has submitted quiz results in their app and that you have clicked "Sync Progress Now" in the mobile Parent Space.
            </p>
          </div>
        ) : (
          /* Render Selected Sub-Component */
          activeSubTab === 'parent-badges' ? (
            <ParentActivityBadges logs={studentLogs} />
          ) : activeSubTab === 'parent-timeline' ? (
            <ParentTimeline
              logs={studentLogs}
              lastUpdatedCell={lastUpdatedCell}
              currentTime={currentTime}
            />
          ) : (
            /* Default: parent-overview or parent-explorer */
            <ParentOverview
              logs={studentLogs}
              studentNameOrId={studentIdInput}
            />
          )
        )
      ) : (
        /* Prompt to search */
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <BarChart3 className="size-12 text-pink-500 opacity-60" />
          <h4 className="text-base font-bold text-[var(--text-main)] m-0">
            Search for your child by Name or Student ID
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Enter your child's name in standard format (e.g. "Cruz, Juan"), their Student ID, or email, along with the 6-Digit Parent Access Code to query synced performance history.
          </p>
        </div>
      )}
    </div>
  );
}
