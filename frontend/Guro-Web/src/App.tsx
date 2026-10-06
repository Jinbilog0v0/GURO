import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { apiFetch, clearAuthToken } from './utils/api';
import { Toaster } from 'react-hot-toast';
import { toast } from './utils/toast';
import { LandingPage } from './pages/LandingPage';
import { LogoutConfirmModal } from './components/shared/LogoutConfirmModal';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { SkeletonCard, SkeletonTable, SkeletonStatCards, PageLoadingSpinner } from './components/shared/SkeletonLoader';
import type { Question } from './pages/LessonSpace';
import './App.css';

const StudentSpace = lazy(() => import('./pages/StudentSpace').then(m => ({ default: m.StudentSpace })));
const TeacherSpace = lazy(() => import('./pages/TeacherSpace').then(m => ({ default: m.TeacherSpace })));
const ParentSpace = lazy(() => import('./pages/ParentSpace').then(m => ({ default: m.ParentSpace })));
const LessonSpace = lazy(() => import('./pages/LessonSpace').then(m => ({ default: m.LessonSpace })));
const DashboardSpace = lazy(() => import('./pages/DashboardSpace').then(m => ({ default: m.DashboardSpace })));
import { SettingsModal } from './components/settings/SettingsModal';
import {
  LayoutDashboard,
  TrendingUp,
  User,
  UserPlus,
  Zap,
  LogOut,
  RotateCw,
  Sun,
  Moon,
  GraduationCap,
  Shield,
  School,
  BookOpen,
  X,
  Settings
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

type TabType = 'landing' | 'student' | 'teacher' | 'parent' | 'lesson-builder' | 'dashboard' | 'settings';

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
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    const stored = localStorage.getItem('guro_active_sub_tab');
    if (stored) return stored;
    return 'analytics';
  });
  const [progressLogs, setProgressLogs] = useState<SyncedEvent[]>([]);
  const [classroomMembers, setClassroomMembers] = useState<string[]>([]);
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
    if (currentUser && activeTab === 'landing') {
      if (currentUser.role === 'teacher') setActiveTab('dashboard');
      else if (currentUser.role === 'parent') {
        setActiveTab('parent');
        setActiveSubTab('parent-explorer');
      }
      else if (currentUser.role === 'student') setActiveTab('student');
      else if (currentUser.role === 'admin' || currentUser.role === 'developer') setActiveTab('dashboard');
      else if (currentUser.role === 'lesson-builder') setActiveTab('lesson-builder');
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
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

  // Listen to unauthorized event to force sign out
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.clear();
      window.location.reload();
    };
    window.addEventListener('guro_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('guro_unauthorized', handleUnauthorized);
  }, []);

  const [lastUpdatedCell, setLastUpdatedCell] = useState<{ studentId: string; topic: string; timestamp: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (isBackground = false) => {
    const classCode = currentUser?.classroomId || 
      (currentUser?.userId ? localStorage.getItem(`guro_teacher_classroom_code_${currentUser.userId}`) : null) || 
      localStorage.getItem('guro_teacher_classroom_code');
    if (!classCode) {
      setProgressLogs([]);
      setClassroomMembers([]);
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

      // Fetch classroom members list
      const membersResponse = await apiFetch(`/api/classroom/members?classroomId=${encodeURIComponent(classCode)}`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        if (Array.isArray(membersData)) {
          setClassroomMembers(membersData.map(m => m.studentId));
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [currentUser?.classroomId]);

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
  }, [activeTab, currentUser, fetchLogs]);

  // Handle exiting out of specialized sub-spaces back to the landing gate
  const handleExitToLanding = () => {
    setActiveTab('landing');
  };

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setIsSettingsModalOpen(true);
  };

  const handleSaveProfileDirect = async (fName: string, mName: string, lName: string): Promise<boolean> => {
    if (!fName.trim() || !lName.trim()) {
      toast.error('First and Last names are required.');
      return false;
    }
    try {
      const response = await apiFetch('/api/user/update-profile', {
        method: 'POST',
        body: JSON.stringify({
          first_name: fName.trim(),
          middle_name: mName.trim(),
          last_name: lName.trim()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = {
          ...currentUser,
          name: data.user.name,
          firstName: data.user.firstName,
          middleName: data.user.middleName,
          lastName: data.user.lastName
        };
        setCurrentUser(updatedUser as any);
        localStorage.setItem('guro_user_session', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
        return true;
      }
      toast.error(data.error || 'Failed to update profile.');
      return false;
    } catch {
      toast.error('Network error. Unable to update profile.');
      return false;
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    if (currentUser?.userId) {
      localStorage.removeItem(`guro_teacher_classroom_code_${currentUser.userId}`);
      localStorage.removeItem(`guro_teacher_classroom_history_${currentUser.userId}`);
    }
    localStorage.removeItem('guro_teacher_classroom_code');
    localStorage.removeItem('guro_teacher_classroom_history');
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
  };

  // Render full screen spaces vs workspace layouts with sidebars
  if (activeTab === 'landing') {
    return (
      <LandingPage 
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
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
          else if (user.role === 'admin' || user.role === 'developer') setActiveTab('dashboard');
          else if (user.role === 'lesson-builder') setActiveTab('lesson-builder');
        }}
      />
    );
  }

  if (activeTab === 'student') {
    return (
      <>
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
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        </Suspense>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onLogout={() => {
            setIsSettingsModalOpen(false);
            setIsLogoutModalOpen(true);
          }}
          onSaveProfile={handleSaveProfileDirect}
        />
      </>
    );
  }



  const renderContent = () => {
    switch (activeTab) {
      case 'teacher':
        return (
          <TeacherSpace
            currentUser={currentUser}
            progressLogs={progressLogs}
            classroomMembers={classroomMembers}
            lastUpdatedCell={lastUpdatedCell}
            refreshLogs={fetchLogs}
            loading={loading}
            activeSubTab={activeSubTab as any}
            setActiveSubTab={setActiveSubTab as any}
          />
        );
      case 'parent':
        return (
          <ParentSpace
            progressLogs={progressLogs}
            lastUpdatedCell={lastUpdatedCell}
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
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
            currentUser={currentUser}
            progressLogs={progressLogs}
            classroomMembers={classroomMembers}
            lastUpdatedCell={lastUpdatedCell}
            refreshLogs={fetchLogs}
            loading={loading}
            activeSubTab={activeSubTab as any}
            setActiveSubTab={setActiveSubTab as any}
          />
        );
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';
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
        {/* MenuBar Header with Logo and Close (X) Button */}
        <div className={`flex items-center pb-5 mb-1 ${isSidebarOpen ? 'justify-between px-1.5' : 'justify-center'}`}>
          <div className="flex items-center gap-[11px] min-w-0">
            <button
              type="button"
              onClick={!isSidebarOpen ? toggleSidebar : undefined}
              disabled={isSidebarOpen}
              aria-label={!isSidebarOpen ? 'Expand menu' : undefined}
              title={!isSidebarOpen ? 'Click to expand menu' : undefined}
              className={`w-[42px] h-[42px] shrink-0 rounded-[12px] bg-gradient-to-br from-[#11428E] to-[#1C5BC0] flex items-center justify-center text-white font-extrabold text-sm shadow-[0_6px_16px_rgba(17,66,142,0.34)] border-none p-0 ${
                !isSidebarOpen 
                  ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' 
                  : 'cursor-default'
              }`}
            >
              GU
            </button>
            {isSidebarOpen && (
              <div className="leading-tight overflow-hidden">
                <div className="text-[18px] font-extrabold text-[var(--text-main)]">GURO</div>
                <div className={`text-[12px] font-semibold ${isAdmin ? 'text-[#CE1126]' : 'text-[var(--text-muted)]'}`}>
                  {isAdmin ? 'Admin Console' 
                    : currentUser?.role === 'parent' ? 'Parent Portal' 
                    : 'Teacher Portal'}
                </div>
              </div>
            )}
          </div>

          {/* Close (X) icon inside the menuBar - only visible when open */}
          {isSidebarOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Collapse menu"
              title="Collapse menu"
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-7 h-7 flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all duration-200 active:scale-[0.93] shrink-0 ml-2"
            >
              <X size={15} />
            </button>
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
              <div className="flex flex-col gap-1 my-1">
                <div className="px-3.5 pt-3 pb-1 text-[11px] font-extrabold tracking-wider uppercase text-[var(--text-dark)]">
                  Teacher Console
                </div>
                <button 
                  onClick={() => { setActiveTab('teacher'); setActiveSubTab('classrooms'); }} 
                  className={navBtn(activeTab === 'teacher' && (activeSubTab === 'classrooms' || activeSubTab === 'classroom-pairing'))} 
                  aria-current={activeTab === 'teacher' && (activeSubTab === 'classrooms' || activeSubTab === 'classroom-pairing') ? 'page' : undefined}
                >
                  <School size={18} className="shrink-0 text-sky-500" />
                  <span>My Classrooms</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('teacher'); setActiveSubTab('lessons'); }} 
                  className={navBtn(activeTab === 'teacher' && (activeSubTab === 'lessons' || activeSubTab === 'manual-lesson'))} 
                  aria-current={activeTab === 'teacher' && (activeSubTab === 'lessons' || activeSubTab === 'manual-lesson') ? 'page' : undefined}
                >
                  <BookOpen size={18} className="shrink-0 text-emerald-500" />
                  <span>Lesson Management</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('teacher'); setActiveSubTab('analytics'); }} 
                  className={navBtn(activeTab === 'teacher' && (activeSubTab === 'analytics' || activeSubTab === 'pre-post-test'))} 
                  aria-current={activeTab === 'teacher' && (activeSubTab === 'analytics' || activeSubTab === 'pre-post-test') ? 'page' : undefined}
                >
                  <TrendingUp size={18} className="shrink-0 text-indigo-400" />
                  <span>Classroom Analytics</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('teacher'); setActiveSubTab('eosy-promotion'); }} 
                  className={navBtn(activeTab === 'teacher' && activeSubTab === 'eosy-promotion')} 
                  aria-current={activeTab === 'teacher' && activeSubTab === 'eosy-promotion' ? 'page' : undefined}
                >
                  <GraduationCap size={18} className="shrink-0 text-amber-500" />
                  <span>EOSY & Promotion</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('classrooms'); }} className={navBtnIcon(activeTab === 'teacher' && (activeSubTab === 'classrooms' || activeSubTab === 'classroom-pairing'))} title="My Classrooms" aria-label="My Classrooms"><School size={18} /></button>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('lessons'); }} className={navBtnIcon(activeTab === 'teacher' && (activeSubTab === 'lessons' || activeSubTab === 'manual-lesson'))} title="Lesson Management" aria-label="Lesson Management"><BookOpen size={18} /></button>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('analytics'); }} className={navBtnIcon(activeTab === 'teacher' && (activeSubTab === 'analytics' || activeSubTab === 'pre-post-test'))} title="Classroom Analytics" aria-label="Classroom Analytics"><TrendingUp size={18} /></button>
                <button onClick={() => { setActiveTab('teacher'); setActiveSubTab('eosy-promotion'); }} className={navBtnIcon(activeTab === 'teacher' && activeSubTab === 'eosy-promotion')} title="EOSY & Promotion" aria-label="EOSY & Promotion"><GraduationCap size={18} /></button>
              </div>
            )
          )}

          {isParent && (
            isSidebarOpen ? (
              <div className="flex flex-col">
                <div className="px-[14px] pt-4 pb-1.5 text-[10.5px] font-extrabold tracking-[0.1em] uppercase text-[var(--text-dark)]">
                  Parent Console
                </div>
                <div className="flex flex-col gap-[3px] pl-2 border-l-[1.5px] border-[var(--border-color)] ml-[14px]">
                  <button onClick={() => { setActiveTab('parent'); setActiveSubTab('parent-explorer'); }} className={navBtn(activeTab === 'parent' && activeSubTab === 'parent-explorer')} aria-current={activeTab === 'parent' && activeSubTab === 'parent-explorer' ? 'page' : undefined}>
                    <User size={17} className="shrink-0" /><span>Parent Explorer</span>
                  </button>
                  <button onClick={() => { setActiveTab('parent'); setActiveSubTab('create-student'); }} className={navBtn(activeTab === 'parent' && activeSubTab === 'create-student')} aria-current={activeTab === 'parent' && activeSubTab === 'create-student' ? 'page' : undefined}>
                    <UserPlus size={17} className="shrink-0" /><span>Create Student</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => { setActiveTab('parent'); setActiveSubTab('parent-explorer'); }} className={navBtnIcon(activeTab === 'parent' && activeSubTab === 'parent-explorer')} title="Parent Explorer" aria-label="Parent Explorer"><User size={18} /></button>
                <button onClick={() => { setActiveTab('parent'); setActiveSubTab('create-student'); }} className={navBtnIcon(activeTab === 'parent' && activeSubTab === 'create-student')} title="Create Student" aria-label="Create Student"><UserPlus size={18} /></button>
              </>
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
          <div className="border-t border-[var(--border-color)] pt-[14px] flex items-center justify-between gap-[11px]">
            <button
              type="button"
              onClick={currentUser ? handleOpenProfileModal : undefined}
              className={`flex items-center gap-[11px] flex-1 min-w-0 p-1 -ml-1 rounded-xl text-left transition-all ${
                currentUser ? 'cursor-pointer hover:bg-[var(--bg-main)] group active:scale-[0.98]' : 'cursor-default'
              }`}
              title={currentUser ? "Edit Profile Settings" : undefined}
              aria-label={currentUser ? `Profile settings for ${currentUser.name}` : "User profile"}
            >
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
                <span className={`text-sm font-bold text-[var(--text-main)] truncate ${currentUser ? 'group-hover:text-[#2563EB] transition-colors' : ''}`}>
                  {currentUser ? currentUser.name : 'Guest Workspace'}
                </span>
                <span className={`text-[11.5px] font-semibold truncate ${isAdmin ? 'text-[#CE1126]' : 'text-[var(--success)]'}`}>
                  {isAdmin ? 'ADMIN · Division Office' : currentUser ? `${currentUser.role.toUpperCase()} · Sync'd` : 'Local Session'}
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser) {
                  handleOpenProfileModal();
                } else {
                  toast('Please log in to manage profile settings.', { icon: '⚙️' });
                }
              }}
              aria-label="Settings"
              title="Settings"
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] active:scale-[0.93] shrink-0"
            >
              <Settings size={15} />
            </button>
          </div>
        ) : (
          <div className="border-t border-[var(--border-color)] pt-[14px] flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser) {
                  handleOpenProfileModal();
                } else {
                  toast('Please log in to manage profile settings.', { icon: '⚙️' });
                }
              }}
              aria-label="Settings"
              title="Settings"
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] active:scale-[0.93]"
            >
              <Settings size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top Header */}
        <header className="h-[62px] border-b border-[var(--border-color)] flex justify-between items-center px-[30px] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {activeTab === 'teacher' ? (
              <>
                <span className="text-[var(--text-muted)]">Teacher Console</span>
                <span className="text-[var(--border-color)]">/</span>
                <span className="text-[var(--text-main)] font-bold">
                  {(activeSubTab === 'classrooms' || activeSubTab === 'classroom-pairing') && 'My Classrooms'}
                  {(activeSubTab === 'lessons' || activeSubTab === 'manual-lesson') && 'Lesson Management'}
                  {(activeSubTab === 'analytics' || activeSubTab === 'pre-post-test') && 'Classroom Analytics'}
                  {activeSubTab === 'eosy-promotion' && 'EOSY & Promotion'}
                </span>
              </>
            ) : activeTab === 'parent' ? (
              <>
                <span className="text-[var(--text-muted)]">Parent Console</span>
                <span className="text-[var(--border-color)]">/</span>
                <span className="text-[var(--text-main)] font-bold">
                  {activeSubTab === 'create-student' ? 'Create Student Account' : 'Parent Explorer'}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-main)] font-bold">
                {activeTab === 'dashboard' ? (isAdmin ? 'Main Dashboard' : 'System Dashboard')
                  : 'Lesson Ingestor'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'teacher' && activeSubTab === 'analytics' && (
              <button
                onClick={() => fetchLogs(false)}
                aria-label="Refresh sync logs"
                className="bg-white/4 border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-md cursor-pointer text-xs font-semibold transition-all duration-200 hover:bg-white/10 flex items-center gap-1.5"
              >
                <RotateCw size={13} /><span>Refresh Logs</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle in Top Right Navigation */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="bg-transparent border border-[var(--border-color)] rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] active:scale-[0.93] shrink-0 shadow-xs"
            >
              {isDarkMode ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
        </header>

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
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onLogout={() => {
          setIsSettingsModalOpen(false);
          setIsLogoutModalOpen(true);
        }}
        onSaveProfile={handleSaveProfileDirect}
      />
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
      <Toaster position="top-center" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
    </div>
  );
}



export default App;
