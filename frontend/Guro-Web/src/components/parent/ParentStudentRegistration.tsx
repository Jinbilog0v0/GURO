import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Eye, EyeOff, Copy, Check, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

export interface LinkedStudentProfile {
  studentId: string;
  name: string;
  email: string;
  accessCode: string;
  section?: string;
  createdAt: string;
}

export interface ParentStudentRegistrationProps {
  onSelectStudentForExplorer?: (studentId: string, accessCode: string) => void;
}

export const ParentStudentRegistration: React.FC<ParentStudentRegistrationProps> = ({
  onSelectStudentForExplorer,
}) => {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [section, setSection] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Linked children list from localStorage
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem('guro_parent_linked_children');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${key} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCreatedStudent(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/parent/create-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
          section: section.trim(),
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const student = data.student;
        setCreatedStudent(student);
        toast.success(`Successfully created student account for ${student.name}!`);

        // Save to linked children list
        const newProfile: LinkedStudentProfile = {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          accessCode: student.accessCode,
          section: section.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        const updated = [newProfile, ...linkedStudents.filter(s => s.studentId !== student.studentId)];
        setLinkedStudents(updated);
        localStorage.setItem('guro_parent_linked_children', JSON.stringify(updated));

        // Reset form inputs
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setSection('');
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg(data.error || 'Failed to create student account.');
      }
    } catch (err) {
      console.error('[ParentStudentRegistration] Create student error:', err);
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <UserPlus size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">
              Student Account Registration &amp; Management
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Register child profiles, generate secure access codes, and link student accounts.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)]">
          <ShieldCheck size={14} className="text-pink-500" />
          <span>Official DepEd Credentials</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 m-0 border-b border-[var(--border-color)] pb-3">
            <UserPlus size={16} className="text-pink-500" />
            <span>Register New Student Account</span>
          </h4>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">
                  Middle Name <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Santos"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">
                  Section <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mabini, Rizal"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">
                Student Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="child.email@guro.gov or learner email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Choose a secure student password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-pink-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl shadow-md mt-1 cursor-pointer"
            >
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Registering Student...' : 'Register Student Account'}</span>
            </button>
          </form>

          {/* Success Banner with Copy Buttons */}
          {createdStudent && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs flex flex-col gap-3 mt-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Account Created Successfully for {createdStudent.name}!</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase">Student ID</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-bold text-[var(--text-main)] font-mono">{createdStudent.studentId}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdStudent.studentId, 'Student ID')}
                      className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                      title="Copy Student ID"
                    >
                      {copiedKey === 'Student ID' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase">6-Digit Access Code</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs font-bold text-emerald-600 font-mono tracking-wider">{createdStudent.accessCode}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdStudent.accessCode, 'Access Code')}
                      className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                      title="Copy Access Code"
                    >
                      {copiedKey === 'Access Code' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {onSelectStudentForExplorer && (
                <button
                  type="button"
                  onClick={() => onSelectStudentForExplorer(createdStudent.studentId, createdStudent.accessCode)}
                  className="btn btn-secondary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Explore Child Telemetry Now</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Linked Children List */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
              <Users size={16} className="text-indigo-400" />
              <span>Linked Student Accounts</span>
            </h4>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]">
              {linkedStudents.length} Child{linkedStudents.length !== 1 ? 'ren' : ''}
            </span>
          </div>

          {linkedStudents.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs italic flex flex-col items-center gap-2">
              <Users size={32} className="opacity-30" />
              <span>No linked children registered on this browser yet. Accounts registered above will appear here for fast switching.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
              {linkedStudents.map((child, idx) => (
                <div
                  key={child.studentId || idx}
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-pink-500/40 rounded-xl p-3.5 flex flex-col gap-2.5 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-main)] truncate">{child.name}</span>
                    {child.section && (
                      <span className="text-[10px] font-semibold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-md">
                        {child.section}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
                    <span>ID: {child.studentId}</span>
                    <span className="text-emerald-500 font-bold">Code: {child.accessCode}</span>
                  </div>

                  {onSelectStudentForExplorer && (
                    <button
                      type="button"
                      onClick={() => onSelectStudentForExplorer(child.studentId, child.accessCode)}
                      className="btn btn-secondary w-full py-1.5 text-[11px] font-bold flex items-center justify-center gap-1 mt-1"
                    >
                      <span>View Progress</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
