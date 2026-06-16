import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { GradeCard, type GradeCardProps } from './GradeCard';

interface GradeSelectionStepProps {
    userName: string;
    onBack: () => void;
    onSelectGrade: (grade: number) => void;
    onLogout?: () => void;
    isLoggedIn?: boolean;
}

export const GradeSelectionStep: React.FC<GradeSelectionStepProps> = ({
    userName = 'NJ',
    onBack,
    onSelectGrade,
    onLogout,
    isLoggedIn = false,
}) => {
    const gradeLevels: GradeCardProps[] = [
        {
            grade: 4,
            emoji: '🌱',
            iconBgColor: 'bg-emerald-500',
            onClick: () => onSelectGrade(4),
        },
        {
            grade: 5,
            emoji: '🌿',
            iconBgColor: 'bg-blue-500',
            onClick: () => onSelectGrade(5),
        },
        {
            grade: 6,
            emoji: '🌳',
            iconBgColor: 'bg-purple-600',
            onClick: () => onSelectGrade(6),
        },
    ];

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 bg-zinc-50 relative overflow-hidden select-none">
            {/* Background ambient blurs for design consistency */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            {/* Back or Log Out Button */}
            {isLoggedIn && onLogout ? (
                <button
                    onClick={onLogout}
                    className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200/60 rounded-full shadow-md text-red-600 hover:bg-red-100/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm z-20 cursor-pointer"
                >
                    <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
                    Log Out
                </button>
            ) : (
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm z-20 cursor-pointer"
                >
                    <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                    Back
                </button>
            )}

            <div className="flex w-full max-w-5xl flex-col items-center gap-10 mt-16 md:mt-0 relative z-10">

                {/* Step Header */}
                <div className="flex flex-col items-center text-center gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 flex items-center gap-2 tracking-tight">
                        <span className="text-amber-400">⭐</span>
                        Hello, {userName}!
                        <span className="text-amber-400">⭐</span>
                    </h1>
                    <div className="mt-2 flex flex-col gap-0.5">
                        <p className="text-lg font-medium text-zinc-600">Select your grade level to begin</p>
                        <p className="text-sm font-medium text-zinc-400">Pumili ng iyong grade level para magsimula</p>
                    </div>
                </div>

                {/* Grade Cards Grid */}
                <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-6 px-4">
                    {gradeLevels.map((level) => (
                        <GradeCard key={level.grade} {...level} />
                    ))}
                </div>

                {/* Informational Bottom Callout Banner */}
                <div className="w-full max-w-3xl bg-white rounded-[24px] p-6 shadow-xl shadow-zinc-200/60 border border-zinc-100 flex flex-col items-center text-center gap-1.5 transition-all">
                    <p className="text-sm md:text-base font-semibold text-zinc-700 leading-relaxed">
                        🎯 Choose your current grade level. Don't worry, GURO will adapt to your learning pace!
                    </p>
                    <p className="text-xs md:text-sm font-medium text-zinc-400 leading-relaxed max-w-2xl">
                        Pumili ng iyong kasalukuyang grade level. Huwag mag-alala, mag-aangkop ang GURO sa iyong bilis ng pag-aaral!
                    </p>
                </div>

            </div>
        </div>
    );
};
