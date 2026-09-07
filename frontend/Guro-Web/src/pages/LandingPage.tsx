import React, { useState, useRef, useEffect } from 'react';
import { User, Users, ArrowLeft, Mail, Lock, Sparkles, BookOpen, Target, Smartphone, AlertCircle, Rocket, School, GraduationCap, Eye, EyeOff, Shield, KeyRound, Terminal, Sun, Moon, Upload, CheckCircle2, Clock, X } from 'lucide-react';
import { RoleCard, type RoleCardProps } from '../components/landing/RoleCard';
import { FeatureCard, type FeatureCardProps } from '../components/landing/FeatureCard';
import { setAuthToken } from '../utils/api';
import { toast } from '../utils/toast';

// ─── Logo ────────────────────────────────────────────────────────────────────

const GuroLogoGraphic: React.FC<{ size?: 'sm' | 'md' | 'lg'; onClick?: () => void }> = ({ size = 'md', onClick }) => {
    const dimensions = size === 'lg' ? 'size-20' : size === 'sm' ? 'size-12' : 'size-16';
    const iconSize = size === 'lg' ? 'size-11' : size === 'sm' ? 'size-6' : 'size-9';
    return (
        <div 
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
            aria-label="GURO Logo"
            className={`relative flex ${dimensions} items-center justify-center rounded-3xl bg-gradient-to-tr from-[#11428E] via-[#2563EB] to-[#A01322] text-white shadow-xl shadow-[#11428E]/25 border border-white/30 transform hover:scale-105 active:scale-95 transition-all duration-300 ${onClick ? 'cursor-pointer select-none' : ''}`}
        >
            <GraduationCap className={iconSize} strokeWidth={2.3} />
            <span className="absolute -top-1.5 -right-1.5 text-xs text-amber-300 animate-pulse">✦</span>
        </div>
    );
};

// ─── Types ───────────────────────────────────────────────────────────────────
 
interface LandingPageProps {
    onSelectRole: (role: 'student' | 'teacher' | 'parent' | 'lesson-builder', grade?: number) => void;
    onLoginSuccess: (user: { userId: string; email: string; name: string; role: string; classroomId?: string | null }) => void;
    isDarkMode?: boolean;
    onToggleTheme?: () => void;
}

type ViewType = 'login' | 'register' | 'guest-roles';

// ─── Component ───────────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, onLoginSuccess, isDarkMode = false, onToggleTheme }) => {
    const [view, setView] = useState<ViewType>('login');
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [adminSecretKey, setAdminSecretKey] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [schoolIdNumber, setSchoolIdNumber] = useState('');
    const [idDocument, setIdDocument] = useState<string | null>(null);
    const [idDocumentName, setIdDocumentName] = useState('');
    const [roleSelection, setRoleSelection] = useState('teacher');
    const [loginRole, setLoginRole] = useState<'student' | 'teacher' | 'parent'>('teacher');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');
    const [pendingNotice, setPendingNotice] = useState<string | null>(null);

    // Secret 5-tap gesture on logo to toggle Admin Mode
    const clickCountRef = useRef(0);
    const logoTimerRef = useRef<any>(null);

    const handleLogoClick = () => {
        if (logoTimerRef.current) clearTimeout(logoTimerRef.current);
        clickCountRef.current += 1;
        if (clickCountRef.current >= 5) {
            clickCountRef.current = 0;
            setIsAdminMode((prev) => {
                const nextMode = !prev;
                if (nextMode) toast.success('Staff & IT Console unlocked.');
                else toast('Returned to standard portal.');
                return nextMode;
            });
            setAuthError('');
        } else {
            logoTimerRef.current = setTimeout(() => {
                clickCountRef.current = 0;
            }, 2500);
        }
    };

    // Keyboard shortcut for IT Staff (Ctrl+Shift+A or Alt+A)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
                e.preventDefault();
                setIsAdminMode((prev) => {
                    const nextMode = !prev;
                    if (nextMode) toast.success('Staff & IT Console unlocked.');
                    else toast('Returned to standard portal.');
                    return nextMode;
                });
                setAuthError('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Inline field validation errors
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; firstName?: string; lastName?: string }>({});

    const validateEmail = (val: string) => !val.includes('@') || val.length < 5 ? 'Enter a valid email address.' : '';
    const validatePassword = (val: string) => {
        if (val.length < 8) return 'Password must be at least 8 characters.';
        if (!/[a-zA-Z]/.test(val)) return 'Password must include at least one letter.';
        if (!/\d/.test(val)) return 'Password must include at least one number.';
        if (!/[\W_]/.test(val)) return 'Password must include at least one special symbol (e.g. !@#$%^&*).';
        return '';
    };
    const validateFirstName = (val: string) => val.trim().length < 2 ? 'First name is required.' : '';
    const validateLastName = (val: string) => val.trim().length < 2 ? 'Last name is required.' : '';

    const handleFieldBlur = (field: 'email' | 'password' | 'firstName' | 'lastName', val: string) => {
        const error = field === 'email' ? validateEmail(val) : field === 'password' ? validatePassword(val) : field === 'firstName' ? validateFirstName(val) : validateLastName(val);
        setFieldErrors((prev) => ({ ...prev, [field]: error }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        setIsSubmitting(true);
        setAuthError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password,
                    role: isAdminMode ? 'admin' : loginRole
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const userRole = (data.user?.role || '').toLowerCase();
                if (data.token) setAuthToken(data.token);
                if (userRole === 'student') {
                    let resolvedGrade = data.user?.grade_level || 4;
                    if (data.user?.classroomId) {
                        const m = data.user.classroomId.match(/-G([4-6])-/i);
                        if (m) resolvedGrade = parseInt(m[1], 10);
                    }
                    localStorage.setItem('guro_student_grade', String(resolvedGrade));
                } else if (userRole === 'teacher') {
                    localStorage.removeItem('guro_teacher_classroom_code');
                    localStorage.removeItem('guro_teacher_classroom_history');
                }
                setPendingNotice(null);
                onLoginSuccess(data.user);
            } else {
                const err = await res.json().catch(() => ({}));
                setAuthError(err.error || 'Authentication failed.');
            }
        } catch {
            setAuthError('Connection error. Is the server running?');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit. Please upload a smaller document.');
            return;
        }
        setIdDocumentName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            setIdDocument(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) return;
        if (isAdminMode && !adminSecretKey.trim()) {
            setAuthError('Admin security passkey is required.');
            return;
        }
        if (!isAdminMode && roleSelection === 'teacher') {
            if (!schoolName.trim()) {
                setAuthError('School / Institution name is required for teacher registration.');
                return;
            }
            if (!schoolIdNumber.trim()) {
                setAuthError('DepEd School ID or PRC License number is required.');
                return;
            }
            if (!idDocument) {
                setAuthError('Please upload a copy of your DepEd School ID or PRC License.');
                return;
            }
        }
        setIsSubmitting(true);
        setAuthError('');
        try {
            const effectiveRole = isAdminMode ? 'developer' : roleSelection;
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                    first_name: firstName.trim(),
                    middle_name: middleName.trim(),
                    last_name: lastName.trim(),
                    role: effectiveRole,
                    admin_secret: isAdminMode ? adminSecretKey.trim() : undefined,
                    school_name: roleSelection === 'teacher' ? schoolName.trim() : undefined,
                    school_id_number: roleSelection === 'teacher' ? schoolIdNumber.trim() : undefined,
                    id_document: roleSelection === 'teacher' ? idDocument : undefined,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                
                // If this is a teacher account, they must wait for admin verification
                if (data.pendingVerification || data.user?.verificationStatus === 'pending' || effectiveRole === 'teacher') {
                    setView('login');
                    setLoginRole('teacher');
                    setPendingNotice('Teacher registration submitted! Your institutional credentials are now pending System Admin verification. Please wait for admin approval before logging in.');
                    toast.success('Registration submitted! Please wait for admin approval before signing in.', { duration: 6000 });
                    setPassword('');
                    setFirstName('');
                    setMiddleName('');
                    setLastName('');
                    setSchoolName('');
                    setSchoolIdNumber('');
                    setIdDocument(null);
                    setIdDocumentName('');
                    return;
                }

                if (data.token) setAuthToken(data.token);
                onLoginSuccess(data.user);
            } else {
                const err = await res.json().catch(() => ({}));
                setAuthError(err.error || 'Registration failed.');
            }
        } catch {
            setAuthError('Connection error. Is the server running?');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Data ──────────────────────────────────────────────────────────────────

    const guestCards: (RoleCardProps & { key: string; onClick: () => void })[] = [
        {
            key: 'student-4',
            role: 'Grade 4 Student',
            description: 'Learn Grade 4 Math & English',
            Icon: GraduationCap,
            bgColor: 'bg-emerald-600',
            onClick: () => {
                localStorage.setItem('guro_student_grade', '4');
                onSelectRole('student', 4);
            }
        },
        {
            key: 'student-5',
            role: 'Grade 5 Student',
            description: 'Learn Grade 5 Math & English',
            Icon: GraduationCap,
            bgColor: 'bg-blue-600',
            onClick: () => {
                localStorage.setItem('guro_student_grade', '5');
                onSelectRole('student', 5);
            }
        },
        {
            key: 'student-6',
            role: 'Grade 6 Student',
            description: 'Learn Grade 6 Math & English',
            Icon: GraduationCap,
            bgColor: 'bg-purple-600',
            onClick: () => {
                localStorage.setItem('guro_student_grade', '6');
                onSelectRole('student', 6);
            }
        },
        {
            key: 'teacher',
            role: 'Teacher',
            description: 'Monitor student progress & performance',
            Icon: School,
            bgColor: 'bg-[#A01322]',
            onClick: () => onSelectRole('teacher')
        },
        {
            key: 'parent',
            role: 'Parent',
            description: "Track your child's learning journey",
            Icon: Users,
            bgColor: 'bg-[#F59E0B]',
            onClick: () => onSelectRole('parent')
        },
    ];

    const featureCards: FeatureCardProps[] = [
        {
            label: 'DepEd MELC Aligned',
            description: 'Grade 4–6 Math & English curriculum standards',
            badge: 'Official Standards',
            Icon: BookOpen,
            gradient: 'from-[#11428E] to-blue-600',
        },
        {
            label: 'Adaptive Learning',
            description: 'Predictive score analysis & quick refresher checks',
            badge: 'AI Diagnostic',
            Icon: Target,
            gradient: 'from-purple-600 to-indigo-600',
        },
        {
            label: 'Works 100% Offline',
            description: 'Learn anywhere, zero internet required',
            badge: 'Offline Mode',
            Icon: Smartphone,
            gradient: 'from-emerald-600 to-teal-600',
        },
    ];

    // ── Shared sub-components ─────────────────────────────────────────────────

    const Brand = () => (
        <div className="flex flex-col items-center gap-1 text-center">
            <GuroLogoGraphic onClick={handleLogoClick} />
            <h1 className="text-5xl font-extrabold tracking-tight text-[#11428E] mt-1">GURO</h1>
            <p className="text-base font-semibold text-[#A01322]">GUIDED UNIFIED RESOURCE OPTIMIZATION</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Your Learning Companion for Math &amp; English</p>
        </div>
    );

    // ── Input field helper ────────────────────────────────────────────────────

    const inputCls = "w-full pl-10 pr-4 py-3 bg-[var(--bg-main)]/60 border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dark)] text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 transition-all";
    const inputErrCls = "w-full pl-10 pr-4 py-3 bg-[var(--bg-main)]/60 border border-[#A01322] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dark)] text-sm focus:outline-none focus:border-[#A01322] focus:ring-2 focus:ring-[#A01322]/20 transition-all";
    const passwordInputCls = "w-full pl-10 pr-10 py-3 bg-[var(--bg-main)]/60 border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dark)] text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 transition-all";
    const passwordInputErrCls = "w-full pl-10 pr-10 py-3 bg-[var(--bg-main)]/60 border border-[#A01322] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dark)] text-sm focus:outline-none focus:border-[#A01322] focus:ring-2 focus:ring-[#A01322]/20 transition-all";
    const labelCls = "text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider";

    const pageStyle: React.CSSProperties = {
        background: isDarkMode 
            ? 'linear-gradient(160deg, #060913 0%, #0a1122 50%, #150913 100%)' 
            : 'linear-gradient(160deg, #eef3fb 0%, #fcf2f2 100%)',
    };

    // ── Views ─────────────────────────────────────────────────────────────────

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden select-none"
            style={pageStyle}
        >
            {/* ── Theme Toggle floating button ── */}
            {onToggleTheme && (
                <div className="absolute top-6 right-6 md:top-8 md:right-8 z-30">
                    <button
                        type="button"
                        onClick={onToggleTheme}
                        aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        className="p-2.5 rounded-2xl glass-panel border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-[#11428E]" />}
                    </button>
                </div>
            )}

            {/* ── Guest role top nav ── */}
            {view === 'guest-roles' && (
                <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 flex items-center justify-between z-20">
                    <button
                        onClick={() => setView('login')}
                        className="flex items-center gap-2 px-4 py-2 glass-panel border border-[var(--border-color)] rounded-full shadow-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all font-semibold text-xs cursor-pointer"
                    >
                        <ArrowLeft className="size-3 text-[var(--text-muted)]" strokeWidth={2.5} />
                        Back to sign in
                    </button>
                    <div className="px-3 py-1.5 bg-[#11428E]/10 border border-[#11428E]/20 rounded-full text-[#3b82f6] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="size-3" /> Guest session
                    </div>
                </div>
            )}

            <div className="flex w-full max-w-5xl flex-col items-center gap-10 relative z-10">

                <Brand />

                {/* ── Login ── */}
                {view === 'login' && (
                    <div className={`w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl flex flex-col gap-6 border transition-all duration-300 ${isAdminMode ? 'border-[#CE1126]/40 ring-2 ring-[#CE1126]/20' : 'border-[var(--border-color)]'}`}>
                        <div className="flex flex-col items-center justify-center text-center w-full">
                            <div className="w-full text-center">
                                {isAdminMode ? (
                                    <div className="flex flex-col items-center gap-1 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-[#CE1126] font-bold text-xs uppercase tracking-wider">
                                            <Shield className="size-4" />
                                            <span>Staff &amp; IT Console</span>
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">System Authorization</h2>
                                        <p className="text-xs text-[var(--text-muted)]">Authenticate for developer &amp; admin controls</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Welcome back</h2>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">Sign in to sync your classroom progress</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {pendingNotice && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                                <Clock className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-extrabold text-amber-800 dark:text-amber-200 mb-0.5">Verification in Progress</h4>
                                    <p>{pendingNotice}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPendingNotice(null)}
                                    className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-0.5 cursor-pointer"
                                    aria-label="Dismiss notice"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        {authError && (
                            <div className="bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <AlertCircle className="size-4" /> {authError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            {/* Role selection for Sign In */}
                            {isAdminMode ? (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="size-4 text-emerald-400" />
                                        <span>Administrator / Developer Mode</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsAdminMode(false)}
                                        className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
                                    >
                                        Standard Mode
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls}>Specify Role</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['teacher', 'student', 'parent'] as const).map((r) => {
                                            const active = loginRole === r;
                                            const IconComponent = r === 'teacher' ? School : r === 'student' ? GraduationCap : Users;
                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => { setLoginRole(r); setAuthError(''); }}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                                        active
                                                            ? 'bg-[#11428E]/20 border-[#11428E] text-[#3b82f6]'
                                                            : 'bg-[var(--bg-main)]/50 border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                                                    }`}
                                                >
                                                    <IconComponent size={14} className={active ? 'text-[#3b82f6]' : 'text-[var(--text-dark)]'} />
                                                    <span>{r}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="login-email">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder={isAdminMode ? "admin@guro.dev" : "you@school.edu"}
                                        className={fieldErrors.email ? inputErrCls : inputCls}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                                        onBlur={(e) => handleFieldBlur('email', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.email ? 'login-email-err' : undefined}
                                    />
                                </div>
                                {fieldErrors.email && <p id="login-email-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.email}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="login-password">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={fieldErrors.password ? passwordInputErrCls : passwordInputCls}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.password ? 'login-pw-err' : undefined}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dark)] hover:text-[var(--text-main)] focus:outline-none flex items-center justify-center p-1 rounded-md hover:bg-[var(--bg-main)] transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {fieldErrors.password && <p id="login-pw-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-[#11428E]/25 transition-all disabled:opacity-60 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                                style={{
                                    background: isAdminMode 
                                        ? 'linear-gradient(135deg, #0F172A 0%, #CE1126 100%)' 
                                        : 'linear-gradient(135deg, #11428E 0%, #A01322 100%)'
                                }}
                            >
                                {isSubmitting ? 'Authenticating…' : isAdminMode ? 'Authenticate as Admin' : 'Sign in'}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-3">
                            <button
                                 onClick={() => setView('register')}
                                 className="text-xs font-bold text-[#3b82f6] hover:text-[#2563eb] cursor-pointer"
                            >
                                Need an account? Create one here
                            </button>
                            <div className="w-full flex items-center gap-3">
                                <div className="flex-1 h-px bg-[var(--border-color)]" />
                                <span className="text-[10px] font-bold text-[var(--text-dark)] uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-[var(--border-color)]" />
                            </div>
                            <button
                                onClick={() => setView('guest-roles')}
                                className="w-full flex items-center justify-center gap-2 border border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-main)] font-semibold py-3 rounded-xl transition-all text-sm cursor-pointer shadow-sm"
                            >
                                 <Rocket className="size-4 text-[#3b82f6]" /> Continue as guest / try demo
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Register ── */}
                {view === 'register' && (
                    <div className={`w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl flex flex-col gap-6 border transition-all duration-300 ${isAdminMode ? 'border-[#CE1126]/40 ring-2 ring-[#CE1126]/20' : 'border-[var(--border-color)]'}`}>
                        <div className="flex flex-col items-center justify-center text-center w-full">
                            <div className="w-full text-center">
                                {isAdminMode ? (
                                    <div className="flex flex-col items-center gap-1 text-center">
                                        <div className="flex items-center justify-center gap-1.5 text-[#CE1126] font-bold text-xs uppercase tracking-wider">
                                            <KeyRound className="size-4" />
                                            <span>Staff Passkey Required</span>
                                        </div>
                                        <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Register System Admin</h2>
                                        <p className="text-xs text-[var(--text-muted)]">Authorized personnel registration with security key</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <h2 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">Create account</h2>
                                        <p className="text-sm text-[var(--text-muted)] mt-1">Register to start managing classes and tracking logs</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {authError && (
                            <div className="bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <AlertCircle className="size-4" /> {authError}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls} htmlFor="reg-first-name">First name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                        <input
                                            id="reg-first-name"
                                            type="text"
                                            placeholder="e.g. Maria"
                                            className={fieldErrors.firstName ? inputErrCls : inputCls}
                                            value={firstName}
                                            onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, firstName: '' })); }}
                                            onBlur={(e) => handleFieldBlur('firstName', e.target.value)}
                                            required
                                            aria-describedby={fieldErrors.firstName ? 'reg-first-name-err' : undefined}
                                        />
                                    </div>
                                    {fieldErrors.firstName && <p id="reg-first-name-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.firstName}</p>}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls} htmlFor="reg-last-name">Last name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                        <input
                                            id="reg-last-name"
                                            type="text"
                                            placeholder="e.g. Santos"
                                            className={fieldErrors.lastName ? inputErrCls : inputCls}
                                            value={lastName}
                                            onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, lastName: '' })); }}
                                            onBlur={(e) => handleFieldBlur('lastName', e.target.value)}
                                            required
                                            aria-describedby={fieldErrors.lastName ? 'reg-last-name-err' : undefined}
                                        />
                                    </div>
                                    {fieldErrors.lastName && <p id="reg-last-name-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.lastName}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="reg-middle-name">Middle name (Optional)</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                    <input
                                        id="reg-middle-name"
                                        type="text"
                                        placeholder="e.g. Dela Cruz"
                                        className={inputCls}
                                        value={middleName}
                                        onChange={(e) => setMiddleName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="reg-email">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                    <input
                                        id="reg-email"
                                        type="email"
                                        placeholder={isAdminMode ? "admin@guro.dev" : "you@school.edu"}
                                        className={fieldErrors.email ? inputErrCls : inputCls}
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                                        onBlur={(e) => handleFieldBlur('email', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.email ? 'reg-email-err' : undefined}
                                    />
                                </div>
                                {fieldErrors.email && <p id="reg-email-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.email}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="reg-password">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" aria-hidden="true" />
                                    <input
                                        id="reg-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 chars (letters, numbers, symbols)"
                                        className={fieldErrors.password ? passwordInputErrCls : passwordInputCls}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.password ? 'reg-pw-err' : undefined}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dark)] hover:text-[var(--text-main)] focus:outline-none flex items-center justify-center p-1 rounded-md hover:bg-[var(--bg-main)] transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {fieldErrors.password && <p id="reg-pw-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.password}</p>}
                                {password.length > 0 && !fieldErrors.password && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password) && (
                                    <p className="text-[11px] text-[var(--text-dark)] pl-1">Requires letters, numbers, and at least 1 symbol (e.g. !@#$%)</p>
                                )}
                            </div>

                            {/* Role selection vs Admin Passkey */}
                            {isAdminMode ? (
                                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className={labelCls} htmlFor="reg-admin-secret">Admin Security Passkey</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#CE1126]" aria-hidden="true" />
                                        <input
                                            id="reg-admin-secret"
                                            type="password"
                                            placeholder="System security passkey..."
                                            className="w-full pl-10 pr-4 py-3 bg-red-950/20 border border-[#CE1126]/30 rounded-xl text-[var(--text-main)] placeholder-[var(--text-dark)] text-sm focus:outline-none focus:border-[#CE1126] focus:ring-2 focus:ring-[#CE1126]/20 transition-all font-mono"
                                            value={adminSecretKey}
                                            onChange={(e) => setAdminSecretKey(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] pl-1">Authorized key defined in server environment configuration.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelCls}>Account role</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['teacher', 'parent'] as const).map((r) => {
                                            const active = roleSelection === r;
                                            const IconComponent = r === 'teacher' ? School : Users;
                                            return (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => { setRoleSelection(r); setAuthError(''); }}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                                        active
                                                            ? 'bg-[#11428E]/20 border-[#11428E] text-[#3b82f6]'
                                                            : 'bg-[var(--bg-main)]/50 border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]'
                                                    }`}
                                                >
                                                    <IconComponent size={14} className={active ? 'text-[#3b82f6]' : 'text-[var(--text-dark)]'} />
                                                    <span>{r}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Teacher Verification Institutional Inputs */}
                            {roleSelection === 'teacher' && !isAdminMode && (
                                <div className="flex flex-col gap-3 p-3.5 bg-[var(--bg-main)]/50 border border-[var(--border-color)] rounded-2xl animate-in fade-in duration-200">
                                    <div className="flex items-center gap-2">
                                        <School className="size-4 text-[#11428E]" />
                                        <span className="text-xs font-bold text-[var(--text-main)]">Teacher Identity &amp; School Verification</span>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className={labelCls} htmlFor="reg-school-name">School / Institution Name</label>
                                        <input
                                            id="reg-school-name"
                                            type="text"
                                            placeholder="e.g. Manila Science Elementary School"
                                            className={inputCls}
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className={labelCls} htmlFor="reg-school-id">School ID / PRC License Number</label>
                                        <input
                                            id="reg-school-id"
                                            type="text"
                                            placeholder="e.g. DepEd ID 109283 / PRC 0928341"
                                            className={inputCls}
                                            value={schoolIdNumber}
                                            onChange={(e) => setSchoolIdNumber(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className={labelCls}>Upload DepEd ID / PRC Credential Document</label>
                                        <div className="relative border border-dashed border-[var(--border-color)] hover:border-[#11428E] rounded-xl p-3 text-center bg-[var(--bg-card)] transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={handleDocumentChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required={!idDocument}
                                            />
                                            {idDocument ? (
                                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
                                                    <CheckCircle2 size={16} />
                                                    <span className="truncate max-w-[200px]">{idDocumentName || 'Document Attached'}</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">(Click to replace)</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]">
                                                    <Upload size={16} className="text-[#11428E]" />
                                                    <span className="text-xs font-semibold">Select image or PDF (DepEd / School ID)</span>
                                                    <span className="text-[10px] text-[var(--text-dark)]">Max file size: 5MB</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-[var(--text-dark)] mt-0.5">
                                            To protect learners (DO 40, s. 2012), new teacher accounts are approved by school administrators before live classroom pairing.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-[#11428E]/25 transition-all disabled:opacity-60 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                                style={{
                                    background: isAdminMode 
                                        ? 'linear-gradient(135deg, #0F172A 0%, #CE1126 100%)' 
                                        : 'linear-gradient(135deg, #11428E 0%, #A01322 100%)'
                                }}
                            >
                                {isSubmitting ? 'Creating account…' : isAdminMode ? 'Register System Admin' : 'Create account'}
                            </button>
                        </form>

                        <button
                            onClick={() => setView('login')}
                            className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] text-center cursor-pointer"
                        >
                            Already have an account? Sign in here
                        </button>
                    </div>
                )}

                {/* ── Guest role picker ── */}
                {view === 'guest-roles' && (
                    <div className="flex flex-col items-center gap-8 w-full mt-4">
                        <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 px-2 justify-center">
                            {guestCards.map((card) => (
                                <RoleCard
                                    key={card.key}
                                    role={card.role}
                                    description={card.description}
                                    Icon={card.Icon}
                                    bgColor={card.bgColor}
                                    onClick={card.onClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Feature strip ── */}
                {view !== 'guest-roles' && (
                    <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mt-4 px-2">
                        {featureCards.map((card) => (
                            <FeatureCard key={card.label} {...card} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};