import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FeatureCardProps {
    label: string;
    description?: string;
    badge?: string;
    Icon: LucideIcon;
    gradient?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    label,
    description,
    badge,
    Icon,
    gradient = 'from-[#11428E] to-blue-600',
}) => {
    return (
        <div className="group flex flex-col items-center text-center gap-3 rounded-[24px] glass-panel p-5 shadow-lg border border-[var(--border-color)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-primary)] relative overflow-hidden">
            {/* Top decorative accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

            {badge && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#11428E]/10 text-[#3b82f6] border border-[#11428E]/20">
                    {badge}
                </span>
            )}

            {/* Glowing Icon Container */}
            <div className={`size-12 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="size-6 text-white" strokeWidth={2.2} />
            </div>

            {/* Content Labels */}
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-extrabold text-[var(--text-main)] tracking-tight leading-snug">
                    {label}
                </span>
                {description && (
                    <span className="text-xs font-medium text-[var(--text-muted)] leading-relaxed">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};
