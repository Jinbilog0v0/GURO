import React, { useState, useEffect } from 'react';
import { StudentSettings } from './StudentSettings';
import { TeacherSettings } from './TeacherSettings';
import { ParentSettings } from './ParentSettings';
import { AdminSettings } from './AdminSettings';
import { SharedSecuritySection } from './SharedSecuritySection';
import { ThemePreferencesSection } from './ThemePreferencesSection';
import { User, Lock, LogOut, Shield, School, Users, GraduationCap, X, Sliders, Palette } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    emailVerifiedAt?: string | null;
  } | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSaveProfile: (firstName: string, middleName: string, lastName: string) => Promise<boolean>;
  selectedGrade?: number;
  parentAccessCode?: string;
}

type SettingsTab = 'profile' | 'preferences' | 'security' | 'account';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onSaveProfile,
  selectedGrade = 4,
  parentAccessCode = 'GURO-P-7492',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Handle Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role = currentUser?.role?.toLowerCase() || 'student';
  const roleTitle = role === 'teacher'
    ? 'Teacher Workspace'
    : role === 'parent'
    ? 'Parent Supervision'
    : role === 'admin'
    ? 'Super Admin Console'
    : 'Student Learning';

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-[var(--bg-card)] text-[var(--text-main)] w-full max-w-5xl xl:max-w-6xl h-[94vh] sm:h-[88vh] max-h-[800px] rounded-t-3xl sm:rounded-3xl border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="h-14 sm:h-16 px-4 sm:px-8 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="size-8 sm:size-9 rounded-xl bg-gradient-to-br from-[#11428E] to-[#A01322] flex items-center justify-center text-white shadow-xs shrink-0">
              <Sliders className="size-4" />
            </div>
            <div className="min-w-0">
              <h2 id="settings-modal-title" className="text-sm sm:text-base font-extrabold text-[var(--text-main)] tracking-tight truncate">
                {roleTitle} Settings
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-medium hidden sm:block">
                Manage your credentials, classroom preferences, and account security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="size-8 sm:size-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all shadow-xs active:scale-95"
              aria-label="Close settings"
              title="Close (Esc)"
            >
              <X size={16} className="sm:size-[18px]" />
            </button>
          </div>
        </div>

        {/* ── Modal Two-Column Body ── */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Small Menu Bar */}
          <aside className="w-full md:w-64 shrink-0 p-2.5 sm:p-4 md:p-5 border-b md:border-b-0 md:border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto md:overflow-x-visible">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink md:whitespace-normal text-left ${
                activeTab === 'profile'
                  ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs font-extrabold ring-1 ring-[var(--accent-primary)]/20'
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
              <span className="truncate">{role === 'student' ? 'Learning Profile' : 'Profile & Classroom'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink md:whitespace-normal text-left ${
                activeTab === 'preferences'
                  ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs font-extrabold ring-1 ring-[var(--accent-primary)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <Palette className="size-4 shrink-0" />
              <span className="truncate">Theme & Preferences</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink md:whitespace-normal text-left ${
                activeTab === 'security'
                  ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs font-extrabold ring-1 ring-[var(--accent-primary)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <Lock className="size-4 shrink-0" />
              <span className="truncate">Password & Security</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink md:whitespace-normal text-left ${
                activeTab === 'account'
                  ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] shadow-xs font-extrabold ring-1 ring-[var(--accent-primary)]/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <User className="size-4 shrink-0" />
              <span className="truncate">Session & Account</span>
            </button>
          </aside>

          {/* Right Column: Filled, Uncompressed Content Canvas */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
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
                    onNavigateToPreferences={() => setActiveTab('preferences')}
                  />
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <ThemePreferencesSection
                isDarkMode={isDarkMode}
                onToggleTheme={onToggleTheme}
                role={role}
              />
            )}

            {activeTab === 'security' && (
              <SharedSecuritySection
                currentUser={currentUser}
                onEmailVerified={(verifiedAt) => {
                  if (currentUser) {
                    currentUser.emailVerifiedAt = verifiedAt;
                  }
                }}
              />
            )}

            {activeTab === 'account' && (
              <div className="flex flex-col gap-6 w-full max-w-2xl">
                <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
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
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
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
    </div>
  );
};
