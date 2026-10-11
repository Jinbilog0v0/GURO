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
        <div className="flex flex-col items-center bg-[var(--bg-card)] rounded-[24px] p-6 text-center shadow-lg border border-[var(--border-color)] transition-shadow hover:shadow-xl w-full">
            {/* Miniature Icon Capsule */}
            <Icon className={`size-7 ${iconColor}`} strokeWidth={2} />

            {/* Numerical Data Metrics Representation */}
            <span className="mt-3 text-3xl font-extrabold text-[var(--text-main)] tracking-tight">
                {value}
            </span>

            {/* Regionalized Explanatory Label Pack */}
            <div className="mt-1 flex flex-col">
                <span className="text-xs font-bold text-[var(--text-muted)]">{labelEn}</span>
            </div>
        </div>
    );
};
