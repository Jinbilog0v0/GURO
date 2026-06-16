import React from 'react';

export interface FeatureCardProps {
    label: string;
    icon: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ label, icon }) => {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 shadow-md shadow-zinc-100 transition-shadow hover:shadow-lg border border-zinc-100/30">
            <div className="text-3xl">{icon}</div>
            <span className="text-center text-base font-medium text-zinc-800">{label}</span>
        </div>
    );
};
