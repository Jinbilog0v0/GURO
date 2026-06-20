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
            className="group flex flex-col items-center rounded-[32px] bg-white p-8 pt-10 pb-8 text-center shadow-xl shadow-zinc-200/80 border border-zinc-100/30 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-zinc-300/70 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
        >
            {/* Icon Capsule Squircle */}
            <div className={`flex size-24 items-center justify-center rounded-[28px] ${iconBgColor} shadow-md transition-transform group-hover:scale-105 duration-300`}>
                <Icon className="size-12 text-white" strokeWidth={1.5} />
            </div>

            {/* Grade Level Headings */}
            <h2 className="mt-6 text-2xl font-bold text-zinc-800 tracking-tight">
                Grade {grade}
            </h2>

            {/* Dynamic Subtext Stack */}
            <div className="mt-2 flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-zinc-500 group-hover:text-zinc-600 transition-colors">
                    Click to start
                </p>
            </div>
        </button>
    );
};
