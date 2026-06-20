import React, { useState, useEffect } from 'react';
import { Trophy, Star, RefreshCw, LayoutDashboard, ChevronDown, ChevronUp, CheckCircle2, XCircle, Zap } from 'lucide-react';

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
    earnedXP,
    answeredQuestions = [],
    onBackToSubjects,
    onTryAgain,
}) => {
    const [showReview, setShowReview] = useState(false);
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

            <div className="w-full max-w-md flex flex-col gap-4 relative z-10">
                {/* Main results card */}
                <div className="bg-white rounded-[32px] p-8 shadow-2xl shadow-zinc-200/80 border border-zinc-100/50 flex flex-col items-center gap-5">
                    {/* XP earned badge */}
                    {earnedXP !== undefined && earnedXP > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-full animate-in fade-in slide-in-from-top-2 duration-500">
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

                {/* Answer review collapsible */}
                {answeredQuestions.length > 0 && (
                    <div className="bg-white rounded-[24px] border border-zinc-100 shadow-md overflow-hidden">
                        <button
                            onClick={() => setShowReview((v) => !v)}
                            className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Trophy className="size-4 text-amber-500" />
                                Review My Answers
                            </div>
                            {showReview ? <ChevronUp className="size-4 text-zinc-400" /> : <ChevronDown className="size-4 text-zinc-400" />}
                        </button>

                        {showReview && (
                            <div className="flex flex-col divide-y divide-zinc-100 px-2 pb-2">
                                {answeredQuestions.map((item, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 p-4">
                                        <div className="flex items-start gap-2">
                                            {item.isCorrect
                                                ? <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                                                : <XCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
                                            }
                                            <p className="text-xs font-semibold text-zinc-700 leading-relaxed">{item.questionText}</p>
                                        </div>
                                        {!item.isCorrect && (
                                            <div className="ml-6 flex flex-col gap-1">
                                                <p className="text-[11px] text-red-500 font-semibold">
                                                    Your answer: <span className="font-bold">{item.selectedOption}</span>
                                                </p>
                                                <p className="text-[11px] text-emerald-600 font-semibold">
                                                    Correct: <span className="font-bold">{item.correctOption}</span>
                                                </p>
                                            </div>
                                        )}
                                        {item.explanationEn && (
                                            <p className="ml-6 text-[11px] text-zinc-400 leading-relaxed italic">{item.explanationEn}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
