import React from 'react';
import { Check, X } from 'lucide-react';

interface QuizExplanationProps {
    isCorrect: boolean;
    explanationEn: string;
}

export const QuizExplanation: React.FC<QuizExplanationProps> = ({
    isCorrect,
    explanationEn,
}) => {
    const containerStyle = isCorrect
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
        : 'bg-[#A01322]/10 border-[#A01322]/20 text-[#A01322] dark:text-rose-300';

    const titleColor = isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-[#A01322] dark:text-rose-400';

    return (
        <div className={`w-full border rounded-[24px] p-5 md:p-6 flex flex-col gap-3 shadow-sm ${containerStyle}`}>
            <div className="flex items-center gap-2 font-bold text-base tracking-tight">
                {isCorrect ? (
                    <Check className="size-5 shrink-0 text-emerald-700 dark:text-emerald-400" strokeWidth={3} />
                ) : (
                    <X className="size-5 shrink-0 text-[#A01322] dark:text-rose-400" strokeWidth={3} />
                )}
                <span className={titleColor}>
                    {isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
            </div>

            <div className="flex flex-col gap-2 text-sm leading-relaxed font-medium">
                <p className="text-[var(--text-main)]">{explanationEn}</p>
            </div>
        </div>
    );
};
