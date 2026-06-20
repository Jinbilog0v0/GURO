import React from 'react';
import { ArrowLeft, Calculator, BookOpen, Trophy, TrendingUp, Flame, Hand, Key } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { StatCard } from './StatCard';
import { StudentProfile } from './StudentProfile';

interface DashboardStepProps {
    userName: string;
    email?: string;
    selectedGrade: number;
    onBack: () => void;
    onSelectSubject: (subject: string) => void;
    onLogout?: () => void;
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
    email,
    selectedGrade = 4,
    onBack,
    onSelectSubject,
    onLogout,
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
                </div>

                {/* Grade Badge & Student Profile Grouped (Top Right) */}
                <div className="flex items-center gap-3">
                    <div className={`px-5 py-2.5 rounded-full shadow-md font-bold text-sm tracking-tight border ${
                        selectedGrade === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                        selectedGrade === 5 ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                        selectedGrade === 6 ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                        'bg-white text-zinc-700 border-zinc-200/60'
                    }`}>
                        Grade {selectedGrade}
                    </div>
                    <StudentProfile
                        userName={userName}
                        email={email}
                        onLogout={onLogout}
                    />
                </div>
            </div>

            {/* Main Container Dashboard Body */}
            <div className="flex w-full max-w-6xl flex-col items-center gap-10 mt-20 md:mt-0 relative z-10">

                {/* Welcome Banner Header */}
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 flex items-center justify-center gap-2.5 tracking-tight">
                        Welcome back, {userName}! <Hand className="size-8 text-amber-500 animate-bounce inline-block shrink-0" />
                    </h1>
                    <div className="mt-3 flex flex-col gap-0.5">
                        <p className="text-lg font-medium text-zinc-600">Choose a subject to continue learning</p>
                        {parentAccessCode && (
                            <p className="text-sm font-semibold text-zinc-600 mt-2 bg-zinc-100 px-4 py-1.5 rounded-full border border-zinc-200/60 inline-flex items-center gap-1.5 justify-center mx-auto">
                                <Key className="size-4 text-amber-500 shrink-0" />
                                <span>Parent Access Code:</span>
                                <span className="text-blue-600 font-extrabold select-all ml-0.5">{parentAccessCode}</span>
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
                        Icon={Trophy}
                        iconColor="text-amber-500"
                    />
                    <StatCard
                        value={`${stats.averageScore}%`}
                        labelEn="Average Score"
                        Icon={TrendingUp}
                        iconColor="text-emerald-500"
                    />
                    <StatCard
                        value={stats.streak}
                        labelEn="Day Streak"
                        Icon={Flame}
                        iconColor="text-orange-500"
                    />
                </div>

            </div>
        </div>
    );
};
