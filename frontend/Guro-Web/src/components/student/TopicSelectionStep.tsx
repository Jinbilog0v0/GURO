import React from 'react';
import { BookOpen, Calculator, Inbox, CheckCircle2, Circle, TrendingUp, GraduationCap, Lock } from 'lucide-react';

export interface TopicStat {
    bestScore: number;
    lastScore: number;
    attempts: number;
}

export interface TopicSelectionStepProps {
    selectedSubject: string;
    selectedGrade: number;
    isEnglishLocked: boolean;
    englishLockReason?: string;
    itemBankLoading: boolean;
    topics: string[];
    classroomCode?: string | null;
    topicHistory: Record<string, TopicStat>;
    onSelectTopic: (topicName: string) => void;
    onConnectClassroom: () => void;
}

export const TopicSelectionStep: React.FC<TopicSelectionStepProps> = ({
    selectedSubject,
    selectedGrade,
    isEnglishLocked,
    englishLockReason,
    itemBankLoading,
    topics,
    classroomCode,
    topicHistory,
    onSelectTopic,
    onConnectClassroom,
}) => {
    return (
        <div className="min-h-[calc(100vh-56px)] w-full flex flex-col items-center p-6 md:p-10 relative overflow-hidden select-none fade-in" style={{ background: 'var(--bg-main)' }}>
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 rounded-full blur-[160px]" style={{ background: 'rgba(17,66,142,0.12)' }} />
            <div className="absolute -top-48 right-1/4 size-80 rounded-full blur-[140px]" style={{ background: 'rgba(160,19,34,0.08)' }} />

            <div className="flex w-full max-w-4xl flex-col items-center gap-8 relative z-10 pt-4">
                {/* Header */}
                <div className="flex flex-col items-center text-center w-full">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] flex items-center justify-center gap-2.5 tracking-tight">
                        {selectedSubject === 'Mathematics' ? (
                            <><Calculator className="size-7 text-[#11428E] shrink-0" /><span>Math</span></>
                        ) : (
                            <><BookOpen className="size-7 text-purple-400 shrink-0" /><span>English</span></>
                        )}
                        <span>Practice Topics</span>
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5">
                        Select a topic to start your diagnostic quest · Grade {selectedGrade}
                    </p>

                    {/* English lock banner in topics view */}
                    {selectedSubject === 'English' && isEnglishLocked && (
                        <div className="flex items-start gap-2.5 w-full max-w-lg px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mt-2">
                            <Lock className="size-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-[var(--text-muted)] text-left">{englishLockReason}</p>
                        </div>
                    )}
                </div>

                {/* Topics grid */}
                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-5">
                    {itemBankLoading ? (
                        // Skeleton shimmer cards
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-[var(--border-color)] shrink-0" />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="h-4 bg-[var(--border-color)] rounded-full w-3/4" />
                                        <div className="h-3 bg-[var(--border-color)] rounded-full w-1/2" />
                                    </div>
                                </div>
                                <div className="h-1.5 bg-[var(--border-color)] rounded-full w-full" />
                            </div>
                        ))
                    ) : topics.length === 0 ? (
                        !classroomCode ? (
                            <div className="col-span-full glass-panel rounded-3xl p-12 text-center border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-4">
                                <GraduationCap className="size-12 text-zinc-400 shrink-0" />
                                <h3 className="text-base font-bold text-[var(--text-main)]">Not Connected to a Classroom</h3>
                                <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                                    Join a classroom using your teacher's code to get custom practice topics and interactive lessons!
                                </p>
                                <button
                                    onClick={onConnectClassroom}
                                    className="px-6 py-2.5 bg-[#11428E] hover:bg-[#0c316b] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer hover:scale-102 flex items-center gap-1.5"
                                >
                                    <GraduationCap className="size-4" />
                                    <span>Connect to Class</span>
                                </button>
                            </div>
                        ) : (
                            <div className="col-span-full glass-panel rounded-3xl p-12 text-center border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-3">
                                <Inbox className="size-10 text-[var(--text-dark)] shrink-0" />
                                <h3 className="text-base font-bold text-[var(--text-main)]">No topics available yet</h3>
                                <p className="text-[var(--text-muted)] text-sm">Staged lessons will appear here once loaded by the teacher workspace.</p>
                            </div>
                        )
                    ) : (
                        topics.map((topicName) => {
                            const topicKey = `${selectedSubject}-${selectedGrade}-${topicName}`;
                            const stat = topicHistory[topicKey];
                            const bestPct = stat ? Math.round(stat.bestScore * 100) : null;
                            const isMastered = bestPct !== null && bestPct >= 80;
                            const isStarted = bestPct !== null && !isMastered;
                            const statusLabel = isMastered ? 'Mastered' : isStarted ? 'In Progress' : 'Not Started';
                            const statusColor = isMastered ? 'text-emerald-500' : isStarted ? 'text-blue-400' : 'text-[var(--text-dark)]';
                            const isMath = selectedSubject === 'Mathematics';
                            return (
                                <button
                                    key={topicName}
                                    onClick={() => onSelectTopic(topicName)}
                                    className="group glass-panel rounded-2xl p-5 text-left hover:-translate-y-0.5 hover:border-[var(--accent-primary)] transition-all duration-300 flex flex-col gap-3 cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3.5 rounded-xl text-white shrink-0 ${isMath ? 'bg-[#11428E]' : 'bg-purple-600'}`}>
                                            {isMath ? <Calculator className="size-5" /> : <BookOpen className="size-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-extrabold text-[var(--text-main)] tracking-tight group-hover:text-[#11428E] transition-colors truncate">
                                                {topicName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {isMastered
                                                    ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                                    : isStarted
                                                    ? <TrendingUp className="size-3.5 text-blue-400 shrink-0" />
                                                    : <Circle className="size-3.5 text-[var(--text-dark)] shrink-0" />
                                                }
                                                <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                                                {stat && stat.attempts > 0 && (
                                                    <span className="text-[11px] text-[var(--text-dark)]">· {stat.attempts} attempt{stat.attempts !== 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                        {bestPct !== null && (
                                            <span className={`text-sm font-extrabold shrink-0 ${isMastered ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                                                {bestPct}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${isMastered ? 'bg-emerald-500' : isMath ? 'bg-[#11428E]' : 'bg-purple-500'}`}
                                            style={{ width: `${bestPct ?? 0}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
