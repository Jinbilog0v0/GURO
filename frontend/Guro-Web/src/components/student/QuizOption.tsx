import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizOptionProps {
    text: string;
    isSelected: boolean;
    isSubmitted: boolean;
    isCorrectAnswer: boolean;
    onSelect: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
    text,
    isSelected,
    isSubmitted,
    isCorrectAnswer,
    onSelect,
}) => {
    // Determine interactive style configurations dynamically
    let cardStyle = 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card)] hover:border-[var(--accent-primary)]';

    if (isSubmitted) {
        if (isCorrectAnswer) {
            cardStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400';
        } else if (isSelected) {
            cardStyle = 'bg-[#A01322]/15 border-[#A01322] text-[#A01322] dark:text-rose-400';
        } else {
            cardStyle = 'bg-[var(--bg-main)]/50 border-[var(--border-color)] text-[var(--text-muted)] opacity-50';
        }
    } else if (isSelected) {
        cardStyle = 'bg-[#11428E]/15 border-[#11428E] dark:border-blue-400 text-[#11428E] dark:text-blue-300 ring-2 ring-[#11428E]/20';
    }

    return (
        <button
            type="button"
            disabled={isSubmitted}
            onClick={onSelect}
            className={`w-full px-5 py-4 flex items-center justify-between text-left text-sm sm:text-base font-semibold rounded-2xl border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 focus:outline-none relative cursor-pointer ${cardStyle}`}
        >
            <span className="pr-4 break-words whitespace-normal leading-relaxed">{text}</span>

            {/* Icon feedback conditionally rendered after execution */}
            {isSubmitted && isCorrectAnswer && (
                <CheckCircle2 className="size-6 text-emerald-500 shrink-0" strokeWidth={2.5} />
            )}
            {isSubmitted && isSelected && !isCorrectAnswer && (
                <XCircle className="size-6 text-[#A01322] shrink-0" strokeWidth={2.5} />
            )}
        </button>
    );
};
