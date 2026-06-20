import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { LogoutConfirmModal } from './components/shared/LogoutConfirmModal';
import type { Question } from './pages/LessonSpace';
import { LiveActivityTicker } from './components/teacher/LiveActivityTicker';
import './App.css';

const StudentSpace = lazy(() => import('./pages/StudentSpace').then(m => ({ default: m.StudentSpace })));
const TeacherSpace = lazy(() => import('./pages/TeacherSpace').then(m => ({ default: m.TeacherSpace })));
const ParentSpace = lazy(() => import('./pages/ParentSpace').then(m => ({ default: m.ParentSpace })));
const LessonSpace = lazy(() => import('./pages/LessonSpace').then(m => ({ default: m.LessonSpace })));
const DashboardSpace = lazy(() => import('./pages/DashboardSpace').then(m => ({ default: m.DashboardSpace })));
import {
  LayoutDashboard,
  TrendingUp,
  Key,
  PlusCircle,
  Users,
  Zap,
  LogOut,
  RotateCw,
  Sun,
  Moon,
  GraduationCap
} from 'lucide-react';

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

type TabType = 'landing' | 'student' | 'teacher' | 'parent' | 'lesson-builder' | 'dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null>(() => {
    const cached = localStorage.getItem('guro_user_session');
    return cached ? JSON.parse(cached) : null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'manual-lesson' | 'classroom-pairing'>('analytics');
  const [progressLogs, setProgressLogs] = useState<SyncedEvent[]>([]);
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('guro_theme') !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('guro_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'teacher') setActiveTab('teacher');
      else if (currentUser.role === 'parent') setActiveTab('parent');
      else if (currentUser.role === 'student') setActiveTab('student');
      else if (currentUser.role === 'lesson-builder' || currentUser.role === 'developer') setActiveTab('lesson-builder');
    }
  }, []);
  const [lastUpdatedCell, setLastUpdatedCell] = useState<{ studentId: string; topic: string; timestamp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const response = await fetch('/api/progress');
      if (!response.ok) throw new Error('Failed to load logs');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProgressLogs((prev) => {
          // Identify if there are new logs we haven't seen yet to trigger cell flashing
          const newEvents = data.filter(
            (newEvt) => !prev.some((oldEvt) => oldEvt.eventId === newEvt.eventId)
          );
          if (newEvents.length > 0) {
            const latest = newEvents[0];
            setLastUpdatedCell({
              studentId: latest.studentId,
              topic: latest.topic,
              timestamp: Date.now()
            });
          }
          return data;
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Fetch initial progress logs and setup polling interval
  useEffect(() => {
    const needsLogs = activeTab === 'teacher' || activeTab === 'lesson-builder' || activeTab === 'dashboard';
    if (!needsLogs) return;

    fetchLogs();

    // Establish a standard short-lived polling interval.
    // This avoids blocking single-threaded PHP local servers (which infinite-loop SSE connections do).
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [activeTab]);

  // Handle exiting out of specialized sub-spaces back to the landing gate
  const handleExitToLanding = () => {
    setActiveTab('landing');
  };

  // Render full screen spaces vs workspace layouts with sidebars
  if (activeTab === 'landing') {
    return (
      <LandingPage 
        onSelectRole={(role) => {
          setCurrentUser(null);
          setActiveTab(role);
        }} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('guro_user_session', JSON.stringify(user));
          toast.success(`Welcome back, ${user.name}!`);
          
          if (user.role === 'teacher') setActiveTab('teacher');
          else if (user.role === 'parent') setActiveTab('parent');
          else if (user.role === 'student') setActiveTab('student');
          else if (user.role === 'lesson-builder' || user.role === 'developer') setActiveTab('lesson-builder');
        }}
      />
    );
  }

  if (activeTab === 'student') {
    return (
      <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#94a3b8' }}>Loading Student Space...</div>}>
        <StudentSpace onExit={handleExitToLanding} currentUser={currentUser} />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'teacher':
        return (
          <TeacherSpace
            progressLogs={progressLogs}
            lastUpdatedCell={lastUpdatedCell}
            refreshLogs={fetchLogs}
            loading={loading}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
          />
        );
      case 'parent':
        return (
          <ParentSpace
            progressLogs={progressLogs}
            lastUpdatedCell={lastUpdatedCell}
          />
        );
      case 'lesson-builder':
        return (
          <LessonSpace
            currentUser={currentUser}
            stagedQuestions={stagedQuestions}
            setStagedQuestions={setStagedQuestions}
          />
        );
      case 'dashboard':
        return (
          <DashboardSpace
            currentUser={currentUser}
            stagedQuestionsCount={stagedQuestions.length}
          />
        );
      default:
        return (
          <TeacherSpace
            progressLogs={progressLogs}
            lastUpdatedCell={lastUpdatedCell}
            refreshLogs={fetchLogs}
            loading={loading}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
          />
        );
    }
  };

  const isTeacherView = ['teacher', 'dashboard', 'lesson-builder'].includes(activeTab);

  return (
    <div className={`flex h-screen w-screen bg-[var(--bg-main)] overflow-hidden${isTeacherView ? ' teacher-portal' : ''}`}>
      {/* Sidebar Navigation */}
      <aside className="w-64 shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col px-4 py-5">
        <div className="flex items-center gap-[11px] px-1.5 pb-5 mb-1">
          <div className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-gradient-to-br from-[#11428E] to-[#1C5BC0] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_6px_16px_rgba(17,66,142,0.34)]">GU</div>
          <div className="leading-tight">
            <div className="font-['Space_Grotesk',sans-serif] text-[18px] font-extrabold text-[var(--text-main)]">GURO</div>
            <div className="text-[12px] font-semibold text-[var(--text-muted)]">Teacher Portal</div>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {(!currentUser || currentUser.role === 'lesson-builder' || currentUser.role === 'developer' || currentUser.role === 'teacher') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-sm text-left transition-all duration-200 w-full ${
                activeTab === 'dashboard'
                  ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
                  : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
              }`}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              <span>System Dashboard</span>
            </button>
          )}

          {(!currentUser || currentUser.role === 'teacher') && (
            <div className="flex flex-col">
              <div className="px-[14px] pt-4 pb-1.5 text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-[var(--text-dark)]">
                Teacher Console
              </div>

              <div className="flex flex-col gap-[3px] pl-2 border-l-[1.5px] border-[var(--border-color)] ml-[14px]">
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('analytics');
                  }}
                  className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-[14.5px] text-left transition-all duration-200 w-full ${
                    activeTab === 'teacher' && activeSubTab === 'analytics'
                      ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
                      : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <TrendingUp size={17} className="shrink-0" />
                  <span>Classroom Analytics</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('classroom-pairing');
                  }}
                  className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-[14.5px] text-left transition-all duration-200 w-full ${
                    activeTab === 'teacher' && activeSubTab === 'classroom-pairing'
                      ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
                      : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <Key size={17} className="shrink-0" />
                  <span>Classroom Setup</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('manual-lesson');
                  }}
                  className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-[14.5px] text-left transition-all duration-200 w-full ${
                    activeTab === 'teacher' && activeSubTab === 'manual-lesson'
                      ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
                      : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <PlusCircle size={17} className="shrink-0" />
                  <span>Create Lesson Manually</span>
                </button>
              </div>
            </div>
          )}

          {(!currentUser || currentUser.role === 'parent') && (
            <button
              onClick={() => setActiveTab('parent')}
              className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-sm text-left transition-all duration-200 w-full ${
                activeTab === 'parent'
                  ? 'bg-[#11428E]/10 text-[var(--text-main)] font-bold'
                  : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-white/5'
              }`}
            >
              <Users size={18} className="shrink-0" />
              <span>Parent Explorer</span>
            </button>
          )}

          {(!currentUser || currentUser.role === 'lesson-builder' || currentUser.role === 'developer' || currentUser.role === 'teacher') && (
            <button
              onClick={() => setActiveTab('lesson-builder')}
              className={`flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-[14.5px] text-left transition-all duration-200 w-full mt-[3px] ${
                activeTab === 'lesson-builder'
                  ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
                  : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
              }`}
            >
              <Zap size={18} className="shrink-0" />
              <span>Lesson Ingestor</span>
            </button>
          )}

          <div className="flex-1" />

          {/* Entrance Role Gateway Button */}
          <button
            onClick={() => {
              if (currentUser) {
                setIsLogoutModalOpen(true);
              } else {
                handleExitToLanding();
              }
            }}
            className="flex items-center gap-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] px-[14px] py-[10px] rounded-[11px] cursor-pointer font-semibold text-sm text-left transition-all duration-200 w-full mb-4 hover:bg-[var(--danger)]/20"
          >
            <LogOut size={18} className="shrink-0" />
            <span>{currentUser ? 'Log Out' : 'Exit Workspace'}</span>
          </button>
        </nav>

        <div className="border-t border-[var(--border-color)] pt-[14px] flex items-center gap-[11px]">
          <div className="w-[38px] h-[38px] rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
            <GraduationCap size={18} className="text-[var(--text-muted)]" />
          </div>
          <div className="flex flex-col flex-1 min-w-0 leading-[1.15]">
            <span className="text-sm font-bold text-[var(--text-main)] truncate">
              {currentUser ? currentUser.name : 'Guest Workspace'}
            </span>
            <span className="text-[11.5px] font-semibold text-[var(--success)] truncate">
              {currentUser ? `${currentUser.role.toUpperCase()} · Sync'd` : 'Local Session'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-[0.93] shrink-0"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header */}
        <header className="h-[62px] border-b border-[var(--border-color)] flex justify-between items-center px-[30px] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="text-[var(--text-muted)]">GURO</span>
            <span className="text-[var(--border-color)]">/</span>
            {activeTab === 'teacher' ? (
              <>
                <span className="text-[var(--text-muted)]">Teacher Console</span>
                <span className="text-[var(--border-color)]">/</span>
                <span className="text-[var(--text-main)] font-bold">
                  {activeSubTab === 'analytics' && 'Classroom Analytics'}
                  {activeSubTab === 'classroom-pairing' && 'Classroom Setup'}
                  {activeSubTab === 'manual-lesson' && 'Create Lesson Manually'}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-main)] font-bold">
                {activeTab === 'parent' ? 'Parent Explorer' :
                  activeTab === 'dashboard' ? 'System Dashboard' : 'Lesson Ingestor'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'teacher' && activeSubTab === 'analytics' && (
              <button 
                onClick={() => fetchLogs(false)}
                className="bg-white/4 border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.25 rounded-md cursor-pointer text-xs font-semibold transition-all duration-200 hover:bg-white/10 flex items-center gap-1.5"
              >
                <RotateCw size={13} />
                <span>Refresh Logs</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-[#10B981]/8 border border-[#10B981]/20 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></div>
              <span className="text-[11px] font-bold text-[#10B981] tracking-[0.5px]">Sync Server Active</span>
            </div>
          </div>
        </header>

        {/* Live Activity Scrolling Ticker */}
        <LiveActivityTicker events={progressLogs} />

        {/* View Component Wrapper */}
        <div className="flex-1 overflow-y-auto p-[28px_30px_40px]">
          <Suspense fallback={<div className="p-6 text-[#94a3b8]">Loading Workspace...</div>}>
            {renderContent()}
          </Suspense>
        </div>
      </main>
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          localStorage.removeItem('guro_user_session');
          setCurrentUser(null);
          handleExitToLanding();
          toast.success('Logged out successfully.');
        }}
      />
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
    </div>
  );
}



export default App;
