import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { LogoutConfirmModal } from './components/shared/LogoutConfirmModal';
import type { Question } from './pages/LessonSpace';
import { LiveActivityTicker } from './components/teacher/LiveActivityTicker';
import { styles } from './styles/appStyles';
import './App.css';

const StudentSpace = lazy(() => import('./pages/StudentSpace').then(m => ({ default: m.StudentSpace })));
const TeacherSpace = lazy(() => import('./pages/TeacherSpace').then(m => ({ default: m.TeacherSpace })));
const ParentSpace = lazy(() => import('./pages/ParentSpace').then(m => ({ default: m.ParentSpace })));
const LessonSpace = lazy(() => import('./pages/LessonSpace').then(m => ({ default: m.LessonSpace })));
const DashboardSpace = lazy(() => import('./pages/DashboardSpace').then(m => ({ default: m.DashboardSpace })));
import { 
  LayoutDashboard, 
  School, 
  TrendingUp, 
  Key, 
  PlusCircle, 
  Users, 
  Zap, 
  LogOut, 
  User, 
  Laptop,
  RotateCw,
  Sun,
  Moon 
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

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={styles.logoBadge}>GURO</div>
          <span style={styles.logoTitle}>Portal</span>
        </div>

        <nav style={styles.navList}>
          {(!currentUser || currentUser.role === 'lesson-builder' || currentUser.role === 'developer' || currentUser.role === 'teacher') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'dashboard' ? styles.navBtnActive : {}),
              }}
            >
              <LayoutDashboard size={18} />
              <span>System Dashboard</span>
            </button>
          )}

          {(!currentUser || currentUser.role === 'teacher') && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                onClick={() => {
                  setActiveTab('teacher');
                  setActiveSubTab('analytics');
                }}
                style={{
                  ...styles.navBtn,
                  ...(activeTab === 'teacher' ? styles.navBtnActive : {}),
                  marginBottom: '4px',
                }}
              >
                <School size={18} />
                <span>Teacher Console</span>
              </button>
              
              <div style={styles.subNavList}>
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('analytics');
                  }}
                  style={{
                    ...styles.subNavBtn,
                    ...(activeTab === 'teacher' && activeSubTab === 'analytics' ? styles.subNavBtnActive : {}),
                  }}
                >
                  <TrendingUp size={14} style={{ opacity: 0.7 }} />
                  <span>Classroom Analytics</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('classroom-pairing');
                  }}
                  style={{
                    ...styles.subNavBtn,
                    ...(activeTab === 'teacher' && activeSubTab === 'classroom-pairing' ? styles.subNavBtnActive : {}),
                  }}
                >
                  <Key size={14} style={{ opacity: 0.7 }} />
                  <span>Classroom Setup</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('teacher');
                    setActiveSubTab('manual-lesson');
                  }}
                  style={{
                    ...styles.subNavBtn,
                    ...(activeTab === 'teacher' && activeSubTab === 'manual-lesson' ? styles.subNavBtnActive : {}),
                  }}
                >
                  <PlusCircle size={14} style={{ opacity: 0.7 }} />
                  <span>Create Lesson Manually</span>
                </button>
              </div>
            </div>
          )}

          {(!currentUser || currentUser.role === 'parent') && (
            <button
              onClick={() => setActiveTab('parent')}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'parent' ? styles.navBtnActive : {}),
              }}
            >
              <Users size={18} />
              <span>Parent Explorer</span>
            </button>
          )}

          {(!currentUser || currentUser.role === 'lesson-builder' || currentUser.role === 'developer' || currentUser.role === 'teacher') && (
            <button
              onClick={() => setActiveTab('lesson-builder')}
              style={{
                ...styles.navBtn,
                ...(activeTab === 'lesson-builder' ? styles.navBtnActive : {}),
              }}
            >
              <Zap size={18} />
              <span>Lesson Ingestor</span>
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Entrance Role Gateway Button */}
          <button
            onClick={() => {
              if (currentUser) {
                setIsLogoutModalOpen(true);
              } else {
                handleExitToLanding();
              }
            }}
            style={styles.exitBtn}
          >
            <LogOut size={18} />
            <span>{currentUser ? 'Log Out' : 'Exit Workspace'}</span>
          </button>
        </nav>

        <div style={styles.footerSection}>
          <div style={styles.avatar}>
            {currentUser ? <User size={18} style={{ color: '#94A3B8' }} /> : <Laptop size={18} style={{ color: '#94A3B8' }} />}
          </div>
          <div style={{ ...styles.footerInfo, flex: 1 }}>
            <span style={styles.devName}>
              {currentUser ? currentUser.name : 'Guest Workspace'}
            </span>
            <span style={styles.devRole}>
              {currentUser ? `${currentUser.role.toUpperCase()} • Sync'd` : 'Local Session'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            style={styles.themeToggleBtn}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="hover:bg-white/5 active:scale-[0.93] transition-all"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main style={styles.mainContent}>
        {/* Top Header */}
        <header style={styles.header}>
          <div style={styles.breadcrumb}>
            <span style={styles.breadRoot}>GURO</span>
            <span style={styles.breadDivider}>/</span>
            {activeTab === 'teacher' ? (
              <>
                <span style={styles.breadRoot}>Teacher Console</span>
                <span style={styles.breadDivider}>/</span>
                <span style={styles.breadActive}>
                  {activeSubTab === 'analytics' && 'Classroom Analytics'}
                  {activeSubTab === 'classroom-pairing' && 'Classroom Setup'}
                  {activeSubTab === 'manual-lesson' && 'Create Lesson Manually'}
                </span>
              </>
            ) : (
              <span style={styles.breadActive}>
                {activeTab === 'parent' ? 'Parent Explorer' :
                  activeTab === 'dashboard' ? 'System Dashboard' : 'Lesson Ingestor'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {activeTab === 'teacher' && activeSubTab === 'analytics' && (
              <button 
                onClick={() => fetchLogs(false)}
                style={{
                  ...styles.refreshBtn,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RotateCw size={13} />
                <span>Refresh Logs</span>
              </button>
            )}
            <div style={styles.indicatorContainer}>
              <div style={styles.statusDot}></div>
              <span style={styles.statusText}>Sync Server Active</span>
            </div>
          </div>
        </header>

        {/* Live Activity Scrolling Ticker */}
        <LiveActivityTicker events={progressLogs} />

        {/* View Component Wrapper */}
        <div style={styles.viewBody}>
          <Suspense fallback={<div style={{ padding: '24px', color: '#94a3b8' }}>Loading Workspace...</div>}>
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
