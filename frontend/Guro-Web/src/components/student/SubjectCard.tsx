import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SubjectCardProps {
    title: string;
    description: string;
    progress: number;
    topics: string[];
    Icon: LucideIcon;
    variant: 'blue' | 'purple';
    onClick: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
    title,
    description,
    progress,
    topics,
    Icon,
    variant,
    onClick,
}) => {
    // Theme styling dictionaries
    const theme = {
        blue: {
            iconBg: 'bg-[#11428E]',
            badgeBg: 'bg-[#11428E]/10 text-[#3b82f6] border border-[#11428E]/20',
            progressBar: 'bg-[#11428E]',
            pillBg: 'bg-[#11428E]/10 text-[#3b82f6] hover:bg-[#11428E]/20 border border-[#11428E]/15',
        },
        purple: {
            iconBg: 'bg-purple-600',
            badgeBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
            progressBar: 'bg-purple-600',
            pillBg: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/15',
        },
    }[variant];

    return (
        <button
            onClick={onClick}
            className="group flex flex-col w-full text-left glass-panel rounded-[32px] p-8 shadow-xl border border-[var(--border-color)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-primary)] focus:outline-none focus:ring-4 focus:ring-[#11428E]/10 cursor-pointer"
        >
            {/* Top Graphic Header Row */}
            <div className="w-full flex items-start justify-between">
                <div className={`flex size-16 items-center justify-center rounded-[20px] ${theme.iconBg} shadow-md text-white`}>
                    <Icon className="size-8" strokeWidth={2} />
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full tracking-wider ${theme.badgeBg}`}>
                    {progress}%
                </span>
            </div>

            {/* Typography Text Content Block */}
            <div className="mt-6 flex flex-col gap-1">
                <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                    {title}
                </h2>
                <p className="text-sm font-medium text-[var(--text-muted)] leading-normal">
                    {description}
                </p>
            </div>

            {/* Progress Track Indicator */}
            <div className="w-full mt-5 bg-[var(--border-color)] h-2.5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Bottom Sub-Topic Tag Chips list */}
            <div className="mt-6 flex flex-wrap gap-2">
                {topics.map((topic) => (
                    <span
                        key={topic}
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors ${theme.pillBg}`}
                    >
                        {topic}
                    </span>
                ))}
            </div>
        </button>
    );
};
