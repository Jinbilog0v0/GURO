import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, ChevronRight } from 'lucide-react';

interface NameInputStepProps {
    onBack: () => void;
    onStartLearning: (name: string) => void;
}

const STORAGE_KEY_NAME = 'guro_student_name';

const GuroLogoGraphic: React.FC = () => (
    <div className="relative flex size-14 items-center justify-center">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 38 C8 38 8 14 26 14 C44 14 44 38 44 38" stroke="#11428E" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M26 14 L26 38" stroke="#11428E" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M8 38 L44 38" stroke="#11428E" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
        <span className="absolute -top-1 -right-1 text-sm leading-none">✦</span>
    </div>
);

export const NameInputStep: React.FC<NameInputStepProps> = ({ onBack, onStartLearning }) => {
    const [name, setName] = useState('');
    const [savedName, setSavedName] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_NAME);
        if (stored) setSavedName(stored);
    }, []);

    const isInputEmpty = name.trim() === '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isInputEmpty) {
            localStorage.setItem(STORAGE_KEY_NAME, name.trim());
            onStartLearning(name.trim());
        }
    };

    const handleContinueAsSaved = () => {
        if (savedName) {
            onStartLearning(savedName);
        }
    };

    const pageStyle: React.CSSProperties = {
        background: 'linear-gradient(160deg, #eef3fb 0%, #fcf2f2 100%)',
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden select-none"
            style={pageStyle}
        >
            {/* Back button */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs cursor-pointer"
                >
                    <ArrowLeft className="size-3 text-slate-400" strokeWidth={2.5} />
                    Back to sign in
                </button>
            </div>

            <div className="flex w-full max-w-xl flex-col items-center gap-8 relative z-10">
                {/* Brand */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <GuroLogoGraphic />
                    <h1 className="text-5xl font-extrabold tracking-tight text-[#11428E] mt-1">GURO</h1>
                    <p className="text-base font-semibold text-[#A01322]">Guided Unified Remote Online</p>
                    <p className="text-sm text-slate-400 mt-0.5">Your Learning Companion for Math &amp; English</p>
                </div>

                {/* "Continue as" shortcut — shown if a name was previously saved */}
                {savedName && (
                    <button
                        type="button"
                        onClick={handleContinueAsSaved}
                        className="w-full max-w-md flex items-center justify-between gap-3 px-5 py-4 bg-[#11428E]/6 border border-[#11428E]/20 rounded-2xl hover:bg-[#11428E]/10 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-gradient-to-br from-[#11428E] to-[#A01322] flex items-center justify-center text-white font-black text-sm shrink-0">
                                {savedName.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Continue as</p>
                                <p className="text-sm font-extrabold text-slate-800">{savedName}</p>
                            </div>
                        </div>
                        <ChevronRight className="size-5 text-[#11428E] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Input Card */}
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-[rgba(17,66,142,0.08)] flex flex-col gap-6 border border-slate-100/80"
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {savedName ? 'Or enter a different name' : "What's your name?"}
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            {savedName ? 'Switch to a different student profile' : 'Enter your name to start learning as a guest'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={savedName ? savedName : 'e.g. Juan Dela Cruz'}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 focus:bg-white transition-all"
                                maxLength={30}
                                autoFocus={!savedName}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isInputEmpty}
                        className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-[#11428E]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-90 active:scale-[0.99]"
                        style={{ background: 'linear-gradient(135deg, #11428E 0%, #A01322 100%)' }}
                    >
                        Start Learning
                    </button>
                </form>
            </div>
        </div>
    );
};
