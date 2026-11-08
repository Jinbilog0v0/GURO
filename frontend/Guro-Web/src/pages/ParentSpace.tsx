import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from '../utils/toast';
import { AlertCircle, Trash2, User, Users, BarChart3, Inbox, Plus, Link, CheckCircle2, RefreshCw, X, ShieldCheck } from 'lucide-react';
import { ParentOverview } from '../components/parent/ParentOverview';
import { ParentActivityBadges } from '../components/parent/ParentActivityBadges';
import { ParentTimeline } from '../components/parent/ParentTimeline';
import { ParentStudentRegistration } from '../components/parent/ParentStudentRegistration';
import { ParentConsultationView } from '../components/parent/ParentConsultationView';
import type { SyncedEvent } from '../components/parent/ParentOverview';
import type { LinkedStudentProfile } from '../components/parent/ParentStudentRegistration';

export interface ParentSpaceProps {
  progressLogs?: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
  activeSubTab?: string;
  setActiveSubTab?: (tab: any) => void;
  currentUser?: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export function ParentSpace({
  lastUpdatedCell,
  activeSubTab = 'parent-explorer',
  setActiveSubTab,
  currentUser,
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
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Claim/Link modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStudentId, setClaimStudentId] = useState('');
  const [claimAccessCode, setClaimAccessCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Linked children list from API / localStorage for child switcher
  const [linkedChildren, setLinkedChildren] = useState<LinkedStudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('guro_parent_linked_children');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch linked children directly from API for authenticated parents
  const fetchChildren = async () => {
    setLoadingChildren(true);
    try {
      const res = await apiFetch('/api/parent/children');
      if (res.ok) {
        const data = await res.json();
        if (data.children && Array.isArray(data.children)) {
          setLinkedChildren(data.children);
          localStorage.setItem('guro_parent_linked_children', JSON.stringify(data.children));

          // If no child selected yet, auto-select the first child
          const currentSaved = localStorage.getItem('guro_parent_student_id');
          const found = data.children.find((c: any) => c.studentId === currentSaved);
          const activeChild = found || data.children[0];
          if (activeChild && (!searched || !studentLogs.length)) {
            setStudentIdInput(activeChild.studentId);
            setAccessCodeInput(activeChild.accessCode || '');
            loadChildProgress(activeChild.studentId, activeChild.accessCode);
          }
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    fetchChildren();
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
    if (searched && studentIdInput.trim()) {
      const fetchLogsOnMount = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
          const codeParam = accessCodeInput.trim() ? `&accessCode=${encodeURIComponent(accessCodeInput.trim())}` : '';
          const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(studentIdInput.trim())}${codeParam}`);
          if (response.ok) {
            const data = await response.json();
            if (isMounted) setStudentLogs(data);
          } else {
            const errData = await response.json().catch(() => ({}));
            if (isMounted) {
              setErrorMsg(errData.error || 'Failed to retrieve logs. Please verify child access.');
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

  const loadChildProgress = async (idToUse: string, codeToUse?: string) => {
    if (!idToUse) return;
    setStudentIdInput(idToUse);
    if (codeToUse) setAccessCodeInput(codeToUse);
    setLoading(true);
    setSearched(true);
    setErrorMsg(null);

    try {
      const codeParam = codeToUse ? `&accessCode=${encodeURIComponent(codeToUse)}` : (accessCodeInput ? `&accessCode=${encodeURIComponent(accessCodeInput)}` : '');
      const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(idToUse)}${codeParam}`);
      if (response.ok) {
        const data = await response.json();
        setStudentLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to retrieve logs for this student.');
        setStudentLogs([]);
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
      setStudentLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent, customId?: string, customCode?: string) => {
    if (e) e.preventDefault();
    const idToUse = (customId ?? studentIdInput).trim();
    const codeToUse = (customCode ?? accessCodeInput).trim();
    if (!idToUse) return;

    if (customId) setStudentIdInput(customId);
    if (customCode) setAccessCodeInput(customCode);

    setLoading(true);
    setSearched(true);
    setErrorMsg(null);

    try {
      const codeParam = codeToUse ? `&accessCode=${encodeURIComponent(codeToUse)}` : '';
      const response = await apiFetch(`/api/progress?studentId=${encodeURIComponent(idToUse)}${codeParam}`);
      if (response.ok) {
        const data = await response.json();
        setStudentLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to retrieve logs. Please verify child access.');
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

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimStudentId.trim() || !claimAccessCode.trim()) return;
    setClaiming(true);
    setClaimError(null);

    try {
      const res = await apiFetch('/api/parent/claim-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: claimStudentId.trim(),
          accessCode: claimAccessCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Child successfully linked!');
        setShowClaimModal(false);
        setClaimStudentId('');
        setClaimAccessCode('');
        await fetchChildren();
        if (data.child) {
          loadChildProgress(data.child.studentId, claimAccessCode);
        }
      } else {
        setClaimError(data.error || 'Failed to link child. Check student ID and access code.');
      }
    } catch {
      setClaimError('Network error while linking child.');
    } finally {
      setClaiming(false);
    }
  };

  // Render registration view if on student registration sub-tab
  if (activeSubTab === 'parent-consultation' || activeSubTab === 'parent-messages') {
    return (
      <ParentConsultationView
        currentUser={currentUser}
        selectedStudentId={studentIdInput}
      />
    );
  }

  if (activeSubTab === 'create-student' || activeSubTab === 'parent-create-student' || activeSubTab === 'parent-students') {
    return (
      <ParentStudentRegistration
        onSelectStudentForExplorer={(sId, aCode) => {
          loadChildProgress(sId, aCode);
          setActiveSubTab?.('parent-overview');
        }}
      />
    );
  }

  const selectedChild = linkedChildren.find(c => c.studentId.toLowerCase() === studentIdInput.toLowerCase());

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Page Title & Sibling Selector Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
            <User className="size-6 text-pink-500" />
            <span>Parent Progress Explorer</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Directly monitoring learning analytics and practice mastery for your registered children.
          </p>
        </div>

        {/* Quick Registration & Claim Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab?.('create-student')}
            className="px-3.5 py-2 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-500 hover:bg-pink-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Register New Child</span>
          </button>
          <button
            type="button"
            onClick={() => setShowClaimModal(true)}
            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-pink-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Link existing student with one-time verification"
          >
            <Link size={13} />
            <span>Link Existing</span>
          </button>
        </div>
      </div>

      {/* ── My Children Direct Switcher Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
            <Users size={16} className="text-pink-500" />
            <span>My Registered Children</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
              {linkedChildren.length} Linked
            </span>
          </div>

          {loadingChildren && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <RefreshCw size={12} className="animate-spin" />
              <span>Syncing children...</span>
            </div>
          )}
        </div>

        {/* Child Selector Chips */}
        {linkedChildren.length > 0 ? (
          <div className="flex items-center gap-2.5 flex-wrap">
            {linkedChildren.map((child) => {
              const isSelected = studentIdInput.toLowerCase() === child.studentId.toLowerCase();
              return (
                <button
                  key={child.studentId}
                  type="button"
                  onClick={() => loadChildProgress(child.studentId, child.accessCode)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-pink-500 text-white shadow-md scale-[1.02]'
                      : 'bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:border-pink-500/40'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-pink-500/10 text-pink-500'
                  }`}>
                    {child.name.charAt(0)}
                  </div>
                  <span>{child.name}</span>
                  {child.section && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)]'
                    }`}>
                      {child.section}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty Children State */
          <div className="bg-[var(--bg-main)] border border-dashed border-[var(--border-color)] rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2">
            <Users size={28} className="text-[var(--text-muted)] opacity-50" />
            <div className="text-xs font-bold text-[var(--text-main)]">No Children Linked Yet</div>
            <p className="text-[11px] text-[var(--text-muted)] max-w-sm">
              Register your child to directly view their quiz analytics, learning mastery, and message their classroom teacher.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setActiveSubTab?.('create-student')}
                className="btn btn-primary text-xs py-1.5 px-3.5 rounded-lg font-bold"
              >
                Register Child Account
              </button>
              <button
                type="button"
                onClick={() => setShowClaimModal(true)}
                className="btn btn-secondary text-xs py-1.5 px-3.5 rounded-lg font-bold"
              >
                Link With Access Code
              </button>
            </div>
          </div>
        )}

        {/* Selected Child Info Banner */}
        {selectedChild && (
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-color)] flex-wrap gap-2 text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span>
                Active Child: <strong className="text-[var(--text-main)]">{selectedChild.name}</strong> ({selectedChild.studentId})
              </span>
            </div>
            {selectedChild.section && (
              <span>Section: <strong className="text-[var(--text-main)]">{selectedChild.section}</strong></span>
            )}
          </div>
        )}

        {/* Fallback Legacy Form (Hidden if child selected, expandable for direct search) */}
        {(!linkedChildren.length || !studentIdInput) && (
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full pt-2 border-t border-[var(--border-color)]">
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
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="btn btn-primary flex-1 sm:flex-initial text-xs py-2.5 px-5 flex items-center justify-center gap-1.5 rounded-xl font-bold cursor-pointer shadow-xs"
              >
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
        )}

        {errorMsg && (
          <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ── Claim / Link Child Modal ── */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-base font-bold text-[var(--text-main)]">
                <Link size={18} className="text-pink-500" />
                <span>Link Existing Student Account</span>
              </div>
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              If your child already has a student account created on their school device, enter their Student ID and 6-digit access code once to bind them permanently to your parent account.
            </p>

            <form onSubmit={handleClaimSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">Student ID or Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. CRUZ-JUAN or Juan Cruz"
                  value={claimStudentId}
                  onChange={(e) => setClaimStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 font-mono"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">6-Digit Verification Code</label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={claimAccessCode}
                  onChange={(e) => setClaimAccessCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 font-mono tracking-wider"
                  required
                />
              </div>

              {claimError && (
                <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="btn btn-secondary text-xs py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claiming || !claimStudentId.trim() || !claimAccessCode.trim()}
                  className="btn btn-primary text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {claiming ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>{claiming ? 'Verifying...' : 'Link to Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              Ensure your child has completed quiz activities in their app and that progress has been synced.
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
              studentNameOrId={selectedChild?.name || studentIdInput}
            />
          )
        )
      ) : (
        /* Prompt to select a child */
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
          <BarChart3 className="size-12 text-pink-500 opacity-60" />
          <h4 className="text-base font-bold text-[var(--text-main)] m-0">
            Select a child above to view reports
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Choose one of your registered children to inspect their quiz accuracy, topic mastery, and study streak.
          </p>
        </div>
      )}
    </div>
  );
}
