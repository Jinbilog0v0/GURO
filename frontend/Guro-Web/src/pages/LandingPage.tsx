import React, { useState, useRef, useEffect } from 'react';
import { User, Users, ArrowLeft, Mail, Lock, Sparkles, BookOpen, Target, Smartphone, AlertCircle, Rocket, School, GraduationCap, Eye, EyeOff, Shield, ShieldCheck, KeyRound, Terminal, Sun, Moon, Upload, CheckCircle2, Clock, X, Download } from 'lucide-react';
import { RoleCard, type RoleCardProps } from '../components/landing/RoleCard';
import { FeatureCard, type FeatureCardProps } from '../components/landing/FeatureCard';
import { setAuthToken } from '../utils/api';
import { toast } from '../utils/toast';

// ─── Logo ────────────────────────────────────────────────────────────────────

const GuroLogoGraphic: React.FC<{ size?: 'sm' | 'md' | 'lg'; onClick?: () => void }> = ({ size = 'md', onClick }) => {
    const dimensions = size === 'lg' ? 'size-20' : size === 'sm' ? 'size-12' : 'size-16';
    return (
        <div 
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
            aria-label="GURO Logo"
            className={`relative flex ${dimensions} items-center justify-center rounded-3xl overflow-hidden shadow-xl shadow-[#11428E]/25 border border-white/30 transform hover:scale-105 active:scale-95 transition-all duration-300 ${onClick ? 'cursor-pointer select-none' : ''}`}
        >
            <img 
                src="/images/guro-mark.png" 
                alt="GURO Logo" 
                className="w-full h-full object-cover" 
            />
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
    onBackToOverview?: () => void;
    onOpenMobileShowcase?: () => void;
}

type ViewType = 'login' | 'register' | 'guest-roles';

// ─── Component ───────────────────────────────────────────────────────────────

export const LandingPage: React.FC<LandingPageProps> = ({ 
    onSelectRole, 
    onLoginSuccess, 
    isDarkMode = false, 
    onToggleTheme,
    onBackToOverview,
}) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');
    const [pendingNotice, setPendingNotice] = useState<string | null>(null);

    // Forgot Password modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState<1 | 2>(1);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotRole, setForgotRole] = useState<'student' | 'teacher' | 'parent'>('student');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Live countdown timer for OTP resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Registration Email Verification OTP state
    const [showRegisterOtpModal, setShowRegisterOtpModal] = useState(false);
    const [registerOtpDigits, setRegisterOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [registerOtpLoading, setRegisterOtpLoading] = useState(false);
    const [registerOtpError, setRegisterOtpError] = useState('');
    const [registerResendCooldown, setRegisterResendCooldown] = useState(0);
    const registerOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (registerResendCooldown <= 0) return;
        const timer = setInterval(() => {
            setRegisterResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [registerResendCooldown]);

    // Secret 5-tap gesture on logo to toggle Admin Mode
    const clickCountRef = useRef(0);
    const logoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Prevent progressive scroll drift on page reload
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                if (typeof window.scrollTo === 'function') {
                    window.scrollTo(0, 0);
                }
                if ('scrollRestoration' in window.history) {
                    window.history.scrollRestoration = 'manual';
                }
            } catch {
                // Ignore environment-specific scroll errors
            }
        }
    }, []);

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
                    role: isAdminMode ? 'admin' : undefined
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

    const handleRegisterOtpChange = (index: number, val: string) => {
        const cleaned = val.replace(/\D/g, '');
        if (!cleaned) {
            const next = [...registerOtpDigits];
            next[index] = '';
            setRegisterOtpDigits(next);
            return;
        }

        if (cleaned.length > 1) {
            const next = [...registerOtpDigits];
            const digits = cleaned.slice(0, 6).split('');
            digits.forEach((d, i) => {
                if (index + i < 6) next[index + i] = d;
            });
            setRegisterOtpDigits(next);
            const nextFocusIndex = Math.min(index + digits.length, 5);
            registerOtpInputRefs.current[nextFocusIndex]?.focus();
            return;
        }

        const next = [...registerOtpDigits];
        next[index] = cleaned;
        setRegisterOtpDigits(next);
        if (index < 5) registerOtpInputRefs.current[index + 1]?.focus();
    };

    const handleRegisterOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!registerOtpDigits[index] && index > 0) {
                const next = [...registerOtpDigits];
                next[index - 1] = '';
                setRegisterOtpDigits(next);
                registerOtpInputRefs.current[index - 1]?.focus();
            } else {
                const next = [...registerOtpDigits];
                next[index] = '';
                setRegisterOtpDigits(next);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            registerOtpInputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            registerOtpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleRegisterOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            const next = ['', '', '', '', '', ''];
            pasted.split('').forEach((char, i) => {
                next[i] = char;
            });
            setRegisterOtpDigits(next);
            registerOtpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
        }
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
            const res = await fetch('/api/auth/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    name: firstName.trim(),
                    for_registration: true,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRegisterResendCooldown(60);
                setRegisterOtpDigits(['', '', '', '', '', '']);
                setRegisterOtpError('');
                setShowRegisterOtpModal(true);
                toast.success(`Verification code sent to ${email.trim()}`);
            } else {
                setAuthError(data.error || 'Failed to send verification code. Please check your email.');
            }
        } catch {
            setAuthError('Connection error. Could not reach verification service.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendRegisterCode = async () => {
        if (registerResendCooldown > 0 || registerOtpLoading) return;
        setRegisterOtpLoading(true);
        setRegisterOtpError('');
        try {
            const res = await fetch('/api/auth/email/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    name: firstName.trim(),
                    for_registration: true,
                }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRegisterResendCooldown(60);
                toast.success(`New verification code sent to ${email.trim()}`);
            } else {
                setRegisterOtpError(data.error || 'Failed to resend code.');
            }
        } catch {
            setRegisterOtpError('Connection error. Could not reach verification service.');
        } finally {
            setRegisterOtpLoading(false);
        }
    };

    const handleConfirmRegistrationWithOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = registerOtpDigits.join('');
        if (code.length !== 6) {
            setRegisterOtpError('Please enter all 6 digits of the verification code.');
            return;
        }
        setRegisterOtpLoading(true);
        setRegisterOtpError('');
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
                    verification_code: code,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setShowRegisterOtpModal(false);

                // If this is a teacher account, they must wait for admin verification
                if (data.pendingVerification || data.user?.verificationStatus === 'pending' || effectiveRole === 'teacher') {
                    setView('login');
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
                toast.success('Account created and verified successfully!');
                onLoginSuccess(data.user);
            } else {
                const data = await res.json().catch(() => ({}));
                setRegisterOtpError(data.error || 'Failed to complete registration.');
            }
        } catch {
            setRegisterOtpError('Connection error. Could not complete registration.');
        } finally {
            setRegisterOtpLoading(false);
        }
    };

    const handleSendRecoveryCode = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = forgotEmail.trim();
        if (!trimmed || !trimmed.includes('@')) {
            setForgotError('Please enter a valid email address.');
            return;
        }
        setForgotLoading(true);
        setForgotError('');
        try {
            const res = await fetch('/api/auth/forgot-password/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed, role: forgotRole }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                toast.success(data.message || 'Verification code sent to your email.');
                setForgotStep(2);
                setResendCooldown(60);
                setOtpDigits(['', '', '', '', '', '']);
                setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                }, 100);
            } else {
                setForgotError(data.error || 'Failed to send recovery code.');
            }
        } catch {
            setForgotError('Connection error. Unable to reach recovery service.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleOtpChange = (index: number, val: string) => {
        const cleaned = val.replace(/\D/g, '');
        if (!cleaned) {
            const next = [...otpDigits];
            next[index] = '';
            setOtpDigits(next);
            return;
        }

        // Handle multi-character paste or fast typing
        if (cleaned.length > 1) {
            const next = [...otpDigits];
            const digits = cleaned.slice(0, 6).split('');
            digits.forEach((d, i) => {
                if (index + i < 6) {
                    next[index + i] = d;
                }
            });
            setOtpDigits(next);
            const nextFocusIndex = Math.min(index + digits.length, 5);
            otpInputRefs.current[nextFocusIndex]?.focus();
            return;
        }

        const next = [...otpDigits];
        next[index] = cleaned;
        setOtpDigits(next);

        if (index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                const next = [...otpDigits];
                next[index - 1] = '';
                setOtpDigits(next);
                otpInputRefs.current[index - 1]?.focus();
            } else {
                const next = [...otpDigits];
                next[index] = '';
                setOtpDigits(next);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            const next = ['', '', '', '', '', ''];
            pasted.split('').forEach((char, i) => {
                next[i] = char;
            });
            setOtpDigits(next);
            const focusIndex = Math.min(pasted.length, 5);
            otpInputRefs.current[focusIndex]?.focus();
        }
    };

    const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = otpDigits.join('').trim();
        if (trimmedCode.length !== 6) {
            setForgotError('Please enter all 6 digits of the verification code.');
            return;
        }
        if (forgotNewPassword.length < 8 || !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).+$/.test(forgotNewPassword)) {
            setForgotError('Password must be at least 8 characters with letters, numbers, and symbols.');
            return;
        }
        setForgotLoading(true);
        setForgotError('');
        try {
            const res = await fetch('/api/auth/forgot-password/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: forgotEmail.trim(),
                    role: forgotRole,
                    code: trimmedCode,
                    new_password: forgotNewPassword,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                toast.success('Password updated! You can now sign in with your new password.');
                setShowForgotModal(false);
                setForgotStep(1);
                setForgotEmail('');
                setOtpDigits(['', '', '', '', '', '']);
                setForgotNewPassword('');
            } else {
                setForgotError(data.error || 'Invalid or expired verification code.');
            }
        } catch {
            setForgotError('Connection error. Unable to complete password reset.');
        } finally {
            setForgotLoading(false);
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
            className="min-h-[100vh] min-h-[100svh] w-full flex flex-col items-center justify-start sm:justify-center px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] pb-[max(2rem,env(safe-area-inset-bottom))] relative select-none overflow-y-auto"
            style={pageStyle}
        >
            {/* ── Top Bar Controls (Full-width edge-to-edge alignment with Safe-Area clearance) ── */}
            {view === 'guest-roles' ? (
                <div className="w-full flex items-center justify-between z-30 absolute top-[max(0.75rem,env(safe-area-inset-top))] left-0 right-0 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
                    <button
                        onClick={() => setView('login')}
                        className="flex items-center gap-2 px-3.5 sm:px-4 py-2 glass-panel border border-[var(--border-color)] rounded-full shadow-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all font-semibold text-xs cursor-pointer"
                    >
                        <ArrowLeft className="size-3 text-[var(--text-muted)]" strokeWidth={2.5} />
                        Back to sign in
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="px-2.5 sm:px-3 py-1.5 bg-[#11428E]/10 border border-[#11428E]/20 rounded-full text-[#3b82f6] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="size-3" /> Guest session
                        </div>
                        {onToggleTheme && (
                            <button
                                type="button"
                                onClick={onToggleTheme}
                                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                className="p-2 sm:p-2.5 rounded-2xl glass-panel border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-[#11428E]" />}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="w-full flex items-center justify-between gap-2 z-30 absolute top-[max(0.75rem,env(safe-area-inset-top))] left-0 right-0 px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pointer-events-none">
                    <div className="flex items-center gap-1.5 sm:gap-2.5 sm:pointer-events-auto">
                        {onBackToOverview && (
                            <button
                                type="button"
                                onClick={onBackToOverview}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 glass-panel border border-[var(--border-color)] rounded-full shadow-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all font-semibold text-xs cursor-pointer"
                            >
                                <ArrowLeft className="size-3 text-[var(--text-muted)]" strokeWidth={2.5} />
                                <span>Overview</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:pointer-events-auto">
                        <a
                            href="/downloads/GURO.apk"
                            download="GURO.apk"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                            title="Download Standalone Android APK"
                        >
                            <Download className="size-3.5 text-sky-500" />
                            <span className="hidden sm:inline">Download APK</span>
                            <span className="sm:hidden">APK</span>
                        </a>

                        {onToggleTheme && (
                            <button
                                type="button"
                                onClick={onToggleTheme}
                                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                className="p-2 sm:p-2.5 rounded-2xl glass-panel border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDarkMode ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-[#11428E]" />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex w-full max-w-5xl flex-col items-center gap-4 sm:gap-8 relative z-10 my-auto">

                <div className="flex flex-col items-center gap-1 text-center">
                    <GuroLogoGraphic onClick={handleLogoClick} />
                    <h1 className="text-[clamp(1.75rem,5.5vw,3rem)] font-extrabold tracking-tight text-[#11428E] mt-1">GURO</h1>
                    <p className="text-[clamp(0.7rem,2vw,0.95rem)] font-semibold text-[#A01322] tracking-wide">GUIDED UNIFIED RESOURCE OPTIMIZATION</p>
                </div>

                {/* ── Login ── */}
                {view === 'login' && (
                    <div className={`w-[min(100%,28rem)] glass-panel rounded-2xl sm:rounded-3xl p-[clamp(1.125rem,4vw,2rem)] shadow-2xl flex flex-col gap-5 sm:gap-6 border transition-all duration-300 ${isAdminMode ? 'border-[#CE1126]/40 ring-2 ring-[#CE1126]/20' : 'border-[var(--border-color)]'}`}>
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
                            {/* Admin mode indicator if active */}
                            {isAdminMode && (
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
                            )}

                            {/* ── Test Accounts Quick Autofill ── */}
                            <div className="flex flex-col gap-1.5 pb-0.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="size-3 text-amber-500" />
                                        <span>Test Accounts</span>
                                    </label>
                                    <span className="text-[10px] text-[var(--text-dark)] font-medium">1-click autofill</span>
                                </div>
                                <div className={`grid ${isAdminMode ? 'grid-cols-[repeat(auto-fit,minmax(min(100%,75px),1fr))]' : 'grid-cols-[repeat(auto-fit,minmax(min(100%,88px),1fr))]'} gap-2`}>
                                    {(isAdminMode
                                        ? [
                                            { role: 'developer', label: 'Developer', email: 'nealjeanclaro@guro.dev', password: 'JinBilog0v0', icon: Terminal, activeBorder: 'border-[#CE1126] text-[#CE1126] bg-[#CE1126]/10' },
                                            { role: 'teacher', label: 'Teacher', email: 'teacher@guro.dev', password: 'Password123', icon: School, activeBorder: 'border-[#11428E] text-[#11428E] dark:text-sky-400 bg-[#11428E]/10' },
                                            { role: 'student', label: 'Student', email: 'student@guro.dev', password: 'Password123', icon: GraduationCap, activeBorder: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
                                            { role: 'parent', label: 'Parent', email: 'parent@guro.dev', password: 'Password123', icon: Users, activeBorder: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
                                          ]
                                        : [
                                            { role: 'student', label: 'Student', email: 'student@guro.dev', password: 'Password123', icon: GraduationCap, activeBorder: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
                                            { role: 'teacher', label: 'Teacher', email: 'teacher@guro.dev', password: 'Password123', icon: School, activeBorder: 'border-[#11428E] text-[#11428E] dark:text-sky-400 bg-[#11428E]/10' },
                                            { role: 'parent', label: 'Parent', email: 'parent@guro.dev', password: 'Password123', icon: Users, activeBorder: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
                                          ]
                                    ).map((acc) => {
                                        const Icon = acc.icon;
                                        const isSelected = email === acc.email;
                                        return (
                                            <button
                                                key={acc.role}
                                                type="button"
                                                onClick={() => {
                                                    setEmail(acc.email);
                                                    setPassword(acc.password);
                                                    setFieldErrors({});
                                                    setAuthError('');
                                                    if (acc.role === 'developer') {
                                                        setIsAdminMode(true);
                                                    }
                                                    toast.success(`${acc.label} test credentials filled`);
                                                }}
                                                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs border transition-all cursor-pointer ${
                                                    isSelected
                                                        ? `${acc.activeBorder} font-bold shadow-xs`
                                                        : 'border-[var(--border-color)] bg-[var(--bg-main)]/60 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                                                }`}
                                                title={`Fill ${acc.label} test account (${acc.email})`}
                                            >
                                                <Icon className="size-3.5 shrink-0" />
                                                <span className="truncate font-semibold">{acc.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

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
                                <div className="flex justify-end pt-0.5">
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotError(''); }}
                                        className="text-[12px] text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
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
                    <div className={`w-[min(100%,28rem)] glass-panel rounded-2xl sm:rounded-3xl p-[clamp(1.125rem,4vw,2rem)] shadow-2xl flex flex-col gap-5 sm:gap-6 border transition-all duration-300 ${isAdminMode ? 'border-[#CE1126]/40 ring-2 ring-[#CE1126]/20' : 'border-[var(--border-color)]'}`}>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                {/* ── Forgot Password Modal ── */}
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-200">
                            <button
                                type="button"
                                onClick={() => { setShowForgotModal(false); setForgotStep(1); setForgotError(''); }}
                                className="absolute right-4 top-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="size-12 rounded-2xl bg-[#11428E]/10 border border-[#11428E]/25 text-[#11428E] dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                                    <KeyRound className="size-6" />
                                </div>
                                <h3 className="text-xl font-bold font-display tracking-tight text-[var(--text-main)]">
                                    Reset Password
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs">
                                    {forgotStep === 1
                                        ? 'Select your role and enter your registered email address to receive a 6-digit code.'
                                        : 'Enter the 6-digit code sent to your email and set your new password.'}
                                </p>
                            </div>

                            {forgotError && (
                                <div className="mb-4 bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{forgotError}</span>
                                </div>
                            )}

                            {forgotStep === 1 ? (
                                <form onSubmit={handleSendRecoveryCode} className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelCls}>Account Role</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['student', 'teacher', 'parent'] as const).map((r) => {
                                                const isSel = forgotRole === r;
                                                return (
                                                    <button
                                                        key={r}
                                                        type="button"
                                                        onClick={() => setForgotRole(r)}
                                                        className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                                                            isSel
                                                                ? 'border-[#11428E] bg-[#11428E]/10 text-[#11428E] dark:text-blue-400 shadow-sm'
                                                                : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-slate-400'
                                                        }`}
                                                    >
                                                        {r}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelCls} htmlFor="forgot-email">Email address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" />
                                            <input
                                                id="forgot-email"
                                                type="email"
                                                placeholder="you@school.edu"
                                                className={inputCls}
                                                value={forgotEmail}
                                                onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-wide shadow-md transition-all disabled:opacity-60 cursor-pointer"
                                            style={{ background: 'linear-gradient(135deg, #11428E 0%, #2563EB 100%)' }}
                                        >
                                            {forgotLoading ? 'Sending code…' : 'Send Recovery Code'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyRecoveryCode} className="flex flex-col gap-4">
                                    <div className="p-2.5 rounded-xl bg-[var(--bg-main)]/60 border border-[var(--border-color)] flex items-center justify-between text-xs">
                                        <span className="text-[var(--text-muted)]">Target account:</span>
                                        <span className="font-semibold text-[var(--text-main)] truncate max-w-[200px]">{forgotEmail} ({forgotRole})</span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <label className={labelCls}>6-Digit Verification Code</label>
                                            <span className="text-[10px] text-[var(--text-dark)] font-medium">Valid for 10 mins</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                            {otpDigits.map((digit, index) => (
                                                <input
                                                    key={index}
                                                    ref={(el) => { otpInputRefs.current[index] = el; }}
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    onPaste={handleOtpPaste}
                                                    className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-2xl font-black rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] shadow-inner focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 transition-all caret-[#11428E]"
                                                    aria-label={`Digit ${index + 1}`}
                                                />
                                            ))}
                                        </div>

                                        {/* Live Resend Countdown */}
                                        <div className="flex items-center justify-center pt-1">
                                            {resendCooldown > 0 ? (
                                                <span className="text-[11px] text-[var(--text-dark)] font-medium flex items-center gap-1">
                                                    <Clock className="size-3 text-[var(--text-dark)]" />
                                                    Resend code in <strong className="text-[var(--text-main)] font-mono">0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}</strong>
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={forgotLoading}
                                                    onClick={() => handleSendRecoveryCode()}
                                                    className="text-[11px] font-bold text-[#11428E] dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                                                >
                                                    Didn't receive the code? Resend now
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className={labelCls} htmlFor="forgot-new-password">New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-dark)]" />
                                            <input
                                                id="forgot-new-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className={inputCls}
                                                value={forgotNewPassword}
                                                onChange={(e) => { setForgotNewPassword(e.target.value); setForgotError(''); }}
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-[var(--text-dark)]">Min. 8 characters with letters, numbers, and special symbols.</p>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-wide shadow-md transition-all disabled:opacity-60 cursor-pointer"
                                            style={{ background: 'linear-gradient(135deg, #11428E 0%, #10B981 100%)' }}
                                        >
                                            {forgotLoading ? 'Updating password…' : 'Reset Password'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setForgotStep(1); setForgotError(''); }}
                                            className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                                        >
                                            ← Back to Email
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Registration Email Verification OTP Modal ── */}
                {showRegisterOtpModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-200">
                            <button
                                type="button"
                                onClick={() => { setShowRegisterOtpModal(false); setRegisterOtpError(''); }}
                                className="absolute right-4 top-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
                                aria-label="Close modal"
                            >
                                <X className="size-5" />
                            </button>

                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                                    <ShieldCheck className="size-6" />
                                </div>
                                <h3 className="text-xl font-bold font-display tracking-tight text-[var(--text-main)]">
                                    Activate Your Account
                                </h3>
                                <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs">
                                    Enter the 6-digit verification code sent to <strong className="text-[var(--text-main)]">{email}</strong> to activate your account.
                                </p>
                            </div>

                            {registerOtpError && (
                                <div className="mb-4 bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{registerOtpError}</span>
                                </div>
                            )}

                            <form onSubmit={handleConfirmRegistrationWithOtp} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <label className={labelCls}>6-Digit Verification Code</label>
                                        <span className="text-[10px] text-[var(--text-dark)] font-medium">Valid for 10 mins</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                                        {registerOtpDigits.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { registerOtpInputRefs.current[index] = el; }}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleRegisterOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleRegisterOtpKeyDown(index, e)}
                                                onPaste={handleRegisterOtpPaste}
                                                className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono text-2xl font-black rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] shadow-inner focus:outline-none focus:border-[#11428E] focus:ring-2 focus:ring-[#11428E]/20 transition-all caret-[#11428E]"
                                                aria-label={`Digit ${index + 1}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Live Resend Countdown */}
                                    <div className="flex items-center justify-center pt-1">
                                        {registerResendCooldown > 0 ? (
                                            <span className="text-[11px] text-[var(--text-dark)] font-medium flex items-center gap-1">
                                                <Clock className="size-3 text-[var(--text-dark)]" />
                                                Resend code in <strong className="text-[var(--text-main)] font-mono">0:{registerResendCooldown < 10 ? `0${registerResendCooldown}` : registerResendCooldown}</strong>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={registerOtpLoading}
                                                onClick={() => handleResendRegisterCode()}
                                                className="text-[11px] font-bold text-[#11428E] dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50"
                                            >
                                                Didn't receive the code? Resend now
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={registerOtpLoading}
                                        className="w-full py-3.5 rounded-xl text-white text-xs font-bold tracking-wide shadow-md transition-all disabled:opacity-60 cursor-pointer"
                                        style={{ background: 'linear-gradient(135deg, #11428E 0%, #10B981 100%)' }}
                                    >
                                        {registerOtpLoading ? 'Verifying & Activating…' : 'Verify & Activate Account'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowRegisterOtpModal(false); setRegisterOtpError(''); }}
                                        className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                                    >
                                        ← Edit Registration Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};