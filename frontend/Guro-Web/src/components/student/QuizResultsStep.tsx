import React from 'react';

interface QuizResultsStepProps {
    correctAnswersCount: number;
    totalQuestionsCount: number;
    onBackToSubjects: () => void;
    onTryAgain: () => void;
}

export const QuizResultsStep: React.FC<QuizResultsStepProps> = ({
    correctAnswersCount = 1,
    totalQuestionsCount = 2,
    onBackToSubjects,
    onTryAgain,
}) => {
    const successPercentage = Math.round((correctAnswersCount / totalQuestionsCount) * 100);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-50 relative overflow-hidden select-none">
            {/* Background ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            {/* Main Results Showcase Card */}
            <div className="w-full max-w-md bg-white rounded-[32px] p-8 md:p-10 shadow-2xl shadow-zinc-200/80 border border-zinc-100/50 flex flex-col items-center text-center relative z-10">

                {/* Dynamic celebratory cap emoji */}
                <span className="text-5xl filter drop-shadow-sm mb-4 animate-bounce">
                    💪
                </span>

                {/* Motivating Headers */}
                <h1 className="text-3xl font-black text-zinc-800 tracking-tight">
                    Good Effort!
                </h1>
                <p className="text-base font-semibold text-zinc-400 mt-1">
                    Magandang Pagsisikap!
                </p>

                {/* Central Summary Metrics Panel */}
                <div className="w-full bg-slate-50/50 border border-zinc-100/80 rounded-[24px] p-6 my-8 flex flex-col items-center gap-1.5">
                    <span className="text-5xl font-black text-zinc-800 tracking-tight">
                        {correctAnswersCount}/{totalQuestionsCount}
                    </span>

                    <div className="flex flex-col text-xs font-bold tracking-normal text-zinc-500 mb-3">
                        <span>Correct Answers</span>
                        <span className="text-zinc-400 font-medium text-[11px]">Tamang Sagot</span>
                    </div>

                    {/* Tracker Strip */}
                    <div className="w-full bg-zinc-200/60 h-3 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-700"
                            style={{ width: `${successPercentage}%` }}
                        />
                    </div>

                    <span className="mt-2 text-base font-extrabold text-zinc-700">
                        {successPercentage}%
                    </span>
                </div>

                {/* Bottom Action buttons */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={onBackToSubjects}
                        className="w-full py-4 text-base font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                    >
                        Back to Subjects
                    </button>

                    <button
                        onClick={onTryAgain}
                        className="w-full py-4 text-base font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-2xl transition-all active:scale-[0.99] cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>

            </div>
        </div>
    );
};
