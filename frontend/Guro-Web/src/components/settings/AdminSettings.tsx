import React, { useState } from 'react';
import { Shield, AlertTriangle, Save } from 'lucide-react';
import { toast } from '../../utils/toast';

interface AdminSettingsProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
  onSaveProfile: (firstName: string, middleName: string, lastName: string) => Promise<boolean>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  currentUser,
  onSaveProfile,
}) => {
  const [adminName, setAdminName] = useState(currentUser?.name || 'Division Administrator');
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const val = localStorage.getItem('guro_admin_alert_threshold');
    return val ? parseInt(val, 10) : 60;
  });
  const [expectedGrowth, setExpectedGrowth] = useState<number>(() => {
    const val = localStorage.getItem('guro_admin_growth_benchmark');
    return val ? parseInt(val, 10) : 15;
  });
  const [tableRowsPerPage, setTableRowsPerPage] = useState<number>(() => {
    const val = localStorage.getItem('guro_admin_rows_per_page');
    return val ? parseInt(val, 10) : 50;
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    localStorage.setItem('guro_admin_alert_threshold', String(alertThreshold));
    localStorage.setItem('guro_admin_growth_benchmark', String(expectedGrowth));
    localStorage.setItem('guro_admin_rows_per_page', String(tableRowsPerPage));

    const nameParts = adminName.trim().split(' ');
    const fName = nameParts[0] || 'Admin';
    const lName = nameParts.slice(1).join(' ') || 'User';

    const success = await onSaveProfile(fName, '', lName);
    if (success) {
      toast.success('Division administrative preferences saved!');
    }
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Administrator Governance Clearance */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <Shield className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Administrative Clearance & Jurisdiction</h3>
            <p className="text-xs text-[var(--text-muted)]">DepEd Division Office supervisory governance parameters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] mb-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)] font-semibold">Jurisdiction:</span>
            <p className="font-bold text-[var(--text-main)] mt-0.5">Division Office · Central Luzon Region III</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-semibold">Clearance Status:</span>
            <p className="font-bold text-rose-500 mt-0.5">Tier 1 Super Administrator</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-w-md">
          <label htmlFor="admin-official-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Official Administrator Name
          </label>
          <input
            id="admin-official-name"
            type="text"
            required
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Division Diagnostic Telemetry Thresholds */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Division Diagnostic & Alert Thresholds</h3>
            <p className="text-xs text-[var(--text-muted)]">Configure when classrooms and schools are flagged for academic intervention.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Mastery Warning Floor */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="alert-threshold" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              At-Risk Alert Floor
            </label>
            <select
              id="alert-threshold"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value, 10))}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={50}>Below 50% Mastery</option>
              <option value={60}>Below 60% Mastery (Standard)</option>
              <option value={70}>Below 70% Mastery (Strict)</option>
            </select>
          </div>

          {/* Expected Growth Benchmark */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expected-growth" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Pre-to-Post Growth Benchmark
            </label>
            <select
              id="expected-growth"
              value={expectedGrowth}
              onChange={(e) => setExpectedGrowth(parseInt(e.target.value, 10))}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>+10% Min Improvement</option>
              <option value={15}>+15% Target Improvement</option>
              <option value={20}>+20% High Expectation</option>
            </select>
          </div>

          {/* Table Density */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="table-rows" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Directory Rows Per Page
            </label>
            <select
              id="table-rows"
              value={tableRowsPerPage}
              onChange={(e) => setTableRowsPerPage(parseInt(e.target.value, 10))}
              className="px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={25}>25 rows / page</option>
              <option value={50}>50 rows / page</option>
              <option value={100}>100 rows / page</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="py-2.5 px-6 bg-gradient-to-tr from-[#CE1126] to-[#E11D48] hover:from-[#a00d1e] hover:to-[#be123c] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 w-fit cursor-pointer flex items-center gap-2"
      >
        <Save className="size-4" />
        <span>{isSaving ? 'Saving Changes...' : 'Save Administrative Settings'}</span>
      </button>
    </form>
  );
};
