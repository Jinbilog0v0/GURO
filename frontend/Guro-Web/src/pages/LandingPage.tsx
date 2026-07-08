import React, { useState } from 'react';
import { User, Users, ArrowLeft, Mail, Lock, Sparkles, BookOpen, Target, Smartphone, AlertCircle, Rocket, School, GraduationCap } from 'lucide-react';
import { RoleCard, type RoleCardProps } from '../components/landing/RoleCard';
import { FeatureCard, type FeatureCardProps } from '../components/landing/FeatureCard';
import { setAuthToken } from '../utils/api';

// ─── Logo ────────────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────
 
interface LandingPageProps {
    onSelectRole: (role: 'student' | 'teacher' | 'parent' | 'lesson-builder', grade?: number) => void;
    onLoginSuccess: (user: { userId: string; email: string; name: string; role: string; classroomId?: string | null }) => void;
}

type ViewType = 'login' | 'register' | 'guest-roles';

// ─── Shared page background ───────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, #eef3fb 0%, #fcf2f2 100%)',
};

// ─── Component ───────────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, onLoginSuccess }) => {
    const [view, setView] = useState<ViewType>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleSelection, setRoleSelection] = useState('teacher');
    const [loginRole, setLoginRole] = useState<'student' | 'teacher' | 'parent'>('teacher');
    const [loginGrade, setLoginGrade] = useState<number>(4);
    const [registerGrade, setRegisterGrade] = useState<number>(4);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');

    // Inline field validation errors
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; name?: string }>({});

    const validateEmail = (val: string) => !val.includes('@') || val.length < 5 ? 'Enter a valid email address.' : '';
    const validatePassword = (val: string) => val.length < 6 ? 'Password must be at least 6 characters.' : '';
    const validateName = (val: string) => val.trim().length < 2 ? 'Full name is required.' : '';

    const handleFieldBlur = (field: 'email' | 'password' | 'name', val: string) => {
        const error = field === 'email' ? validateEmail(val) : field === 'password' ? validatePassword(val) : validateName(val);
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
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user.role.toLowerCase() !== loginRole.toLowerCase()) {
                    setAuthError(`Role Mismatch: This account is registered as a ${data.user.role}, not a ${loginRole}.`);
                } else {
                    if (data.token) setAuthToken(data.token);
                    if (loginRole === 'student') {
                        localStorage.setItem('guro_student_grade', String(loginGrade));
                    }
                    onLoginSuccess(data.user);
                }
            } else {
                const err = await res.json();
                setAuthError(err.error || 'Authentication failed.');
            }
        } catch {
            setAuthError('Connection error. Is the server running?');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim() || !name.trim()) return;
        setIsSubmitting(true);
        setAuthError('');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, role: roleSelection }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) setAuthToken(data.token);
                if (roleSelection === 'student') {
                    localStorage.setItem('guro_student_grade', String(registerGrade));
                }
                onLoginSuccess(data.user);
            } else {
                const err = await res.json();
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
        { label: 'DepEd MELC Aligned', Icon: BookOpen },
        { label: 'Adaptive Learning', Icon: Target },
        { label: 'Works Offline', Icon: Smartphone },
    ];

    // ── Shared sub-components ─────────────────────────────────────────────────

    const Brand = () => (
        <div className="flex flex-col items-center gap-1 text-center">
            <GuroLogoGraphic />
            <h1 className="text-5xl font-extrabold tracking-tight text-[#11428E] mt-1">GURO</h1>
            <p className="text-base font-semibold text-[#A01322]">Guided Unified Remote Online</p>
            <p className="text-sm text-slate-400 mt-0.5">Your Learning Companion for Math &amp; English</p>
        </div>
    );

    // ── Input field helper ────────────────────────────────────────────────────

    const inputCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 focus:bg-white transition-all";
    const inputErrCls = "w-full pl-10 pr-4 py-3 bg-slate-50 border border-[#A01322] rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#A01322] focus:ring-2 focus:ring-[#A01322]/20 focus:bg-white transition-all";
    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider";

    // ── Views ─────────────────────────────────────────────────────────────────

    return (
        <div
            className="min-h-screen w-full flex flex-col items-center justify-center p-8 relative overflow-hidden select-none"
            style={pageStyle}
        >

            {/* ── Guest role top nav ── */}
            {view === 'guest-roles' && (
                <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 flex items-center justify-between z-20">
                    <button
                        onClick={() => setView('login')}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm text-slate-600 hover:bg-slate-50 transition-all font-semibold text-xs cursor-pointer"
                    >
                        <ArrowLeft className="size-3 text-slate-400" strokeWidth={2.5} />
                        Back to sign in
                    </button>
                    <div className="px-3 py-1.5 bg-[#11428E]/10 border border-[#11428E]/20 rounded-full text-[#11428E] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="size-3" /> Guest session
                    </div>
                </div>
            )}

            <div className="flex w-full max-w-5xl flex-col items-center gap-10 relative z-10">

                <Brand />

                {/* ── Login ── */}
                {view === 'login' && (
                    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-[rgba(17,66,142,0.08)] flex flex-col gap-6 border border-slate-100/80">
                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Welcome back</h2>
                            <p className="text-sm text-slate-400 mt-1">Sign in to sync your classroom progress</p>
                        </div>

                        {authError && (
                            <div className="bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <AlertCircle className="size-4" /> {authError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            {/* Role selection for Sign In */}
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
                                                        ? 'bg-[#11428E]/10 border-[#11428E] text-[#11428E]'
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <IconComponent size={14} className={active ? 'text-[#11428E]' : 'text-slate-400'} />
                                                <span>{r}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grade level selection for student role */}
                            {loginRole === 'student' && (
                                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className={labelCls}>Specify Grade Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[4, 5, 6].map((g) => {
                                            const active = loginGrade === g;
                                            return (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setLoginGrade(g)}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                        active
                                                            ? 'bg-[#11428E]/10 border-[#11428E] text-[#11428E]'
                                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    Grade {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="login-email">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@school.edu"
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
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        className={fieldErrors.password ? inputErrCls : inputCls}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.password ? 'login-pw-err' : undefined}
                                    />
                                </div>
                                {fieldErrors.password && <p id="login-pw-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-[#11428E]/25 transition-all disabled:opacity-60 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                                style={{ background: 'linear-gradient(135deg, #11428E 0%, #A01322 100%)' }}
                            >
                                {isSubmitting ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>

                        <div className="flex flex-col items-center gap-3">
                            <button
                                 onClick={() => setView('register')}
                                 className="text-xs font-bold text-[#11428E] hover:text-[#11428E]/80 cursor-pointer"
                            >
                                Need an account? Create one here
                            </button>
                            <div className="w-full flex items-center gap-3">
                                <div className="flex-1 h-px bg-slate-100" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-slate-100" />
                            </div>
                            <button
                                onClick={() => setView('guest-roles')}
                                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-all text-sm cursor-pointer"
                            >
                                 <Rocket className="size-4 text-[#11428E]" /> Continue as guest / try demo
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Register ── */}
                {view === 'register' && (
                    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-[rgba(17,66,142,0.08)] flex flex-col gap-6 border border-slate-100/80">
                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Create account</h2>
                            <p className="text-sm text-slate-400 mt-1">Register to start managing classes and tracking logs</p>
                        </div>

                        {authError && (
                            <div className="bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                                <AlertCircle className="size-4" /> {authError}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="reg-name">Full name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="reg-name"
                                        type="text"
                                        placeholder="Teacher Maria / Juan Dela Cruz"
                                        className={fieldErrors.name ? inputErrCls : inputCls}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
                                        onBlur={(e) => handleFieldBlur('name', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.name ? 'reg-name-err' : undefined}
                                    />
                                </div>
                                {fieldErrors.name && <p id="reg-name-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls} htmlFor="reg-email">Email address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="reg-email"
                                        type="email"
                                        placeholder="you@school.edu"
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
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" aria-hidden="true" />
                                    <input
                                        id="reg-password"
                                        type="password"
                                        placeholder="Minimum 6 characters"
                                        className={fieldErrors.password ? inputErrCls : inputCls}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                                        required
                                        aria-describedby={fieldErrors.password ? 'reg-pw-err' : undefined}
                                    />
                                </div>
                                {fieldErrors.password && <p id="reg-pw-err" className="text-[11px] text-[#A01322] font-semibold pl-1">{fieldErrors.password}</p>}
                                {password.length > 0 && password.length < 6 && !fieldErrors.password && (
                                    <p className="text-[11px] text-slate-400 pl-1">{password.length}/6 characters minimum</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={labelCls}>Account role</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['teacher', 'student', 'parent'] as const).map((r) => {
                                        const active = roleSelection === r;
                                        const IconComponent = r === 'teacher' ? School : r === 'student' ? GraduationCap : Users;
                                        return (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => { setRoleSelection(r); setAuthError(''); }}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                                                    active
                                                        ? 'bg-[#11428E]/10 border-[#11428E] text-[#11428E]'
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                }`}
                                            >
                                                <IconComponent size={14} className={active ? 'text-[#11428E]' : 'text-slate-400'} />
                                                <span>{r}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Grade level selection for student role during registration */}
                            {roleSelection === 'student' && (
                                <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className={labelCls}>Specify Grade Level</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[4, 5, 6].map((g) => {
                                            const active = registerGrade === g;
                                            return (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setRegisterGrade(g)}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                                        active
                                                            ? 'bg-[#11428E]/10 border-[#11428E] text-[#11428E]'
                                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    Grade {g}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide shadow-lg shadow-[#11428E]/25 transition-all disabled:opacity-60 cursor-pointer hover:opacity-90 active:scale-[0.99]"
                                style={{ background: 'linear-gradient(135deg, #11428E 0%, #A01322 100%)' }}
                            >
                                {isSubmitting ? 'Creating account…' : 'Create account'}
                            </button>
                        </form>

                        <button
                            onClick={() => setView('login')}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 text-center cursor-pointer"
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
                    <div className="grid w-full grid-cols-3 gap-4 max-w-lg mt-2">
                        {featureCards.map((card) => (
                            <FeatureCard key={card.label} {...card} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};