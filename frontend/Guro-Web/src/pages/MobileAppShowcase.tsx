import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  BatteryCharging,
  GraduationCap,
  School,
  Users,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  Clock,
  Award,
  Home,
  BarChart2,
  User as UserIcon,
  Zap,
  PenLine,
  Settings,
  Flame,
  Copy,
  Check,
  Play,
  Download,
  SlidersHorizontal,
  Menu,
  X,
  Calendar,
  HelpCircle,
  Tag,
  ChevronDown,
  ChevronUp,
  Calculator,
  Activity,
  FileText,
  Folder,
  Save,
  Search,
  Trash2,
  ClipboardList,
  Target,
  Shield,
  Hourglass,
  Lock,
  Globe,
  Key,
  LogOut,
} from 'lucide-react';

interface MobileAppShowcaseProps {
  onBackToOverview: () => void;
  onLaunchPortal: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

type SimulatedRole = 'student' | 'teacher' | 'parent';

// Navigation types matching Mobile Navigators
type StudentTab = 'home' | 'lessons' | 'progress' | 'me' | 'study' | 'quiz';
type TeacherTab = 'console' | 'ingest' | 'builder' | 'settings';
type ParentTab = 'progress' | 'settings' | 'home' | 'limits';

export const MobileAppShowcase: React.FC<MobileAppShowcaseProps> = ({
  onBackToOverview,
  onLaunchPortal,
  isDarkMode = false,
  onToggleTheme,
}) => {
  // Mobile platform & menu state
  const [isIOS, setIsIOS] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent || '';
      const isApple = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isApple);
    }
  }, []);

  // Simulator Controls State
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>('student');
  const [studentTab, setStudentTab] = useState<StudentTab>('home');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('console');
  const [parentTab, setParentTab] = useState<ParentTab>('progress');
  const [isSimulatedOnline, setIsSimulatedOnline] = useState(true);
  const [simulatedGrade, setSimulatedGrade] = useState<number>(4);

  // Student Experience State
  const [earnedStars, setEarnedStars] = useState(12);
  const [xpPoints, setXpPoints] = useState(65);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');
  
  // Interactive Quiz State
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Interactive Study Slide State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isRefresherOpen, setIsRefresherOpen] = useState(false);
  const [refresherAnswer, setRefresherAnswer] = useState<string | null>(null);

  // Copy code feedback
  const [codeCopied, setCodeCopied] = useState(false);


  // Parent Experience State (Matches Mobile Parent Explorer)
  const [parentStudentName, setParentStudentName] = useState('Neal Jean Claro');
  const [parentAccessCode, setParentAccessCode] = useState('146709');
  const [parentSubTab, setParentSubTab] = useState<'overview' | 'report' | 'milestones'>('overview');
  const [parentScreenTimeLimit, setParentScreenTimeLimit] = useState<number>(0);
  const [parentMathGate, setParentMathGate] = useState(false);
  const [parentPriorityTopic, setParentPriorityTopic] = useState('');
  const [parentServerUrl, setParentServerUrl] = useState('https://neoguro.app');
  const [parentSyncSuccess, setParentSyncSuccess] = useState(false);
  const [parentDeviceId, setParentDeviceId] = useState('SAMPLE-PARENT');
  const [parentDeviceSaved, setParentDeviceSaved] = useState(false);

  // Teacher Experience State (Matches Mobile Teacher Console)
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState<'All Subjects' | 'Mathematics' | 'English'>('All Subjects');
  const [teacherGradeFilter, setTeacherGradeFilter] = useState<'All Grades' | 'Grade 4' | 'Grade 5' | 'Grade 6'>('All Grades');
  const [teacherLessonSearch, setTeacherLessonSearch] = useState('');
  const [expandedTeacherTopics, setExpandedTeacherTopics] = useState<Record<string, boolean>>({
    fractions: false,
    decimals: false,
    mult: false,
  });

  // Mobile console collapse toggle
  const [isMobileConsoleOpen, setIsMobileConsoleOpen] = useState(true);

  // Focus Mode State (Collapse Controls Console)
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(false);

  // Reset simulator
  const handleResetSimulator = () => {
    setSelectedRole('student');
    setStudentTab('home');
    setTeacherTab('console');
    setParentTab('progress');
    setIsSimulatedOnline(true);
    setSimulatedGrade(4);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setCurrentSlideIndex(0);
    setIsRefresherOpen(false);
    setRefresherAnswer(null);
    setCodeCopied(false);
    setTeacherSubjectFilter('All Subjects');
    setTeacherGradeFilter('All Grades');
    setTeacherLessonSearch('');
    setExpandedTeacherTopics({ fractions: false, decimals: false, mult: false });
    setParentStudentName('Neal Jean Claro');
    setParentAccessCode('146709');
    setParentSubTab('overview');
    setParentScreenTimeLimit(0);
    setParentMathGate(false);
    setParentPriorityTopic('');
    setParentServerUrl('https://neoguro.app');
    setParentSyncSuccess(false);
  };

  const sampleSlides = [
    {
      title: 'Equivalent Fractions',
      subject: 'Mathematics',
      concept: 'What is an equivalent fraction?',
      content: 'Fractions that have different numerators and denominators but represent the exact same value are equivalent. For example, 1/2 is equivalent to 2/4 and 3/6.',
      checkpoint: {
        question: 'Which of the following is equivalent to 1/2?',
        options: [
          { key: 'A', text: '2/4' },
          { key: 'B', text: '1/3' },
          { key: 'C', text: '3/4' },
        ],
        correct: 'A',
        explanation: 'Multiplying both numerator and denominator by 2 gives 2/4.',
      },
    },
    {
      title: 'Simplifying Fractions',
      subject: 'Mathematics',
      concept: 'How do we simplify to lowest terms?',
      content: 'Divide both the top and bottom numbers by their Greatest Common Factor (GCF) until no further division is possible except by 1.',
      checkpoint: {
        question: 'What is 4/8 in lowest terms?',
        options: [
          { key: 'A', text: '2/4' },
          { key: 'B', text: '1/2' },
          { key: 'C', text: '1/4' },
        ],
        correct: 'B',
        explanation: 'Dividing both 4 and 8 by 4 results in 1/2.',
      },
    },
  ];

  const sampleTopics = [
    {
      id: 'math-1',
      title: 'Equivalent Fractions',
      subject: 'Mathematics',
      badge: 'DepEd MELC G4',
      status: 'Completed (90%)',
      stars: 3,
    },
    {
      id: 'math-2',
      title: 'Decimals & Place Value',
      subject: 'Mathematics',
      badge: 'DepEd MELC G4',
      status: 'In Progress (60%)',
      stars: 2,
    },
    {
      id: 'eng-1',
      title: 'Figurative Language (Similes & Metaphors)',
      subject: 'English',
      badge: 'DepEd MELC G4',
      status: 'Up Next',
      stars: 0,
    },
  ];

  const filteredTopics = sampleTopics.filter(t => 
    selectedSubjectFilter === 'All' ? true : t.subject === selectedSubjectFilter
  );

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      
      {/* ── Top Header Bar — iOS: Frosted Glass | Android: M3 Solid Elevation ── */}
      <header className={`sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between transition-all duration-200 ${
        isIOS
          ? 'bg-[var(--bg-card)]/70 backdrop-blur-xl border-b border-[var(--border-color)]/60 shadow-[0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/5'
          : 'bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm'
      }`}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToOverview}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
              isIOS
                ? 'border-[var(--border-color)]/70 bg-[var(--bg-main)]/60 text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90'
                : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-95'
            }`}
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </button>
          <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-[#11428E] dark:text-sky-400 tracking-tight">GURO</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold hidden sm:inline-block">
              Mobile App Simulator
            </span>
          </div>
        </div>

        {/* Desktop Header Actions (hidden on phone, visible md+) */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
            aria-label={isConsoleCollapsed ? 'Show Simulator Console' : 'Focus Phone Mode'}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer"
            title={isConsoleCollapsed ? 'Show Controls Console' : 'Focus on Mobile Screen Only'}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{isConsoleCollapsed ? 'Show Console' : 'Focus Phone'}</span>
          </button>

          <a
            href="https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk"
            target="_blank"
            rel="noopener noreferrer"
            download="GURO-preview.apk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Download Standalone Android APK (v1.0.1)"
          >
            <Download className="size-3.5 text-sky-500" />
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">APK</span>
          </a>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-[#11428E]" />}
            </button>
          )}

          <button
            onClick={onLaunchPortal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#11428E]/20 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <span>Sign In</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {/* Mobile Header Menu Trigger (Phone only) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              isMobileMenuOpen ? 'z-[60]' : 'z-10'
            } ${
              isIOS
                ? 'border border-[var(--border-color)] bg-[var(--bg-main)]/60 hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90'
                : 'bg-[var(--bg-card)] hover:bg-[var(--border-color)]/40 text-[var(--text-main)] shadow-sm border border-[var(--border-color)] active:scale-95'
            }`}
          >
            {isMobileMenuOpen ? <X className="size-5 text-[var(--text-main)]" /> : <Menu className="size-5 text-[var(--text-main)]" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Top-Right Actions Dropdown (Compact 40-50% width) ── */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay — z-50 to grey out top navigation, phone simulator status bar, and phone bottom navigation */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Floating Dropdown Menu (40-50% screen width, right-aligned) */}
          <div
            data-testid="showcase-mobile-top-action-menu"
            className={`fixed top-14 right-3 w-[50%] min-w-[170px] max-w-[210px] z-[60] p-2 rounded-2xl border shadow-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
              isIOS
                ? 'bg-[var(--bg-card)]/85 backdrop-blur-2xl border-[var(--border-color)]/70 ring-1 ring-white/10 shadow-black/25'
                : 'bg-white dark:bg-[#0d1322] border-[var(--border-color)] shadow-[0_12px_32px_rgba(0,0,0,0.35)]'
            }`}
          >
            <div className="flex flex-col gap-1">
              {/* Download App Link */}
              <a
                href="https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk"
                target="_blank"
                rel="noopener noreferrer"
                download="GURO-preview.apk"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
              >
                <Download className="size-3.5 text-sky-500 shrink-0" />
                <span className="truncate">Download App</span>
              </a>

              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                >
                  {isDarkMode ? <Sun className="size-3.5 text-amber-400 shrink-0" /> : <Moon className="size-3.5 text-[#11428E] shrink-0" />}
                  <span className="truncate">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              )}

              {/* Sign In Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLaunchPortal();
                }}
                className="flex items-center justify-between w-full px-3 py-2 mt-0.5 rounded-xl bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>Sign In</span>
                <ArrowRight className="size-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main Showcase Workspace ── */}
      <div className="flex-1 w-full mx-auto p-0 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-center justify-center h-[calc(100dvh-3.5rem)] md:h-auto md:min-h-[calc(100vh-4rem)] overflow-hidden md:overflow-visible">
        
        {/* ── Left Column: Simulator Controls Dashboard (Hidden on Phone/Tablet screens) ── */}
        <div className={`w-full lg:w-[340px] shrink-0 transition-all duration-300 ${
          isConsoleCollapsed ? 'hidden' : 'hidden lg:flex flex-col gap-4'
        }`}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">Simulator Console</h3>
                <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">Control the mini mobile app live</p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsMobileConsoleOpen(!isMobileConsoleOpen)}
                  className="lg:hidden px-2.5 py-1 text-xs font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  {isMobileConsoleOpen ? 'Hide' : 'Controls'}
                </button>
                <button
                  onClick={handleResetSimulator}
                  className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  title="Reset Simulator"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            </div>

            <div className={`flex flex-col gap-4 sm:gap-5 ${isMobileConsoleOpen ? 'flex' : 'hidden lg:flex'}`}>
              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                  1. Select Audience Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap, color: 'text-emerald-500' },
                    { id: 'teacher', label: 'Teacher', icon: School, color: 'text-blue-500' },
                    { id: 'parent', label: 'Parent', icon: Users, color: 'text-amber-500' },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isActive = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRole(r.id as SimulatedRole);
                          if (r.id === 'student') setStudentTab('home');
                          if (r.id === 'teacher') setTeacherTab('console');
                          if (r.id === 'parent') setParentTab('progress');
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <Icon className={`size-4 ${r.color}`} />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simulated Mobile Tabs List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                    2. Active Mobile Tab
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Click on phone or here</span>
                </div>

                {selectedRole === 'student' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'home', label: 'Dashboard (Home)' },
                      { id: 'lessons', label: 'Lessons Library' },
                      { id: 'progress', label: 'My Progress' },
                      { id: 'me', label: 'Profile & Mascot' },
                    ].map((tb) => (
                      <button
                        key={tb.id}
                        onClick={() => setStudentTab(tb.id as StudentTab)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                          studentTab === tb.id
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRole === 'teacher' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'console', label: 'Console (Overview)' },
                      { id: 'ingest', label: 'AI Lesson Ingest' },
                      { id: 'builder', label: 'Lesson Builder' },
                      { id: 'settings', label: 'Settings & Diagnostics' },
                    ].map((tb) => (
                      <button
                        key={tb.id}
                        onClick={() => setTeacherTab(tb.id as TeacherTab)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                          teacherTab === tb.id
                            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                )}

                {selectedRole === 'parent' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'progress', label: 'Child Progress' },
                      { id: 'settings', label: 'Device Settings' },
                    ].map((tb) => (
                      <button
                        key={tb.id}
                        onClick={() => setParentTab(tb.id as ParentTab)}
                        className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                          (parentTab === tb.id || (tb.id === 'progress' && parentTab === 'home') || (tb.id === 'settings' && parentTab === 'limits'))
                            ? 'border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 font-bold'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Offline Simulation Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                  3. Network Mode (Offline Resilience)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulatedOnline(true)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSimulatedOnline
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]/40 text-[var(--text-muted)]'
                    }`}
                  >
                    <Wifi className="size-3.5 text-emerald-500" />
                    <span>Online</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSimulatedOnline(false)}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      !isSimulatedOnline
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)]/40 text-[var(--text-muted)]'
                    }`}
                  >
                    <WifiOff className="size-3.5 text-amber-500" />
                    <span>Offline (0 Data)</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                  Toggle between online and zero-data offline to observe local caching and quiz execution inside the phone.
                </p>
              </div>

              {/* Grade Switcher (Only visible for Student role) */}
              {selectedRole === 'student' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                    4. Simulated Grade Curriculum
                  </label>
                  <div className="flex gap-2">
                    {[4, 5, 6].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSimulatedGrade(g)}
                        className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          simulatedGrade === g
                            ? 'border-[#11428E] bg-[#11428E] text-white shadow-xs'
                            : 'border-[var(--border-color)] bg-[var(--bg-main)]/40 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Smartphone Device Chassis Frame (Edge-to-Edge on Mobile, Phone Bezel on Desktop) ── */}
        <div className="shrink-0 flex flex-col items-center justify-center">
          <div
            data-testid="phone-device-wrapper"
            className="w-full select-none relative transition-all duration-300 flex flex-col h-full max-h-[calc(100dvh-3.5rem)] md:h-[680px] lg:h-[min(760px,calc(100vh-6rem))] md:w-[375px] max-w-md rounded-none md:rounded-[50px] bg-transparent md:bg-slate-950 p-0 md:p-3.5 md:shadow-2xl md:ring-1 md:ring-slate-800/80 md:border-4 md:border-slate-700/60"
          >
            {/* Dynamic Island / Speaker (Hidden on mobile devices, shown on desktop simulator) */}
            <div
              data-testid="dynamic-island"
              className="hidden md:flex absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 items-center justify-between px-2.5"
            >
              <div className="size-2 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <div className="size-1.5 rounded-full bg-blue-900/40" />
            </div>

            {/* Inner Phone Screen / Native Edge-to-Edge Full Screen on Mobile, Bezel Card on Desktop */}
            <div className="w-full h-full rounded-none md:rounded-[40px] bg-[var(--bg-main)] overflow-hidden flex flex-col relative border-0 md:border md:border-[var(--border-color)] shadow-none">
              
              {/* Phone Status Bar */}
              <div className="h-10 px-4 sm:px-6 pt-1 flex items-center justify-between text-[11px] font-bold text-[var(--text-main)] z-40 bg-[var(--bg-main)]/90 backdrop-blur-sm border-b border-[var(--border-color)]/40">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  {isSimulatedOnline ? (
                    <span className="flex items-center gap-0.5 text-emerald-500 text-[10px]">
                      <Wifi size={12} />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-amber-500 text-[10px]">
                      <WifiOff size={12} />
                      <span>Offline</span>
                    </span>
                  )}
                  <BatteryCharging size={13} className="text-[var(--text-main)]" />
                </div>
              </div>

              {/* ── Phone Screen Content Body ── */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3.5 scrollbar-none">
                
                {/* ════════════════════════ STUDENT TABS ════════════════════════ */}
                
                {/* 1. STUDENT HOME / DASHBOARD */}
                {selectedRole === 'student' && studentTab === 'home' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Welcome Banner Card */}
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-[#11428E] via-[#1C5BC0] to-[#A01322] text-white shadow-md flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider">
                          Student Space
                        </span>
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Flame size={12} /> Level 3 Explorer
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold tracking-tight text-white">Welcome back, Juan!</h4>
                      
                      {/* Companion Message */}
                      <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-[11px] flex items-center gap-2">
                        <Sparkles size={13} className="text-amber-300 shrink-0" />
                        <span className="leading-tight text-white/95">"Ready to master Equivalent Fractions today?"</span>
                      </div>

                      {/* XP Progress Bar */}
                      <div className="flex flex-col gap-1 mt-0.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                          <span>Progress XP</span>
                          <span>{xpPoints} / 100 XP</span>
                        </div>
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${xpPoints}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Classroom Connection Card */}
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <School size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--text-main)]">Grade 4 - Rizal</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Teacher: Ms. Maria</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Connected
                      </span>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center text-center">
                        <span className="text-sm font-black text-amber-500">⭐ {earnedStars}</span>
                        <span className="text-[9px] font-semibold text-[var(--text-muted)]">Total Stars</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center text-center">
                        <span className="text-sm font-black text-[#11428E] dark:text-sky-400">8</span>
                        <span className="text-[9px] font-semibold text-[var(--text-muted)]">Completed</span>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center text-center">
                        <span className="text-sm font-black text-emerald-500">92%</span>
                        <span className="text-[9px] font-semibold text-[var(--text-muted)]">Accuracy</span>
                      </div>
                    </div>

                    {/* Today's Recommended Lesson Card */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[#11428E]/30 shadow-xs flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-[#11428E] dark:text-sky-400">
                          Today's Pick
                        </span>
                        <span className="text-[10px] font-bold text-amber-500">Grade {simulatedGrade} Math</span>
                      </div>
                      <h5 className="text-xs font-black text-[var(--text-main)]">Equivalent Fractions</h5>
                      <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                        Learn how fractions with different numbers can represent the same amount.
                      </p>
                      
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setStudentTab('study')}
                          className="flex-1 py-1.5 rounded-xl bg-[#11428E] text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <BookOpen size={12} />
                          <span>Study Slide</span>
                        </button>
                        <button
                          onClick={() => setStudentTab('quiz')}
                          className="flex-1 py-1.5 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-300 bg-amber-500/10 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Award size={12} />
                          <span>Take Quiz</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. STUDENT LESSONS LIBRARY */}
                {selectedRole === 'student' && studentTab === 'lessons' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--text-main)]">Lesson Catalog</span>
                      <span className="text-[10px] font-bold text-[#11428E] dark:text-sky-400">Grade {simulatedGrade} MELC</span>
                    </div>

                    {/* Subject Filter Chips */}
                    <div className="flex gap-1.5">
                      {(['All', 'Mathematics', 'English'] as const).map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubjectFilter(sub)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            selectedSubjectFilter === sub
                              ? 'bg-[#11428E] text-white'
                              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>

                    {/* Topic Cards List */}
                    <div className="flex flex-col gap-2.5">
                      {filteredTopics.map((topic) => (
                        <div key={topic.id} className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                              {topic.subject}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {topic.status}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-[var(--text-main)]">{topic.title}</h5>

                          <div className="flex gap-2 pt-1 border-t border-[var(--border-color)]/60">
                            <button
                              onClick={() => setStudentTab('study')}
                              className="flex-1 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[10px] font-bold text-[var(--text-main)] flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <BookOpen size={11} /> Study
                            </button>
                            <button
                              onClick={() => setStudentTab('quiz')}
                              className="flex-1 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play size={11} /> Quiz
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. STUDENT MY PROGRESS */}
                {selectedRole === 'student' && studentTab === 'progress' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--text-main)]">My Learning Progress</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        +24.6% Growth
                      </span>
                    </div>

                    {/* Competency Mastery List */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-3">
                      <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)]">MELC Competency Mastery</span>
                      
                      {[
                        { name: 'Fractions & Decimals', mastery: 92, color: 'bg-emerald-500' },
                        { name: 'Multiplication & Division', mastery: 85, color: 'bg-blue-500' },
                        { name: 'Reading Comprehension', mastery: 88, color: 'bg-indigo-500' },
                        { name: 'Grammar & Vocabulary', mastery: 78, color: 'bg-amber-500' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-semibold text-[var(--text-main)]">
                            <span className="truncate">{item.name}</span>
                            <span className="font-bold">{item.mastery}%</span>
                          </div>
                          <div className="w-full bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden">
                            <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.mastery}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Telemetry Status Box */}
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-[11px] leading-tight">
                        All progress logs are stored locally. Ready for automatic sync when connected!
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. STUDENT PROFILE & ME */}
                {selectedRole === 'student' && studentTab === 'me' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Mascot Profile Header */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#11428E]/15 to-[#A01322]/15 border border-[#11428E]/20 flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-[#11428E] text-white flex items-center justify-center text-xl shadow-xs">
                        🦉
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[var(--text-main)]">Juan Dela Cruz</h4>
                        <p className="text-[11px] text-[var(--text-muted)] font-semibold">Grade {simulatedGrade} Explorer • {xpPoints} XP</p>
                      </div>
                    </div>

                    {/* 6-Digit Parent Access Code */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                        <span>Parent Access Code</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          }}
                          className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 cursor-pointer"
                        >
                          {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-main)] text-center font-mono font-black text-base text-[#11428E] dark:text-sky-300 tracking-widest border border-amber-500/30">
                        582-910
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] text-center">
                        Give this 6-digit code to parents to let them track your learning journey.
                      </p>
                    </div>

                    {/* Badges Collection */}
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase">My Badges</span>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { emoji: '⭐', label: 'First Quiz' },
                          { emoji: '📐', label: 'Math Star' },
                          { emoji: '📖', label: 'Reader' },
                          { emoji: '🔥', label: 'Streak' },
                        ].map((b, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col items-center">
                            <span className="text-base">{b.emoji}</span>
                            <span className="text-[8px] font-bold text-[var(--text-muted)] mt-0.5">{b.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. STUDENT STUDY SLIDES (Interactive Screen) */}
                {selectedRole === 'student' && studentTab === 'study' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Header with Back button */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setStudentTab('home')}
                        className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Back</span>
                      </button>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                        Slide {currentSlideIndex + 1}/{sampleSlides.length}
                      </span>
                    </div>

                    {/* Slide Card */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                        <BookOpen className="size-4 text-[#11428E]" />
                        <span>{sampleSlides[currentSlideIndex].concept}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {sampleSlides[currentSlideIndex].content}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                        <button
                          disabled={currentSlideIndex === 0}
                          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--border-color)] disabled:opacity-30 cursor-pointer"
                        >
                          Prev
                        </button>
                        <div className="flex gap-1">
                          {sampleSlides.map((_, i) => (
                            <div
                              key={i}
                              className={`size-1.5 rounded-full ${
                                i === currentSlideIndex ? 'bg-[#11428E] dark:bg-sky-400' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <button
                          disabled={currentSlideIndex === sampleSlides.length - 1}
                          onClick={() => setCurrentSlideIndex((prev) => Math.min(sampleSlides.length - 1, prev + 1))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#11428E] text-white disabled:opacity-30 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>

                    {/* Refresher Checkpoint Accordion */}
                    <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsRefresherOpen(!isRefresherOpen)}
                        className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--bg-main)]/50"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-[var(--text-main)]">
                            Refresher Quick Check
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#11428E] dark:text-sky-400">
                          {isRefresherOpen ? 'Collapse ▲' : 'Open ▼'}
                        </span>
                      </button>

                      {isRefresherOpen && (
                        <div className="p-3 pt-0 border-t border-[var(--border-color)]/60 flex flex-col gap-2 mt-2">
                          <p className="text-xs font-semibold text-[var(--text-main)]">
                            {sampleSlides[currentSlideIndex].checkpoint.question}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {sampleSlides[currentSlideIndex].checkpoint.options.map((opt) => {
                              const isSelected = refresherAnswer === opt.key;
                              const isCorrect = opt.key === sampleSlides[currentSlideIndex].checkpoint.correct;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => setRefresherAnswer(opt.key)}
                                  className={`p-2 rounded-xl border text-xs text-left font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? isCorrect
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                        : 'border-red-500 bg-red-500/10 text-red-600'
                                      : 'border-[var(--border-color)] bg-[var(--bg-main)]/40 text-[var(--text-muted)]'
                                  }`}
                                >
                                  <span>{opt.key}. {opt.text}</span>
                                  {isSelected && (isCorrect ? <CheckCircle2 size={13} className="text-emerald-500" /> : <span className="text-[10px] text-red-500">Retry</span>)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. STUDENT QUIZ (Interactive Screen) */}
                {selectedRole === 'student' && studentTab === 'quiz' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setStudentTab('home')}
                        className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Exit Quiz</span>
                      </button>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-extrabold">
                        <span>⭐</span>
                        <span>{earnedStars} Stars</span>
                      </div>
                    </div>

                    <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-2/3" />
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-[#11428E] dark:text-sky-400 uppercase">Question 2 of 3</span>
                      <p className="text-xs font-bold text-[var(--text-main)] leading-relaxed">
                        A recipe calls for 3/4 cup of sugar. If Juan makes double the recipe, how much sugar does he need?
                      </p>

                      <div className="flex flex-col gap-2">
                        {[
                          { key: 'A', text: '1 1/2 cups', correct: true },
                          { key: 'B', text: '6/8 cup', correct: false },
                          { key: 'C', text: '1 cup', correct: false },
                        ].map((opt) => {
                          const isSelected = selectedQuizAnswer === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => {
                                setSelectedQuizAnswer(opt.key);
                                setQuizSubmitted(true);
                                if (opt.correct) {
                                  setEarnedStars(prev => prev + 1);
                                  setXpPoints(prev => Math.min(100, prev + 15));
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? opt.correct
                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300'
                                  : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                              }`}
                            >
                              <span>{opt.key}. {opt.text}</span>
                              {quizSubmitted && isSelected && (
                                opt.correct ? <CheckCircle2 size={14} className="text-emerald-500" /> : <span className="text-[10px] text-red-500">Incorrect</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px] leading-relaxed">
                          🎉 <strong>Correct!</strong> 3/4 × 2 = 6/4 = 1 1/2 cups. You earned 1 Star &amp; +15 XP!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ════════════════════════ TEACHER TABS ════════════════════════ */}
                {/* 1. TEACHER CONSOLE / OVERVIEW */}
                {selectedRole === 'teacher' && teacherTab === 'console' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Top Header Card (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      {/* Top Blue Accent Line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />

                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                            GURO Teacher Console
                          </h4>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#11428E]/8 dark:bg-sky-950/40 text-[#11428E] dark:text-sky-300 border border-[#11428E]/15 text-[9px] font-bold mt-1">
                            <Calendar size={10} />
                            <span>S.Y. 2026-2027 • Quarter 1</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">
                            Real-Time Classroom Telemetry &amp; DepEd Reporting
                          </p>
                        </div>

                        {/* Stacked Badges & Settings Button */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-extrabold uppercase">
                            TEACHER
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${
                            isSimulatedOnline
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`size-1.5 rounded-full ${isSimulatedOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {isSimulatedOnline ? 'Connected' : 'Offline'}
                          </span>
                          <button
                            onClick={() => setTeacherTab('settings')}
                            className="size-7 rounded-full bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-xs mt-0.5"
                            title="Open Settings"
                          >
                            <Settings size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item Bank Overview (3 Stat Cards) */}
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-col">
                        <h5 className="text-xs font-black text-[var(--text-main)]">Item Bank Overview</h5>
                        <span className="text-[10px] text-[var(--text-muted)]">Live count from local item bank</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-0.5">
                        <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center text-center shadow-xs">
                          <BookOpen size={16} className="text-slate-500 dark:text-slate-400 mb-1" />
                          <span className="text-base font-black text-[var(--text-main)]">1</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">SUBJECTS</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center text-center shadow-xs">
                          <HelpCircle size={16} className="text-slate-500 dark:text-slate-400 mb-1" />
                          <span className="text-base font-black text-[var(--text-main)]">8</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">QUESTIONS</span>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center text-center shadow-xs">
                          <Tag size={16} className="text-slate-500 dark:text-slate-400 mb-1" />
                          <span className="text-base font-black text-[var(--text-main)]">5</span>
                          <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">TOPICS</span>
                        </div>
                      </div>
                    </div>

                    {/* Lessons Overview Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3 flex flex-col gap-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Folder size={14} className="text-[#11428E] dark:text-sky-300" />
                          <h5 className="text-xs font-black text-[var(--text-main)]">Lessons Overview</h5>
                        </div>
                        <button
                          onClick={() => setTeacherTab('ingest')}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#11428E] dark:text-sky-300 border border-[#11428E]/20 text-[10px] font-extrabold cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors"
                        >
                          <Sparkles size={11} />
                          <span>+ Ingest</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] -mt-1">
                        Claimed &amp; active lessons in ENG-G4-URV
                      </span>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search topics or questions..."
                          value={teacherLessonSearch}
                          onChange={(e) => setTeacherLessonSearch(e.target.value)}
                          className="w-full text-[11px] py-1.5 pl-7 pr-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden"
                        />
                      </div>

                      {/* Segmented Filter Pills: Subjects */}
                      <div className="p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-1">
                        {(['All Subjects', 'Mathematics', 'English'] as const).map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setTeacherSubjectFilter(sub)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              teacherSubjectFilter === sub
                                ? 'bg-[var(--bg-card)] text-[#11428E] dark:text-sky-300 shadow-xs border border-[var(--border-color)]/60'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>

                      {/* Segmented Filter Pills: Grades */}
                      <div className="p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-1">
                        {(['All Grades', 'Grade 4', 'Grade 5', 'Grade 6'] as const).map((gr) => (
                          <button
                            key={gr}
                            onClick={() => setTeacherGradeFilter(gr)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                              teacherGradeFilter === gr
                                ? 'bg-[var(--bg-card)] text-[#11428E] dark:text-sky-300 shadow-xs border border-[var(--border-color)]/60'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                            }`}
                          >
                            {gr}
                          </button>
                        ))}
                      </div>

                      {/* Lessons List Accordion Items */}
                      <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border-color)]/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-main)]">
                            <Calculator size={12} className="text-slate-500" />
                            <span>Mathematics</span>
                            <span className="size-1 rounded-full bg-emerald-500" />
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">Grade 4</span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            DepEd SF9 Progress Ready
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {[
                            { name: 'Fractions', count: 3, id: 'fractions' },
                            { name: 'Decimals', count: 2, id: 'decimals' },
                            { name: 'Multiplication & Division', count: 1, id: 'mult' },
                          ].map((item) => {
                            const isExpanded = !!expandedTeacherTopics[item.id];
                            return (
                              <div key={item.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/40 overflow-hidden">
                                <button
                                  onClick={() => setExpandedTeacherTopics(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                  className="w-full p-2 flex items-center justify-between text-[11px] cursor-pointer hover:bg-[var(--bg-main)] transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
                                    {isExpanded ? <ChevronUp size={12} className="text-[var(--text-muted)]" /> : <ChevronDown size={12} className="text-[var(--text-muted)]" />}
                                    <span>{item.name}</span>
                                  </div>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                    {item.count} items
                                  </span>
                                </button>
                                {isExpanded && (
                                  <div className="px-3 pb-2 pt-1 border-t border-[var(--border-color)]/50 text-[10px] text-[var(--text-muted)] flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                      <span>• Identifying Common Parts</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">3 Checkpoints</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span>• Mixed Numbers Addition</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Mastery Tracked</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Curriculum Health & Tally Section */}
                    <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-xl bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 flex items-center justify-center">
                          <Activity size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--text-main)]">Curriculum Health &amp; Tally</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% DepEd MELC Aligned</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#11428E] dark:text-sky-300">Active</span>
                    </div>
                  </div>
                )}

                {/* 2. TEACHER AI INGEST */}
                {selectedRole === 'teacher' && teacherTab === 'ingest' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Header (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                            AI Lesson Ingestor
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                            AI Lesson Ingestion &amp; Curriculum Parser
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-extrabold uppercase">
                            TEACHER
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ingestion Workspace */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Ingestion Workspace</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Configure course parameters and paste lesson details</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">SUBJECT</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="py-2 rounded-xl border-2 border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 text-xs font-bold">
                            Mathematics
                          </button>
                          <button className="py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-xs font-semibold">
                            English
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">GRADE LEVEL</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button className="py-1.5 rounded-xl border-2 border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 text-[11px] font-bold">
                            Grade 4
                          </button>
                          <button className="py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[11px] font-semibold">
                            Grade 5
                          </button>
                          <button className="py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[11px] font-semibold">
                            Grade 6
                          </button>
                        </div>
                      </div>

                      <button className="p-3 rounded-xl border-2 border-dashed border-[#11428E]/40 text-[#11428E] dark:text-sky-300 flex items-center justify-center gap-2 text-xs font-bold hover:bg-[#11428E]/5 transition-colors cursor-pointer">
                        <FileText size={15} />
                        <span>Upload PDF Lesson Plan</span>
                      </button>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">LESSON TOPIC</span>
                        <input
                          type="text"
                          readOnly
                          value="Adding Dissimilar Fractions"
                          className="w-full text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)]"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">QUESTION VOLUME &amp; DENSITY</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button className="py-1.5 px-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-semibold text-center">
                            10 Questions
                          </button>
                          <button className="py-1.5 px-1 rounded-xl border-2 border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 text-[10px] font-bold text-center">
                            15 Questions
                          </button>
                          <button className="py-1.5 px-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[10px] font-semibold text-center">
                            20 Questions
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TEACHER LESSON BUILDER */}
                {selectedRole === 'teacher' && teacherTab === 'builder' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Header (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                            Manual Lesson Builder
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                            Create Lesson Manually
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-extrabold uppercase">
                            TEACHER
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Lesson Metadata Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Step 1: Lesson Metadata</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Set subject, grade, and topic</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">SUBJECT</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="py-1.5 rounded-xl border-2 border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 text-xs font-bold">
                            Mathematics
                          </button>
                          <button className="py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-xs font-semibold">
                            English
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">GRADE LEVEL</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button className="py-1.5 rounded-xl border-2 border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 text-[11px] font-bold">
                            Grade 4
                          </button>
                          <button className="py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[11px] font-semibold">
                            Grade 5
                          </button>
                          <button className="py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] text-[11px] font-semibold">
                            Grade 6
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">LESSON TOPIC *</span>
                        <input
                          type="text"
                          readOnly
                          value="Adding Dissimilar Fractions"
                          className="w-full text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)]"
                        />
                      </div>
                    </div>

                    {/* Step 2: Item Bank Questions */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2 shadow-xs">
                      <h5 className="text-xs font-black text-[var(--text-main)]">Step 2: Item Bank Questions (1)</h5>
                      <span className="text-[10px] text-[var(--text-muted)]">Tap a letter bubble to mark the correct answer</span>
                      <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/40 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#11428E]/10 text-[#11428E] dark:text-sky-300">Q1</span>
                          <span className="text-[9px] text-[var(--text-muted)]">Multiple Choice</span>
                        </div>
                        <p className="text-xs font-bold text-[var(--text-main)]">What is 1/2 + 1/4?</p>
                        <div className="grid grid-cols-2 gap-1.5 mt-1 text-[11px]">
                          <span className="p-1.5 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">A. 3/4 ✓</span>
                          <span className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)]">B. 2/6</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. TEACHER SETTINGS & DIAGNOSTICS */}
                {selectedRole === 'teacher' && teacherTab === 'settings' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Header (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                            Settings &amp; Diagnostics
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">
                            Configure endpoints and file reports
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-extrabold uppercase">
                            TEACHER
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* New Diagnostic Report Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">New Diagnostic Report</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Save a student diagnostic to the local file system</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">REPORT TITLE</span>
                        <input
                          type="text"
                          readOnly
                          value="Grade4_Math_Fractions_Session1"
                          className="w-full text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)]"
                        />
                      </div>
                      <button className="w-full py-2 px-3 rounded-xl bg-[#11428E] hover:bg-[#0c316b] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors mt-1">
                        <Save size={13} />
                        <span>Save to Device</span>
                      </button>
                    </div>

                    {/* Classroom Pairing & Setup */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Classroom Pairing &amp; Setup</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Generate codes to link student devices to your dashboard</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border-color)] flex items-center justify-between mt-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">INVITE CODE</span>
                          <span className="font-mono text-sm font-black text-[#11428E] dark:text-sky-300">ENG-G4-URV</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                          STATUS: ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════════════════════ PARENT TABS ════════════════════════ */}
                {/* 1. CHILD PROGRESS & LEARNING */}
                {selectedRole === 'parent' && (parentTab === 'progress' || parentTab === 'home') && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Top Header Card (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                              GURO Parent Explorer
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-bold mt-1">
                            <Calendar size={10} />
                            <span>S.Y. 2026-2027 • Quarter 1</span>
                          </span>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">
                            Child Progress &amp; Parental Controls
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Parent
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parent Progress Explorer Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <UserIcon size={16} className="text-[#A01322]" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Parent Progress Explorer</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Query child performance history from server</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">
                          CHILD'S NAME (LAST NAME, FIRST NAME) OR STUDENT ID
                        </label>
                        <input
                          type="text"
                          value={parentStudentName}
                          onChange={(e) => setParentStudentName(e.target.value)}
                          placeholder="e.g. Cruz, Juan or Student ID"
                          className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-medium focus:outline-hidden"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">
                          6-DIGIT PARENT ACCESS CODE
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={parentAccessCode}
                          onChange={(e) => setParentAccessCode(e.target.value)}
                          placeholder="e.g. 123456"
                          className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono font-medium focus:outline-hidden"
                        />
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => {}}
                          className="flex-1 py-2 px-3 rounded-xl bg-[#11428E] hover:bg-[#1C5BC0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Search size={14} />
                          <span>Search Reports</span>
                        </button>
                        <button
                          onClick={() => {
                            setParentStudentName('');
                            setParentAccessCode('');
                          }}
                          className="size-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[#A01322] border border-[#A01322]/20 flex items-center justify-center transition-colors cursor-pointer"
                          title="Clear inputs"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Stats Row (3 Columns) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 text-center shadow-2xs">
                        <ClipboardList size={16} className="text-[var(--text-muted)]" />
                        <span className="text-base font-black text-[var(--text-main)] leading-none">1</span>
                        <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">LESSONS COMPLETED</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 text-center shadow-2xs">
                        <Target size={16} className="text-emerald-500" />
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">100%</span>
                        <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">AVERAGE ACCURACY</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center gap-1 text-center shadow-2xs">
                        <BarChart2 size={16} className="text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1">Advanced</span>
                        <span className="text-[8px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">STATUS</span>
                      </div>
                    </div>

                    {/* Segmented Sub-Tabs */}
                    <div className="p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-1">
                      {[
                        { id: 'overview', label: 'Activity Heatmap' },
                        { id: 'report', label: 'Tutor Report' },
                        { id: 'milestones', label: 'Badge Case' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setParentSubTab(t.id as 'overview' | 'report' | 'milestones')}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                            parentSubTab === t.id
                              ? 'bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 border border-[#11428E]/20 shadow-2xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Activity Heatmap Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Activity Heatmap</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Daily assessment completion intensity (Past 28 Days)</p>
                        </div>
                      </div>

                      {/* 4x7 Dots Grid */}
                      <div className="flex flex-col items-center my-1">
                        <div className="grid grid-cols-7 gap-2">
                          {Array.from({ length: 28 }).map((_, i) => {
                            const isFilled = i === 27; // today completed
                            return (
                              <div
                                key={i}
                                className={`size-5 rounded-md border transition-colors ${
                                  isFilled
                                    ? 'bg-[#11428E] border-[#11428E] shadow-2xs'
                                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 text-[9px] text-[var(--text-muted)]">
                        <span>Less</span>
                        <div className="size-2.5 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
                        <div className="size-2.5 rounded-xs bg-blue-300 dark:bg-blue-800" />
                        <div className="size-2.5 rounded-xs bg-blue-500" />
                        <div className="size-2.5 rounded-xs bg-[#11428E]" />
                        <span>More</span>
                      </div>
                    </div>

                    {/* Practice Timeline History Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Practice Timeline History</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">1 sessions recorded</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-[var(--text-main)]">Short Story Comprehension</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Grade 5 English • 10/14/2026</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[var(--text-muted)]">1/1</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            100%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Parental Controls Card */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Parental Controls</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Screen time, gates &amp; language</p>
                        </div>
                      </div>

                      {/* Screen Time Limit info */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <Hourglass size={13} className="text-slate-400" />
                        <span className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                          DAILY SCREEN TIME LIMIT:{' '}
                          <span className="text-[var(--text-main)]">
                            {parentScreenTimeLimit === 0 ? 'UNLIMITED' : `${parentScreenTimeLimit} MIN`}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs -mt-1 text-[var(--text-muted)]">
                        <span className="text-[11px]">
                          Used today: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">0</strong> / {parentScreenTimeLimit === 0 ? '∞' : parentScreenTimeLimit} min
                        </span>
                        {parentScreenTimeLimit > 0 && (
                          <button
                            onClick={() => setParentScreenTimeLimit(0)}
                            className="text-[10px] text-[#11428E] dark:text-sky-300 font-bold hover:underline cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Screen Time Preset Buttons */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 15, 30, 45, 60].map((mins) => {
                          const isActive = parentScreenTimeLimit === mins;
                          return (
                            <button
                              key={mins}
                              onClick={() => {
                                setParentScreenTimeLimit(mins);
                              }}
                              className={`py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#11428E] border-[#11428E] text-white shadow-xs'
                                  : 'bg-[var(--bg-main)]/50 border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                              }`}
                            >
                              {mins === 0 ? 'Off' : `${mins}m`}
                            </button>
                          );
                        })}
                      </div>

                      {/* Math Progression Gate Toggle Row */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)]/40 border border-[var(--border-color)]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Lock size={13} className="text-slate-400" />
                            <span className="text-xs font-bold text-[var(--text-main)]">Math Progression Gate</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">Lock English until Math scores &ge; 80%</span>
                        </div>
                        <button
                          onClick={() => setParentMathGate(!parentMathGate)}
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                            parentMathGate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <div
                            className={`size-4 rounded-full bg-white shadow-md transition-transform absolute top-1 ${
                              parentMathGate ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Priority Target Topic */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">
                          PRIORITY TARGET TOPIC
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Fractions (leave blank for none)"
                          value={parentPriorityTopic}
                          onChange={(e) => setParentPriorityTopic(e.target.value)}
                          className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Linked Child & Daily Regulation Status Badge Card */}
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-bold text-[11px] leading-tight text-amber-800 dark:text-amber-300">
                            Daily Study Regulation
                          </span>
                          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                            Linked Child: <strong className="font-bold">{parentStudentName || 'Neal Jean Claro'}</strong>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setParentTab('settings')}
                        className="px-2.5 py-1 rounded-lg bg-[#11428E] hover:bg-[#1C5BC0] text-white text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                      >
                        Device Settings
                      </button>
                    </div>

                    <div className="sr-only">
                      <span>Screen Time Guard</span>
                    </div>
                  </div>
                )}

                {/* 2. LOCAL DEVICE SETTINGS */}
                {selectedRole === 'parent' && (parentTab === 'settings' || parentTab === 'limits') && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    {/* Top Header Card (Sticky, Full-Width Edge-to-Edge) */}
                    <div className="relative sticky top-0 z-30 -mx-4 -mt-3 w-[calc(100%+2rem)] bg-[var(--bg-card)] border-b border-[var(--border-color)] p-3.5 shadow-xs overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-[#11428E]" />
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-extrabold text-[var(--text-main)] tracking-tight">
                              GURO Parent Explorer
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 text-[#11428E] dark:text-sky-300 text-[9px] font-bold mt-1">
                            <Calendar size={10} />
                            <span>S.Y. 2026-2027 • Quarter 1</span>
                          </span>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-tight">
                            Device Configuration &amp; Security
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Parent
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Connected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section Header: Local Device Settings */}
                    <div className="flex items-center gap-2 px-1">
                      <Settings size={16} className="text-[var(--text-main)]" />
                      <div>
                        <h5 className="text-xs font-black text-[var(--text-main)]">Local Device Settings</h5>
                        <p className="text-[10px] text-[var(--text-muted)]">Configure sync, account &amp; PIN for this device</p>
                      </div>
                    </div>

                    {/* Card 1: Cloud Sync */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Cloud Sync</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Upload progress to teacher's server</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">
                          SERVER URL
                        </label>
                        <input
                          type="text"
                          value={parentServerUrl}
                          onChange={(e) => setParentServerUrl(e.target.value)}
                          className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono focus:outline-hidden"
                        />
                      </div>

                      <button
                        onClick={() => {
                          setParentSyncSuccess(true);
                          setTimeout(() => setParentSyncSuccess(false), 2000);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#11428E] hover:bg-[#1C5BC0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        {parentSyncSuccess ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span>Synced Successfully!</span>
                          </>
                        ) : (
                          <span>Sync Now (0 staged)</span>
                        )}
                      </button>
                    </div>

                    {/* Card 2: Device Profile ID */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-[#11428E] dark:text-sky-300" />
                        <div>
                          <h5 className="text-xs font-black text-[var(--text-main)]">Device Profile ID</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">Matches teacher/parent web dashboards</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-extrabold uppercase text-[var(--text-muted)]">
                          STUDENT ID
                        </label>
                        <input
                          type="text"
                          value={parentDeviceId}
                          onChange={(e) => setParentDeviceId(e.target.value)}
                          className="w-full text-xs py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-mono focus:outline-hidden"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                        <Key size={13} className="text-slate-400" />
                        <span>Parent Access Code: <strong>134061</strong></span>
                      </div>

                      <button
                        onClick={() => {
                          setParentDeviceSaved(true);
                          setTimeout(() => setParentDeviceSaved(false), 2000);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#11428E] hover:bg-[#1C5BC0] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        {parentDeviceSaved ? 'Saved Device ID!' : 'Save Device ID'}
                      </button>
                    </div>

                    {/* Card 3: Cloud Account */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-[#11428E] dark:text-sky-300" />
                          <h5 className="text-xs font-black text-[var(--text-main)]">Cloud Account</h5>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          LINKED
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-[var(--text-main)]">Sample Parent</span>
                        <span className="text-[10px] text-[var(--text-muted)]">parent@guro.dev</span>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-[#A01322] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Log Out of Cloud Account
                      </button>
                    </div>

                    {/* Card 4: Portal Settings */}
                    <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 flex flex-col gap-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <Settings size={16} className="text-[#11428E] dark:text-sky-300" />
                        <h5 className="text-xs font-black text-[var(--text-main)]">Portal Settings</h5>
                      </div>

                      <button
                        className="w-full py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-main)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Lock size={14} className="text-[var(--text-muted)]" />
                        <span>Change Dashboard PIN</span>
                      </button>

                      <button
                        className="w-full py-2 px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-[#A01322] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} className="text-[#A01322]" />
                        <span>Clear Practice History</span>
                      </button>
                    </div>

                    {/* Exit Parent Portal Button */}
                    <button
                      onClick={() => setSelectedRole('student')}
                      className="w-full py-2.5 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Exit Parent Portal</span>
                    </button>
                  </div>
                )}

              </div>

              {/* ── Working Mobile Bottom Navigation Bar (Exact Replica of Mobile Tab Navigator) ── */}
              
              {/* STUDENT BOTTOM TABS: Home, Lessons, Progress, Profile */}
              {selectedRole === 'student' && (() => {
                const studentTabs = [
                  { id: 'home', label: 'Dashboard', icon: Home },
                  { id: 'lessons', label: 'Lessons', icon: BookOpen },
                  { id: 'progress', label: 'My Progress', icon: BarChart2 },
                  { id: 'me', label: 'Profile', icon: UserIcon },
                ];
                const activeIndex = 
                  studentTab === 'home' ? 0 :
                  (studentTab === 'lessons' || studentTab === 'study' || studentTab === 'quiz') ? 1 :
                  studentTab === 'progress' ? 2 : 3;

                return (
                  <div className="relative h-14 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center z-40 select-none">
                    {studentTabs.map((tabItem, idx) => {
                      const Icon = tabItem.icon;
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={tabItem.id}
                          onClick={() => {
                            setStudentTab(tabItem.id as StudentTab);
                          }}
                          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors duration-200 relative z-10 ${
                            isActive
                              ? 'text-[#11428E] dark:text-sky-400'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <Icon size={18} className="transition-transform duration-200 active:scale-90" />
                          <span className="text-[9px] font-bold">{tabItem.label}</span>
                        </button>
                      );
                    })}

                    {/* Animated Sliding Underline for Current Screen */}
                    <div
                      data-testid="student-sliding-underline"
                      className="absolute bottom-0 left-0 h-[2.5px] transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none z-20"
                      style={{
                        width: '25%',
                        transform: `translateX(${activeIndex * 100}%)`,
                      }}
                    >
                      <div className="h-[2.5px] w-9 rounded-full bg-[#11428E] dark:bg-sky-400 shadow-[0_0_8px_rgba(17,66,142,0.4)]" />
                    </div>
                  </div>
                );
              })()}

              {/* TEACHER BOTTOM TABS: Console, AI Ingest, Lesson Builder, Settings */}
              {selectedRole === 'teacher' && (() => {
                const teacherTabs = [
                  { id: 'console', label: 'Console', icon: BarChart2 },
                  { id: 'ingest', label: 'AI Ingest', icon: Zap },
                  { id: 'builder', label: 'Lesson Builder', icon: PenLine },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ];
                const activeIndex =
                  teacherTab === 'console' ? 0 :
                  teacherTab === 'ingest' ? 1 :
                  teacherTab === 'builder' ? 2 : 3;

                return (
                  <div className="relative h-14 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center z-40 select-none">
                    {teacherTabs.map((tabItem, idx) => {
                      const Icon = tabItem.icon;
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={tabItem.id}
                          onClick={() => setTeacherTab(tabItem.id as TeacherTab)}
                          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors duration-200 relative z-10 ${
                            isActive
                              ? 'text-[#11428E] dark:text-sky-400 font-bold'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <Icon size={18} className="transition-transform duration-200 active:scale-90" />
                          <span className="text-[9px] font-bold">{tabItem.label}</span>
                        </button>
                      );
                    })}

                    {/* Animated Sliding Underline for Current Screen */}
                    <div
                      data-testid="teacher-sliding-underline"
                      className="absolute bottom-0 left-0 h-[2.5px] transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none z-20"
                      style={{
                        width: '25%',
                        transform: `translateX(${activeIndex * 100}%)`,
                      }}
                    >
                      <div className="h-[2.5px] w-9 rounded-full bg-[#11428E] dark:bg-sky-400 shadow-[0_0_8px_rgba(17,66,142,0.4)]" />
                    </div>
                  </div>
                );
              })()}

              {/* PARENT BOTTOM TABS: Child Progress, Device Settings */}
              {selectedRole === 'parent' && (() => {
                const parentTabs = [
                  { id: 'progress', label: 'Child Progress', icon: BarChart2 },
                  { id: 'settings', label: 'Device Settings', icon: Settings },
                ];
                const activeIndex = (parentTab === 'progress' || parentTab === 'home') ? 0 : 1;

                return (
                  <div className="relative h-14 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center z-40 select-none">
                    {parentTabs.map((tabItem, idx) => {
                      const Icon = tabItem.icon;
                      const isActive = activeIndex === idx;
                      return (
                        <button
                          key={tabItem.id}
                          onClick={() => setParentTab(tabItem.id as ParentTab)}
                          className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors duration-200 relative z-10 ${
                            isActive
                              ? 'text-[#11428E] dark:text-sky-400 font-bold'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <Icon size={18} className="transition-transform duration-200 active:scale-90" />
                          <span className="text-[9px] font-bold">{tabItem.label}</span>
                        </button>
                      );
                    })}

                    {/* Animated Sliding Underline for Current Screen */}
                    <div
                      data-testid="parent-sliding-underline"
                      className="absolute bottom-0 left-0 h-[2.5px] transition-transform duration-300 ease-out flex items-center justify-center pointer-events-none z-20"
                      style={{
                        width: '50%',
                        transform: `translateX(${activeIndex * 100}%)`,
                      }}
                    >
                      <div className="h-[2.5px] w-14 rounded-full bg-[#11428E] dark:bg-sky-400 shadow-[0_0_8px_rgba(17,66,142,0.4)]" />
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Phone Home Indicator Bar */}
              <div className="h-4 flex items-center justify-center bg-[var(--bg-card)]">
                <div className="w-28 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
