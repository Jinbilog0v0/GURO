import React, { useMemo } from 'react';
import {
    Trophy, Flame, Calculator, BookOpen, Zap, Star,
    Clock, TrendingUp, CheckCircle2, AlertCircle, Activity,
} from 'lucide-react';

interface ProgressEvent {
    eventId: string;
    subject: string;
    gradeLevel: number;
    topic: string;
    score: number;
    totalQuestions: number;
    timestamp: string;
}

interface ProgressViewProps {
    studentProgress: ProgressEvent[];
    streakCount?: number;
    xpPoints?: number;
}

const SUBJECTS = ['Mathematics', 'English'] as const;
const GRADES = [4, 5, 6] as const;

const BADGE_INFO: Record<string, { emoji: string; label: string; desc: string }> = {
    first_step:       { emoji: '👣', label: 'First Step',     desc: 'Completed your first lesson' },
    perfect_score:    { emoji: '💯', label: 'Perfect 100%',   desc: 'Got 100% on any quiz' },
    math_wizard:      { emoji: '🧮', label: 'Math Wizard',    desc: 'Perfect score in Mathematics' },
    english_champion: { emoji: '📖', label: 'English Champ',  desc: 'Perfect score in English' },
    streak_starter:   { emoji: '🔥', label: 'Streak Starter', desc: '3-day study streak' },
    streak_master:    { emoji: '⚡', label: 'Streak Master',  desc: '5-day study streak' },
};

function deriveWebBadges(progress: ProgressEvent[], streak: number): string[] {
    const badges: string[] = [];
    if (progress.length > 0) badges.push('first_step');
    if (progress.some(p => p.score === p.totalQuestions)) {
        badges.push('perfect_score');
        if (progress.some(p => p.score === p.totalQuestions && p.subject === 'Mathematics')) badges.push('math_wizard');
        if (progress.some(p => p.score === p.totalQuestions && p.subject === 'English')) badges.push('english_champion');
    }
    if (streak >= 3) badges.push('streak_starter');
    if (streak >= 5) badges.push('streak_master');
    return badges;
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
    return (
        <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    );
}

export const ProgressView: React.FC<ProgressViewProps> = ({
    studentProgress,
    streakCount = 0,
    xpPoints = 0,
}) => {
    const level = Math.floor(xpPoints / 100) + 1;
    const xpInLevel = xpPoints % 100;

    // 7-day activity calendar
    const weekActivity = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
        const isToday = i === 6;
        const active = studentProgress.some(p => p.timestamp.startsWith(dateStr));
        return { label, active, isToday };
    }), [studentProgress]);

    // Subject × grade breakdown
    const subjectBreakdown = useMemo(() => {
        const result: { key: string; subject: string; grade: number; avg: number; attempts: number }[] = [];
        for (const subject of SUBJECTS) {
            for (const grade of GRADES) {
                const logs = studentProgress.filter(p => p.subject === subject && p.gradeLevel === grade);
                if (logs.length === 0) continue;
                const avg = Math.round(logs.reduce((a, p) => a + (p.score / p.totalQuestions) * 100, 0) / logs.length);
                result.push({ key: `${subject}-${grade}`, subject, grade, avg, attempts: logs.length });
            }
        }
        return result;
    }, [studentProgress]);

    // Recent activity (last 6, newest first)
    const recentActivity = useMemo(() =>
        [...studentProgress]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 6),
        [studentProgress]
    );

    // Totals
    const totalQuizzes = studentProgress.length;
    const overallAvg = totalQuizzes > 0
        ? Math.round(studentProgress.reduce((a, p) => a + (p.score / p.totalQuestions) * 100, 0) / totalQuizzes)
        : 0;

    // Badges
    const unlockedBadges = useMemo(() => deriveWebBadges(studentProgress, streakCount), [studentProgress, streakCount]);

    const scoreColor = (avg: number) =>
        avg >= 80 ? '#16A34A' : avg >= 60 ? '#2563EB' : '#E8890C';

    return (
        <div className="min-h-[calc(100vh-56px)] w-full bg-zinc-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">

                {/* Page header */}
                <div>
                    <h1 className="text-2xl font-extrabold text-zinc-800 tracking-tight">My Progress</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Track your learning journey</p>
                </div>

                {/* Summary stat cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: <Trophy className="size-5 text-amber-500" />, value: totalQuizzes, label: 'Quizzes Done' },
                        { icon: <TrendingUp className="size-5 text-emerald-500" />, value: `${overallAvg}%`, label: 'Overall Avg' },
                        { icon: <Flame className="size-5 text-orange-500" />, value: streakCount, label: 'Day Streak' },
                        { icon: <Zap className="size-5 text-amber-400" />, value: xpPoints, label: 'Total XP' },
                    ].map(({ icon, value, label }) => (
                        <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100 flex flex-col gap-2">
                            {icon}
                            <span className="text-2xl font-black text-zinc-800">{value}</span>
                            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
                        </div>
                    ))}
                </div>

                {/* XP level bar */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Star className="size-5 text-amber-400 fill-amber-400" />
                            <span className="font-extrabold text-zinc-800">Level {level} Explorer</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-400">{xpInLevel} / 100 XP</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#11428E] to-[#A01322] transition-all duration-700"
                            style={{ width: `${xpInLevel}%` }}
                        />
                    </div>
                </div>

                {/* 7-day activity */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="size-4 text-[#11428E]" />
                        <h2 className="font-extrabold text-zinc-800 text-sm">This Week</h2>
                        <span className="text-xs text-zinc-400 ml-1">Days you studied</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {weekActivity.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                                    day.active
                                        ? 'bg-[#11428E] border-[#11428E]'
                                        : day.isToday
                                        ? 'border-[#11428E]/40 bg-[#11428E]/5'
                                        : 'bg-zinc-50 border-zinc-200'
                                }`}>
                                    {day.active && <Flame className="size-4 text-white" />}
                                    {!day.active && day.isToday && <Clock className="size-3.5 text-[#11428E]/60" />}
                                </div>
                                <span className={`text-[10px] font-bold ${day.active ? 'text-[#11428E]' : 'text-zinc-400'}`}>
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subject breakdown */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-[#11428E]" />
                        <h2 className="font-extrabold text-zinc-800 text-sm">Subject Progress</h2>
                        <span className="text-xs text-zinc-400 ml-1">Avg score per subject & grade</span>
                    </div>
                    {subjectBreakdown.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-6 text-center">
                            <Trophy className="size-8 text-zinc-300" />
                            <p className="text-sm text-zinc-400">Complete lessons to see your scores here!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {subjectBreakdown.map(({ key, subject, grade, avg, attempts }) => (
                                <div key={key} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {subject === 'Mathematics'
                                                ? <Calculator className="size-4 text-[#11428E]" />
                                                : <BookOpen className="size-4 text-purple-500" />
                                            }
                                            <span className="text-sm font-semibold text-zinc-700">{subject} · Grade {grade}</span>
                                            <span className="text-[11px] text-zinc-400">{attempts} attempt{attempts !== 1 ? 's' : ''}</span>
                                        </div>
                                        <span className="text-sm font-extrabold" style={{ color: scoreColor(avg) }}>
                                            {avg}%
                                        </span>
                                    </div>
                                    <ScoreBar pct={avg} color={scoreColor(avg)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent activity */}
                {recentActivity.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-[#11428E]" />
                            <h2 className="font-extrabold text-zinc-800 text-sm">Recent Activity</h2>
                        </div>
                        <div className="flex flex-col divide-y divide-zinc-100">
                            {recentActivity.map((p, i) => {
                                const pct = Math.round((p.score / p.totalQuestions) * 100);
                                const passed = pct >= 75;
                                const dateStr = new Date(p.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                                return (
                                    <div key={i} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-3">
                                            {passed
                                                ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                                : <AlertCircle className="size-4 text-amber-500 shrink-0" />
                                            }
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-700 leading-tight">{p.topic}</p>
                                                <p className="text-[11px] text-zinc-400">{p.subject} · G{p.gradeLevel} · {dateStr}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-extrabold ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {pct}%
                                            </span>
                                            <span className="text-xs text-zinc-400">{p.score}/{p.totalQuestions}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Badge showcase */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="size-4 text-amber-500" />
                        <h2 className="font-extrabold text-zinc-800 text-sm">Badges</h2>
                        <span className="text-xs text-zinc-400 ml-1">Complete goals to earn them</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(BADGE_INFO).map(([key, info]) => {
                            const unlocked = unlockedBadges.includes(key);
                            return (
                                <div
                                    key={key}
                                    className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border transition-all ${
                                        unlocked
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-zinc-50 border-zinc-100 opacity-45'
                                    }`}
                                >
                                    <span className="text-3xl">{info.emoji}</span>
                                    <span className="text-xs font-extrabold text-zinc-700 text-center">{info.label}</span>
                                    <span className="text-[10px] text-zinc-400 text-center leading-snug">{info.desc}</span>
                                    {!unlocked && (
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Locked</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
