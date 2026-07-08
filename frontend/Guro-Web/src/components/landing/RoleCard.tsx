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
            className="flex flex-col items-center rounded-[32px] bg-white p-12 text-center shadow-xl shadow-zinc-200 transition-all hover:-translate-y-1 hover:shadow-2xl border border-zinc-100/50 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/10 w-full"
        >
            <div className={`flex size-24 items-center justify-center rounded-full ${bgColor} border-[6px] border-white shadow-lg`}>
                <Icon className="size-12 text-white" strokeWidth={1.5} />
            </div>
            <h2 className="mt-8 text-3xl font-semibold text-zinc-900">I am a {role}</h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">{description}</p>
        </button>
    );
};
