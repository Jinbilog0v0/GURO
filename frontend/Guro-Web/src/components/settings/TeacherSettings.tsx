import React, { useState } from 'react';
import { School, CheckCircle2, AlertCircle, Sliders, Save } from 'lucide-react';
import { toast } from '../../utils/toast';

interface TeacherSettingsProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    schoolName?: string | null;
    schoolIdNumber?: string | null;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    firstName?: string;
    middleName?: string;
    lastName?: string;
  } | null;
  onSaveProfile: (firstName: string, middleName: string, lastName: string) => Promise<boolean>;
}

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({
  currentUser,
  onSaveProfile,
}) => {
  const parts = currentUser?.name ? currentUser.name.split(' ') : ['Teacher', ''];
  const [firstName, setFirstName] = useState(currentUser?.firstName || parts[0] || '');
  const [middleName, setMiddleName] = useState(currentUser?.middleName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || parts.slice(1).join(' ') || '');
  const [passThreshold, setPassThreshold] = useState<number>(() => {
    const val = localStorage.getItem('guro_teacher_pass_threshold');
    return val ? parseInt(val, 10) : 75;
  });
  const [matrixDensity, setMatrixDensity] = useState<string>(() => {
    return localStorage.getItem('guro_teacher_matrix_density') || 'standard';
  });
  const [defaultExportFormat, setDefaultExportFormat] = useState<string>(() => {
    return localStorage.getItem('guro_teacher_export_format') || 'pdf';
  });
  const [isSaving, setIsSaving] = useState(false);

  const isVerified = currentUser?.verificationStatus === 'approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and Last name are required.');
      return;
    }
    setIsSaving(true);
    localStorage.setItem('guro_teacher_pass_threshold', String(passThreshold));
    localStorage.setItem('guro_teacher_matrix_density', matrixDensity);
    localStorage.setItem('guro_teacher_export_format', defaultExportFormat);

    const success = await onSaveProfile(firstName.trim(), middleName.trim(), lastName.trim());
    if (success) {
      toast.success('Teacher classroom preferences saved!');
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-4xl">
      {/* DepEd Professional Credentials Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <School className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">Teacher Credentials & School</h3>
              <p className="text-xs text-[var(--text-muted)]">Official DepEd faculty information and division assignment.</p>
            </div>
          </div>

          {/* Verification Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            isVerified
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
          }`}>
            {isVerified ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
            <span>{isVerified ? 'Accredited Faculty' : 'Verification In Review'}</span>
          </div>
        </div>

        {/* Read-Only DepEd System Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] mb-5 text-xs">
          <div>
            <span className="text-[var(--text-muted)] font-semibold">School Assignment:</span>
            <p className="font-bold text-[var(--text-main)] mt-0.5">{currentUser?.schoolName || 'DepEd Division Elementary School'}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-semibold">Employee ID / PRC License:</span>
            <p className="font-mono font-bold text-[var(--text-main)] mt-0.5">{currentUser?.schoolIdNumber || 'PRC-0982341'}</p>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-first-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              First Name
            </label>
            <input
              id="teacher-first-name"
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-middle-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Middle Name (Opt)
            </label>
            <input
              id="teacher-middle-name"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="teacher-last-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Last Name
            </label>
            <input
              id="teacher-last-name"
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Classroom Pedagogical Defaults */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <Sliders className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Classroom & Evaluation Defaults</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure mastery thresholds and report generation defaults.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Passing Mastery Score */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pass-threshold" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Passing Mark Threshold
            </label>
            <select
              id="pass-threshold"
              value={passThreshold}
              onChange={(e) => setPassThreshold(parseInt(e.target.value, 10))}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={70}>70% (Remedial Target)</option>
              <option value={75}>75% (DepEd Standard Passing)</option>
              <option value={80}>80% (Advanced Mastery)</option>
            </select>
          </div>

          {/* Matrix Row Density */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="matrix-density" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Mastery Matrix Density
            </label>
            <select
              id="matrix-density"
              value={matrixDensity}
              onChange={(e) => setMatrixDensity(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="compact">Compact (More students per screen)</option>
              <option value="standard">Standard Balanced</option>
              <option value="comfortable">Comfortable (Larger row tap targets)</option>
            </select>
          </div>

          {/* Export Default */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="export-format" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Grade Sheet Export Format
            </label>
            <select
              id="export-format"
              value={defaultExportFormat}
              onChange={(e) => setDefaultExportFormat(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="pdf">Official PDF (DepEd Form 138 compliant)</option>
              <option value="csv">Raw CSV / Excel Spreadsheet</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="py-2.5 px-6 bg-gradient-to-tr from-[#11428E] to-[#2563EB] hover:from-[#0d3470] hover:to-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 w-fit cursor-pointer flex items-center gap-2"
      >
        <Save className="size-4" />
        <span>{isSaving ? 'Saving Changes...' : 'Save Teacher Settings'}</span>
      </button>
    </form>
  );
};
