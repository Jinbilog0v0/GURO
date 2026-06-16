import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { QuizOption } from './QuizOption';
import { QuizExplanation } from './QuizExplanation';

interface QuestionStepProps {
    currentQuestionIndex: number;
    totalQuestions: number;
    score: number;
    questionText: string;
    options: string[];
    correctOption: string;
    explanationEn: string;
    explanationFil: string;
    onBack: () => void;
    onNextOrFinish: (isCorrect: boolean) => void;
}

export const QuestionStep: React.FC<QuestionStepProps> = ({
    currentQuestionIndex = 1,
    totalQuestions = 2,
    score = 0,
    questionText,
    options,
    correctOption,
    explanationEn,
    explanationFil,
    onBack,
    onNextOrFinish,
}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const isCorrect = selectedOption === correctOption;
    const isLastQuestion = currentQuestionIndex === totalQuestions;
    const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, [questionText]);

    const toggleSpeech = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            const optionsText = options
                .map((opt, idx) => `Option ${String.fromCharCode(65 + idx)}: ${opt}`)
                .join('. ');
            const utterance = new SpeechSynthesisUtterance(`${questionText}. ${optionsText}`);
            
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleActionClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSubmitted) {
            setIsSubmitted(true);
        } else {
            onNextOrFinish(isCorrect);
            // Reset local states
            setIsSubmitted(false);
            setSelectedOption(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-50 relative overflow-hidden select-none">
            {/* Visual Confetti Particle Layer */}
            {isSubmitted && isCorrect && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden opacity-70">
                    {[...Array(24)].map((_, idx) => (
                        <div
                            key={idx}
                            className="absolute size-2 rounded-sm animate-bounce"
                            style={{
                                top: `${Math.random() * 60}%`,
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#3b82f6', '#a855f7', '#ec4899', '#eab308', '#22c55e'][idx % 5],
                                transform: `rotate(${Math.random() * 360}deg)`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${1.5 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Background ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            {/* Header Panel Navigation */}
            <div className="absolute top-0 left-0 w-full pt-6 px-6 flex flex-col gap-4 z-20">
                <div className="w-full flex items-center justify-between max-w-7xl mx-auto">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                    >
                        <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                        Back
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-white border border-zinc-200/60 rounded-full shadow-sm text-zinc-700 font-bold text-sm">
                            {currentQuestionIndex}/{totalQuestions}
                        </span>
                        <span className="px-4 py-2 bg-white border border-emerald-200 rounded-full shadow-sm text-emerald-600 font-bold text-sm bg-emerald-50/20">
                            Score: {score}
                        </span>
                    </div>
                </div>

                {/* Global Progress Track Line */}
                <div className="w-full max-w-7xl mx-auto bg-zinc-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Center Card Content Form Layout */}
            <form
                onSubmit={handleActionClick}
                className="w-full max-w-3xl bg-white rounded-[32px] p-6 md:p-10 shadow-2xl shadow-zinc-200/80 border border-zinc-100/50 flex flex-col items-center gap-6 mt-24 relative z-10"
            >
                <div className="flex items-center gap-3">
                    <div className="px-5 py-1.5 bg-purple-50 rounded-full text-xs font-bold text-purple-600 tracking-wide border border-purple-100/40">
                        Multiple Choice • Maraming Pagpipilian
                    </div>
                    <button
                        type="button"
                        onClick={toggleSpeech}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${isSpeaking 
                            ? 'bg-purple-100 border-purple-300 text-purple-700 font-bold' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        {isSpeaking ? '🛑 Stop' : '🔊 Listen'}
                    </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-800 text-center tracking-tight leading-snug px-2">
                    {questionText}
                </h2>

                {/* Options List */}
                <div className="w-full flex flex-col gap-3">
                    {options.map((option) => (
                        <QuizOption
                            key={option}
                            text={option}
                            isSelected={selectedOption === option}
                            isSubmitted={isSubmitted}
                            isCorrectAnswer={option === correctOption}
                            onSelect={() => setSelectedOption(option)}
                        />
                    ))}
                </div>

                {/* Post-submit explanation layout render */}
                {isSubmitted && (
                    <QuizExplanation
                        isCorrect={isCorrect}
                        explanationEn={explanationEn}
                        explanationFil={explanationFil}
                    />
                )}

                {/* Context-Aware Primary Action Button */}
                <button
                    type="submit"
                    disabled={selectedOption === null}
                    className={`w-full max-w-md mt-2 py-4 text-lg font-bold text-white rounded-2xl shadow-md transition-all duration-300 ${selectedOption === null
                            ? 'bg-gradient-to-r from-blue-400/50 to-purple-500/50 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg active:scale-[0.99] cursor-pointer'
                        }`}
                >
                    {!isSubmitted
                        ? 'Submit Answer'
                        : isLastQuestion
                            ? 'Finish Quiz →'
                            : 'Next Question →'
                    }
                </button>
            </form>
        </div>
    );
};
