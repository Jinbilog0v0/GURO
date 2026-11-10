import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck, Copy, Check, Printer, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

interface CreateStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string;
  onStudentCreated?: () => void;
}

interface CreatedStudentResult {
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  lrn: string;
  gender: string;
  email: string;
  temporaryPassword: string | null;
  parentAccessToken: string | null;
  sectionName?: string | null;
}

export const CreateStudentModal: React.FC<CreateStudentModalProps> = ({
  isOpen,
  onClose,
  classroomId,
  onStudentCreated,
}) => {
  const [lrn, setLrn] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [password, setPassword] = useState('Guro2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdStudent, setCreatedStudent] = useState<CreatedStudentResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLrnChange = (val: string) => {
    // Only numbers, max 12 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    setLrn(cleaned);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lrn.length !== 12) {
      setError('DepEd Learner Reference Number (LRN) must be exactly 12 digits.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please provide student first and last name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiFetch('/api/classroom/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId,
          lrn,
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          gender,
          password: password.trim() || 'Guro2026!',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student account.');
      }

      setCreatedStudent(data.student);
      toast.success(data.message || 'Student account created and enrolled successfully!');
      if (onStudentCreated) onStudentCreated();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudent) return;
    const text = `GURO Student Account Credentials
---------------------------------
Student Name: ${createdStudent.name}
DepEd LRN: ${createdStudent.lrn}
Login ID / Email: ${createdStudent.email}
Temporary Password: ${createdStudent.temporaryPassword || '(Existing Password)'}
Parent Access Code: ${createdStudent.parentAccessToken || 'N/A'}
Classroom Section: ${classroomId}
Web Login: https://neoguro.app`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleReset = () => {
    setCreatedStudent(null);
    setLrn('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setPassword('Guro2026!');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#11428E]/10 text-[#11428E] dark:text-sky-400">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                {createdStudent ? 'Student Account Created' : 'Create & Enroll Student Account'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Section: <span className="font-mono font-bold text-[var(--text-main)]">{classroomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          {createdStudent ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
                <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-sm mb-0.5">Enrolled Successfully!</h4>
                  <p>The student account is active. Provide these login details to the student and their parent.</p>
                </div>
              </div>

              {/* Printable Credential Slip */}
              <div className="p-4 rounded-xl border-2 border-dashed border-[#11428E]/40 bg-[var(--bg-sidebar)] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">GURO Learner Slip</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#11428E]/10 text-[#11428E] font-bold">DepEd Region IX</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Learner Name:</span>
                    <strong className="text-[var(--text-main)]">{createdStudent.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">12-Digit LRN:</span>
                    <strong className="text-[#11428E] dark:text-sky-400 tabular-nums">{createdStudent.lrn}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Login ID / Email:</span>
                    <strong className="text-[var(--text-main)] truncate block">{createdStudent.email}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Initial Password:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {createdStudent.temporaryPassword || 'Existing Password'}
                    </strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block">Parent Access Code:</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                      {createdStudent.parentAccessToken || 'N/A'}
                    </span>
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] text-right">Give code to guardian</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] text-xs font-bold text-[var(--text-main)] transition-all cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="hidden sm:flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] text-xs font-bold text-[var(--text-main)] transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="size-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <UserPlus className="size-4" />
                  <span>Add Another</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  12-Digit DepEd LRN *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  required
                  placeholder="e.g. 109283748291"
                  value={lrn}
                  onChange={(e) => handleLrnChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider tabular-nums rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {lrn.length}/12 digits entered {lrn.length === 12 && '✓ Valid LRN format'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dela Cruz"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Middle Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Santos"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 pr-10 text-sm font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[#11428E]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Default temporary password. Learner can change it later in settings.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || lrn.length !== 12}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white text-xs font-bold shadow-md shadow-[#11428E]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="size-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Enroll Student'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
