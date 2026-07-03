import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, BarChart2, Wifi, WifiOff, Menu, X, GraduationCap, Sun, Moon, LogOut } from 'lucide-react';
import { StudentProfile } from './StudentProfile';

export type ShellView = 'dashboard' | 'lessons' | 'progress' | 'classroom';

interface StudentShellProps {
    userName: string;
    email?: string;
    selectedGrade: number;
    onGradeChange: (grade: number) => void;
    onLogout: () => void;
    isOnline: boolean;
    currentView: ShellView;
    onViewChange: (view: ShellView) => void;
    parentAccessCode?: string;
    children: React.ReactNode;
    isDarkMode: boolean;
    onToggleTheme: () => void;
}

const NAV_ITEMS: { view: ShellView; label: string; Icon: React.FC<any> }[] = [
    { view: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { view: 'lessons', label: 'Lessons', Icon: BookOpen },
    { view: 'progress', label: 'My Progress', Icon: BarChart2 },
    { view: 'classroom', label: 'Classroom', Icon: GraduationCap },
];

export const StudentShell: React.FC<StudentShellProps> = ({
    userName,
    email,
    selectedGrade,
    onLogout,
    isOnline,
    currentView,
    onViewChange,
    parentAccessCode,
    children,
    isDarkMode,
    onToggleTheme,
}) => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)]">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex flex-col w-56 fixed left-0 top-0 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] shadow-sm z-40">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border-color)]">
                    <div className="size-8 rounded-xl bg-gradient-to-br from-[#11428E] to-[#A01322] flex items-center justify-center">
                        <GraduationCap className="size-4 text-white" />
                    </div>
                    <span className="font-black text-base text-[var(--text-main)] tracking-tight">GURO</span>
                </div>

                {/* Nav items */}
                <nav className="flex flex-col gap-1 p-3 flex-1">
                    {NAV_ITEMS.map(({ view, label, Icon }) => {
                        const active = currentView === view;
                        return (
                            <button
                                key={view}
                                onClick={() => onViewChange(view)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                    active
                                        ? 'bg-[#11428E]/10 text-[#11428E] font-bold'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                                }`}
                            >
                                <Icon className={`size-4 ${active ? 'text-[#11428E]' : 'text-[var(--text-dark)]'}`} />
                                {label}
                                {active && <div className="ml-auto size-1.5 rounded-full bg-[#11428E]" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Logout button at bottom of sidebar */}
                <div className="p-3 border-t border-[var(--border-color)]">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-[#A01322] hover:bg-[#A01322]/10 transition-all cursor-pointer"
                    >
                        <LogOut className="size-4 text-[#A01322]" />
                        Log Out
                    </button>
                </div>
            </aside>

            {/* ── Main content area ── */}
            <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
                {/* Sticky top header */}
                <header className="sticky top-0 z-30 bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] px-4 md:px-6 h-14 flex items-center justify-between shadow-sm">
                    {/* Mobile: hamburger */}
                    <button
                        className="md:hidden flex items-center justify-center size-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-main)] transition cursor-pointer"
                        onClick={() => setMobileNavOpen((v) => !v)}
                    >
                        {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>

                    {/* Desktop: breadcrumb label */}
                    <span className="hidden md:block text-sm font-bold text-[var(--text-main)] capitalize">
                        {currentView === 'dashboard' ? `Welcome back, ${userName}!` : NAV_ITEMS.find(n => n.view === currentView)?.label}
                    </span>

                    {/* Right side */}
                    <div className="flex items-center gap-2.5 ml-auto">
                        {/* Online badge */}
                        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                            isOnline
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                        }`}>
                            {isOnline
                                ? <><Wifi className="size-3" /> Online</>
                                : <><WifiOff className="size-3" /> Offline</>
                            }
                        </div>

                        {/* Mobile grade badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold bg-[#11428E]/10 text-[#11428E] border-[#11428E]/20">
                            <div className="size-1.5 rounded-full bg-[#11428E]" />
                            G{selectedGrade}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={onToggleTheme}
                            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className="flex items-center justify-center bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full size-8 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-all shrink-0 shadow-sm"
                        >
                            {isDarkMode ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
                        </button>

                         <StudentProfile
                            userName={userName}
                            email={email}
                            parentAccessCode={parentAccessCode}
                        />
                    </div>
                </header>

                {/* Mobile slide-down nav */}
                {mobileNavOpen && (
                    <div className="md:hidden bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] shadow-sm px-3 py-2 flex flex-col gap-1 z-20">
                        {NAV_ITEMS.map(({ view, label, Icon }) => (
                            <button
                                key={view}
                                onClick={() => { onViewChange(view); setMobileNavOpen(false); }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                    currentView === view
                                        ? 'bg-[#11428E]/10 text-[#11428E] font-bold'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                                }`}
                            >
                                <Icon className="size-4" />
                                {label}
                            </button>
                        ))}
                        {/* Mobile Log Out */}
                        <button
                            onClick={() => { setMobileNavOpen(false); onLogout(); }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#A01322] hover:bg-[#A01322]/10 transition-all cursor-pointer border-t border-[var(--border-color)] mt-1 pt-3 w-full"
                        >
                            <LogOut className="size-4" />
                            Log Out
                        </button>
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};
