import React from 'react';
import { ArrowLeft, Sprout, Leaf, Trees, Star, Target } from 'lucide-react';
import { GradeCard, type GradeCardProps } from './GradeCard';
import { StudentProfile } from './StudentProfile';

interface GradeSelectionStepProps {
    userName: string;
    email?: string;
    onBack: () => void;
    onSelectGrade: (grade: number) => void;
}

export const GradeSelectionStep: React.FC<GradeSelectionStepProps> = ({
    userName = 'NJ',
    email,
    onBack,
    onSelectGrade,
}) => {
    const gradeLevels: GradeCardProps[] = [
        {
            grade: 4,
            Icon: Sprout,
            iconBgColor: 'bg-emerald-500',
            onClick: () => onSelectGrade(4),
        },
        {
            grade: 5,
            Icon: Leaf,
            iconBgColor: 'bg-blue-500',
            onClick: () => onSelectGrade(5),
        },
        {
            grade: 6,
            Icon: Trees,
            iconBgColor: 'bg-purple-600',
            onClick: () => onSelectGrade(6),
        },
    ];

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 bg-zinc-50 relative overflow-hidden select-none">
            {/* Background ambient blurs for design consistency */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            {/* Back Button */}
            <button
                onClick={onBack}
                className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-medium text-sm z-20 cursor-pointer"
            >
                <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                Back
            </button>

            {/* Student Profile (Top Right) */}
            <div className="absolute top-6 right-6 md:top-10 md:right-10 z-20">
                <StudentProfile
                    userName={userName}
                    email={email}
                />
            </div>

            <div className="flex w-full max-w-5xl flex-col items-center gap-10 mt-16 md:mt-0 relative z-10">

                {/* Step Header */}
                <div className="flex flex-col items-center text-center gap-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 flex items-center gap-2.5 tracking-tight">
                        <Star className="size-8 text-amber-400 fill-amber-400 shrink-0" />
                        <span>Hello, {userName}!</span>
                        <Star className="size-8 text-amber-400 fill-amber-400 shrink-0" />
                    </h1>
                    <div className="mt-2 flex flex-col gap-0.5">
                        <p className="text-lg font-medium text-zinc-600">Select your grade level to begin</p>
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
                    <p className="text-sm md:text-base font-semibold text-zinc-700 leading-relaxed flex items-center justify-center gap-1.5">
                        <Target className="size-5 text-[#A01322] shrink-0" />
                        <span>Choose your current grade level. Don't worry, GURO will adapt to your learning pace!</span>
                    </p>
                </div>

            </div>
        </div>
    );
};
