import React, { useState } from 'react';

interface NameInputStepProps {
    onBack: () => void;
    onStartLearning: (name: string) => void;
}

const GuroLogoGraphic: React.FC = () => {
    return (
        <div className="relative flex size-12 items-center justify-center">
            <div className="absolute size-10 rounded-t-lg border-[3px] border-blue-600 bg-white" />
            <div className="absolute h-8 w-px bg-zinc-300" />
            <div className="absolute top-1 right-2">
                <span className="text-sm">✨</span>
            </div>
        </div>
    );
};

export const NameInputStep: React.FC<NameInputStepProps> = ({ onBack, onStartLearning }) => {
    const [name, setName] = useState('');

    const isInputEmpty = name.trim() === '';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isInputEmpty) {
            onStartLearning(name.trim());
        }
    };

    return (
        <div className="min-h-screen w-full flex-col flex items-center justify-center p-6 bg-zinc-50 relative overflow-hidden">
            {/* Background ambient blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
            <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

            <div className="flex w-full max-w-xl flex-col items-center gap-10 relative z-10">

                {/* Brand Area */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <GuroLogoGraphic />
                    <h1 className="text-7xl font-bold tracking-tight text-blue-700">GURO</h1>
                    <p className="text-xl font-medium text-purple-700">Guided Unified Remote Online</p>
                    <p className="mt-1 text-base text-zinc-700">Your Learning Companion for Math & English</p>
                </div>

                {/* Input Form Card */}
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl shadow-zinc-200/80 border border-zinc-100/50 flex flex-col items-center gap-6"
                >
                    <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">
                        Enter your name
                    </h2>

                    {/* Text Input */}
                    <div className="w-full">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name..."
                            className="w-full px-5 py-4 text-lg bg-white border border-zinc-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-zinc-800 placeholder-zinc-400 transition-all"
                            maxLength={30}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full flex flex-col gap-3">
                        {/* Start Learning Button */}
                        <button
                            type="submit"
                            disabled={isInputEmpty}
                            className={`w-full py-4 text-lg font-semibold text-white rounded-2xl shadow-md transition-all duration-300 ${isInputEmpty
                                    ? 'bg-gradient-to-r from-blue-400/50 to-purple-500/50 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.99] cursor-pointer'
                                }`}
                        >
                            Start Learning
                        </button>

                        {/* Back Button */}
                        <button
                            type="button"
                            onClick={onBack}
                            className="w-full py-4 text-lg font-semibold text-zinc-700 bg-zinc-200/70 hover:bg-zinc-200 rounded-2xl transition-colors active:scale-[0.99] cursor-pointer"
                        >
                            Back
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
