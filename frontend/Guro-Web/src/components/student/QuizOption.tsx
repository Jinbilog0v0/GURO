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
    let cardStyle = 'bg-zinc-50/40 border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300';

    if (isSubmitted) {
        if (isCorrectAnswer) {
            cardStyle = 'bg-emerald-50/30 border-emerald-500 text-emerald-700';
        } else if (isSelected) {
            cardStyle = 'bg-red-50/30 border-red-500 text-red-700';
        } else {
            cardStyle = 'bg-zinc-50/10 border-zinc-200 text-zinc-400 opacity-60';
        }
    } else if (isSelected) {
        cardStyle = 'bg-blue-50/40 border-blue-500 text-blue-700 ring-2 ring-blue-500/10';
    }

    return (
        <button
            type="button"
            disabled={isSubmitted}
            onClick={onSelect}
            className={`w-full px-6 py-5 flex items-center justify-between text-left text-lg font-semibold rounded-2xl border transition-all duration-200 focus:outline-none relative cursor-pointer ${cardStyle}`}
        >
            <span className="truncate pr-4">{text}</span>

            {/* Icon feedback conditionally rendered after execution */}
            {isSubmitted && isCorrectAnswer && (
                <CheckCircle2 className="size-6 text-emerald-500 shrink-0" strokeWidth={2.5} />
            )}
            {isSubmitted && isSelected && !isCorrectAnswer && (
                <XCircle className="size-6 text-red-500 shrink-0" strokeWidth={2.5} />
            )}
        </button>
    );
};
