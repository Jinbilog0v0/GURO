import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calculator, ChevronRight, Lightbulb, ListChecks, AlignLeft, Volume2, Square, Sparkles, CheckCircle2, ChevronLeft, HelpCircle } from 'lucide-react';

interface Definition {
    term: string;
    definition: string;
    examples: string[];
}

interface RefresherQuestion {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

interface StudyContent {
    introduction: string;
    definitions: Definition[];
    summary: string[];
    refresherQuiz?: RefresherQuestion[];
}

interface StudyContentStepProps {
    subject: 'Mathematics' | 'English';
    gradeLevel: number;
    topic: string;
    studyContent: StudyContent | null;
    onStartQuiz: () => void;
    onBack: () => void;
}

interface Slide {
    type: 'intro' | 'definition' | 'refresher' | 'summary' | 'completed';
    title: string;
    data: any;
    refresherIndex?: number;
}

export const StudyContentStep: React.FC<StudyContentStepProps> = ({
    subject,
    gradeLevel,
    topic,
    studyContent,
    onStartQuiz,
    onBack,
}) => {
    const isMath = subject === 'Mathematics';
    const accentClass = isMath ? 'bg-[#11428E]' : 'bg-purple-600';
    const accentText = isMath ? 'text-[#11428E]' : 'text-purple-600';
    const accentBorder = isMath ? 'border-[#11428E]/20' : 'border-purple-500/20';
    const accentBg = isMath ? 'bg-[#11428E]/8' : 'bg-purple-500/8';

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedRefresherOpt, setSelectedRefresherOpt] = useState<Record<number, string>>({});
    const [refresherChecked, setRefresherChecked] = useState<Record<number, boolean>>({});

    // Build the dynamic slide list based on study guide definitions & quizzes
    const slides = React.useMemo(() => {
        if (!studyContent) return [];
        const list: Slide[] = [];

        // 1. Introduction Slide
        if (studyContent.introduction) {
            list.push({
                type: 'intro',
                title: 'Introduction',
                data: studyContent.introduction,
            });
        }

        // 2. Interleave Definitions and Refresher Questions
        const definitions = studyContent.definitions || [];
        const refreshers = studyContent.refresherQuiz || [];
        const maxLen = Math.max(definitions.length, refreshers.length);

        for (let i = 0; i < maxLen; i++) {
            if (i < definitions.length) {
                list.push({
                    type: 'definition',
                    title: `Concept: ${definitions[i].term}`,
                    data: definitions[i],
                });
            }
            if (i < refreshers.length) {
                list.push({
                    type: 'refresher',
                    title: `Quick Check!`,
                    data: refreshers[i],
                    refresherIndex: i,
                });
            }
        }

        // 3. Summary Slide
        if (studyContent.summary && studyContent.summary.length > 0) {
            list.push({
                type: 'summary',
                title: 'Key Takeaways',
                data: studyContent.summary,
            });
        }

        // 4. Lesson Completed Slide
        list.push({
            type: 'completed',
            title: 'Lesson Completed!',
            data: null,
        });

        return list;
    }, [studyContent]);

    // Handle voice synthesis on slide change
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [currentSlideIndex]);

    const toggleSpeech = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const currentSlide = slides[currentSlideIndex];
        if (!currentSlide) return;

        let text = '';
        if (currentSlide.type === 'intro') {
            text = `Introduction. ${currentSlide.data}`;
        } else if (currentSlide.type === 'definition') {
            const def = currentSlide.data as Definition;
            text = `${def.term}. ${def.definition}. For example, ${def.examples.join(', ')}`;
        } else if (currentSlide.type === 'refresher') {
            const q = currentSlide.data as RefresherQuestion;
            text = `Quick Check. ${q.questionText}. Is it ${q.options.join(', or ')}?`;
        } else if (currentSlide.type === 'summary') {
            text = `Let's summarize. ${currentSlide.data.join('. ')}`;
        } else if (currentSlide.type === 'completed') {
            text = `Congratulations! You have completed the interactive lesson. You are now ready to take the quiz!`;
        }

        if (!text) return;

        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(text);
        const storedRate = localStorage.getItem('guro_student_speech_rate');
        utterance.rate = storedRate ? parseFloat(storedRate) : 0.9;
        const storedVoice = localStorage.getItem('guro_student_guide_voice');
        let pitch = 1.0;
        if (storedVoice === 'robot') {
            pitch = 0.65;
        } else if (storedVoice === 'owl') {
            pitch = 1.25;
        }
        utterance.pitch = pitch;
        utterance.lang = 'en-US';
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    if (!studyContent || slides.length === 0) {
        return (
            <div
                className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center select-none"
                style={{ background: 'var(--bg-main)' }}
            >
                <div className="glass-panel rounded-3xl p-10 flex flex-col items-center gap-4 max-w-md">
                    <BookOpen className="size-12 text-[var(--text-dark)] animate-pulse" strokeWidth={1.5} />
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Guide Unavailable</h2>
                    <p className="text-[var(--text-muted)] text-sm">
                        No study material exists for this topic yet. Go straight to the quiz to test your skills!
                    </p>
                    <button
                        onClick={onStartQuiz}
                        className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 cursor-pointer font-bold"
                    >
                        Start Quiz <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
        );
    }

    const currentSlide = slides[currentSlideIndex];
    const progressPercent = ((currentSlideIndex + 1) / slides.length) * 100;

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center p-6 md:p-12 relative overflow-hidden select-none fade-in"
            style={{ background: 'var(--bg-main)' }}
        >
            {/* Ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 rounded-full blur-[160px]" style={{ background: 'rgba(17,66,142,0.10)' }} />
            <div className="absolute -top-48 right-1/4 size-80 rounded-full blur-[160px]" style={{ background: 'rgba(160,19,34,0.07)' }} />

            {/* Header controls */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-6 mt-12 relative z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all font-semibold text-xs cursor-pointer"
                >
                    <ArrowLeft className="size-3.5" strokeWidth={2.5} />
                    Exit Lesson
                </button>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs ${accentClass}`}>
                    {isMath ? <Calculator className="size-3.5" /> : <BookOpen className="size-3.5" />}
                    {subject} · Grade {gradeLevel}
                </div>
            </div>

            {/* Interactive Slide Viewer Area */}
            <div className="w-full max-w-2xl flex flex-col gap-6 relative z-10 flex-1 justify-center">
                {/* Step indicator progress bar */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[var(--text-muted)]">
                        <span className="uppercase tracking-widest text-[10px]">{topic}</span>
                        <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
                    </div>
                    <div className="h-3 w-full bg-zinc-200/60 rounded-full overflow-hidden p-0.5 border border-zinc-300/10">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${accentClass}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Card Container with slide animations */}
                <div className="glass-panel rounded-[32px] p-7 md:p-9 border border-[var(--border-color)] flex flex-col gap-5 min-h-[380px] justify-between relative shadow-lg">
                    {/* Read Aloud Button */}
                    <div className="absolute top-6 right-6">
                        <button
                            type="button"
                            onClick={toggleSpeech}
                            className={`px-3 py-1 text-xs font-bold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${isSpeaking 
                                ? 'bg-purple-100 border-purple-300 text-purple-700 font-bold scale-105' 
                                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                        >
                            {isSpeaking ? <Square className="size-3 fill-current" /> : <Volume2 className="size-3" />}
                            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                        </button>
                    </div>

                    {/* Slide Content Dispatcher */}
                    <div className="flex-1 pr-16">
                        {currentSlide.type === 'intro' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2.5 rounded-2xl ${accentClass}`}>
                                        <AlignLeft className="size-5 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-lg">{currentSlide.title}</h2>
                                </div>
                                <p className="text-[var(--text-main)] text-sm sm:text-base leading-relaxed font-medium mt-2">
                                    {currentSlide.data}
                                </p>
                            </div>
                        )}

                        {currentSlide.type === 'definition' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2.5 rounded-2xl ${accentClass}`}>
                                        <Lightbulb className="size-5 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-lg">{currentSlide.title}</h2>
                                </div>
                                <div className={`rounded-2xl p-5 border mt-2 ${accentBorder} ${accentBg} flex flex-col gap-2`}>
                                    <p className={`font-extrabold text-lg ${accentText}`}>{currentSlide.data.term}</p>
                                    <p className="text-[var(--text-main)] text-sm sm:text-base leading-relaxed font-medium">
                                        {currentSlide.data.definition}
                                    </p>
                                </div>
                                {currentSlide.data.examples && currentSlide.data.examples.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <span className="text-[10px] font-extrabold text-[var(--text-dark)] uppercase tracking-widest">Examples</span>
                                        <div className="flex flex-col gap-1.5">
                                            {currentSlide.data.examples.map((ex: string, eIdx: number) => (
                                                <div key={eIdx} className="flex items-start gap-2 bg-white/40 border border-zinc-200/50 p-2 rounded-xl">
                                                    <ChevronRight className={`size-4 mt-0.5 shrink-0 ${accentText}`} />
                                                    <span className="text-xs sm:text-sm text-[var(--text-muted)] font-bold">{ex}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentSlide.type === 'refresher' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-2xl bg-amber-500 text-white">
                                        <HelpCircle className="size-5" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-lg">{currentSlide.title}</h2>
                                </div>
                                <p className="text-[var(--text-main)] text-sm sm:text-base font-extrabold leading-snug mt-2">
                                    {currentSlide.data.questionText}
                                </p>
                                
                                <div className="flex flex-col gap-3 mt-3">
                                    {currentSlide.data.options.map((opt: string) => {
                                        const rIdx = currentSlide.refresherIndex ?? 0;
                                        const selected = selectedRefresherOpt[rIdx];
                                        const hasChecked = refresherChecked[rIdx];
                                        const isOptSelected = selected === opt;
                                        
                                        let optClass = "border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0";
                                        if (hasChecked) {
                                            if (opt === currentSlide.data.correctAnswer) {
                                                optClass = "bg-emerald-50 border-emerald-400 text-emerald-800 font-extrabold";
                                            } else if (isOptSelected) {
                                                optClass = "bg-rose-50 border-rose-400 text-rose-800 font-bold";
                                            } else {
                                                optClass = "border-zinc-100 text-zinc-400 bg-zinc-50/50 opacity-60";
                                            }
                                        } else if (isOptSelected) {
                                            optClass = "bg-amber-50 border-amber-400 text-amber-800 font-bold";
                                        }

                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                disabled={hasChecked}
                                                onClick={() => {
                                                    setSelectedRefresherOpt(prev => ({ ...prev, [rIdx]: opt }));
                                                }}
                                                className={`py-3.5 px-5 rounded-2xl border text-sm font-bold text-left transition-all duration-200 ${optClass} ${!hasChecked && 'cursor-pointer'}`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>

                                {refresherChecked[currentSlide.refresherIndex ?? 0] && (
                                    <div className={`mt-2 p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                                        selectedRefresherOpt[currentSlide.refresherIndex ?? 0] === currentSlide.data.correctAnswer
                                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                                            : 'bg-rose-50/50 border-rose-200 text-rose-800'
                                    }`}>
                                        <p className="font-extrabold mb-1">
                                            {selectedRefresherOpt[currentSlide.refresherIndex ?? 0] === currentSlide.data.correctAnswer ? '✨ Correct!' : '❌ Keep learning!'}
                                        </p>
                                        <p className="font-medium text-zinc-600">{currentSlide.data.explanation}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentSlide.type === 'summary' && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2.5 rounded-2xl ${accentClass}`}>
                                        <ListChecks className="size-5 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-lg">{currentSlide.title}</h2>
                                </div>
                                <ul className="flex flex-col gap-3.5 mt-3">
                                    {currentSlide.data.map((point: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 bg-white/30 border border-zinc-200/40 p-3 rounded-2xl">
                                            <div className={`mt-1.5 size-2 rounded-full shrink-0 ${accentClass}`} />
                                            <span className="text-sm text-[var(--text-muted)] font-semibold leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {currentSlide.type === 'completed' && (
                            <div className="flex flex-col items-center text-center justify-center gap-5 mt-6 py-4">
                                <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce">
                                    <CheckCircle2 className="size-10" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <h2 className="font-black text-2xl text-[var(--text-main)] flex items-center gap-1.5 justify-center">
                                        You are Ready! <Sparkles className="size-5 text-amber-500" />
                                    </h2>
                                    <p className="text-sm text-[var(--text-muted)] font-semibold max-w-sm leading-relaxed">
                                        You completed all interactive checkpoints in the guide. Good luck on your Diagnostic challenge!
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step Navigation Controls */}
                    <div className="flex justify-between items-center gap-4 border-t border-zinc-200/50 pt-5 mt-5">
                        <button
                            type="button"
                            onClick={() => {
                                if (currentSlideIndex > 0) {
                                    setCurrentSlideIndex(currentSlideIndex - 1);
                                } else {
                                    onBack();
                                }
                            }}
                            className="px-4 py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] glass-panel hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
                        >
                            <ChevronLeft className="size-4" />
                            Back
                        </button>

                        {currentSlide.type === 'completed' ? (
                            <button
                                type="button"
                                onClick={onStartQuiz}
                                className="px-6 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 to-[#11428E] hover:opacity-90 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                            >
                                Start Quiz
                                <ChevronRight className="size-4" />
                            </button>
                        ) : currentSlide.type === 'refresher' ? (
                            (() => {
                                const rIdx = currentSlide.refresherIndex ?? 0;
                                const selected = selectedRefresherOpt[rIdx];
                                const hasChecked = refresherChecked[rIdx];
                                
                                if (!hasChecked) {
                                    return (
                                        <button
                                            type="button"
                                            disabled={!selected}
                                            onClick={() => {
                                                setRefresherChecked(prev => ({ ...prev, [rIdx]: true }));
                                                try {
                                                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                                    if (AudioContextClass) {
                                                        const ctx = new AudioContextClass();
                                                        setTimeout(() => ctx.close(), 1000);
                                                        const osc = ctx.createOscillator();
                                                        const gain = ctx.createGain();
                                                        osc.connect(gain);
                                                        gain.connect(ctx.destination);
                                                        
                                                        if (selected === currentSlide.data.correctAnswer) {
                                                            osc.frequency.setValueAtTime(659.25, ctx.currentTime);
                                                            gain.gain.setValueAtTime(0.08, ctx.currentTime);
                                                            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
                                                            osc.start();
                                                            osc.stop(ctx.currentTime + 0.5);
                                                        } else {
                                                            osc.type = 'sawtooth';
                                                            osc.frequency.setValueAtTime(110, ctx.currentTime);
                                                            gain.gain.setValueAtTime(0.08, ctx.currentTime);
                                                            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
                                                            osc.start();
                                                            osc.stop(ctx.currentTime + 0.5);
                                                        }
                                                    }
                                                } catch (e) {}
                                            }}
                                            className={`px-5 py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1 active:scale-[0.98] ${
                                                !selected
                                                    ? 'bg-amber-300 cursor-not-allowed'
                                                    : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                                            }`}
                                        >
                                            Check Answer
                                            <ChevronRight className="size-4" />
                                        </button>
                                    );
                                } else {
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                                            className={`px-5 py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer ${accentClass}`}
                                        >
                                            Next Slide
                                            <ChevronRight className="size-4" />
                                        </button>
                                    );
                                }
                            })()
                        ) : (
                            <button
                                type="button"
                                onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                                className={`px-5 py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1 active:scale-[0.98] cursor-pointer ${accentClass}`}
                            >
                                Next Slide
                                <ChevronRight className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
