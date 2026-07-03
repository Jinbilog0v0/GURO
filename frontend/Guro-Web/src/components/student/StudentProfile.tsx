import React, { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, Mail, Key } from 'lucide-react';

interface StudentProfileProps {
    userName: string;
    email?: string;
    parentAccessCode?: string;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
    userName = 'Student',
    email,
    parentAccessCode,
}) => {
    const [isOpen, setIsOpen] = useState(false);
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
            {/* Profile trigger capsule */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-sm cursor-pointer z-30"
            >
                <div className="size-6 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner">
                    {userName ? userName.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="max-w-[100px] truncate">{userName}</span>
                <ChevronDown className={`size-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-[24px] shadow-2xl border border-zinc-100 p-5 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-[18px] flex items-center justify-center text-white shadow-md shrink-0">
                            <User className="size-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-extrabold text-zinc-800 truncate">
                                {userName}
                            </h4>
                            <p className="text-xs text-zinc-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                                <Mail className="size-3 text-zinc-300" />
                                <span className="truncate">{displayEmail}</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-100" />

                    {parentAccessCode && (
                        <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-100 rounded-2xl p-3">
                            <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                                <Key className="size-3.5 text-amber-500 shrink-0" />
                                Share with Parent
                            </p>
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                Show this code to your parent or guardian to let them track your progress.
                            </p>
                            <p className="text-center font-black text-base text-[#11428E] tracking-widest mt-0.5 select-all bg-white border border-amber-200 rounded-xl px-3 py-2">
                                {parentAccessCode}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
