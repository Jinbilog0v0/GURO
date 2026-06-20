import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    value: string | number;
    labelEn: string;
    Icon: LucideIcon;
    iconColor: string; // Tailwind text utility class
}

export const StatCard: React.FC<StatCardProps> = ({
    value,
    labelEn,
    Icon,
    iconColor,
}) => {
    return (
        <div className="flex flex-col items-center bg-white rounded-[24px] p-6 text-center shadow-lg shadow-zinc-200/60 border border-zinc-100/50 transition-shadow hover:shadow-xl w-full">
            {/* Miniature Icon Capsule */}
            <Icon className={`size-7 ${iconColor}`} strokeWidth={2} />

            {/* Numerical Data Metrics Representation */}
            <span className="mt-3 text-3xl font-extrabold text-zinc-800 tracking-tight">
                {value}
            </span>

            {/* Regionalized Explanatory Label Pack */}
            <div className="mt-1 flex flex-col">
                <span className="text-xs font-bold text-zinc-500">{labelEn}</span>
            </div>
        </div>
    );
};
