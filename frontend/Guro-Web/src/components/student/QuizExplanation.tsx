import React from 'react';
import { Lightbulb } from 'lucide-react';

interface QuizExplanationProps {
    isCorrect: boolean;
    explanationEn: string;
    explanationFil: string;
}

export const QuizExplanation: React.FC<QuizExplanationProps> = ({
    isCorrect,
    explanationEn,
    explanationFil,
}) => {
    const containerStyle = isCorrect
        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
        : 'bg-red-50/40 border-red-200 text-red-800';

    const titleColor = isCorrect ? 'text-emerald-700' : 'text-red-700';
    const subtextColor = isCorrect ? 'text-emerald-600/90' : 'text-red-600/90';

    return (
        <div className={`w-full border rounded-[24px] p-5 md:p-6 flex flex-col gap-3 shadow-sm ${containerStyle}`}>
            <div className="flex items-center gap-2 font-bold text-base tracking-tight">
                <Lightbulb className="size-5 shrink-0" strokeWidth={2.5} />
                <span className={titleColor}>
                    {isCorrect ? '✓ Correct!' : '✕ Not quite right'}
                </span>
            </div>

            <div className="flex flex-col gap-2 text-sm leading-relaxed font-medium">
                <p className="text-zinc-700">{explanationEn}</p>
                <p className={`text-xs italic ${subtextColor}`}>{explanationFil}</p>
            </div>
        </div>
    );
};
