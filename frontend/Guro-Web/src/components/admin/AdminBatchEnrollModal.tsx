import React, { useState } from 'react';
import { X, UserPlus, FileSpreadsheet, Check, Copy, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

interface AdminBatchEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: {
    id: number;
    classroomId: string;
    teacherName: string;
    sectionName?: string | null;
    subject?: string;
    gradeLevel?: number;
  } | null;
  onSuccess?: () => void;
}

export const AdminBatchEnrollModal: React.FC<AdminBatchEnrollModalProps> = ({
  isOpen,
  onClose,
  classroom,
  onSuccess,
}) => {
  const [rawText, setRawText] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('Guro2026!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !classroom) return null;

  const handleLoadSampleRoster = () => {
    // 5 Realistic DepEd elementary sample students with 12-digit LRNs
    const sample = `109283748201, Dela Cruz, Juan, Santos, Male
109283748202, Aquino, Maria, Gomez, Female
109283748203, Reyes, Gabriel, Ramos, Male
109283748204, Flores, Bea, Bautista, Female
109283748205, Tan, Joshua, Lim, Male`;
    setRawText(sample);
    setError('');
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setError('Please paste student roster records or click "Load Sample Test Roster".');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiFetch(`/api/admin/classrooms/${classroom.id}/batch-students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_text: rawText,
          default_password: defaultPassword.trim() || 'Guro2026!',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Batch import failed.');
      }

      setImportResult(data);
      toast.success(data.message || 'Batch enrollment complete!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Batch import error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!importResult || !importResult.records) return;
    const lines = importResult.records.map((r: any) => 
      `${r.lrn}\t${r.name}\t${r.gender}\t${r.email || r.studentId}\t${r.temporaryPassword || '(Existing)'}\t${r.parentAccessToken || 'N/A'}`
    );
    const text = `GURO Batch Test Roster — Section: ${classroom.classroomId} (${classroom.teacherName})
LRN\tStudent Name\tGender\tUsername/Email\tPassword\tParent Code
${lines.join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Roster credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setImportResult(null);
    setRawText('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">
                {importResult ? 'Batch Enrollment Complete' : 'Admin Batch Master List Import'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Section: <span className="font-mono font-bold text-[#11428E]">{classroom.classroomId}</span> • Teacher: <strong>{classroom.teacherName}</strong>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {importResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
                <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-sm mb-0.5">Batch Import Successful!</h4>
                  <p>
                    Processed <strong>{importResult.summary?.totalProcessed}</strong> students: {importResult.summary?.createdCount} newly registered, {importResult.summary?.existingEnrolledCount} existing students linked.
                  </p>
                </div>
              </div>

              {/* Roster Table */}
              <div className="border border-[var(--border-color)] rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse font-mono">
                  <thead className="bg-[var(--bg-sidebar)] text-[var(--text-muted)] sticky top-0 border-b border-[var(--border-color)] text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">12-Digit LRN</th>
                      <th className="p-2.5">Learner Name</th>
                      <th className="p-2.5">Password</th>
                      <th className="p-2.5">Parent Code</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[11px]">
                    {importResult.records?.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--bg-sidebar)]/50">
                        <td className="p-2.5 font-bold text-[#11428E] dark:text-sky-400 tabular-nums">{r.lrn}</td>
                        <td className="p-2.5 font-sans font-medium text-[var(--text-main)]">{r.name}</td>
                        <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{r.temporaryPassword || '—'}</td>
                        <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400 tabular-nums">{r.parentAccessToken}</td>
                        <td className="p-2.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)] text-xs font-bold text-[var(--text-main)] transition-all cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  <span>{copied ? 'Copied Test Roster!' : 'Copy Credentials Sheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <UserPlus className="size-4" />
                  <span>Import More</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleImport} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Master List Lines (CSV or Tab-Delimited)
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleRoster}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="size-3" />
                  <span>Load Sample Test Roster</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={7}
                  required
                  placeholder={`LRN, Last Name, First Name, Middle Name, Gender\n109283748291, Dela Cruz, Juan, Santos, Male\n109283748292, Aquino, Maria, Gomez, Female`}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Format per line: <code>LRN, Last Name, First Name, Middle Name, Gender</code>. Header rows are automatically ignored.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Default Temporary Password for New Accounts
                </label>
                <input
                  type="text"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
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
                  disabled={isSubmitting || !rawText.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="size-4" />
                  <span>{isSubmitting ? 'Importing Roster...' : 'Import & Enroll All'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
