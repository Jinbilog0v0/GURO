import { useState, useEffect, lazy, Suspense } from 'react';
import { apiFetch, clearAuthToken } from './utils/api';
import { Toaster } from 'react-hot-toast';
import { toast } from './utils/toast';
import { LandingPage } from './pages/LandingPage';
import { LogoutConfirmModal } from './components/shared/LogoutConfirmModal';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SkeletonCard, SkeletonTable, SkeletonStatCards, PageLoadingSpinner } from './components/shared/SkeletonLoader';
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
  User,
  Zap,
  LogOut,
  RotateCw,
  Sun,
  Moon,
  GraduationCap,
  Shield,
  Menu,
  X
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
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem('guro_user_session');
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const cachedUser = localStorage.getItem('guro_user_session');
    if (!cachedUser) return 'landing';
    const stored = localStorage.getItem('guro_active_tab');
    if (stored) return stored as TabType;
    return 'landing';
  });
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'manual-lesson' | 'classroom-pairing'>(() => {
    const stored = localStorage.getItem('guro_active_sub_tab');
    if (stored) return stored as 'analytics' | 'manual-lesson' | 'classroom-pairing';
    return 'analytics';
  });
  const [progressLogs, setProgressLogs] = useState<SyncedEvent[]>([]);
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('guro_theme') !== 'light';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return localStorage.getItem('guro_sidebar') !== 'collapsed';
  });

  useEffect(() => {
    localStorage.setItem('guro_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('guro_active_sub_tab', activeSubTab);
  }, [activeSubTab]);

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
    if (currentUser && activeTab === 'landing') {
      if (currentUser.role === 'teacher') setActiveTab('dashboard');
      else if (currentUser.role === 'parent') setActiveTab('parent');
      else if (currentUser.role === 'student') setActiveTab('student');
      else if (currentUser.role === 'admin') setActiveTab('dashboard');
      else if (currentUser.role === 'lesson-builder' || currentUser.role === 'developer') setActiveTab('lesson-builder');
    }
  }, [currentUser, activeTab]);
  const [lastUpdatedCell, setLastUpdatedCell] = useState<{ studentId: string; topic: string; timestamp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (isBackground = false) => {
    const classCode = currentUser?.classroomId || localStorage.getItem('guro_teacher_classroom_code');
    if (!classCode) {
      setProgressLogs([]);
      setLoading(false);
      return;
    }

    if (!isBackground) setLoading(true);
    try {
      const response = await apiFetch(`/api/progress?classroomId=${encodeURIComponent(classCode)}`);
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
  }, [activeTab, currentUser]);

  // Handle exiting out of specialized sub-spaces back to the landing gate
  const handleExitToLanding = () => {
    setActiveTab('landing');
  };

  // Render full screen spaces vs workspace layouts with sidebars
  if (activeTab === 'landing') {
    return (
      <LandingPage 
        onSelectRole={(role, grade) => {
          setCurrentUser(null);
          if (grade) {
            localStorage.setItem('guro_student_grade', String(grade));
          }
          setActiveTab(role);
        }} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('guro_user_session', JSON.stringify(user));
          toast.success(`Welcome back, ${user.name}!`);
          
          if (user.role === 'teacher') setActiveTab('dashboard');
          else if (user.role === 'parent') setActiveTab('parent');
          else if (user.role === 'student') setActiveTab('student');
          else if (user.role === 'admin') setActiveTab('dashboard');
          else if (user.role === 'lesson-builder' || user.role === 'developer') setActiveTab('lesson-builder');
        }}
      />
    );
  }

  if (activeTab === 'student') {
    return (
      <Suspense fallback={<PageLoadingSpinner message="Loading Student Space…" />}>
        <StudentSpace 
          onExit={handleExitToLanding} 
          onLogout={() => {
            setCurrentUser(null);
            clearAuthToken();
            handleExitToLanding();
          }}
          currentUser={currentUser} 
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
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
            progressLogs={progressLogs}
            progressLoading={loading}
            onNavigate={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) setActiveSubTab(subTab);
            }}
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

  const isAdmin = currentUser?.role === 'admin';
  const isTeacherView = ['teacher', 'dashboard', 'lesson-builder'].includes(activeTab);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('guro_sidebar', next ? 'open' : 'collapsed');
      return next;
    });
  };

  const navBtn = (active: boolean) =>
    `flex items-center gap-3 border-none px-[14px] py-[10px] rounded-[11px] cursor-pointer text-[14.5px] text-left transition-all duration-200 w-full ${
      active
        ? 'bg-[var(--nav-active-bg)] shadow-[inset_3px_0_0_#11428E] text-[var(--text-main)] font-bold'
        : 'bg-transparent text-[var(--text-muted)] font-semibold hover:bg-[var(--bg-main)]'
    }`;

  const navBtnIcon = (active: boolean) =>
    `flex items-center justify-center border-none p-[10px] rounded-[11px] cursor-pointer transition-all duration-200 w-full ${
      active
        ? 'bg-[var(--nav-active-bg)] text-[var(--accent-primary)]'
        : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
    }`;

  const isTeacher = !isAdmin && (!currentUser || currentUser.role === 'teacher');
  const isBuilderOrDev = !isAdmin && (!currentUser || currentUser.role === 'lesson-builder' || currentUser.role === 'developer' || currentUser.role === 'teacher');
  const isParent = !isAdmin && (!currentUser || currentUser.role === 'parent');

  return (
    <div className={`flex h-screen w-screen bg-[var(--bg-main)] overflow-hidden${isTeacherView ? ' teacher-portal' : ''}`}>
      {/* Sidebar Navigation */}
      <aside
        className={`shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col py-5 transition-all duration-300 ${
          isSidebarOpen ? 'w-64 px-4' : 'w-[60px] px-2'
        }`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={`flex items-center pb-5 mb-1 ${isSidebarOpen ? 'gap-[11px] px-1.5' : 'justify-center'}`}>
          <div className="w-[42px] h-[42px] shrink-0 rounded-[12px] bg-gradient-to-br from-[#11428E] to-[#1C5BC0] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_6px_16px_rgba(17,66,142,0.34)]">GU</div>
          {isSidebarOpen && (
            <div className="leading-tight overflow-hidden">
              <div className="font-['Space_Grotesk',sans-serif] text-[18px] font-extrabold text-[var(--text-main)]">GURO</div>
              <div className={`text-[12px] font-semibold ${isAdmin ? 'text-[#CE1126]' : 'text-[var(--text-muted)]'}`}>
                {isAdmin ? 'Admin Console' : 'Teacher Portal'}
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {/* ── Admin nav ── */}
          {isAdmin && (
            <>
              {isSidebarOpen ? (
                <>
                  <button onClick={() => setActiveTab('dashboard')} className={navBtn(activeTab === 'dashboard')} aria-current={activeTab === 'dashboard' ? 'page' : undefined}>
                    <LayoutDashboard size={18} className="shrink-0" /><span>Main Dashboard</span>
                  </button>
                  <button onClick={() => setActiveTab('lesson-builder')} className={navBtn(activeTab === 'lesson-builder')} aria-current={activeTab === 'lesson-builder' ? 'page' : undefined}>
                    <Zap size={18} className="shrink-0" /><span>Lesson Ingestor</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveTab('dashboard')} className={navBtnIcon(activeTab === 'dashboard')} title="Main Dashboard" aria-label="Main Dashboard"><LayoutDashboard size={18} /></button>
                  <button onClick={() => setActiveTab('lesson-builder')} className={navBtnIcon(activeTab === 'lesson-builder')} title="Lesson Ingestor" aria-label="Lesson Ingestor"><Zap size={18} /></button>
                </>
              )}
            </>
          )}

          {/* ── Teacher / builder nav ── */}
          {isBuilderOrDev && (
            isSidebarOpen ? (
              <button onClick={() => setActiveTab('dashboard')} className={navBtn(activeTab === 'dashboard')} aria-current={activeTab === 'dashboard' ? 'page' : undefined}>
                <LayoutDashboard size={18} className="shrink-0" /><span>System Dashboard</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('dashboard')} className={navBtnIcon(activeTab === 'dashboard')} title="System Dashboard" aria-label="System Dashboard"><LayoutDashboard size={18} /></button>
            )
          )}

          {isTeacher && (
            isSidebarOpen ? (
              <div className="flex flex-col">
                <div className="px-[14px] pt-4 pb-1.5 text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-[var(--text-dark)]">
                  Teacher Console
                </div>
                <div className="flex flex-col gap-[3px] pl-2 border-l-[1.5px] border-[var(--border-color)] ml-[14px]">
                  <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('analytics'); }} className={navBtn(activeTab === 'teacher' && activeSubTab === 'analytics')} aria-current={activeTab === 'teacher' && activeSubTab === 'analytics' ? 'page' : undefined}>
                    <TrendingUp size={17} className="shrink-0" /><span>Classroom Analytics</span>
                  </button>
                  <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('classroom-pairing'); }} className={navBtn(activeTab === 'teacher' && activeSubTab === 'classroom-pairing')} aria-current={activeTab === 'teacher' && activeSubTab === 'classroom-pairing' ? 'page' : undefined}>
                    <Key size={17} className="shrink-0" /><span>Classroom Setup</span>
                  </button>
                  <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('manual-lesson'); }} className={navBtn(activeTab === 'teacher' && activeSubTab === 'manual-lesson')} aria-current={activeTab === 'teacher' && activeSubTab === 'manual-lesson' ? 'page' : undefined}>
                    <PlusCircle size={17} className="shrink-0" /><span>Create Lesson Manually</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('analytics'); }} className={navBtnIcon(activeTab === 'teacher' && activeSubTab === 'analytics')} title="Classroom Analytics" aria-label="Classroom Analytics"><TrendingUp size={18} /></button>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('classroom-pairing'); }} className={navBtnIcon(activeTab === 'teacher' && activeSubTab === 'classroom-pairing')} title="Classroom Setup" aria-label="Classroom Setup"><Key size={18} /></button>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('manual-lesson'); }} className={navBtnIcon(activeTab === 'teacher' && activeSubTab === 'manual-lesson')} title="Create Lesson Manually" aria-label="Create Lesson Manually"><PlusCircle size={18} /></button>
              </>
            )
          )}

          {isParent && (
            isSidebarOpen ? (
              <button onClick={() => setActiveTab('parent')} className={navBtn(activeTab === 'parent')} aria-current={activeTab === 'parent' ? 'page' : undefined}>
                <User size={18} className="shrink-0" /><span>Parent Explorer</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('parent')} className={navBtnIcon(activeTab === 'parent')} title="Parent Explorer" aria-label="Parent Explorer"><User size={18} /></button>
            )
          )}

          {isBuilderOrDev && (
            isSidebarOpen ? (
              <button onClick={() => setActiveTab('lesson-builder')} className={navBtn(activeTab === 'lesson-builder')} aria-current={activeTab === 'lesson-builder' ? 'page' : undefined}>
                <Zap size={18} className="shrink-0" /><span>Lesson Ingestor</span>
              </button>
            ) : (
              <button onClick={() => setActiveTab('lesson-builder')} className={navBtnIcon(activeTab === 'lesson-builder')} title="Lesson Ingestor" aria-label="Lesson Ingestor"><Zap size={18} /></button>
            )
          )}

          <div className="flex-1" />

          {isSidebarOpen ? (
            <button
              onClick={() => currentUser ? setIsLogoutModalOpen(true) : handleExitToLanding()}
              className="flex items-center gap-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] px-[14px] py-[10px] rounded-[11px] cursor-pointer font-semibold text-sm text-left transition-all duration-200 w-full mb-4 hover:bg-[var(--danger)]/20"
              aria-label={currentUser ? 'Log Out' : 'Exit Workspace'}
            >
              <LogOut size={18} className="shrink-0" />
              <span>{currentUser ? 'Log Out' : 'Exit Workspace'}</span>
            </button>
          ) : (
            <button
              onClick={() => currentUser ? setIsLogoutModalOpen(true) : handleExitToLanding()}
              className="flex items-center justify-center bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] p-[10px] rounded-[11px] cursor-pointer transition-all duration-200 w-full mb-4 hover:bg-[var(--danger)]/20"
              aria-label={currentUser ? 'Log Out' : 'Exit Workspace'}
              title={currentUser ? 'Log Out' : 'Exit Workspace'}
            >
              <LogOut size={18} />
            </button>
          )}
        </nav>

        {/* User footer */}
        {isSidebarOpen ? (
          <div className="border-t border-[var(--border-color)] pt-[14px] flex items-center gap-[11px]">
            <div className={`w-[38px] h-[38px] rounded-full border border-[var(--border-color)] flex items-center justify-center shrink-0 ${isAdmin ? 'bg-[#FBECEE]' : 'bg-[var(--bg-main)]'}`}>
              {isAdmin ? (
                <Shield size={18} className="text-[#CE1126]" />
              ) : currentUser?.role === 'parent' ? (
                <User size={18} className="text-[var(--text-muted)]" />
              ) : (
                <GraduationCap size={18} className="text-[var(--text-muted)]" />
              )}
            </div>
            <div className="flex flex-col flex-1 min-w-0 leading-[1.15]">
              <span className="text-sm font-bold text-[var(--text-main)] truncate">
                {currentUser ? currentUser.name : 'Guest Workspace'}
              </span>
              <span className={`text-[11.5px] font-semibold truncate ${isAdmin ? 'text-[#CE1126]' : 'text-[var(--success)]'}`}>
                {isAdmin ? 'ADMIN · Division Office' : currentUser ? `${currentUser.role.toUpperCase()} · Sync'd` : 'Local Session'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-[0.93] shrink-0"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        ) : (
          <div className="border-t border-[var(--border-color)] pt-[14px] flex flex-col items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-[0.93]"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        )}
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header */}
        <header className="h-[62px] border-b border-[var(--border-color)] flex justify-between items-center px-[30px] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] active:scale-[0.93] shrink-0"
            >
              {isSidebarOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="text-[var(--text-muted)] font-bold">{isAdmin ? 'GURO Admin' : 'GURO'}</span>
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
                  {activeTab === 'parent' ? 'Parent Explorer'
                    : activeTab === 'dashboard' ? (isAdmin ? 'Main Dashboard' : 'System Dashboard')
                    : 'Lesson Ingestor'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeTab === 'teacher' && activeSubTab === 'analytics' && (
              <button
                onClick={() => fetchLogs(false)}
                aria-label="Refresh sync logs"
                className="bg-white/4 border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-md cursor-pointer text-xs font-semibold transition-all duration-200 hover:bg-white/10 flex items-center gap-1.5"
              >
                <RotateCw size={13} /><span>Refresh Logs</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-[#10B981]/8 border border-[#10B981]/20 px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" aria-hidden="true"></div>
              <span className="text-[11px] font-bold text-[#10B981] tracking-[0.5px]">Sync Server Active</span>
            </div>
          </div>
        </header>

        {/* Live Activity Scrolling Ticker */}
        <LiveActivityTicker events={progressLogs} />

        {/* View Component Wrapper */}
        <div key={activeTab} className="flex-1 overflow-y-auto p-[28px_30px_40px] fade-in">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex flex-col gap-5">
                <SkeletonStatCards count={4} />
                <SkeletonCard rows={4} />
                <SkeletonTable rows={5} cols={5} />
              </div>
            }>
              {renderContent()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          localStorage.removeItem('guro_user_session');
          localStorage.removeItem('guro_active_tab');
          localStorage.removeItem('guro_active_sub_tab');
          localStorage.removeItem('guro_student_step');
          localStorage.removeItem('guro_student_subject');
          localStorage.removeItem('guro_student_topic');
          clearAuthToken();
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
