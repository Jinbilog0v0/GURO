import React, { useState } from 'react';
import { SettingsHeader } from '../components/settings/SettingsHeader';
import { StudentSettings } from '../components/settings/StudentSettings';
import { TeacherSettings } from '../components/settings/TeacherSettings';
import { ParentSettings } from '../components/settings/ParentSettings';
import { AdminSettings } from '../components/settings/AdminSettings';
import { SharedSecuritySection } from '../components/settings/SharedSecuritySection';
import { User, Lock, LogOut, Shield, School, Users, GraduationCap } from 'lucide-react';

interface SettingsSpaceProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
    schoolName?: string | null;
    schoolIdNumber?: string | null;
    verificationStatus?: 'pending' | 'approved' | 'rejected';
    firstName?: string;
    middleName?: string;
    lastName?: string;
  } | null;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSaveProfile: (firstName: string, middleName: string, lastName: string) => Promise<boolean>;
  selectedGrade?: number;
  parentAccessCode?: string;
}

type SettingsTab = 'profile' | 'security' | 'account';

export const SettingsSpace: React.FC<SettingsSpaceProps> = ({
  currentUser,
  onBack,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onSaveProfile,
  selectedGrade = 4,
  parentAccessCode = 'GURO-P-7492',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const role = currentUser?.role?.toLowerCase() || 'student';
  const roleTitle = role === 'teacher'
    ? 'Teacher Workspace'
    : role === 'parent'
    ? 'Parent Supervision'
    : role === 'admin'
    ? 'Super Admin Console'
    : 'Student Learning';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] animate-in fade-in duration-200">
      {/* ── Zen Focus-Mode Header ── */}
      <SettingsHeader
        onBack={onBack}
        roleTitle={roleTitle}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />

      {/* ── Main Settings Container ── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Left: Category Navigation Rail */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-[var(--border-color)] pb-4 md:pb-0 md:pr-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
              activeTab === 'profile'
                ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            {role === 'teacher' ? (
              <School className="size-4 shrink-0" />
            ) : role === 'parent' ? (
              <Users className="size-4 shrink-0" />
            ) : role === 'admin' ? (
              <Shield className="size-4 shrink-0" />
            ) : (
              <GraduationCap className="size-4 shrink-0" />
            )}
            <span>{role === 'student' ? 'Learning & Display' : 'Profile & Classroom'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
              activeTab === 'security'
                ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Lock className="size-4 shrink-0" />
            <span>Password & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer text-left ${
              activeTab === 'account'
                ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <User className="size-4 shrink-0" />
            <span>Session & Account</span>
          </button>
        </aside>

        {/* Right: Active Section Content Canvas */}
        <main className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <div>
              {role === 'teacher' && (
                <TeacherSettings currentUser={currentUser} onSaveProfile={onSaveProfile} />
              )}
              {role === 'parent' && (
                <ParentSettings currentUser={currentUser} onSaveProfile={onSaveProfile} />
              )}
              {role === 'admin' && (
                <AdminSettings currentUser={currentUser} onSaveProfile={onSaveProfile} />
              )}
              {role !== 'teacher' && role !== 'parent' && role !== 'admin' && (
                <StudentSettings
                  currentUser={currentUser}
                  selectedGrade={selectedGrade}
                  parentAccessCode={parentAccessCode}
                  onUpdateProfile={async (name) => {
                    const p = name.split(' ');
                    return onSaveProfile(p[0] || '', '', p.slice(1).join(' '));
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'security' && <SharedSecuritySection />}

          {activeTab === 'account' && (
            <div className="flex flex-col gap-6 max-w-xl">
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                <h3 className="text-base font-bold text-[var(--text-main)]">Active Account & Device</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)]">Signed in email:</span>
                    <span className="font-bold text-[var(--text-main)] font-mono">{currentUser?.email || 'guest@guro.local'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[var(--border-color)]">
                    <span className="text-[var(--text-muted)]">User role:</span>
                    <span className="font-bold uppercase text-[var(--accent-primary-text)]">{role}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Storage environment:</span>
                    <span className="font-bold text-[var(--text-main)]">Browser Local Storage + Cloud Sync</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Log Out */}
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-rose-500">Sign Out of GURO</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">End your current session on this device.</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="size-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
