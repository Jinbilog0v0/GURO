import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, ChevronRight, Mail } from 'lucide-react';

interface NameInputStepProps {
    onBack: () => void;
    onStartLearning: (name: string) => void;
}

const STORAGE_KEY_NAME = 'guro_student_name';
const STORAGE_KEY_EMAIL_ID = 'guro_student_email_or_id';

const GuroLogoGraphic: React.FC = () => (
    <div className="relative flex size-16 items-center justify-center rounded-2xl overflow-hidden shadow-xl shadow-[#11428E]/25 border border-white/30 transform hover:scale-105 transition-all duration-300">
        <img src="/images/guro-mark.png" alt="GURO Logo" className="w-full h-full object-cover" />
        <span className="absolute -top-1.5 -right-1.5 text-xs text-amber-300 animate-pulse">✦</span>
    </div>
);

export const NameInputStep: React.FC<NameInputStepProps> = ({ onBack, onStartLearning }) => {
    const [name, setName] = useState('');
    const [section, setSection] = useState('');
    const [emailOrId, setEmailOrId] = useState('');
    const [savedName, setSavedName] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY_NAME);
        const storedEmail = localStorage.getItem(STORAGE_KEY_EMAIL_ID);
        if (stored) setSavedName(stored);
        if (storedEmail) setEmailOrId(storedEmail);
    }, []);

    const isInputEmpty = name.trim() === '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isInputEmpty) {
            const finalName = name.trim();
            localStorage.setItem(STORAGE_KEY_NAME, finalName);
            if (emailOrId.trim()) {
                localStorage.setItem(STORAGE_KEY_EMAIL_ID, emailOrId.trim());
            }
            const resolvedName = section.trim() ? `${finalName} (${section.trim()})` : finalName;
            onStartLearning(resolvedName);
        }
    };

    const handleContinueAsSaved = () => {
        if (savedName) {
            onStartLearning(savedName);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-[var(--bg-main)] relative overflow-hidden select-none"
        >
            {/* Background blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-[var(--accent-primary-glow)] rounded-full blur-[160px]" />
            <div className="absolute -top-48 right-1/4 size-96 bg-purple-500/10 rounded-full blur-[160px]" />

            {/* Back button */}
            <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full shadow-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all font-semibold text-xs cursor-pointer"
                >
                    <ArrowLeft className="size-3 text-[var(--text-muted)]" strokeWidth={2.5} />
                    Back to sign in
                </button>
            </div>

            <div className="flex w-full max-w-xl flex-col items-center gap-8 relative z-10">
                {/* Brand */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <GuroLogoGraphic />
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#11428E] dark:text-sky-400 mt-1">GURO</h1>
                    <p className="text-xs font-bold text-[#A01322] dark:text-rose-400 tracking-wider">GUIDED UNIFIED RESOURCE OPTIMIZATION</p>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">Your Learning Companion for Math &amp; English</p>
                </div>

                {/* "Continue as" shortcut — shown if a name was previously saved */}
                {savedName && (
                    <button
                        type="button"
                        onClick={handleContinueAsSaved}
                        className="w-full max-w-md flex items-center justify-between gap-3 px-5 py-4 bg-[#11428E]/6 dark:bg-sky-500/10 border border-[#11428E]/20 dark:border-sky-500/20 rounded-2xl hover:bg-[#11428E]/10 dark:hover:bg-sky-500/15 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-gradient-to-br from-[#11428E] to-[#A01322] flex items-center justify-center text-white font-black text-sm shrink-0">
                                {savedName.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Continue as</p>
                                <p className="text-sm font-extrabold text-[var(--text-main)]">{savedName}</p>
                            </div>
                        </div>
                        <ChevronRight className="size-5 text-[#11428E] dark:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}

                {/* Input Card */}
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl p-8 shadow-xl border border-[var(--border-color)] flex flex-col gap-6"
                >
                    <div className="text-center">
                        <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                            {savedName ? 'Or enter a different name' : "What's your name?"}
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            {savedName ? 'Switch to a different student profile' : 'Enter your name to start learning as a guest'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Your name</label>
                        <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={savedName ? savedName : 'e.g. Juan Dela Cruz'}
                                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 focus:bg-[var(--bg-card)] transition-all"
                                maxLength={30}
                                autoFocus={!savedName}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Section (Optional)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-extrabold select-none">#</span>
                            <input
                                type="text"
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                placeholder="e.g. Rizal, Bonifacio, Section A"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 focus:bg-[var(--bg-card)] transition-all"
                                maxLength={20}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">School Email or Learner ID (Optional)</label>
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200/40 dark:border-blue-800/40">Cloud Sync Ready</span>
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={emailOrId}
                                onChange={(e) => setEmailOrId(e.target.value)}
                                placeholder="e.g. juan@school.ph or LRN-123456"
                                className="w-full pl-10 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 focus:bg-[var(--bg-card)] transition-all"
                                maxLength={50}
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
