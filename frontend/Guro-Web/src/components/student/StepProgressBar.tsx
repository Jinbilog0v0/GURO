import React from 'react';

type StepType = 'name' | 'grade' | 'dashboard' | 'topics' | 'progress' | 'study' | 'quiz' | 'results';

const STEPS: { key: StepType; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'grade', label: 'Grade' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'topics', label: 'Topics' },
  { key: 'study', label: 'Study' },
  { key: 'quiz', label: 'Quiz' },
  { key: 'results', label: 'Results' },
];

interface StepProgressBarProps {
  currentStep: StepType;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-sm mx-auto px-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold border-2 transition-all duration-300 ${
                  isDone
                    ? 'bg-[#11428E] border-[#11428E] text-white'
                    : isActive
                    ? 'bg-transparent border-[#11428E] text-[#11428E]'
                    : 'bg-transparent border-white/20 text-white/30'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-[#11428E]' : isDone ? 'text-white/50' : 'text-white/20'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mb-4 mx-1 rounded transition-all duration-300 ${
                  i < currentIndex ? 'bg-[#11428E]' : 'bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
