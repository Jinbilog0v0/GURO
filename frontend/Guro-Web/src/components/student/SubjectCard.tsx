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
            iconBg: 'bg-blue-500',
            badgeBg: 'bg-blue-50 text-blue-600',
            progressBar: 'bg-blue-600',
            pillBg: 'bg-blue-50/60 text-blue-600 hover:bg-blue-100/70',
        },
        purple: {
            iconBg: 'bg-purple-500',
            badgeBg: 'bg-purple-50 text-purple-600',
            progressBar: 'bg-purple-600',
            pillBg: 'bg-purple-50/60 text-purple-600 hover:bg-purple-100/70',
        },
    }[variant];

    return (
        <button
            onClick={onClick}
            className="group flex flex-col w-full text-left bg-white rounded-[32px] p-8 shadow-xl shadow-zinc-200/80 border border-zinc-100/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-300/60 focus:outline-none focus:ring-4 focus:ring-blue-500/5 cursor-pointer"
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
                <h2 className="text-2xl font-extrabold text-zinc-800 tracking-tight">
                    {title}
                </h2>
                <p className="text-sm font-medium text-zinc-500 leading-normal">
                    {description}
                </p>
            </div>

            {/* Progress Track Indicator */}
            <div className="w-full mt-5 bg-zinc-100 h-2.5 rounded-full overflow-hidden">
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
