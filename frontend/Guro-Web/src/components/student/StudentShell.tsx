import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, BarChart2, ChevronDown, Wifi, WifiOff, Menu, X, GraduationCap } from 'lucide-react';
import { StudentProfile } from './StudentProfile';

export type ShellView = 'dashboard' | 'lessons' | 'progress';

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
}

const GRADES = [4, 5, 6] as const;

const GRADE_COLORS: Record<number, { pill: string; dot: string }> = {
    4: { pill: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60', dot: 'bg-emerald-500' },
    5: { pill: 'bg-blue-500/10 text-blue-600 border-blue-200/60', dot: 'bg-blue-500' },
    6: { pill: 'bg-purple-500/10 text-purple-600 border-purple-200/60', dot: 'bg-purple-500' },
};

const NAV_ITEMS: { view: ShellView; label: string; Icon: React.FC<any> }[] = [
    { view: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { view: 'lessons', label: 'Lessons', Icon: BookOpen },
    { view: 'progress', label: 'My Progress', Icon: BarChart2 },
];

export const StudentShell: React.FC<StudentShellProps> = ({
    userName,
    email,
    selectedGrade,
    onGradeChange,
    onLogout,
    isOnline,
    currentView,
    onViewChange,
    parentAccessCode,
    children,
}) => {
    const [gradeOpen, setGradeOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const gradeStyle = GRADE_COLORS[selectedGrade] ?? GRADE_COLORS[4];

    return (
        <div className="min-h-screen flex bg-zinc-50">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex flex-col w-56 fixed left-0 top-0 h-full bg-white border-r border-zinc-100 shadow-sm z-40">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100">
                    <div className="size-8 rounded-xl bg-gradient-to-br from-[#11428E] to-[#A01322] flex items-center justify-center">
                        <GraduationCap className="size-4 text-white" />
                    </div>
                    <span className="font-black text-base text-zinc-800 tracking-tight">GURO</span>
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
                                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                                }`}
                            >
                                <Icon className={`size-4 ${active ? 'text-[#11428E]' : 'text-zinc-400'}`} />
                                {label}
                                {active && <div className="ml-auto size-1.5 rounded-full bg-[#11428E]" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar footer — grade selector */}
                <div className="p-3 border-t border-zinc-100">
                    <div className="relative">
                        <button
                            onClick={() => setGradeOpen((v) => !v)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${gradeStyle.pill}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${gradeStyle.dot}`} />
                                Grade {selectedGrade}
                            </div>
                            <ChevronDown className={`size-3.5 transition-transform ${gradeOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {gradeOpen && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-zinc-100 rounded-xl shadow-lg overflow-hidden z-50">
                                {GRADES.map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => { onGradeChange(g); setGradeOpen(false); }}
                                        className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
                                            selectedGrade === g
                                                ? 'bg-[#11428E]/8 text-[#11428E] font-bold'
                                                : 'text-zinc-600 hover:bg-zinc-50'
                                        }`}
                                    >
                                        <div className={`size-2 rounded-full ${GRADE_COLORS[g].dot}`} />
                                        Grade {g}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ── Main content area ── */}
            <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
                {/* Sticky top header */}
                <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-4 md:px-6 h-14 flex items-center justify-between shadow-sm">
                    {/* Mobile: hamburger */}
                    <button
                        className="md:hidden flex items-center justify-center size-8 rounded-lg text-zinc-500 hover:bg-zinc-100 transition cursor-pointer"
                        onClick={() => setMobileNavOpen((v) => !v)}
                    >
                        {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>

                    {/* Desktop: breadcrumb label */}
                    <span className="hidden md:block text-sm font-bold text-zinc-700 capitalize">
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

                        {/* Mobile grade pill */}
                        <div className={`md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${gradeStyle.pill}`}>
                            <div className={`size-1.5 rounded-full ${gradeStyle.dot}`} />
                            G{selectedGrade}
                        </div>

                        <StudentProfile
                            userName={userName}
                            email={email}
                            onLogout={onLogout}
                            parentAccessCode={parentAccessCode}
                        />
                    </div>
                </header>

                {/* Mobile slide-down nav */}
                {mobileNavOpen && (
                    <div className="md:hidden bg-white border-b border-zinc-100 shadow-sm px-3 py-2 flex flex-col gap-1 z-20">
                        {NAV_ITEMS.map(({ view, label, Icon }) => (
                            <button
                                key={view}
                                onClick={() => { onViewChange(view); setMobileNavOpen(false); }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                    currentView === view
                                        ? 'bg-[#11428E]/10 text-[#11428E] font-bold'
                                        : 'text-zinc-500 hover:bg-zinc-100'
                                }`}
                            >
                                <Icon className="size-4" />
                                {label}
                            </button>
                        ))}
                        <div className="flex gap-2 px-3 py-2">
                            {GRADES.map((g) => (
                                <button
                                    key={g}
                                    onClick={() => { onGradeChange(g); setMobileNavOpen(false); }}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                        selectedGrade === g
                                            ? `${gradeStyle.pill} border-current`
                                            : 'text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                                    }`}
                                >
                                    Grade {g}
                                </button>
                            ))}
                        </div>
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
