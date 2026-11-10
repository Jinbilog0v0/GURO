import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Target, 
  Key, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  ArrowDown,
  GraduationCap
} from 'lucide-react';

interface StudentFeatureTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  description: string;
  highlightIcon: React.ElementType;
  arrowPosition: 'top' | 'bottom' | 'center';
  tip: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Explore Subjects & DepEd Topics',
    badge: 'Step 1 of 4 • Curriculum',
    description: 'Choose between Mathematics and English. Each subject contains DepEd MELC-aligned competencies broken down into digestible, bite-sized topics.',
    highlightIcon: BookOpen,
    arrowPosition: 'top',
    tip: 'Click any topic card to begin studying!',
  },
  {
    title: 'Study Slides & Visual Flashcards',
    badge: 'Step 2 of 4 • Self-Paced',
    description: 'Read illustrated slides with real-world Philippine examples, step-by-step problem solutions, and grammar explanations before starting the quiz.',
    highlightIcon: GraduationCap,
    arrowPosition: 'center',
    tip: 'Take your time — the study slides are untimed.',
  },
  {
    title: 'Challenge Yourself with Quizzes',
    badge: 'Step 3 of 4 • Mastery Check',
    description: 'Answer diagnostic quizzes to test your knowledge! Watch the countdown timer, earn XP jewels, maintain your study streak, and collect mastery badges.',
    highlightIcon: Target,
    arrowPosition: 'bottom',
    tip: 'Scoring 80% or higher awards a Mastery badge!',
  },
  {
    title: 'Pair with Your Teacher’s Section',
    badge: 'Step 4 of 4 • Classroom Sync',
    description: 'Click Classroom Code in the menu. Enter your teacher’s 6-character code (e.g. GRADE4-QUEZON) and your 12-digit DepEd LRN to submit progress and attendance.',
    highlightIcon: Key,
    arrowPosition: 'top',
    tip: 'Ask your class adviser for your section code.',
  },
];

export const StudentFeatureTour: React.FC<StudentFeatureTourProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.highlightIcon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.setItem('guro_student_tour_completed_v1', 'true');
      }
      if (onComplete) onComplete();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guro_student_tour_completed_v1', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 flex flex-col gap-5 text-[var(--text-main)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Animated Directional Arrow Coach Mark */}
        <div className="flex items-center justify-center -mt-2">
          <div className="flex flex-col items-center gap-1 text-[#11428E] dark:text-sky-400 animate-bounce">
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#11428E]/10 dark:bg-sky-500/10 px-3 py-1 rounded-full border border-[#11428E]/20">
              Interactive Guide
            </span>
            <ArrowDown className="size-5" />
          </div>
        </div>

        {/* Card Header & Step Counter */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#11428E] to-blue-600 text-white shadow-lg shadow-[#11428E]/30">
              <StepIcon className="size-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-[#11428E] dark:text-sky-400 uppercase tracking-wider font-mono">
                {step.badge}
              </span>
              <h3 className="text-lg font-bold text-[var(--text-main)] mt-0.5">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-colors cursor-pointer"
            aria-label="Skip walkthrough"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Description */}
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed max-w-prose">
          {step.description}
        </p>

        {/* Helpful Tip Box */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-sidebar)] border border-[var(--border-color)] flex items-center gap-2.5 text-xs text-[var(--text-main)]">
          <Sparkles className="size-4 shrink-0 text-amber-500 animate-pulse" />
          <span>
            <strong>Pro Tip:</strong> {step.tip}
          </span>
        </div>

        {/* Progress Dots Indicator */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === currentStep 
                  ? 'w-6 bg-[#11428E] dark:bg-sky-400' 
                  : 'w-2 bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
              }`}
              aria-label={`Jump to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-3.5 py-2 text-xs font-bold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#11428E] to-[#10B981] hover:opacity-95 text-white text-xs font-bold shadow-md shadow-[#11428E]/25 transition-all cursor-pointer hover:scale-102 active:scale-98"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Got it, let’s go!' : 'Next Step'}</span>
              {currentStep === TOUR_STEPS.length - 1 ? <CheckCircle2 className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
