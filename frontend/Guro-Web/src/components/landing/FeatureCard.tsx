import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FeatureCardProps {
    label: string;
    Icon: LucideIcon;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ label, Icon }) => {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-md shadow-zinc-100 transition-shadow hover:shadow-lg border border-zinc-100/30">
            <div className="text-zinc-500">
                <Icon className="size-8 text-blue-600" strokeWidth={2} />
            </div>
            <span className="text-center text-base font-medium text-zinc-800">{label}</span>
        </div>
    );
};
