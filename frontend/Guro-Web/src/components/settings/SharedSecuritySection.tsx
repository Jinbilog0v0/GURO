import React, { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Mail, AlertCircle, Clock, X } from 'lucide-react';
import { toast } from '../../utils/toast';
import { apiFetch } from '../../utils/api';

export interface SharedSecuritySectionProps {
  currentUser?: {
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    emailVerifiedAt?: string | null;
  } | null;
  onEmailVerified?: (verifiedAt: string) => void;
}

export const SharedSecuritySection: React.FC<SharedSecuritySectionProps> = ({
  currentUser,
  onEmailVerified,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Email verification state
  const [isVerified, setIsVerified] = useState(!!currentUser?.emailVerifiedAt);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsVerified(!!currentUser?.emailVerifiedAt);
  }, [currentUser?.emailVerifiedAt]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleStartEmailVerification = async () => {
    if (!currentUser?.email) {
      toast.error('No email address associated with this account.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await apiFetch('/api/auth/email/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email: currentUser.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setIsVerifyModalOpen(true);
        toast.success(`Verification code sent to ${currentUser.email}`);
      } else {
        toast.error(data.error || 'Failed to send verification code.');
      }
    } catch {
      toast.error('Unable to send code. Please check your network connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await apiFetch('/api/auth/email/send-verification', {
        method: 'POST',
        body: JSON.stringify({ email: currentUser?.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        toast.success(`New code sent to ${currentUser?.email}`);
      } else {
        setOtpError(data.error || 'Failed to resend code.');
      }
    } catch {
      setOtpError('Unable to resend verification code.');
    } finally {
      setOtpLoading(false);
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
    if (cleaned.length > 1) {
      const next = [...otpDigits];
      const digits = cleaned.slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (index + i < 6) next[index + i] = d;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);
    if (index < 5) otpInputRefs.current[index + 1]?.focus();
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
      otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter the full 6-digit verification code.');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await apiFetch('/api/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({
          code,
          email: currentUser?.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true);
        const verifiedTimestamp = data.emailVerifiedAt || new Date().toISOString();
        onEmailVerified?.(verifiedTimestamp);
        setIsVerifyModalOpen(false);
        toast.success('Email verified successfully!');
      } else {
        setOtpError(data.error || 'Invalid or expired verification code.');
      }
    } catch {
      setOtpError('Network error. Unable to verify code.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Simple password strength calculation
  const getStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = getStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || data.error || 'Failed to update password.');
      }
    } catch {
      toast.error('Unable to change password. Please check your network connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* ── Email Verification Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          }`}>
            <Mail className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-main)]">Email Verification</h3>
              {isVerified ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold">
                  <CheckCircle2 className="size-3" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[11px] font-bold">
                  <AlertCircle className="size-3" /> Unverified
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {currentUser?.email ? (
                <>Primary: <span className="font-semibold text-[var(--text-main)] font-mono">{currentUser.email}</span></>
              ) : (
                'Verify your email to secure your account and enable password recovery.'
              )}
            </p>
          </div>
        </div>

        {!isVerified && currentUser?.email && (
          <button
            type="button"
            disabled={otpLoading}
            onClick={handleStartEmailVerification}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {otpLoading ? 'Sending Code...' : 'Verify Email Now'}
          </button>
        )}
      </div>

      {/* ── Password Change Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Lock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Change Password</h3>
            <p className="text-xs text-[var(--text-muted)]">Ensure your account uses a secure password to protect your data.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 max-w-lg">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-password" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[var(--text-muted)]">Password Strength</span>
                  <span className={`font-bold ${
                    strength <= 25 ? 'text-red-500' :
                    strength <= 50 ? 'text-amber-500' :
                    strength <= 75 ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 25 ? 'bg-red-500 w-1/4' :
                      strength <= 50 ? 'bg-amber-500 w-2/4' :
                      strength <= 75 ? 'bg-blue-500 w-3/4' : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="mt-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs w-fit cursor-pointer active:scale-95"
          >
            {isUpdating ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── Security Integrity Status Card ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)]">Account Integrity & Verification</h4>
            <p className="text-xs text-[var(--text-muted)]">Signed in via secure session token. Auto-refreshed upon activity.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
          <CheckCircle2 className="size-3.5" />
          <span>Protected</span>
        </div>
      </div>

      {/* ── 6-Square Email Verification Modal ── */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-[var(--text-main)] animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => { setIsVerifyModalOpen(false); setOtpError(''); }}
              className="absolute right-4 top-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-6">
              <div className="size-12 rounded-2xl bg-[#11428E]/10 border border-[#11428E]/25 text-[#11428E] dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                <Mail className="size-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
                Verify Email Address
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs">
                Enter the 6-digit verification code sent to <strong className="text-[var(--text-main)]">{currentUser?.email}</strong>.
              </p>
            </div>

            {otpError && (
              <div className="mb-4 bg-[#A01322]/10 border border-[#A01322]/20 text-[#A01322] text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">Valid for 10 mins</span>
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
                    <span className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                      <Clock className="size-3 text-[var(--text-muted)]" />
                      Resend code in <strong className="text-[var(--text-main)] font-mono">0:{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={otpLoading}
                      onClick={handleResendCode}
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
                  disabled={otpLoading}
                  className="w-full py-3.5 rounded-xl text-white text-xs font-bold tracking-wide shadow-md transition-all disabled:opacity-60 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #11428E 0%, #10B981 100%)' }}
                >
                  {otpLoading ? 'Verifying Code…' : 'Confirm & Verify Email'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsVerifyModalOpen(false); setOtpError(''); }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
