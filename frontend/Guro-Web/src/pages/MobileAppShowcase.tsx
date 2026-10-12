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
  ChevronRight,
  Clock,
  Award
} from 'lucide-react';

interface MobileAppShowcaseProps {
  onBackToOverview: () => void;
  onLaunchPortal: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

type SimulatedRole = 'student' | 'teacher' | 'parent';
type StudentScreen = 'auth' | 'study' | 'quiz' | 'profile';
type TeacherScreen = 'overview' | 'ingestion';
type ParentScreen = 'tracking' | 'limits';

export const MobileAppShowcase: React.FC<MobileAppShowcaseProps> = ({
  onBackToOverview,
  onLaunchPortal,
  isDarkMode = false,
  onToggleTheme,
}) => {
  // Simulator Controls State
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>('student');
  const [studentScreen, setStudentScreen] = useState<StudentScreen>('study');
  const [teacherScreen, setTeacherScreen] = useState<TeacherScreen>('overview');
  const [parentScreen, setParentScreen] = useState<ParentScreen>('tracking');
  const [isSimulatedOnline, setIsSimulatedOnline] = useState(true);
  const [simulatedGrade, setSimulatedGrade] = useState<number>(4);

  // Interactive In-Phone Quiz State
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(12);

  // Interactive In-Phone Study Slide State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isRefresherOpen, setIsRefresherOpen] = useState(false);
  const [refresherAnswer, setRefresherAnswer] = useState<string | null>(null);

  // Reset simulator
  const handleResetSimulator = () => {
    setSelectedRole('student');
    setStudentScreen('study');
    setIsSimulatedOnline(true);
    setSimulatedGrade(4);
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setCurrentSlideIndex(0);
    setIsRefresherOpen(false);
    setRefresherAnswer(null);
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
              Mobile Simulator
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
                      onClick={() => setSelectedRole(r.id as SimulatedRole)}
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

            {/* Screen Selection by Role */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                2. Preview Screen
              </label>
              {selectedRole === 'student' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'study', label: 'Study Slides & Checkpoint' },
                    { id: 'quiz', label: 'Gamified Quiz' },
                    { id: 'auth', label: 'Login & Offline Start' },
                    { id: 'profile', label: 'Mascot & Rewards' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setStudentScreen(sc.id as StudentScreen)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                        studentScreen === sc.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}

              {selectedRole === 'teacher' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'overview', label: 'Class Analytics & Sync' },
                    { id: 'ingestion', label: 'Mobile Lesson Manager' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setTeacherScreen(sc.id as TeacherScreen)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                        teacherScreen === sc.id
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}

              {selectedRole === 'parent' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'tracking', label: 'Child Growth & Codes' },
                    { id: 'limits', label: 'Screen Time Guard' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setParentScreen(sc.id as ParentScreen)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer truncate ${
                        parentScreen === sc.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Simulation Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
                3. Simulate Network Condition
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
                Toggle offline mode to see how the app caches lesson materials, runs quizzes locally, and preserves student telemetry without internet.
              </p>
            </div>

            {/* Grade Switcher */}
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
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-200 text-xs flex items-start gap-3">
            <Sparkles className="size-4 shrink-0 text-sky-500 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Native Mobile App:</strong> Built with React Native &amp; Expo for Android and iOS. Teachers and students can pair devices via peer-to-peer sync or cloud classroom IDs.
            </p>
          </div>
        </div>

        {/* ── Right Column: Smartphone Device Chassis Frame ── */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-[340px] sm:w-[370px] h-[720px] rounded-[48px] bg-slate-950 p-3.5 shadow-2xl shadow-slate-950/40 ring-1 ring-slate-800/80 border-4 border-slate-700/60 select-none">
            
            {/* Camera Cutout / Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
              <div className="size-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
              <div className="size-2 rounded-full bg-blue-900/40" />
            </div>

            {/* Inner Phone Screen */}
            <div className="w-full h-full rounded-[38px] bg-[var(--bg-main)] overflow-hidden flex flex-col relative border border-[var(--border-color)]">
              
              {/* Phone Status Bar */}
              <div className="h-10 px-6 pt-2 flex items-center justify-between text-[11px] font-bold text-[var(--text-main)] z-40 bg-[var(--bg-main)]/80 backdrop-blur-sm">
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

              {/* ── Screen Body Content based on active state ── */}
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3.5 scrollbar-none">
                
                {/* ────────────────── STUDENT: STUDY SLIDES ────────────────── */}
                {selectedRole === 'student' && studentScreen === 'study' && (
                  <div className="flex flex-col gap-3">
                    {/* Header Banner */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-[#11428E] dark:text-sky-400 uppercase tracking-wider">
                          Grade {simulatedGrade} {sampleSlides[currentSlideIndex].subject}
                        </span>
                        <h4 className="text-sm font-extrabold text-[var(--text-main)] leading-tight">
                          {sampleSlides[currentSlideIndex].title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Slide {currentSlideIndex + 1}/{sampleSlides.length}
                      </span>
                    </div>

                    {/* Interactive Slide Card */}
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

                    {/* In-Slide Checkpoint Accordion */}
                    <div className="border border-[var(--border-color)] rounded-2xl bg-[var(--bg-card)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsRefresherOpen(!isRefresherOpen)}
                        className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--bg-main)]/50"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-[var(--text-main)]">
                            Refresher Checkpoint
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#11428E] dark:text-sky-400">
                          {isRefresherOpen ? 'Collapse ▲' : 'Quick Check ▼'}
                        </span>
                      </button>

                      {isRefresherOpen && (
                        <div className="p-3 pt-0 border-t border-[var(--border-color)]/60 flex flex-col gap-2.5 mt-2">
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

                          {refresherAnswer && (
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-[var(--text-muted)]">
                              💡 {sampleSlides[currentSlideIndex].checkpoint.explanation}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ────────────────── STUDENT: GAMIFIED QUIZ ────────────────── */}
                {selectedRole === 'student' && studentScreen === 'quiz' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-main)]">Quiz Challenge #1</span>
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
                                if (opt.correct) setEarnedStars(prev => prev + 1);
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
                          🎉 <strong>Great job!</strong> 3/4 × 2 = 6/4 = 1 2/4 = 1 1/2 cups. You earned 1 Star!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ────────────────── STUDENT: AUTH & OFFLINE ────────────────── */}
                {selectedRole === 'student' && studentScreen === 'auth' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col items-center text-center gap-1 my-1">
                      <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#11428E] to-[#A01322] text-white flex items-center justify-center font-black text-sm">
                        G
                      </div>
                      <h4 className="text-sm font-extrabold text-[var(--text-main)]">Sign In with Account</h4>
                      <p className="text-[10px] text-[var(--text-muted)]">Or start offline with zero internet</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Test Accounts Autofill</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button className="py-1 px-1.5 rounded-lg border border-emerald-500 text-emerald-600 bg-emerald-500/10 text-[10px] font-bold">
                          Student
                        </button>
                        <button className="py-1 px-1.5 rounded-lg border border-blue-500 text-blue-600 bg-blue-500/10 text-[10px] font-bold">
                          Teacher
                        </button>
                        <button className="py-1 px-1.5 rounded-lg border border-amber-500 text-amber-600 bg-amber-500/10 text-[10px] font-bold">
                          Parent
                        </button>
                      </div>

                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">Full Name</span>
                        <input
                          type="text"
                          readOnly
                          value="Juan Dela Cruz"
                          className="w-full text-xs p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]"
                        />
                      </div>

                      <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#11428E] to-[#2563EB] text-white text-xs font-bold shadow-xs cursor-pointer">
                        Continue Offline →
                      </button>
                    </div>
                  </div>
                )}

                {/* ────────────────── STUDENT: PROFILE & REWARDS ────────────────── */}
                {selectedRole === 'student' && studentScreen === 'profile' && (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#11428E]/10 to-[#A01322]/10 border border-[#11428E]/20 flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-[#11428E] text-white flex items-center justify-center text-xl shadow-xs">
                        🦉
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-[var(--text-main)]">Guro Owl Mascot</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">Level 3 Explorer • 240 XP</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                        <span>Parent Access Code</span>
                        <span className="text-emerald-500 font-extrabold">Active</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[var(--bg-main)] text-center font-mono font-black text-sm text-[#11428E] dark:text-sky-300 tracking-widest border border-[var(--border-color)]">
                        582-910
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] text-center">
                        Give this 6-digit code to parents to track learning progress.
                      </p>
                    </div>
                  </div>
                )}

                {/* ────────────────── TEACHER MOBILE VIEW ────────────────── */}
                {selectedRole === 'teacher' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[var(--text-main)]">Teacher Mobile Console</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                        Section Grade 4-A
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Active Students</span>
                        <span className="text-lg font-black text-[#11428E] dark:text-sky-300">32</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Avg Mastery</span>
                        <span className="text-lg font-black text-emerald-500">88.4%</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">DepEd SF9 Progress</span>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        All student quizzes are aggregated and synced to official quarterly SF9 report forms.
                      </p>
                      <button className="w-full py-2 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-xs font-bold text-[var(--text-main)] flex items-center justify-center gap-1.5 cursor-pointer">
                        <span>Review Mastery Matrix</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ────────────────── PARENT MOBILE VIEW ────────────────── */}
                {selectedRole === 'parent' && (
                  <div className="flex flex-col gap-3">
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-main)]">Linked Student</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-[var(--text-main)]">Juan Dela Cruz (Grade 4)</h4>
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                        <span>Today's Screen Time:</span>
                        <span className="font-bold text-[var(--text-main)]">38 / 60 mins</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="size-3.5 text-amber-500" />
                        <span>Daily Study Regulation</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        Parents can set study limits directly from their phone to ensure healthy learning habits.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Simulated Phone Bottom Navigation Bar */}
              <div className="h-14 px-6 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-around z-40">
                <button
                  onClick={() => setStudentScreen('study')}
                  className="flex flex-col items-center gap-0.5 text-[var(--text-muted)] hover:text-[#11428E] cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span className="text-[9px] font-bold">Study</span>
                </button>
                <button
                  onClick={() => setStudentScreen('quiz')}
                  className="flex flex-col items-center gap-0.5 text-[var(--text-muted)] hover:text-[#11428E] cursor-pointer"
                >
                  <Award size={16} />
                  <span className="text-[9px] font-bold">Quiz</span>
                </button>
                <button
                  onClick={() => setStudentScreen('profile')}
                  className="flex flex-col items-center gap-0.5 text-[var(--text-muted)] hover:text-[#11428E] cursor-pointer"
                >
                  <Users size={16} />
                  <span className="text-[9px] font-bold">Profile</span>
                </button>
              </div>

              {/* Bottom Home Indicator Bar */}
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
