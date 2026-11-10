import React, { useState, useEffect } from 'react';
import { X, BookOpen, GraduationCap, Users, HeartHandshake, CheckCircle2, QrCode, Smartphone, WifiOff, FileText, Printer, ArrowRight } from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'student' | 'teacher' | 'parent';
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'student',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'parent'>(defaultRole);

  useEffect(() => {
    setActiveTab(defaultRole);
  }, [defaultRole, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#11428E]/10 dark:bg-sky-500/10 text-[#11428E] dark:text-sky-400">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h2 id="manual-title" className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                GURO User Manual & Quick Guide
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                DepEd K to 12 MELC-Aligned Offline-Capable Learning Platform
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg transition-colors cursor-pointer"
              title="Print Manual"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer focus:ring-2 focus:ring-[#11428E]/30 focus:outline-none"
              aria-label="Close user manual"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto">
          {[
            { id: 'student' as const, label: 'Student Guide', icon: GraduationCap },
            { id: 'teacher' as const, label: 'Teacher Guide', icon: Users },
            { id: 'parent' as const, label: 'Parent Guide', icon: HeartHandshake },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-[#11428E] text-[#11428E] dark:border-sky-400 dark:text-sky-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
          {activeTab === 'student' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] mb-1 flex items-center gap-2">
                  <GraduationCap className="size-4 text-[#11428E] dark:text-sky-400" />
                  Student Quick-Start Guide (Learners)
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-prose">
                  Master Mathematics and English lessons with interactive study slides, beat diagnostic quizzes, and track your daily streak!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#11428E] dark:text-sky-400">
                    <span className="w-5 h-5 rounded-full bg-[#11428E] dark:bg-sky-500 text-white flex items-center justify-center text-[11px]">1</span>
                    Joining Your Classroom
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Enter Teacher's Code</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Click <strong>Classroom</strong> in the navigation. Ask your teacher for the 6-character Section Code (e.g., <code>GRADE4-QUEZON</code>) and enter your 12-digit DepEd LRN to connect.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                    Studying Lessons
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Interactive Flashcards & Slides</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Browse topics under Mathematics or English. Each topic contains visual slides with diagrams, formulas, definitions, and real-world examples aligned with DepEd MELCs.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px]">3</span>
                    Taking Quizzes
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Timed Quizzes & Instant Feedback</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Test your understanding with multiple choice, matching pairs, and fill-in questions. Keep an eye on the top timer bar, earn XP, and unlock mastery badges.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">4</span>
                    Offline Mode & Sync
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Zero-Data Mobile App</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    The Android mobile app works completely without internet! All your quiz scores and study minutes are safely stored on your device and will auto-sync when you connect to Wi-Fi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] mb-1 flex items-center gap-2">
                  <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Teacher Management Guide (Advisers & Subject Teachers)
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-prose">
                  Manage classrooms, track DepEd SF2 daily attendance, monitor Form SF9 mastery grades, and build custom curriculum banks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#11428E] dark:text-sky-400">
                    <span className="w-5 h-5 rounded-full bg-[#11428E] dark:bg-sky-500 text-white flex items-center justify-center text-[11px]">1</span>
                    Classroom Creation & Enrolling
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Create Sections & Student Accounts</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Create your classroom (Grade 4, 5, or 6). Share the classroom code with students or directly create student accounts using their 12-digit DepEd LRN.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px]">2</span>
                    Daily Attendance Roll Call
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">1-Click SF2 Daily Roll Call</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Use the <strong>Attendance</strong> tab in Teacher Space to take attendance in seconds. Mark all present with 1 click, toggle Late/Absent/Excused, and export monthly DepEd SF2 logs.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">3</span>
                    Lesson & Quiz Builder
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">AI-Assisted or Manual Item Bank</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Generate DepEd MELC-aligned questions with AI or add your own custom items. Configure quiz timers, correct answer disclosures, and toggle subject visibility per section.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px]">4</span>
                    DepEd Form SF9 Analytics
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Automated Mastery & Grade Reports</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    View student pre-test and post-test gains, mastery levels per competency, and generate printable Form SF9 progress reports for parent consultations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parent' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)] mb-1 flex items-center gap-2">
                  <HeartHandshake className="size-4 text-amber-600 dark:text-amber-400" />
                  Parent & Guardian Portal Guide
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-prose">
                  Stay updated on your child's academic achievements, study habits, attendance alerts, and chat directly with their adviser.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-[#11428E] dark:text-sky-400">
                    <span className="w-5 h-5 rounded-full bg-[#11428E] dark:bg-sky-500 text-white flex items-center justify-center text-[11px]">1</span>
                    Linking Your Child
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">6-Digit Parent Access Code</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Ask your child or their teacher for their 6-digit Parent Code (found in Student Settings). Enter the code in Parent Space to link their academic record.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                    Progress & Score Monitoring
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Real-Time Mastery & Streaks</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Check your child's average quiz score, topics they find challenging, daily active study minutes, and badges unlocked in Mathematics and English.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
                    Attendance Notifications
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Automatic Session Alerts</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Receive automated notifications whenever your child logs into GURO, syncs active learning hours, or is marked present by their teacher during roll call.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px]">4</span>
                    Teacher Consultation Chat
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-main)]">Secure Direct Messaging</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-prose">
                    Send messages to your child's teacher during their scheduled DepEd consultation hours to discuss remedial interventions, study tips, and homework help.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GURO Platform v1.0.3 · DepEd Region IX Certified MELC Guidelines</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white transition-all cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
