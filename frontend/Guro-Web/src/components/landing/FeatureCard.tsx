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
        <div className="group flex flex-col items-center text-center gap-3 rounded-[24px] bg-white/95 backdrop-blur-md p-5 shadow-lg shadow-zinc-200/60 border border-zinc-100/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200/80 relative overflow-hidden">
            {/* Top decorative accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

            {badge && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#11428E] border border-blue-100">
                    {badge}
                </span>
            )}

            {/* Glowing Icon Container */}
            <div className={`size-12 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="size-6 text-white" strokeWidth={2.2} />
            </div>

            {/* Content Labels */}
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-extrabold text-zinc-800 tracking-tight leading-snug">
                    {label}
                </span>
                {description && (
                    <span className="text-xs font-medium text-zinc-500 leading-relaxed">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
};
