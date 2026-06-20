import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut, ChevronDown, Mail, Shield } from 'lucide-react';

interface UserProfileProps {
    currentUser: {
        name: string;
        email: string;
        role: string;
    } | null;
    onLogout: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
    currentUser,
    onLogout,
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

    const userName = currentUser?.name || 'Guest User';
    const userEmail = currentUser?.email || 'guest@guro.local';
    const userRole = currentUser?.role 
        ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)
        : 'Guest Explorer';

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Profile Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-white/4 border border-[var(--border-color)] rounded-md cursor-pointer text-xs font-semibold text-[var(--text-main)] transition-all duration-200 hover:bg-white/10"
            >
                <div className="size-5 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-md flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{userName}</span>
                <ChevronDown className={`size-3.5 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Card */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[var(--bg-card)] backdrop-blur-md rounded-[20px] shadow-2xl border border-[var(--border-color)] p-5 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-gradient-to-tr from-[#11428E] to-[#A01322] rounded-[14px] flex items-center justify-center text-white shadow-md shrink-0">
                            <User className="size-6" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h4 className="text-sm font-extrabold text-[var(--text-main)] truncate">
                                {userName}
                            </h4>
                            <p className="text-[11px] text-[var(--text-muted)] font-semibold truncate flex items-center gap-1 mt-0.5">
                                <Mail className="size-3 text-[var(--text-muted)]" />
                                <span className="truncate">{userEmail}</span>
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-semibold truncate flex items-center gap-1 mt-0.5">
                                <Shield className="size-3 text-[var(--text-muted)]" />
                                <span className="truncate">{userRole}</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-[var(--border-color)]" />

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onLogout();
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] font-bold text-xs transition-colors cursor-pointer"
                    >
                        <LogOut className="size-3.5" />
                        <span>Log Out</span>
                    </button>
                </div>
            )}
        </div>
    );
};
