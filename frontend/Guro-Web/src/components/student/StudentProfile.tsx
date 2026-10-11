import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, Mail, Key, Settings, Copy, Check } from 'lucide-react';
import { toast } from '../../utils/toast';

interface StudentProfileProps {
    userName: string;
    email?: string;
    parentAccessCode?: string;
    onOpenSettings?: () => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
    userName = 'Student',
    email,
    parentAccessCode,
    onOpenSettings,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayEmail = email || 'guest@guro.local';

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Profile trigger avatar icon/picture */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Account menu for ${userName}`}
                title={`Account menu (${userName})`}
                className="relative flex items-center justify-center size-9 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full shadow-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] hover:ring-2 hover:ring-[#11428E]/20 transition-all hover:scale-105 active:scale-95 cursor-pointer z-30"
            >
                <div className="size-7 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner">
                    {userName ? userName.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="sr-only">{userName}</span>
                <div className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-xs">
                    <ChevronDown className={`size-2 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)]/95 backdrop-blur-md rounded-[24px] shadow-2xl border border-[var(--border-color)] p-5 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-[18px] flex items-center justify-center text-white shadow-md shrink-0">
                            <User className="size-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-extrabold text-[var(--text-main)] truncate">
                                {userName}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] font-semibold truncate flex items-center gap-1 mt-0.5">
                                <Mail className="size-3 text-[var(--text-muted)]" />
                                <span className="truncate">{displayEmail}</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border-color)]" />

                    {onOpenSettings && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                onOpenSettings();
                            }}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors w-full cursor-pointer"
                        >
                            <Settings className="size-3.5 text-[var(--text-muted)]" />
                            <span>Learning & Settings</span>
                        </button>
                    )}

                    {parentAccessCode && (
                        <div className="flex flex-col gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 m-0">
                                    <Key className="size-3.5 text-amber-500 shrink-0" />
                                    Share with Parent
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(parentAccessCode);
                                        setCopied(true);
                                        toast.success('Parent Access Code copied to clipboard!');
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                                    title="Copy Access Code"
                                >
                                    {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5 text-amber-600 dark:text-amber-400" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed m-0">
                                Show this code to your parent or guardian to let them track your progress.
                            </p>
                            <p className="text-center font-black text-base text-[#11428E] dark:text-sky-300 tracking-widest mt-0.5 select-all bg-[var(--bg-main)] border border-amber-500/30 rounded-xl px-3 py-2 m-0">
                                {parentAccessCode}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
