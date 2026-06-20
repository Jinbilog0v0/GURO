import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calculator, ChevronRight, Lightbulb, ListChecks, AlignLeft, Volume2, Square } from 'lucide-react';

interface Definition {
    term: string;
    definition: string;
    examples: string[];
}

interface StudyContent {
    introduction: string;
    definitions: Definition[];
    summary: string[];
}

interface StudyContentStepProps {
    subject: 'Mathematics' | 'English';
    gradeLevel: number;
    topic: string;
    studyContent: StudyContent | null;
    onStartQuiz: () => void;
    onBack: () => void;
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

    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    const toggleSpeech = () => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            let speechParts = [`Study Guide: ${topic}`];
            if (studyContent) {
                if (studyContent.introduction) {
                    speechParts.push(`Introduction: ${studyContent.introduction}`);
                }
                if (studyContent.definitions && studyContent.definitions.length > 0) {
                    speechParts.push("Key concepts:");
                    studyContent.definitions.forEach(def => {
                        speechParts.push(`${def.term}. ${def.definition}`);
                    });
                }
                if (studyContent.summary && studyContent.summary.length > 0) {
                    speechParts.push("Key takeaways:");
                    studyContent.summary.forEach(point => {
                        speechParts.push(point);
                    });
                }
            }
            
            const utterance = new SpeechSynthesisUtterance(speechParts.join('. '));

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

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center p-6 md:p-12 relative overflow-hidden select-none fade-in"
            style={{ background: 'var(--bg-main)' }}
        >
            {/* Ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 rounded-full blur-[160px]" style={{ background: 'rgba(17,66,142,0.10)' }} />
            <div className="absolute -top-48 right-1/4 size-80 rounded-full blur-[160px]" style={{ background: 'rgba(160,19,34,0.07)' }} />

            {/* Nav */}
            <div className="w-full max-w-3xl flex items-center justify-between mb-8 mt-16 relative z-10">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                >
                    <ArrowLeft className="size-4" strokeWidth={2.5} />
                    Back to Topics
                </button>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm ${accentClass}`}>
                    {isMath ? <Calculator className="size-4" /> : <BookOpen className="size-4" />}
                    {subject} · Grade {gradeLevel}
                </div>
            </div>

            <div className="w-full max-w-3xl flex flex-col gap-6 relative z-10">
                {/* Title card */}
                <div className="glass-panel rounded-3xl p-7 flex flex-col gap-2 relative">
                    <div className="flex justify-between items-start">
                        <span className={`text-xs font-bold uppercase tracking-widest ${accentText}`}>Study Guide</span>
                        {studyContent && (
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
                        )}
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">{topic}</h1>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        Read through this material before starting the quiz. It will help you answer correctly!
                    </p>
                </div>

                {studyContent ? (
                    <>
                        {/* Introduction */}
                        {studyContent.introduction && (
                            <div className={`glass-panel rounded-3xl p-6 border ${accentBorder} flex flex-col gap-3`}>
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2 rounded-xl ${accentClass}`}>
                                        <AlignLeft className="size-4 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-base">Introduction</h2>
                                </div>
                                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{studyContent.introduction}</p>
                            </div>
                        )}

                        {/* Definitions */}
                        {studyContent.definitions && studyContent.definitions.length > 0 && (
                            <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2 rounded-xl ${accentClass}`}>
                                        <Lightbulb className="size-4 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-base">Key Concepts</h2>
                                </div>
                                <div className="flex flex-col gap-4">
                                    {studyContent.definitions.map((def, idx) => (
                                        <div key={idx} className={`rounded-2xl p-4 border ${accentBorder} ${accentBg}`}>
                                            <p className={`font-extrabold text-sm mb-1 ${accentText}`}>{def.term}</p>
                                            <p className="text-[var(--text-muted)] text-sm mb-2">{def.definition}</p>
                                            {def.examples && def.examples.length > 0 && (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <span className="text-[11px] font-bold text-[var(--text-dark)] uppercase tracking-wider">Examples</span>
                                                    {def.examples.map((ex, eIdx) => (
                                                        <div key={eIdx} className="flex items-start gap-2">
                                                            <ChevronRight className={`size-3.5 mt-0.5 shrink-0 ${accentText}`} />
                                                            <span className="text-xs text-[var(--text-muted)]">{ex}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        {studyContent.summary && studyContent.summary.length > 0 && (
                            <div className="glass-panel rounded-3xl p-6 flex flex-col gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className={`p-2 rounded-xl ${accentClass}`}>
                                        <ListChecks className="size-4 text-white" />
                                    </div>
                                    <h2 className="font-extrabold text-[var(--text-main)] text-base">Key Takeaways</h2>
                                </div>
                                <ul className="flex flex-col gap-2">
                                    {studyContent.summary.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5">
                                            <div className={`mt-1.5 size-2 rounded-full shrink-0 ${accentClass}`} />
                                            <span className="text-sm text-[var(--text-muted)] leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="glass-panel rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
                        <BookOpen className="size-10 text-[var(--text-dark)]" strokeWidth={1.5} />
                        <p className="text-[var(--text-muted)] text-sm font-medium">
                            No study guide is available for this topic yet. You can still take the quiz!
                        </p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pb-8">
                    <button
                        onClick={onStartQuiz}
                        className="flex-1 py-4 text-base font-bold text-white bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-90 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                        Start Quiz
                        <ChevronRight className="size-5" />
                    </button>
                    <button
                        onClick={onStartQuiz}
                        className="sm:w-40 py-4 text-sm font-bold text-[var(--text-muted)] glass-panel hover:text-[var(--text-main)] border border-[var(--border-color)] rounded-2xl transition-all active:scale-[0.99] cursor-pointer"
                    >
                        Skip Preview
                    </button>
                </div>
            </div>
        </div>
    );
};
