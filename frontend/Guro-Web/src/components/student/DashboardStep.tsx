import React from 'react';
import { ArrowLeft, Calculator, BookOpen, Trophy, TrendingUp, Flame, LogOut } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { StatCard } from './StatCard';

interface DashboardStepProps {
    userName: string;
    selectedGrade: number;
    onBack: () => void;
    onSelectSubject: (subject: string) => void;
    onLogout?: () => void;
    isLoggedIn?: boolean;
    mathTopics?: string[];
    englishTopics?: string[];
    mathProgress?: number;
    englishProgress?: number;
    stats?: {
        lessonsCompleted: number;
        averageScore: number;
        streak: number;
    };
    parentAccessCode?: string;
}

export const DashboardStep: React.FC<DashboardStepProps> = ({
    userName = 'NJ',
    selectedGrade = 4,
    onBack,
    onSelectSubject,
    onLogout,
    isLoggedIn = false,
    mathTopics = ['Whole Numbers', 'Fractions', 'Geometry'],
    englishTopics = ['Reading', 'Grammar', 'Figures of Speech'],
    mathProgress = 65,
    englishProgress = 72,
    stats = {
        lessonsCompleted: 12,
        averageScore: 85,
        streak: 5
    },
    parentAccessCode
}) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 bg-zinc-50 relative overflow-hidden select-none">
            {/* Background ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            {/* Top Navigation Row */}
            <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                    >
                        <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                        Back
                    </button>

                    {isLoggedIn && onLogout && (
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200/60 rounded-full shadow-md text-red-600 hover:bg-red-100/50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                        >
                            <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
                            Log Out
                        </button>
                    )}
                </div>

                <div className="px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 font-bold text-sm tracking-tight">
                    Grade {selectedGrade}
                </div>
            </div>

            {/* Main Container Dashboard Body */}
            <div className="flex w-full max-w-6xl flex-col items-center gap-10 mt-20 md:mt-0 relative z-10">

                {/* Welcome Banner Header */}
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 flex items-center justify-center gap-2 tracking-tight">
                        Welcome back, {userName}! <span className="animate-pulse">👋</span>
                    </h1>
                    <div className="mt-3 flex flex-col gap-0.5">
                        <p className="text-lg font-medium text-zinc-600">Choose a subject to continue learning</p>
                        <p className="text-sm font-medium text-zinc-400">Pumili ng paksa para magpatuloy sa pag-aaral</p>
                        {parentAccessCode && (
                            <p className="text-sm font-semibold text-zinc-600 mt-2 bg-zinc-100 px-4 py-1.5 rounded-full border border-zinc-200/60 inline-block mx-auto">
                                🔑 Parent Access Code: <span className="text-blue-600 font-extrabold select-all">{parentAccessCode}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Subjects Dual Grid Layout */}
                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8 px-2">
                    <SubjectCard
                        title="Mathematics"
                        description="Numbers, Fractions, Geometry & More"
                        progress={mathProgress}
                        topics={mathTopics}
                        Icon={Calculator}
                        variant="blue"
                        onClick={() => onSelectSubject('Mathematics')}
                    />
                    <SubjectCard
                        title="English"
                        description="Reading, Grammar & Figures of Speech"
                        progress={englishProgress}
                        topics={englishTopics}
                        Icon={BookOpen}
                        variant="purple"
                        onClick={() => onSelectSubject('English')}
                    />
                </div>

                {/* Bottom Statistical Cards Row */}
                <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-5 px-2">
                    <StatCard
                        value={stats.lessonsCompleted}
                        labelEn="Lessons Completed"
                        labelFil="Natapos na Aralin"
                        Icon={Trophy}
                        iconColor="text-amber-500"
                    />
                    <StatCard
                        value={`${stats.averageScore}%`}
                        labelEn="Average Score"
                        labelFil="Average na Iskor"
                        Icon={TrendingUp}
                        iconColor="text-emerald-500"
                    />
                    <StatCard
                        value={stats.streak}
                        labelEn="Day Streak"
                        labelFil="Sunod-sunod na Araw"
                        Icon={Flame}
                        iconColor="text-orange-500"
                    />
                </div>

            </div>
        </div>
    );
};
