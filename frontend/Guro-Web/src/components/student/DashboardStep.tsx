import React, { useState } from 'react';
import { Calculator, BookOpen, Trophy, TrendingUp, Hand, Lock, Play, Rocket, ShoppingBag, Sparkles, X, Clock, ArrowLeft, Flame } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { StatCard } from './StatCard';
import { StudentProfile } from './StudentProfile';

interface DashboardStepProps {
    userName: string;
    email?: string;
    selectedGrade: number;
    onBack: () => void;
    onSelectSubject: (subject: string) => void;
    onLogout?: () => void;
    mathTopics?: string[];
    englishTopics?: string[];
    mathProgress?: number;
    englishProgress?: number;
    stats?: {
        lessonsCompleted: number;
        averageScore: number;
        streak: number;
    };
    parentAccessCode?: string;
    inShell?: boolean;
    isEnglishLocked?: boolean;
    englishLockReason?: string;
    
    // Gamification & Rewards
    stars: number;
    avatarEmoji: string;
    activeOutfit: string;
    ownedOutfits: string[];
    xpPoints: number;
    onPurchaseOutfit: (key: string, cost: number) => boolean;
    onEquipOutfit: (key: string) => void;
    onSelectAvatarEmoji: (emoji: string) => void;
    
    // Recommendation Engine
    recommendedLesson: { subject: string; topic: string; reason: string } | null;
    lastActivity: { subject: string; topic: string; gradeLevel: number; score: number; totalQuestions: number } | null;
    onResumeQuiz: (subject: string, topic: string) => void;

    // Time Limits
    dailyMinutesUsed: number;
    dailyTimeLimit: number;
    isTimeLimitExceeded: boolean;
}

const OUTFIT_OPTIONS = [
    { key: 'default', label: 'Classic Spacecraft', emoji: '🚀', cost: 0 },
    { key: 'detective_hat', label: 'Detective Gear', emoji: '🕵️‍♂️', cost: 20 },
    { key: 'space_visor', label: 'Cosmic Visor', emoji: '👨‍🚀', cost: 40 },
    { key: 'wizard_cape', label: 'Wizard Cape', emoji: '🧙‍♂️', cost: 60 },
    { key: 'crown', label: 'Golden Crown', emoji: '👑', cost: 80 },
];

const EMOJI_AVATARS = ['🚀', '🦁', '🐱', '🦊', '🦄', '🐨', '🐼', '🤖', '👾'];

export const DashboardStep: React.FC<DashboardStepProps> = ({
    userName = 'Explorer',
    email,
    selectedGrade = 4,
    onBack,
    onSelectSubject,
    onLogout,
    mathTopics = ['Whole Numbers', 'Fractions', 'Geometry'],
    englishTopics = ['Reading', 'Grammar', 'Figures of Speech'],
    mathProgress = 65,
    englishProgress = 72,
    stats = {
        lessonsCompleted: 12,
        averageScore: 85,
        streak: 5
    },
    parentAccessCode,
    inShell = false,
    isEnglishLocked = false,
    englishLockReason,
    
    // Gamification
    stars = 0,
    avatarEmoji = '🚀',
    activeOutfit = 'default',
    ownedOutfits = ['default'],
    xpPoints = 0,
    onPurchaseOutfit,
    onEquipOutfit,
    onSelectAvatarEmoji,

    // Recommendation
    recommendedLesson,
    lastActivity,
    onResumeQuiz,

    // Time Limits
    dailyMinutesUsed = 0,
    dailyTimeLimit = 0,
    isTimeLimitExceeded = false,
}) => {
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    // Levels
    const level = Math.floor(xpPoints / 100) + 1;
    const xpInLevel = xpPoints % 100;

    const equippedOutfit = OUTFIT_OPTIONS.find(o => o.key === activeOutfit);

    return (
        <div className={`w-full flex flex-col items-center p-6 md:p-10 bg-[var(--bg-main)] relative overflow-hidden select-none ${inShell ? 'min-h-[calc(100vh-56px)]' : 'min-h-screen'}`}>
            {/* Background blurs */}
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-[var(--accent-primary-glow)] rounded-full blur-[160px]" />
            <div className="absolute -top-48 right-1/4 size-96 bg-purple-500/5 rounded-full blur-[160px]" />

            {/* Top Navigation Row — hidden inside shell (shell header handles this) */}
            {!inShell && (
                <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 flex items-center justify-between z-20 w-[calc(100%-48px)] max-w-5xl">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                        >
                            <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                            Back
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`px-5 py-2.5 rounded-full shadow-md font-bold text-sm tracking-tight border ${
                            selectedGrade === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                            selectedGrade === 5 ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                            selectedGrade === 6 ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                            'bg-white text-zinc-700 border-zinc-200/60'
                        }`}>
                            Grade {selectedGrade}
                        </div>
                        <StudentProfile
                            userName={userName}
                            email={email}
                            onLogout={onLogout}
                            parentAccessCode={parentAccessCode}
                        />
                    </div>
                </div>
            )}

            <div className={`flex w-full max-w-5xl flex-col gap-8 relative z-10 ${inShell ? 'mt-0' : 'mt-24 md:mt-16'}`}>
                
                {/* Time Limit Exceeded Warning */}
                {isTimeLimitExceeded && (
                    <div className="w-full flex flex-col gap-1.5 p-5 bg-red-500/10 border border-red-500/20 rounded-3xl animate-bounce">
                        <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
                            <Clock className="size-4 shrink-0" />
                            <span>DAILY SCREEN TIME LIMIT REACHED</span>
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-muted)]">
                            You have used {Math.round(dailyMinutesUsed)} / {dailyTimeLimit} minutes today. Rest up and come back tomorrow!
                        </p>
                    </div>
                )}

                {/* Level Up progress bar card */}
                <div className="w-full glass-panel rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm border border-[var(--border-color)]">
                    <div className="relative size-20 flex items-center justify-center bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] group hover:scale-105 transition-transform duration-300">
                        <button 
                            onClick={() => setIsEmojiPickerOpen(true)}
                            className="text-5xl cursor-pointer"
                            title="Change Avatar Emoji"
                        >
                            {avatarEmoji}
                        </button>
                        {equippedOutfit && equippedOutfit.key !== 'default' && (
                            <span className="absolute -top-2 -right-2 text-2xl drop-shadow-md">
                                {equippedOutfit.emoji}
                            </span>
                        )}
                        <div className="absolute -bottom-2.5 px-2 py-0.5 bg-[var(--accent-primary)] text-[9px] font-black text-white rounded-full uppercase tracking-wider">
                            Avatar
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-xl font-extrabold text-[var(--text-main)] flex items-center gap-2">
                                    <span>Level {level} Explorer</span>
                                    <Sparkles className="size-4 text-amber-500 animate-pulse" />
                                </h2>
                                <p className="text-xs font-bold text-[var(--text-muted)]">Hydrate your mind. Complete quests to rank up.</p>
                            </div>
                            <span className="text-xs font-extrabold text-[var(--text-muted)]">{xpInLevel} / 100 XP</span>
                        </div>
                        <div className="w-full bg-[var(--border-color)] rounded-full h-3 overflow-hidden border border-[var(--border-color)]">
                            <div className="h-full bg-gradient-to-r from-[#11428E] to-[#1c5bc0] rounded-full transition-all duration-500" style={{ width: `${xpInLevel}%` }} />
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsShopOpen(true)}
                        className="flex items-center gap-2 px-5 py-3.5 bg-amber-500 hover:bg-amber-600 font-extrabold text-xs text-white rounded-2xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                    >
                        <ShoppingBag className="size-4 shrink-0" />
                        <span>Mascot Shop</span>
                    </button>
                </div>

                {/* Main Welcome row */}
                <div className="flex flex-col items-center text-center mt-2">
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] flex items-center justify-center gap-2 tracking-tight">
                        Welcome back, {userName}! <Hand className="size-8 text-amber-500 animate-bounce inline-block shrink-0" />
                    </h1>
                    <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">Ready for today's learning journey?</p>
                </div>

                {/* Recommendations Columns (Today's Pick & Last Activity) */}
                {(recommendedLesson || lastActivity) && (
                    <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recommended Lesson */}
                        {recommendedLesson && (
                            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border border-[var(--border-color)] shadow-sm gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-[#11428E] tracking-widest flex items-center gap-1.5">
                                        <Sparkles className="size-3 text-amber-500 animate-spin" />
                                        <span>TODAY'S PICK</span>
                                    </span>
                                    <h3 className="text-lg font-black text-[var(--text-main)] truncate">{recommendedLesson.topic}</h3>
                                    <p className="text-xs font-semibold text-[var(--text-muted)]">{recommendedLesson.subject} · Grade {selectedGrade}</p>
                                </div>
                                <button
                                    disabled={isTimeLimitExceeded}
                                    onClick={() => onResumeQuiz(recommendedLesson.subject, recommendedLesson.topic)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#11428E] hover:bg-[#0c316b] text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Rocket className="size-4" />
                                    <span>Start Practice</span>
                                </button>
                            </div>
                        )}

                        {/* Continue Learning */}
                        {lastActivity && (
                            <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border border-[var(--border-color)] shadow-sm gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-1.5">
                                        <Play className="size-3 text-purple-500 fill-purple-500" />
                                        <span>CONTINUE LEARNING</span>
                                    </span>
                                    <h3 className="text-lg font-black text-[var(--text-main)] truncate">{lastActivity.topic}</h3>
                                    <p className="text-xs font-semibold text-[var(--text-muted)]">
                                        {lastActivity.subject} · Score: {Math.round((lastActivity.score / lastActivity.totalQuestions) * 100)}%
                                    </p>
                                </div>
                                <button
                                    disabled={isTimeLimitExceeded}
                                    onClick={() => onResumeQuiz(lastActivity.subject, lastActivity.topic)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="size-4 fill-white" />
                                    <span>Resume Lesson</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* English lock banner */}
                {isEnglishLocked && (
                    <div className="w-full flex items-start gap-3 px-5 py-4 bg-amber-500/15 border border-amber-500/25 rounded-2xl text-sm">
                        <Lock className="size-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-extrabold text-amber-800">English is locked</p>
                            <p className="text-amber-700 text-xs font-semibold mt-0.5">{englishLockReason}</p>
                        </div>
                    </div>
                )}

                {/* Subjects Dual Grid Layout */}
                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-8 px-1">
                    <SubjectCard
                        title="Mathematics"
                        description="Fractions, Decimals, Algebra & More"
                        progress={mathProgress}
                        topics={mathTopics}
                        Icon={Calculator}
                        variant="blue"
                        onClick={isTimeLimitExceeded ? () => {} : () => onSelectSubject('Mathematics')}
                    />
                    <div className="relative">
                        {isEnglishLocked && (
                            <div className="absolute inset-0 z-10 rounded-[32px] bg-zinc-50/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 cursor-not-allowed border border-dashed border-zinc-200">
                                <Lock className="size-8 text-zinc-400" />
                                <span className="text-sm font-black text-zinc-500">English Locked</span>
                            </div>
                        )}
                        <SubjectCard
                            title="English"
                            description="Grammar, Stories, Figures of Speech"
                            progress={englishProgress}
                            topics={englishTopics}
                            Icon={BookOpen}
                            variant="purple"
                            onClick={isEnglishLocked || isTimeLimitExceeded ? () => {} : () => onSelectSubject('English')}
                        />
                    </div>
                </div>

                {/* Statistical Cards Row */}
                <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-1">
                    <StatCard
                        value={stats.lessonsCompleted}
                        labelEn="Lessons Completed"
                        Icon={Trophy}
                        iconColor="text-amber-500"
                    />
                    <StatCard
                        value={`${stats.averageScore}%`}
                        labelEn="Average Score"
                        Icon={TrendingUp}
                        iconColor="text-emerald-500"
                    />
                    <StatCard
                        value={stats.streak}
                        labelEn="Daily Streak"
                        Icon={Flame}
                        iconColor="text-orange-500"
                    />
                    <div className="glass-panel rounded-2xl p-5 border border-[var(--border-color)] flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-[var(--text-main)]">{stars}</span>
                            <span className="text-xs font-extrabold text-[var(--text-muted)]">Stars Collected</span>
                        </div>
                        <div className="size-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-xl animate-pulse">⭐</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Avatar Emoji Picker Modal */}
            {isEmojiPickerOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 border border-[var(--border-color)] shadow-2xl relative fade-in">
                        <button 
                            onClick={() => setIsEmojiPickerOpen(false)}
                            className="absolute top-4 right-4 p-1 hover:bg-[var(--bg-input)] rounded-full transition-all cursor-pointer"
                        >
                            <X className="size-5 text-[var(--text-muted)]" />
                        </button>
                        <h3 className="text-lg font-black text-[var(--text-main)]">Choose Avatar Emoji</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {EMOJI_AVATARS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        onSelectAvatarEmoji(emoji);
                                        setIsEmojiPickerOpen(false);
                                    }}
                                    className={`p-4 text-4xl rounded-2xl bg-[var(--bg-input)] hover:scale-105 border transition-all cursor-pointer ${
                                        avatarEmoji === emoji ? 'border-[#11428E] bg-[#11428E]/5' : 'border-[var(--border-color)]'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Shop Modal */}
            {isShopOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-md rounded-3xl p-6 flex flex-col gap-6 border border-[var(--border-color)] shadow-2xl relative fade-in">
                        <button 
                            onClick={() => setIsShopOpen(false)}
                            className="absolute top-4 right-4 p-1 hover:bg-[var(--bg-input)] rounded-full transition-all cursor-pointer"
                        >
                            <X className="size-5 text-[var(--text-muted)]" />
                        </button>
                        
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                                <ShoppingBag className="size-5 text-amber-500" />
                                <span>Mascot Outfit Shop</span>
                            </h3>
                            <p className="text-xs font-bold text-[var(--text-muted)]">Dress up your spacecraft. Purchase gear using Stars.</p>
                        </div>

                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)]">
                            <span className="text-sm font-extrabold text-[var(--text-muted)]">Your Balance</span>
                            <span className="text-base font-black text-amber-600 flex items-center gap-1">
                                <span>⭐</span> {stars}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                            {OUTFIT_OPTIONS.map((outfit) => {
                                const isOwned = ownedOutfits.includes(outfit.key);
                                const isEquipped = activeOutfit === outfit.key;

                                return (
                                    <div key={outfit.key} className="flex items-center justify-between p-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl gap-3 hover:-translate-y-0.5 transition-all duration-300">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-3xl shrink-0">{outfit.emoji}</span>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-extrabold text-[var(--text-main)] truncate">{outfit.label}</h4>
                                                <p className="text-xs font-bold text-[var(--text-muted)]">
                                                    {isOwned ? 'Purchased' : `${outfit.cost} ⭐ Stars`}
                                                </p>
                                            </div>
                                        </div>

                                        {isEquipped ? (
                                            <span className="px-3 py-1.5 bg-[#11428E]/10 border border-[#11428E]/25 text-[10px] font-black text-[#11428E] uppercase tracking-wider rounded-xl">
                                                Equipped
                                            </span>
                                        ) : isOwned ? (
                                            <button
                                                onClick={() => onEquipOutfit(outfit.key)}
                                                className="px-4.5 py-2.5 bg-[#11428E] hover:bg-[#0c316b] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
                                            >
                                                Equip
                                            </button>
                                        ) : (
                                            <button
                                                disabled={stars < outfit.cost}
                                                onClick={() => {
                                                    const success = onPurchaseOutfit(outfit.key, outfit.cost);
                                                    if (!success) {
                                                        // Fallback alert
                                                    }
                                                }}
                                                className="px-4.5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
                                            >
                                                Buy
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
