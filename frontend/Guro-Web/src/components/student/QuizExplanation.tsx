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
        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
        : 'bg-[#A01322]/10 border-[#A01322]/20 text-[#A01322]';

    const titleColor = isCorrect ? 'text-emerald-700' : 'text-[#A01322]';

    return (
        <div className={`w-full border rounded-[24px] p-5 md:p-6 flex flex-col gap-3 shadow-sm ${containerStyle}`}>
            <div className="flex items-center gap-2 font-bold text-base tracking-tight">
                {isCorrect ? (
                    <Check className="size-5 shrink-0 text-emerald-700" strokeWidth={3} />
                ) : (
                    <X className="size-5 shrink-0 text-[#A01322]" strokeWidth={3} />
                )}
                <span className={titleColor}>
                    {isCorrect ? 'Correct!' : 'Not quite right'}
                </span>
            </div>

            <div className="flex flex-col gap-2 text-sm leading-relaxed font-medium">
                <p className="text-zinc-700">{explanationEn}</p>
            </div>
        </div>
    );
};
