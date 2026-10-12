import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  School,
  Users,
  Smartphone,
  WifiOff,
  BarChart3,
  BookOpen,
  ArrowRight,
  Sparkles,
  Shield,
  Sun,
  Moon,
  CheckCircle2,
  Download
} from 'lucide-react';

interface SystemOverviewPageProps {
  onOpenMobileShowcase: () => void;
  onOpenAuth: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

type NavSectionId = 'overview' | 'pillars' | 'roles' | 'mobile-preview';

interface NavSection {
  id: NavSectionId;
  label: string;
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'pillars', label: 'Why GURO' },
  { id: 'roles', label: "Who It's For" },
  { id: 'mobile-preview', label: 'Mobile Showcase' },
];

export const SystemOverviewPage: React.FC<SystemOverviewPageProps> = ({
  onOpenMobileShowcase,
  onOpenAuth,
  isDarkMode = false,
  onToggleTheme,
}) => {
  const [activeAudienceTab, setActiveAudienceTab] = useState<'student' | 'teacher' | 'parent'>('student');
  const [activeNavSection, setActiveNavSection] = useState<NavSectionId>('overview');
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const isClickScrollingRef = useRef(false);
  const clickScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateIndicator = useCallback(() => {
    const currentItem = itemRefs.current[activeNavSection];
    const navContainer = navRef.current;
    if (currentItem && navContainer) {
      const itemRect = currentItem.getBoundingClientRect();
      const containerRect = navContainer.getBoundingClientRect();
      const left = itemRect.left - containerRect.left;
      const width = itemRect.width;
      if (width > 0) {
        setIndicatorStyle({ left, width });
        return;
      }
    }
    const idx = NAV_SECTIONS.findIndex((s) => s.id === activeNavSection);
    setIndicatorStyle({ left: idx * 95, width: 80 });
  }, [activeNavSection]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  useEffect(() => {
    const handleScroll = () => {
      // Do not update active section during smooth scrolling triggered by a click
      if (isClickScrollingRef.current) return;

      const scrollPosition = window.scrollY + 140; // 140px offset for sticky header

      for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
        const sectionId = NAV_SECTIONS[i].id;
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveNavSection((prev) => (prev !== sectionId ? sectionId : prev));
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (clickScrollTimeoutRef.current) clearTimeout(clickScrollTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (sectionId: NavSectionId) => {
    setActiveNavSection(sectionId);
    isClickScrollingRef.current = true;
    if (clickScrollTimeoutRef.current) {
      clearTimeout(clickScrollTimeoutRef.current);
    }
    clickScrollTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

    if (sectionId === 'overview') {
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 64; // height of sticky header
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + (window.scrollY ?? window.pageYOffset ?? 0) - headerOffset;
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      } else if (el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col transition-colors duration-300">
      
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-color)] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-gradient-to-tr from-[#11428E] via-[#2563EB] to-[#A01322] flex items-center justify-center text-white shadow-md shadow-[#11428E]/20">
            <GraduationCap className="size-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-[#11428E] dark:text-sky-400 tracking-tight leading-none">
              GURO
            </span>
            <span className="text-[10px] font-bold text-[#A01322] dark:text-rose-400 tracking-wider">
              RESOURCE OPTIMIZATION
            </span>
          </div>
        </div>

        {/* Center Quick Jump Links (Desktop) with Animated Sliding Underline */}
        <nav
          ref={navRef}
          aria-label="Overview navigation"
          className="hidden md:flex items-center gap-1 text-xs relative py-1"
        >
          {NAV_SECTIONS.map((sec) => {
            const isActive = activeNavSection === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                ref={(el) => {
                  itemRefs.current[sec.id] = el;
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(sec.id);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors duration-200 cursor-pointer relative z-10 whitespace-nowrap select-none ${
                  isActive
                    ? 'text-[#11428E] dark:text-sky-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {sec.label}
              </a>
            );
          })}

          {/* Animated Sliding Underline for Current Screen / Section */}
          <span
            data-testid="top-nav-sliding-underline"
            className="absolute bottom-0 h-[2.5px] bg-[#11428E] dark:bg-sky-400 rounded-full transition-all duration-300 ease-out pointer-events-none z-20 shadow-[0_0_8px_rgba(17,66,142,0.35)]"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer"
            >
              {isDarkMode ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-[#11428E]" />}
            </button>
          )}

          <a
            href="https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk"
            target="_blank"
            rel="noopener noreferrer"
            download="GURO-preview.apk"
            aria-label="Download App APK"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Download Standalone Android APK (v1.0.1)"
          >
            <Download className="size-3.5 text-sky-500" />
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">APK</span>
          </a>

          <button
            onClick={onOpenMobileShowcase}
            aria-label="Mobile Showcase"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Smartphone className="size-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Mobile Showcase</span>
            <span className="sm:hidden">Showcase</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#11428E]/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
          >
            <span>Sign In / Portal</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 flex flex-col">

        {/* ── Section 1: Hero Banner (Dynamic Screen Fitting) ── */}
        <section id="overview" className="relative px-4 sm:px-8 py-10 sm:py-16 min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto w-full flex flex-col items-center justify-center text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-extrabold mb-5 shadow-xs animate-in fade-in duration-300">
            <Sparkles className="size-3.5 text-sky-500" />
            <span>DepEd MELC Aligned • Grades 4 to 6 Mathematics &amp; English</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--text-main)] tracking-tight max-w-4xl leading-[1.12]">
            Adaptive, Offline-First Learning for{' '}
            <span className="bg-gradient-to-r from-[#11428E] via-[#2563EB] to-[#A01322] bg-clip-text text-transparent">
              Philippine Classrooms
            </span>
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-[var(--text-muted)] max-w-2xl leading-relaxed font-medium">
            GURO (Guided Unified Resource Optimization) bridges the digital divide with rich interactive slides, diagnostic quizzes, automated DepEd SF9 reports, and 100% offline capability.
          </p>

          {/* Action Buttons */}
          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            <button
              onClick={onOpenMobileShowcase}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/20 transition-all cursor-pointer hover:scale-102 active:scale-98 w-full sm:w-auto"
            >
              <Smartphone className="size-4" />
              <span>Explore Mobile Showcase</span>
            </button>

            <a
              href="https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk"
              target="_blank"
              rel="noopener noreferrer"
              download="GURO-preview.apk"
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-102 active:scale-98 w-full sm:w-auto"
            >
              <Download className="size-4 text-sky-500" />
              <span>Download App APK</span>
            </a>

            <button
              onClick={onOpenAuth}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-main)] text-[var(--text-main)] font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-102 active:scale-98 w-full sm:w-auto"
            >
              <span>Open Web Portal</span>
              <ArrowRight className="size-4 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-10 sm:mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-4xl text-left">
            {[
              { label: 'Offline Ready', value: '100% Zero-Data', desc: 'Quizzes & slides run without internet' },
              { label: 'DepEd Standards', value: 'Grades 4, 5, 6', desc: 'Official MELC curriculum alignment' },
              { label: 'Teacher Analytics', value: 'Form SF9 Ready', desc: 'Automated quarterly reports & analytics' },
              { label: 'Guardian Sync', value: '6-Digit Codes', desc: 'Secure guardian sync & screen time' },
            ].map((m, idx) => (
              <div key={idx} className="p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{m.label}</span>
                <span className="text-base sm:text-lg font-black text-[#11428E] dark:text-sky-400">{m.value}</span>
                <span className="text-[11px] sm:text-xs text-[var(--text-muted)] line-clamp-2">{m.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Why GURO (Dynamic Screen Fitting) ── */}
        <section id="pillars" className="scroll-mt-16 px-4 sm:px-8 py-12 sm:py-16 min-h-[calc(100vh-3.5rem)] flex flex-col justify-center bg-[var(--bg-card)]/50 border-y border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto w-full flex flex-col gap-8 sm:gap-10 my-auto">
            <div className="text-center flex flex-col items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-black text-[#A01322] dark:text-rose-400 uppercase tracking-widest">
                Why GURO
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tight">
                Designed for Reliability &amp; Academic Growth
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: WifiOff,
                  color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                  title: '100% Offline Learning',
                  description: 'All lesson materials, interactive study slides, and quizzes run locally on the client with zero network dependency. Syncs automatically when back online.',
                },
                {
                  icon: BookOpen,
                  color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                  title: 'DepEd MELC Alignment',
                  description: 'Covers Philippine elementary Grade 4 to 6 competencies in Mathematics (fractions, decimals, geometry) and English (grammar, reading comprehension, vocabulary).',
                },
                {
                  icon: BarChart3,
                  color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
                  title: 'Automated SF9 Reporting',
                  description: 'Calculates mastery matrix, pre-test vs. post-test growth, and item analyses. Directly generates printable DepEd Form SF9 progress reports for teachers.',
                },
                {
                  icon: Shield,
                  color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                  title: 'Guardian Transparency',
                  description: 'Guardians receive a 6-digit access code to review real-time subject mastery, practice attempts, and enforce healthy daily screen-time limits.',
                },
              ].map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex flex-col gap-2.5 sm:gap-3 transition-transform hover:-translate-y-0.5">
                    <div className={`size-11 sm:size-12 rounded-2xl border flex items-center justify-center ${p.color}`}>
                      <Icon className="size-5 sm:size-6" />
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-main)] mt-1">{p.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{p.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Section 3: Audience Role Comparison (Dynamic Screen Fitting) ── */}
        <section id="roles" className="scroll-mt-16 px-4 sm:px-8 py-12 sm:py-16 min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto w-full flex flex-col justify-center gap-8 sm:gap-10">
          <div className="text-center flex flex-col items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-black text-[#11428E] dark:text-sky-400 uppercase tracking-widest">
              Who It's For
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-main)] tracking-tight">
              A Tailored Experience for Every Role
            </h2>
          </div>

          {/* Role Tabs */}
          <div className="flex justify-center">
            <div className="flex p-1 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs w-full sm:w-auto">
              {[
                { id: 'student', label: 'For Students', icon: GraduationCap },
                { id: 'teacher', label: 'For Teachers', icon: School },
                { id: 'parent', label: 'For Parents', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeAudienceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAudienceTab(tab.id as any)}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#11428E] text-white shadow-md'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="size-3.5 sm:size-4" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Tab Card Content */}
          <div className="p-5 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm">
            {activeAudienceTab === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Student Experience</span>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] leading-tight">
                    Engaging, Self-Paced Learning with Zero Barriers
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Students can learn anywhere—at school or at home—without worrying about Wi-Fi or data allowances.
                  </p>
                  <ul className="flex flex-col gap-2 sm:gap-2.5 text-xs text-[var(--text-main)] font-semibold mt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> Interactive study slides with collapsible checkpoint questions</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> Gamified star rewards, level progression, and mascot closet</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> Immediate positive feedback and detailed answer explanations</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> 1-tap offline guest mode with zero registration required</li>
                  </ul>
                </div>
                <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Active Module</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">Grade 4 Math</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">Fractions &amp; Decimals Mastery</h4>
                  <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-4/5" />
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">80% Competency Achieved • 12 Stars Earned</span>
                </div>
              </div>
            )}

            {activeAudienceTab === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Teacher Experience</span>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] leading-tight">
                    Comprehensive Classroom Analytics &amp; SF9 Reporting
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    Save hours of manual grading with automated telemetry and standardized DepEd report outputs.
                  </p>
                  <ul className="flex flex-col gap-2 sm:gap-2.5 text-xs text-[var(--text-main)] font-semibold mt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-blue-500 shrink-0" /> Real-time mastery matrix displaying student competency status</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-blue-500 shrink-0" /> One-click official DepEd SF9 report card export</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-blue-500 shrink-0" /> Manual and AI-assisted custom lesson builder with checkpoints</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-blue-500 shrink-0" /> Classroom PIN generation for seamless pairing</li>
                  </ul>
                </div>
                <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Section 4-Rizal</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">32 Students</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">Classroom Mastery Rate: 88.4%</h4>
                  <p className="text-xs text-[var(--text-muted)]">Pre/Post test growth: +24.6% improvement across all MELC competencies.</p>
                </div>
              </div>
            )}

            {activeAudienceTab === 'parent' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Parent Experience</span>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--text-main)] leading-tight">
                    Stay Connected to Your Child's Academic Journey
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    No complicated setups. A simple 6-digit access code pairs parent devices with their child's tablet or phone.
                  </p>
                  <ul className="flex flex-col gap-2 sm:gap-2.5 text-xs text-[var(--text-main)] font-semibold mt-1">
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Daily study activity timeline and quiz accuracy breakdown</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Screen-time limit guard to foster balanced study habits</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Subject-level strengths and growth areas summary</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-amber-500 shrink-0" /> Instant badge showcase to celebrate milestones</li>
                  </ul>
                </div>
                <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">Linked Student</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Grade 4</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-main)]">Screen Time Guard: 38 / 60 Mins</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Healthy learning balance active.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 4: Mobile App Simulator Showcase Callout (Dynamic Screen Fitting) ── */}
        <section id="mobile-preview" className="scroll-mt-16 px-4 sm:px-8 py-12 sm:py-16 min-h-[calc(100vh-3.5rem)] flex flex-col justify-center bg-gradient-to-br from-[#11428E]/10 via-[var(--bg-main)] to-[#A01322]/10 border-t border-[var(--border-color)]">
          <div className="max-w-4xl mx-auto rounded-3xl p-6 sm:p-12 border border-[#11428E]/20 bg-[var(--bg-card)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 w-full my-auto">
            <div className="flex flex-col gap-2.5 sm:gap-3 max-w-lg text-center sm:text-left items-center sm:items-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold w-fit">
                <Smartphone className="size-3.5" />
                <span>Interactive Mobile Showcase</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-[var(--text-main)] tracking-tight">
                Experience the Mobile App Live
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Test the smartphone interface directly in your browser. Experiment with live study slide checkpoints, answer a sample quiz question, and test the offline mode toggle.
              </p>
            </div>

            <button
              onClick={onOpenMobileShowcase}
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 w-full sm:w-auto"
            >
              <Smartphone className="size-4" />
              <span>Launch Mobile Showcase →</span>
            </button>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border-color)] px-4 sm:px-8 py-8 bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-[#11428E]" />
            <span className="font-extrabold text-[var(--text-main)]">GURO Platform</span>
            <span>• Guided Unified Resource Optimization</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <span>DepEd MELC Aligned</span>
            <span>•</span>
            <span>100% Offline Ready</span>
            <span>•</span>
            <button onClick={onOpenAuth} className="text-[#11428E] dark:text-sky-400 hover:underline cursor-pointer">
              Sign In / Portal
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
