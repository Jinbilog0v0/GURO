import React, { useState } from 'react';
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
  ExternalLink,
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
  Play
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
type ParentTab = 'home' | 'limits';

export const MobileAppShowcase: React.FC<MobileAppShowcaseProps> = ({
  onBackToOverview,
  onLaunchPortal,
  isDarkMode = false,
  onToggleTheme,
}) => {
  // Simulator Controls State
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>('student');
  const [studentTab, setStudentTab] = useState<StudentTab>('home');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('console');
  const [parentTab, setParentTab] = useState<ParentTab>('home');
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

  // Screen time limit state (Parent)
  const [screenTimeLimit, setScreenTimeLimit] = useState(60);

  // Reset simulator
  const handleResetSimulator = () => {
    setSelectedRole('student');
    setStudentTab('home');
    setTeacherTab('console');
    setParentTab('home');
    setIsSimulatedOnline(true);
    setSimulatedGrade(4);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setCurrentSlideIndex(0);
    setIsRefresherOpen(false);
    setRefresherAnswer(null);
    setCodeCopied(false);
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
      
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Overview</span>
          </button>
          <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-[#11428E] dark:text-sky-400 tracking-tight">GURO</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              Mobile App Simulator
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#11428E]/20 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <span>Launch Web Portal</span>
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </header>

      {/* ── Main Showcase Workspace ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* ── Left Column: Simulator Controls Dashboard ── */}
        <div className="w-full lg:w-[380px] flex flex-col gap-5">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-main)]">Simulator Console</h3>
                <p className="text-xs text-[var(--text-muted)]">Control the mini mobile app live</p>
              </div>
              <button
                onClick={handleResetSimulator}
                className="p-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                title="Reset Simulator"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>

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
                        if (r.id === 'parent') setParentTab('home');
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
                    { id: 'settings', label: 'Classroom Pairing' },
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
                    { id: 'home', label: 'Child Growth & Codes' },
                    { id: 'limits', label: 'Screen Time Guard' },
                  ].map((tb) => (
                    <button
                      key={tb.id}
                      onClick={() => setParentTab(tb.id as ParentTab)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                        parentTab === tb.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
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

        {/* ── Right Column: Smartphone Device Chassis Frame ── */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-[340px] sm:w-[375px] h-[740px] rounded-[50px] bg-slate-950 p-3.5 shadow-2xl shadow-slate-950/40 ring-1 ring-slate-800/80 border-4 border-slate-700/60 select-none">
            
            {/* Dynamic Island / Speaker */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
              <div className="size-2 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <div className="size-1.5 rounded-full bg-blue-900/40" />
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full rounded-[40px] bg-[var(--bg-main)] overflow-hidden flex flex-col relative border border-[var(--border-color)]">
              
              {/* Phone Status Bar */}
              <div className="h-10 px-6 pt-2 flex items-center justify-between text-[11px] font-bold text-[var(--text-main)] z-40 bg-[var(--bg-main)]/90 backdrop-blur-sm border-b border-[var(--border-color)]/40">
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
                      <h4 className="text-base font-extrabold tracking-tight">Welcome back, Juan!</h4>
                      
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
                {selectedRole === 'teacher' && teacherTab === 'console' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--text-main)]">Teacher Console</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                        Section Grade 4-Rizal
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Active Learners</span>
                        <span className="text-lg font-black text-[#11428E] dark:text-sky-300">32</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Average Mastery</span>
                        <span className="text-lg font-black text-emerald-500">88.4%</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">DepEd SF9 Progress Ready</span>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        All student quizzes are aggregated and synced to official quarterly SF9 report forms.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRole === 'teacher' && teacherTab === 'ingest' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-[var(--text-main)]">AI Lesson Ingestion</span>
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-dashed border-[#11428E]/40 text-center flex flex-col items-center gap-2">
                      <Zap size={24} className="text-[#11428E]" />
                      <span className="text-xs font-bold text-[var(--text-main)]">Upload Lesson PDF/DOCX</span>
                      <p className="text-[10px] text-[var(--text-muted)]">AI will extract slides, MELC competencies, and quiz checkpoints.</p>
                    </div>
                  </div>
                )}

                {selectedRole === 'teacher' && teacherTab === 'builder' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-[var(--text-main)]">Mobile Lesson Builder</span>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">Lesson Title</span>
                      <input type="text" readOnly value="Grade 4 Fractions Module" className="w-full text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">Checkpoints: 3 Active</span>
                    </div>
                  </div>
                )}

                {selectedRole === 'teacher' && teacherTab === 'settings' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-[var(--text-main)]">Classroom Pairing</span>
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-[var(--text-muted)]">Pairing Code</span>
                      <span className="font-mono text-lg font-black text-[#11428E] dark:text-sky-300">CL-4892</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Share this code with students to join your class.</span>
                    </div>
                  </div>
                )}

                {/* ════════════════════════ PARENT TABS ════════════════════════ */}
                {selectedRole === 'parent' && parentTab === 'home' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-main)]">Linked Child</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-[var(--text-main)]">Juan Dela Cruz (Grade 4)</h4>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                        <span>Today's Screen Time:</span>
                        <span className="font-bold text-[var(--text-main)]">38 / {screenTimeLimit} mins</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="size-3.5 text-amber-500" />
                        <span>Daily Study Regulation</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        Set daily screen limits to ensure healthy learning habits.
                      </p>
                    </div>
                  </div>
                )}

                {selectedRole === 'parent' && parentTab === 'limits' && (
                  <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                    <span className="text-xs font-black text-[var(--text-main)]">Screen Time Guard</span>
                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center gap-3">
                      <span className="text-xs font-bold text-[var(--text-muted)]">Daily Max Allowed</span>
                      <span className="text-2xl font-black text-amber-500">{screenTimeLimit} Mins</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setScreenTimeLimit(prev => Math.max(15, prev - 15))}
                          className="px-3 py-1 rounded-xl border border-[var(--border-color)] text-xs font-bold cursor-pointer"
                        >
                          - 15 mins
                        </button>
                        <button
                          onClick={() => setScreenTimeLimit(prev => Math.min(180, prev + 15))}
                          className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          + 15 mins
                        </button>
                      </div>
                    </div>
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

              {/* TEACHER BOTTOM TABS: Console, AI Ingest, Builder, Settings */}
              {selectedRole === 'teacher' && (() => {
                const teacherTabs = [
                  { id: 'console', label: 'Console', icon: BarChart2 },
                  { id: 'ingest', label: 'AI Ingest', icon: Zap },
                  { id: 'builder', label: 'Builder', icon: PenLine },
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
                              ? 'text-blue-600 dark:text-blue-400'
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
                      <div className="h-[2.5px] w-9 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                    </div>
                  </div>
                );
              })()}

              {/* PARENT BOTTOM TABS: Growth, Screen Time */}
              {selectedRole === 'parent' && (() => {
                const parentTabs = [
                  { id: 'home', label: 'Child Growth', icon: Users },
                  { id: 'limits', label: 'Time Guard', icon: Clock },
                ];
                const activeIndex = parentTab === 'home' ? 0 : 1;

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
                              ? 'text-amber-600 dark:text-amber-400'
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
                      <div className="h-[2.5px] w-14 rounded-full bg-amber-600 dark:bg-amber-400 shadow-[0_0_8px_rgba(217,119,6,0.4)]" />
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
