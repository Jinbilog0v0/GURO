import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Square, X, Check, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { QuizOption } from './QuizOption';
import { QuizExplanation } from './QuizExplanation';

const getSlicePath = (index: number, total: number) => {
    const radius = 95;
    const center = 100;
    const startAngle = (index * 360) / total - 90;
    const endAngle = ((index + 1) * 360) / total - 90;
    
    const rad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = center + radius * Math.cos(rad(startAngle));
    const y1 = center + radius * Math.sin(rad(startAngle));
    const x2 = center + radius * Math.cos(rad(endAngle));
    const y2 = center + radius * Math.sin(rad(endAngle));
    
    const largeArc = 0;
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

interface AnswerDetails {
    questionText: string;
    selectedOption: string;
    correctOption: string;
    explanationEn: string;
}

interface QuestionStepProps {
    currentQuestionIndex: number;
    totalQuestions: number;
    score: number;
    questionText: string;
    options: string[];
    correctOption: string;
    explanationEn: string;
    type?: 'multiple-choice' | 'fill-in-the-blank' | 'drag-drop-matching' | 'true-false' | 'swipe-card' | 'fraction-builder';
    matchingPairs?: Record<string, string>;
    onBack: () => void;
    onNextOrFinish: (isCorrect: boolean, details: AnswerDetails) => void;
    answeredHistory?: { isCorrect: boolean }[];
}

const matchColorClasses = [
    { bg: "bg-cyan-50/80 border-cyan-400 text-cyan-800 border-b-cyan-600 shadow-sm shadow-cyan-100/50", badgeBg: "bg-cyan-100 text-cyan-800" },
    { bg: "bg-fuchsia-50/80 border-fuchsia-400 text-fuchsia-800 border-b-fuchsia-600 shadow-sm shadow-fuchsia-100/50", badgeBg: "bg-fuchsia-100 text-fuchsia-800" },
    { bg: "bg-amber-50/80 border-amber-400 text-amber-800 border-b-amber-600 shadow-sm shadow-amber-100/50", badgeBg: "bg-amber-100 text-amber-800" },
    { bg: "bg-rose-50/80 border-rose-400 text-rose-800 border-b-rose-600 shadow-sm shadow-rose-100/50", badgeBg: "bg-rose-100 text-rose-800" },
    { bg: "bg-emerald-50/80 border-emerald-400 text-emerald-800 border-b-emerald-600 shadow-sm shadow-emerald-100/50", badgeBg: "bg-emerald-100 text-emerald-800" },
];

export const QuestionStep: React.FC<QuestionStepProps> = ({
    currentQuestionIndex = 1,
    totalQuestions = 2,
    score = 0,
    questionText,
    options,
    correctOption,
    explanationEn,
    type = 'multiple-choice',
    matchingPairs,
    onBack,
    onNextOrFinish,
    answeredHistory = [],
}) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [shadedSlices, setShadedSlices] = useState<number[]>([]);

    // ── Swipe Card states ────────────────────────────────────────────────────────
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeStartX, setSwipeStartX] = useState(0);

    // ── Matching challenge states ────────────────────────────────────────────────
    const [currentMatches, setCurrentMatches] = useState<Record<string, string>>({});
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [rightOptionsShuffled, setRightOptionsShuffled] = useState<string[]>([]);
    const [leftOptionsShuffled, setLeftOptionsShuffled] = useState<string[]>([]);

    useEffect(() => {
        setSelectedLeft(null);
        setCurrentMatches({});
        setSelectedOption(null);
        setIsSubmitted(false);
        setSwipeX(0);
        setIsSwiping(false);
        setShadedSlices([]);
        if (type === 'drag-drop-matching' && matchingPairs) {
            const left = Object.keys(matchingPairs);
            const right = Object.values(matchingPairs);
            setLeftOptionsShuffled([...left].sort(() => Math.random() - 0.5));
            setRightOptionsShuffled([...right].sort(() => Math.random() - 0.5));
        }
    }, [questionText, type, matchingPairs]);

    const handleSwipeStart = (clientX: number) => {
        if (isSubmitted || selectedOption) return;
        setIsSwiping(true);
        setSwipeStartX(clientX);
    };

    const handleSwipeMove = (clientX: number) => {
        if (!isSwiping || isSubmitted || selectedOption) return;
        const diffX = clientX - swipeStartX;
        setSwipeX(diffX);
    };

    const handleSwipeEnd = () => {
        if (!isSwiping) return;
        setIsSwiping(false);
        const threshold = 120;
        if (swipeX > threshold) {
            const rightOpt = options[1];
            if (rightOpt) {
                setSelectedOption(rightOpt);
                setSwipeX(200);
            } else {
                setSwipeX(0);
            }
        } else if (swipeX < -threshold) {
            const leftOpt = options[0];
            if (leftOpt) {
                setSelectedOption(leftOpt);
                setSwipeX(-200);
            } else {
                setSwipeX(0);
            }
        } else {
            setSwipeX(0);
        }
    };

    const handleLeftSelect = (item: string) => {
        if (isSubmitted) return;
        
        // Tap a matched item to undo/remove it
        if (currentMatches[item]) {
            const nextMatches = { ...currentMatches };
            delete nextMatches[item];
            setCurrentMatches(nextMatches);
            setSelectedOption(null);
            return;
        }

        // Tap selected left item again to deselect
        if (selectedLeft === item) {
            setSelectedLeft(null);
            return;
        }

        setSelectedLeft(item);
    };

    const handleRightSelect = (item: string) => {
        if (isSubmitted || !selectedLeft) return;

        const nextMatches = { ...currentMatches };
        
        // If this right option was already matched elsewhere, clear that old match
        const matchedLeftKey = Object.keys(nextMatches).find(k => nextMatches[k] === item);
        if (matchedLeftKey) {
            delete nextMatches[matchedLeftKey];
        }

        nextMatches[selectedLeft] = item;
        setCurrentMatches(nextMatches);
        setSelectedLeft(null);
        checkAllMatched(nextMatches);
    };

    const checkAllMatched = (newMatches: Record<string, string>) => {
        if (matchingPairs && Object.keys(newMatches).length === Object.keys(matchingPairs).length) {
            const isAllCorrect = Object.keys(matchingPairs).every(
                key => newMatches[key] === matchingPairs[key]
            );
            if (isAllCorrect) {
                setSelectedOption(correctOption);
            } else {
                setSelectedOption('Incorrect Matching');
            }
        }
    };

    const isLastQuestion = currentQuestionIndex === totalQuestions;
    const isCorrect = selectedOption === correctOption;

    const comboStreak = (() => {
        let streak = 0;
        for (let i = answeredHistory.length - 1; i >= 0; i--) {
            if (answeredHistory[i].isCorrect) streak++;
            else break;
        }
        return streak;
    })();

    const mascotEmoji = (() => {
        if (isSubmitted) return isCorrect ? '🦉🎉' : '🦉✋';
        if (comboStreak >= 2) return '🦉🔥';
        return '🦉';
    })();

    const progressPercentage = (currentQuestionIndex / totalQuestions) * 100;

    const [confettiParticles, setConfettiParticles] = useState<{
        id: number;
        left: number;
        color: string;
        delay: number;
        duration: number;
        angle: number;
        size: number;
    }[]>([]);

    useEffect(() => {
        if (isSubmitted) {
            // Play correct chime or incorrect buzz sound via Web Audio API
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    const ctx = new AudioContextClass();
                    if (ctx.state === 'suspended') {
                        ctx.resume();
                    }
                    const cleanupDelay = isCorrect ? 4.0 : 3.8;
                    setTimeout(() => ctx.close(), cleanupDelay * 1000);

                    if (isCorrect) {
                        // Ascending high-pitch arpeggio for correct answer (about 3.7s total)
                        const playNote = (freq: number, startTime: number, duration: number) => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();

                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(freq, startTime);

                            gain.gain.setValueAtTime(0, startTime);
                            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
                            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

                            osc.connect(gain);
                            gain.connect(ctx.destination);

                            osc.start(startTime);
                            osc.stop(startTime + duration);
                        };

                        const now = ctx.currentTime;
                        playNote(523.25, now, 2.5);        // C5
                        playNote(659.25, now + 0.3, 2.5);  // E5
                        playNote(783.99, now + 0.6, 2.5);  // G5
                        playNote(987.77, now + 0.9, 2.5);  // B5
                        playNote(1046.50, now + 1.2, 2.5); // C6
                    } else {
                        // Custom arcade double buzz for wrong answer (longer, fuller, no delay)
                        const playBuzz = (startFreq: number, endFreq: number, startTime: number, duration: number) => {
                            const osc = ctx.createOscillator();
                            const gain = ctx.createGain();

                            osc.type = 'sawtooth';
                            osc.frequency.setValueAtTime(startFreq, startTime);
                            osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

                            gain.gain.setValueAtTime(0, startTime);
                            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
                            gain.gain.setValueAtTime(0.12, startTime + duration - 0.15);
                            gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

                            const filter = ctx.createBiquadFilter();
                            filter.type = 'lowpass';
                            filter.frequency.setValueAtTime(320, startTime);
                            filter.frequency.exponentialRampToValueAtTime(130, startTime + duration);

                            osc.connect(filter);
                            filter.connect(gain);
                            gain.connect(ctx.destination);

                            osc.start(startTime);
                            osc.stop(startTime + duration);
                        };

                        const now = ctx.currentTime;
                        playBuzz(150, 95, now, 0.45);
                        playBuzz(130, 85, now + 0.55, 0.75);
                    }
                }
            } catch (e) {
                console.error('AudioContext failed:', e);
            }

            if (isCorrect) {
                const colors = ['#3b82f6', '#a855f7', '#ec4899', '#eab308', '#22c55e', '#f97316', '#06b6d4'];
                const particles = Array.from({ length: 40 }).map((_, idx) => ({
                    id: idx,
                    left: Math.random() * 100,
                    color: colors[idx % colors.length],
                    delay: Math.random() * 0.5,
                    duration: 2.5 + Math.random() * 2,
                    angle: Math.random() * 360,
                    size: 6 + Math.random() * 8,
                }));
                setConfettiParticles(particles);
            }
        } else {
            setConfettiParticles([]);
        }
    }, [isSubmitted, isCorrect]);

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
            const cleanText = questionText
                .replace(/\[\[blank\]\]/g, ' blank ')
                .replace(/_+/g, ' blank ');
            const utterance = new SpeechSynthesisUtterance(`${cleanText}. ${optionsText}`);
            
            // Sync voice rate and pitch from localStorage (alignment with mobile settings)
            const storedRate = localStorage.getItem('guro_student_speech_rate');
            const rate = storedRate ? parseFloat(storedRate) : 0.9;
            const storedVoice = localStorage.getItem('guro_student_guide_voice');
            let pitch = 1.0;
            if (storedVoice === 'robot') {
                pitch = 0.65;
            } else if (storedVoice === 'owl') {
                pitch = 1.25;
            }

            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.lang = 'en-US';
            
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
            onNextOrFinish(isCorrect, {
                questionText,
                selectedOption: selectedOption!,
                correctOption,
                explanationEn,
            });
            setIsSubmitted(false);
            setSelectedOption(null);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-50 relative overflow-hidden select-none">
            {/* Visual Confetti Particle Layer */}
            {confettiParticles.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                    <style>{`
                        @keyframes confetti-fall {
                            0% {
                                transform: translateY(-20px) rotate(0deg);
                                opacity: 1;
                            }
                            100% {
                                transform: translateY(105vh) rotate(720deg);
                                opacity: 0;
                            }
                        }
                    `}</style>
                    {confettiParticles.map((p) => (
                        <div
                            key={p.id}
                            className="absolute"
                            style={{
                                top: -20,
                                left: `${p.left}%`,
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: p.id % 2 === 0 ? '50%' : '2px',
                                transform: `rotate(${p.angle}deg)`,
                                animationName: 'confetti-fall',
                                animationDuration: `${p.duration}s`,
                                animationDelay: `${p.delay}s`,
                                animationTimingFunction: 'linear',
                                animationFillMode: 'forwards',
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
                        {comboStreak >= 2 && (
                            <span className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs rounded-full shadow-md animate-bounce flex items-center gap-1.5">
                                <Sparkles className="size-3.5 fill-white" />
                                🔥 {comboStreak}x Combo!
                            </span>
                        )}
                        <span className="px-4 py-2 bg-white border border-zinc-200/60 rounded-full shadow-sm text-zinc-700 font-bold text-sm">
                            {currentQuestionIndex}/{totalQuestions}
                        </span>
                        <span className="px-4 py-2 bg-white border border-emerald-200 rounded-full shadow-sm text-emerald-600 font-bold text-sm bg-emerald-50/20">
                            Score: {score}
                        </span>
                    </div>
                </div>

                {/* Question dot indicators */}
                <div className="w-full max-w-7xl mx-auto flex items-center justify-center gap-2">
                    {Array.from({ length: totalQuestions }).map((_, idx) => {
                        const isPast = idx < currentQuestionIndex - 1;
                        const isCurrent = idx === currentQuestionIndex - 1;
                        
                        let dotColor = 'bg-zinc-200';
                        if (isCurrent) {
                            if (isSubmitted) {
                                dotColor = isCorrect ? 'bg-emerald-400' : 'bg-rose-500';
                            } else {
                                dotColor = 'bg-blue-500 shadow-sm shadow-blue-400/40';
                            }
                        } else if (isPast) {
                            const pastCorrect = answeredHistory?.[idx]?.isCorrect;
                            dotColor = pastCorrect ? 'bg-emerald-400' : 'bg-rose-500';
                        }
                        
                        return (
                            <div
                                key={idx}
                                className={`rounded-full transition-all duration-300 ${
                                    isCurrent ? 'w-6 h-2.5' : 'w-2.5 h-2.5'
                                } ${dotColor}`}
                            />
                        );
                    })}
                </div>

                {/* Global Progress Track Line */}
                <div className="w-full max-w-7xl mx-auto bg-zinc-100 h-2 rounded-full overflow-hidden shadow-inner">
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
                    <div className="size-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shadow-sm hover:scale-110 transition-transform cursor-pointer" title="Wise Owl Companion">
                        {mascotEmoji}
                    </div>
                    <div className="px-5 py-1.5 bg-purple-50 rounded-full text-xs font-bold text-purple-600 tracking-wide border border-purple-100/40">
                        {type === 'fill-in-the-blank' 
                            ? 'Fill-in-the-Blank' 
                            : type === 'drag-drop-matching' 
                            ? 'Matching Pairs' 
                            : type === 'true-false'
                            ? 'True or False'
                            : 'Multiple Choice'}
                    </div>
                    <button
                        type="button"
                        onClick={toggleSpeech}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${isSpeaking 
                            ? 'bg-purple-100 border-purple-300 text-purple-700 font-bold' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        {isSpeaking ? <Square className="size-3 fill-current" /> : <Volume2 className="size-3" />}
                        <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                    </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-800 text-center tracking-tight leading-snug px-2">
                    {type === 'fill-in-the-blank' && (questionText.includes('[[blank]]') || questionText.includes('______') || questionText.includes('____')) ? (
                        (() => {
                            const delimiter = questionText.includes('[[blank]]')
                                ? '[[blank]]'
                                : (questionText.includes('______') ? '______' : '____');
                            const parts = questionText.split(delimiter);
                            return (
                                <span>
                                    {parts[0]}
                                    <span className="underline text-blue-600 font-bold mx-2">
                                        {selectedOption ? ` ${selectedOption} ` : ' ______ '}
                                    </span>
                                    {parts[1]}
                                </span>
                            );
                        })()
                    ) : (
                        questionText
                    )}
                </h2>

                {/* Options List / Matching Columns */}
                <div className="w-full">
                    {type === 'drag-drop-matching' ? (
                        <div className="w-full flex flex-col gap-4 mt-2">
                            <p className="text-sm font-medium text-zinc-500 text-center">
                                Tap a word on the left, then tap its match on the right! (Tap a matched word to undo)
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
                                {/* Left Column */}
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-extrabold text-blue-500 text-center tracking-wider uppercase">Term</h3>
                                    {leftOptionsShuffled
                                        .filter((item) => !currentMatches[item])
                                        .map((item, idx) => {
                                            const isSelected = selectedLeft === item;
                                            return (
                                                <button
                                                    key={`left-${idx}`}
                                                    type="button"
                                                    disabled={isSubmitted}
                                                    onClick={() => handleLeftSelect(item)}
                                                    className={`w-full py-4 px-4 font-bold rounded-2xl border-2 border-b-4 transition-all duration-150 cursor-pointer active:translate-y-[2px] active:border-b-2 flex items-center justify-between gap-2 ${
                                                        isSelected
                                                            ? "bg-blue-50 border-blue-400 text-blue-800 border-b-blue-600 shadow-md shadow-blue-100/50"
                                                            : "bg-white border-zinc-200 text-zinc-700 border-b-zinc-300 hover:bg-zinc-50/80"
                                                    }`}
                                                >
                                                    <span className="flex-1 text-center">{item}</span>
                                                </button>
                                            );
                                        })}
                                </div>

                                {/* Right Column */}
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-sm font-extrabold text-purple-500 text-center tracking-wider uppercase">Match</h3>
                                    {rightOptionsShuffled
                                        .filter((item) => !Object.values(currentMatches).includes(item))
                                        .map((item, idx) => {
                                            let cardStyle = "bg-white border-zinc-200 text-zinc-700 border-b-zinc-300";
                                            if (!selectedLeft) {
                                                cardStyle = "bg-white border-zinc-200 text-zinc-400 border-b-zinc-200 opacity-60 hover:bg-zinc-50/50 cursor-not-allowed";
                                            } else {
                                                cardStyle = "bg-white border-zinc-200 text-zinc-700 border-b-zinc-300 hover:bg-zinc-50/80";
                                            }

                                            return (
                                                <button
                                                    key={`right-${idx}`}
                                                    type="button"
                                                    disabled={isSubmitted}
                                                    onClick={() => handleRightSelect(item)}
                                                    className={`w-full py-4 px-4 font-bold rounded-2xl border-2 border-b-4 transition-all duration-150 cursor-pointer active:translate-y-[2px] active:border-b-2 flex items-center justify-between gap-2 ${cardStyle}`}
                                                >
                                                    <span className="flex-1 text-center">{item}</span>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Current Matches Display */}
                            {Object.keys(currentMatches).length > 0 && (
                                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 max-w-xl w-full mx-auto">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 text-center">Your Matches</h4>
                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {Object.entries(currentMatches).map(([k, v], idx) => {
                                            const colorConfig = matchColorClasses[idx % matchColorClasses.length];
                                            return (
                                                <div 
                                                    key={k} 
                                                    className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 border-b-4 font-extrabold text-sm shadow-sm transition-all hover:scale-[1.02] ${colorConfig.bg}`}
                                                >
                                                    <span>{k}</span>
                                                    <span className="text-zinc-400/80">⇄</span>
                                                    <span>{v}</span>
                                                    {!isSubmitted && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const nextMatches = { ...currentMatches };
                                                                delete nextMatches[k];
                                                                setCurrentMatches(nextMatches);
                                                                setSelectedOption(null);
                                                            }}
                                                            className="text-red-500 hover:text-red-700 font-extrabold ml-1.5 cursor-pointer bg-transparent border-none text-base leading-none"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : type === 'true-false' ? (
                        <div className="grid grid-cols-2 gap-6 w-full max-w-xl mx-auto mt-4">
                            {['True', 'False'].map((option) => {
                                const isSelected = selectedOption === option;
                                const isCorrect = option === correctOption;
                                const isWrong = isSelected && selectedOption !== correctOption;
                                
                                let cardStyle = "bg-white border-zinc-200 text-zinc-700 border-b-zinc-300 hover:bg-zinc-50/80";
                                if (isSubmitted) {
                                    if (isCorrect) {
                                        cardStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 border-b-emerald-600";
                                    } else if (isWrong) {
                                        cardStyle = "bg-rose-50 border-rose-400 text-rose-800 border-b-rose-600";
                                    } else {
                                        cardStyle = "bg-white border-zinc-150 text-zinc-400 border-b-zinc-200 opacity-60";
                                    }
                                } else if (isSelected) {
                                    cardStyle = option === 'True' 
                                        ? "bg-emerald-50/80 border-emerald-400 text-emerald-800 border-b-emerald-600 shadow-md shadow-emerald-100/50"
                                        : "bg-rose-50/80 border-rose-400 text-rose-800 border-b-rose-600 shadow-md shadow-rose-100/50";
                                }

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        disabled={isSubmitted}
                                        onClick={() => setSelectedOption(option)}
                                        className={`py-8 px-6 font-extrabold text-2xl rounded-3xl border-2 border-b-4 transition-all duration-150 cursor-pointer active:translate-y-[2px] active:border-b-2 flex flex-col items-center justify-center gap-3 ${cardStyle}`}
                                    >
                                        <span className="text-4xl">
                                            {option === 'True' ? (
                                                <ThumbsUp className="w-10 h-10 text-emerald-500" />
                                            ) : (
                                                <ThumbsDown className="w-10 h-10 text-rose-500" />
                                            )}
                                        </span>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : type === 'swipe-card' ? (
                        <div className="flex flex-col items-center w-full max-w-xl mx-auto mt-4">
                            <div className="flex justify-between w-full mb-6 px-4">
                                <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                                    swipeX < -40 
                                        ? "bg-rose-50 border-rose-400 text-rose-700 scale-105" 
                                        : "bg-zinc-50 border-zinc-200 text-zinc-500"
                                }`}>
                                    <span className="text-xs font-bold uppercase tracking-wider">Swipe Left ◀</span>
                                    <span className="text-lg font-extrabold">{options[0] || 'Left'}</span>
                                </div>
                                <div className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                                    swipeX > 40 
                                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 scale-105" 
                                        : "bg-zinc-50 border-zinc-200 text-zinc-500"
                                }`}>
                                    <span className="text-xs font-bold uppercase tracking-wider">▶ Swipe Right</span>
                                    <span className="text-lg font-extrabold">{options[1] || 'Right'}</span>
                                </div>
                            </div>

                            <div className="relative w-full h-[280px] flex items-center justify-center overflow-visible">
                                <div
                                    onMouseDown={(e) => handleSwipeStart(e.clientX)}
                                    onMouseMove={(e) => handleSwipeMove(e.clientX)}
                                    onMouseUp={handleSwipeEnd}
                                    onMouseLeave={handleSwipeEnd}
                                    onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
                                    onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
                                    onTouchEnd={handleSwipeEnd}
                                    style={{
                                        transform: `translateX(${swipeX}px) rotate(${swipeX * 0.08}deg)`,
                                        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
                                        cursor: isSubmitted || selectedOption ? 'default' : isSwiping ? 'grabbing' : 'grab',
                                    }}
                                    className={`absolute w-[240px] h-[240px] rounded-[32px] border-4 p-6 flex flex-col items-center justify-center text-center shadow-lg transition-colors select-none ${
                                        isSubmitted 
                                            ? selectedOption === correctOption 
                                                ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                                                : "bg-rose-50 border-rose-400 text-rose-800"
                                            : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-300"
                                    }`}
                                >
                                    {swipeX < -45 && (
                                        <div className="absolute inset-0 bg-rose-500/10 rounded-[28px] flex items-center justify-center border-4 border-rose-500 select-none">
                                            <span className="bg-rose-500 text-white font-extrabold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider rotate-[-12deg]">
                                                {options[0]}
                                            </span>
                                        </div>
                                    )}
                                    {swipeX > 45 && (
                                        <div className="absolute inset-0 bg-emerald-500/10 rounded-[28px] flex items-center justify-center border-4 border-emerald-500 select-none">
                                            <span className="bg-emerald-500 text-white font-extrabold px-4 py-1.5 rounded-full text-sm uppercase tracking-wider rotate-[12deg]">
                                                {options[1]}
                                            </span>
                                        </div>
                                    )}

                                    <div className="w-16 h-16 rounded-3xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center mb-4 animate-bounce">
                                        <Sparkles className="w-8 h-8 text-emerald-500" />
                                    </div>
                                    <p className="text-lg font-extrabold leading-snug">
                                        {questionText}
                                    </p>
                                </div>
                            </div>

                            {!isSubmitted && (
                                <div className="flex gap-8 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedOption(options[0]);
                                            setSwipeX(-200);
                                        }}
                                        className="w-14 h-14 rounded-full border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 shadow active:translate-y-[2px] transition-transform cursor-pointer"
                                        title={options[0]}
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedOption(options[1]);
                                            setSwipeX(200);
                                        }}
                                        className="w-14 h-14 rounded-full border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 shadow active:translate-y-[2px] transition-transform cursor-pointer"
                                        title={options[1]}
                                    >
                                        <Check className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : type === 'fraction-builder' ? (
                        <div className="flex flex-col items-center w-full max-w-md mx-auto mt-4 gap-6">
                            {/* Interactive fraction visualization */}
                            <div className="flex items-center justify-center p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-sm relative overflow-visible">
                                <svg width="220" height="220" viewBox="0 0 200 200" className="drop-shadow-md">
                                    {Array.from({ length: parseInt(options[1] || '4') }).map((_, idx) => {
                                        const denominator = parseInt(options[1] || '4');
                                        const isShaded = shadedSlices.includes(idx);
                                        const path = getSlicePath(idx, denominator);
                                        
                                        // Colors: correct green, wrong red, active orange, default white/gray
                                        let fillColor = "fill-white";
                                        let strokeColor = "stroke-zinc-300";
                                        
                                        if (isSubmitted) {
                                            const correctNum = parseInt(options[0] || '0');
                                            const selectedNum = shadedSlices.length;
                                            if (selectedNum === correctNum) {
                                                fillColor = isShaded ? "fill-emerald-500" : "fill-emerald-50/50";
                                                strokeColor = "stroke-emerald-600";
                                            } else {
                                                fillColor = isShaded ? "fill-rose-500" : "fill-rose-50/50";
                                                strokeColor = "stroke-rose-600";
                                            }
                                        } else if (isShaded) {
                                            fillColor = "fill-amber-500";
                                            strokeColor = "stroke-amber-600";
                                        }

                                        return (
                                            <path
                                                key={idx}
                                                d={path}
                                                className={`${fillColor} ${strokeColor} transition-all duration-150 cursor-pointer hover:opacity-90`}
                                                strokeWidth="2.5"
                                                onClick={() => {
                                                    if (isSubmitted) return;
                                                    // Trigger tiny audio feedback!
                                                    try {
                                                        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                                        if (AudioContextClass) {
                                                            const ctx = new AudioContextClass();
                                                            setTimeout(() => ctx.close(), 500);
                                                            const osc = ctx.createOscillator();
                                                            const gain = ctx.createGain();
                                                            osc.connect(gain);
                                                            gain.connect(ctx.destination);
                                                            osc.frequency.setValueAtTime(isShaded ? 330 : 440, ctx.currentTime);
                                                            gain.gain.setValueAtTime(0.04, ctx.currentTime);
                                                            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
                                                            osc.start();
                                                            osc.stop(ctx.currentTime + 0.15);
                                                        }
                                                    } catch (e) {}
                                                    
                                                    const nextShaded = isShaded 
                                                        ? shadedSlices.filter(i => i !== idx)
                                                        : [...shadedSlices, idx];
                                                    setShadedSlices(nextShaded);
                                                    setSelectedOption(nextShaded.length.toString());
                                                }}
                                            />
                                        );
                                    })}
                                    {/* Draw inner circle for a donut-chart premium look */}
                                    <circle cx="100" cy="100" r="30" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
                                </svg>
                            </div>

                            {/* Label showing current fraction */}
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Shaded Fraction</span>
                                <div className="flex items-center gap-2 text-2xl font-black text-zinc-800">
                                    <span className={shadedSlices.length > 0 ? "text-amber-500" : ""}>{shadedSlices.length}</span>
                                    <span>/</span>
                                    <span>{options[1] || '4'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Post-submit explanation layout render */}
                {isSubmitted && (
                    <QuizExplanation
                        isCorrect={isCorrect}
                        explanationEn={explanationEn}
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
