import React, { useState, useEffect } from 'react';
import { Trophy, Star, RefreshCw, LayoutDashboard, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface AnsweredQuestion {
    questionText: string;
    selectedOption: string;
    correctOption: string;
    explanationEn: string;
    isCorrect: boolean;
}

interface QuizResultsStepProps {
    correctAnswersCount: number;
    totalQuestionsCount: number;
    topicName?: string;
    subject?: string;
    earnedXP?: number;
    answeredQuestions?: AnsweredQuestion[];
    onBackToSubjects: () => void;
    onTryAgain: () => void;
    onSelectPrerequisite?: (topic: string, grade: number) => void;
    onStudyReview?: () => void;
}

const LESSON_SEQUENCE: Record<string, { grade: number; topic: string }[]> = {
  Mathematics: [
    { grade: 4, topic: 'Fractions' },
    { grade: 5, topic: 'Decimals' },
    { grade: 6, topic: 'Algebraic Equations' }
  ],
  English: [
    { grade: 4, topic: 'Figurative Language' },
    { grade: 5, topic: 'Short Story Comprehension' },
    { grade: 5, topic: 'Adjectives' },
    { grade: 6, topic: 'Idiomatic Expressions' }
  ]
};

export function evaluateWebRemediation(scorePct: number, subjectName?: string, currentTopicName?: string) {
  if (scorePct >= 80) {
    return {
      instruction: 'advance',
      title: 'Mastery Achieved! 🎉',
      message: `Outstanding job! You scored ${scorePct}%. You have demonstrated solid mastery and are ready to advance.`,
    };
  } else if (scorePct >= 50) {
    return {
      instruction: 'scaffold_review',
      title: 'Guided Micro-Review 💡',
      message: `You scored ${scorePct}%. You are close to mastery! Review key concepts for "${currentTopicName || 'this topic'}" before retrying.`,
    };
  } else {
    const seq = subjectName ? LESSON_SEQUENCE[subjectName] : undefined;
    const currentIndex = seq && currentTopicName ? seq.findIndex((item) => item.topic === currentTopicName) : -1;
    const prereq = seq && currentIndex > 0 ? seq[currentIndex - 1] : undefined;

    return {
      instruction: 'prerequisite_return',
      targetLesson: prereq,
      title: 'Foundational Re-Routing 📚',
      message: prereq
        ? `You scored ${scorePct}%. We detected foundational gaps. Reviewing "${prereq.topic}" (Grade ${prereq.grade}) will rebuild essential prerequisite skills before retrying ${currentTopicName || 'this topic'}.`
        : `You scored ${scorePct}%. Step back to review foundational building blocks for "${currentTopicName || 'this topic'}".`,
    };
  }
}

const STAR_THRESHOLDS = [
    { min: 80, stars: 3, label: 'Excellent!', labelFil: 'Napakahusay!', color: 'text-amber-500' },
    { min: 60, stars: 2, label: 'Good Job!', labelFil: 'Magaling!', color: 'text-blue-500' },
    { min: 0, stars: 1, label: 'Keep Trying!', labelFil: 'Huwag Sumuko!', color: 'text-zinc-500' },
];

function ScoreRing({ percentage, size = 140 }: { percentage: number; size?: number }) {
    const [animatedPct, setAnimatedPct] = useState(0);
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = circumference - (animatedPct / 100) * circumference;

    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedPct(percentage), 120);
        return () => clearTimeout(timeout);
    }, [percentage]);

    const ringColor =
        percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : '#F59E0B';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E4E4E7"
                    strokeWidth={10}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDash}
                    style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-zinc-800 leading-none">{percentage}%</span>
                <span className="text-xs font-bold text-zinc-400 mt-0.5">Score</span>
            </div>
        </div>
    );
}

function StarRow({ stars }: { stars: number }) {
    return (
        <div className="flex items-center gap-1.5 justify-center">
            {[1, 2, 3].map((n) => (
                <Star
                    key={n}
                    className={`size-7 transition-all duration-500 ${
                        n <= stars
                            ? 'text-amber-400 fill-amber-400 scale-110'
                            : 'text-zinc-200 fill-zinc-200'
                    }`}
                    style={{ transitionDelay: `${(n - 1) * 150}ms` }}
                />
            ))}
        </div>
    );
}

export const QuizResultsStep: React.FC<QuizResultsStepProps> = ({
    correctAnswersCount,
    totalQuestionsCount,
    topicName,
    subject,
    earnedXP,
    answeredQuestions = [],
    onBackToSubjects,
    onTryAgain,
    onSelectPrerequisite,
    onStudyReview,
}) => {
    const [starsVisible, setStarsVisible] = useState(false);

    const percentage = Math.round((correctAnswersCount / totalQuestionsCount) * 100);
    const tier = STAR_THRESHOLDS.find((t) => percentage >= t.min) ?? STAR_THRESHOLDS[2];
    const isPassed = percentage >= 75;

    useEffect(() => {
        const t = setTimeout(() => setStarsVisible(true), 300);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-50 relative overflow-hidden select-none">
            {/* Ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -top-32 right-1/4 size-72 bg-blue-100 rounded-full blur-[140px]" />

            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 items-start">
                {/* LEFT COLUMN: Main Score & Action Card (5 columns on desktop) */}
                <div className="lg:col-span-5 bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-zinc-200/80 border border-zinc-100/50 flex flex-col items-center gap-5 lg:sticky lg:top-8">
                    {/* XP earned badge */}
                    {earnedXP !== undefined && earnedXP > 0 && (
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200/60 rounded-full animate-in fade-in slide-in-from-top-2 duration-500">
                            <Zap className="size-3.5 text-amber-500 fill-amber-400" />
                            <span className="text-xs font-extrabold text-amber-600">+{earnedXP} XP Earned</span>
                        </div>
                    )}

                    {/* Score ring */}
                    <ScoreRing percentage={percentage} />

                    {/* Stars */}
                    <div
                        className={`flex flex-col items-center gap-2 transition-all duration-500 ${starsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                    >
                        <StarRow stars={tier.stars} />
                        <div className="text-center">
                            <h1 className={`text-2xl font-black tracking-tight ${tier.color}`}>{tier.label}</h1>
                            <p className="text-sm font-medium text-zinc-400">{tier.labelFil}</p>
                        </div>
                    </div>

                    {/* Score fraction */}
                    <div className="flex flex-col items-center gap-1 w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4">
                        <span className="text-4xl font-black text-zinc-800">
                            {correctAnswersCount}
                            <span className="text-2xl text-zinc-400 font-bold">/{totalQuestionsCount}</span>
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Correct Answers</span>
                        {topicName && (
                            <span className="text-xs font-semibold text-zinc-500 mt-0.5">{topicName}</span>
                        )}
                    </div>

                    {/* Actionable Remediation & Prerequisite Return Card */}
                    {(() => {
                        const remediation = evaluateWebRemediation(percentage, subject, topicName);
                        const isPrereq = remediation.instruction === 'prerequisite_return';
                        const isScaffold = remediation.instruction === 'scaffold_review';

                        const cardBg = isPassed
                            ? 'bg-emerald-50 border-emerald-200'
                            : isPrereq
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200';

                        const titleColor = isPassed
                            ? 'text-emerald-700'
                            : isPrereq
                            ? 'text-red-700'
                            : 'text-amber-700';

                        return (
                            <div className={`w-full p-4 rounded-2xl border ${cardBg} flex flex-col gap-2 text-left`}>
                                <span className={`text-xs font-extrabold ${titleColor}`}>{remediation.title}</span>
                                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                                    {remediation.message}
                                </p>
                                {isPrereq && remediation.targetLesson && onSelectPrerequisite && (
                                    <button
                                        onClick={() => onSelectPrerequisite(remediation.targetLesson!.topic, remediation.targetLesson!.grade)}
                                        className="mt-1 w-full py-2.5 px-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        🎯 Return to Prerequisite: {remediation.targetLesson.topic} (Grade {remediation.targetLesson.grade})
                                    </button>
                                )}
                                {isScaffold && onStudyReview && (
                                    <button
                                        onClick={onStudyReview}
                                        className="mt-1 w-full py-2.5 px-3 text-xs font-bold text-zinc-800 bg-amber-200 hover:bg-amber-300 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        💡 Start Guided Study Review: {topicName}
                                    </button>
                                )}
                            </div>
                        );
                    })()}

                    {/* Action buttons */}
                    <div className="w-full flex flex-col gap-3">
                        {isPassed ? (
                            <>
                                <button
                                    onClick={onBackToSubjects}
                                    className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-90 rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="size-4" />
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={onTryAgain}
                                    className="w-full py-3.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="size-4" />
                                    Try Again
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onTryAgain}
                                    className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-90 rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="size-4" />
                                    Try Again
                                </button>
                                <button
                                    onClick={onBackToSubjects}
                                    className="w-full py-3.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <LayoutDashboard className="size-4" />
                                    Back to Dashboard
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Detailed Answer Breakdown (7 columns on desktop) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    {answeredQuestions.length > 0 && (
                        <div className="bg-white rounded-[32px] border border-zinc-200/80 shadow-xl overflow-hidden">
                            {/* Header bar */}
                            <div className="w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100/80 text-amber-600 rounded-2xl">
                                        <Trophy className="size-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-base font-extrabold text-zinc-800">Answer Breakdown &amp; Analysis</h2>
                                        <p className="text-xs text-zinc-400 font-medium">Review your answers and learn key concepts</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 text-xs font-black bg-zinc-100 text-zinc-700 rounded-full border border-zinc-200/50">
                                    {answeredQuestions.length} Questions
                                </span>
                            </div>

                            <ReviewBreakdownList answeredQuestions={answeredQuestions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function ReviewBreakdownList({ answeredQuestions }: { answeredQuestions: AnsweredQuestion[] }) {
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

    const incorrectCount = answeredQuestions.filter((q) => !q.isCorrect).length;
    const correctCount = answeredQuestions.filter((q) => q.isCorrect).length;

    const filtered = answeredQuestions.filter((q) => {
        if (filter === 'correct') return q.isCorrect;
        if (filter === 'incorrect') return !q.isCorrect;
        return true;
    });

    return (
        <div className="flex flex-col gap-4 p-5 bg-zinc-50/70 border-t border-zinc-100">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filter === 'all'
                            ? 'bg-zinc-800 text-white shadow-sm'
                            : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                    }`}
                >
                    All ({answeredQuestions.length})
                </button>
                {incorrectCount > 0 && (
                    <button
                        onClick={() => setFilter('incorrect')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            filter === 'incorrect'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-red-50 text-red-700 border border-red-200/60 hover:bg-red-100'
                        }`}
                    >
                        Needs Review ({incorrectCount})
                    </button>
                )}
                <button
                    onClick={() => setFilter('correct')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filter === 'correct'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100'
                    }`}
                >
                    Correct ({correctCount})
                </button>
            </div>

            {/* Questions List */}
            <div className="flex flex-col gap-3.5">
                {filtered.map((item, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-2xl border bg-white shadow-sm flex flex-col gap-3 text-left transition-all ${
                            item.isCorrect ? 'border-zinc-200/80' : 'border-red-200/80 bg-red-50/20'
                        }`}
                    >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-zinc-100 text-zinc-700 shrink-0 mt-0.5">
                                    Q{idx + 1}
                                </span>
                                <p className="text-xs font-bold text-zinc-800 leading-snug">{item.questionText}</p>
                            </div>
                            {item.isCorrect ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                    <CheckCircle2 className="size-3" /> Correct
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200 shrink-0">
                                    <XCircle className="size-3" /> Needs Review
                                </span>
                            )}
                        </div>

                        {/* Answer Choices Comparison */}
                        <div className="flex flex-col gap-2 pt-1">
                            {!item.isCorrect && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50/80 border border-red-200/60 text-xs font-medium text-red-900">
                                    <span className="font-extrabold text-red-600 shrink-0">Your Choice:</span>
                                    <span className="line-through font-semibold text-red-800">{item.selectedOption}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-xs font-medium text-emerald-900">
                                <span className="font-extrabold text-emerald-700 shrink-0">Correct Answer:</span>
                                <span className="font-bold text-emerald-900">{item.correctOption}</span>
                            </div>
                        </div>

                        {/* Explanation Box */}
                        {item.explanationEn && (
                            <div className="p-3 rounded-xl bg-amber-50/60 border-l-4 border-amber-400 text-xs text-zinc-700 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-[11px]">
                                    <Zap className="size-3.5 fill-amber-400 text-amber-500" />
                                    <span>Explanation & Key Concept</span>
                                </div>
                                <p className="leading-relaxed font-medium text-zinc-600 pl-0.5">{item.explanationEn}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
