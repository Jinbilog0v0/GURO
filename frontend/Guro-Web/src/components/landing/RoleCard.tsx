import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface RoleCardProps {
    role: string;
    description: string;
    Icon: LucideIcon;
    bgColor: string; // Tailwind bg color class
    onClick?: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role, description, Icon, bgColor, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center rounded-[32px] glass-panel p-12 text-center shadow-xl border border-[var(--border-color)] transition-all hover:-translate-y-1 hover:border-[var(--accent-primary)] cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#11428E]/10 w-full"
        >
            <div className={`flex size-24 items-center justify-center rounded-full ${bgColor} border-[6px] border-[var(--bg-card)] shadow-lg`}>
                <Icon className="size-12 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="mt-8 text-3xl font-extrabold text-[var(--text-main)]">I am a {role}</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-muted)] font-medium">{description}</p>
        </button>
    );
};
