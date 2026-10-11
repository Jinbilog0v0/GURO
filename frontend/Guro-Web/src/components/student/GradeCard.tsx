import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface GradeCardProps {
    grade: number;
    Icon: LucideIcon;
    iconBgColor: string; // Tailwind bg utility class
    onClick: () => void;
}

export const GradeCard: React.FC<GradeCardProps> = ({
    grade,
    Icon,
    iconBgColor,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center rounded-[32px] bg-[var(--bg-card)] p-8 pt-10 pb-8 text-center shadow-xl border border-[var(--border-color)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
        >
            {/* Icon Capsule Squircle */}
            <div className={`flex size-24 items-center justify-center rounded-[28px] ${iconBgColor} shadow-md transition-transform group-hover:scale-105 duration-300`}>
                <Icon className="size-12 text-white" strokeWidth={1.5} />
            </div>

            {/* Grade Level Headings */}
            <h2 className="mt-6 text-2xl font-bold text-[var(--text-main)] tracking-tight">
                Grade {grade}
            </h2>

            {/* Dynamic Subtext Stack */}
            <div className="mt-2 flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                    Click to start
                </p>
            </div>
        </button>
    );
};
