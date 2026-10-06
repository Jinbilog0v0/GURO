import React, { useEffect } from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';

interface SettingsHeaderProps {
  onBack: () => void;
  roleTitle: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  onBack,
  roleTitle,
  isDarkMode,
  onToggleTheme,
}) => {
  // Allow Esc key to exit settings cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <header className="h-[64px] border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Back to Workspace button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-main)] border border-[var(--border-color)] transition-all cursor-pointer shadow-xs active:scale-95 group"
        aria-label="Back to workspace"
        title="Back to workspace (Esc)"
      >
        <ArrowLeft className="size-4 text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors" />
        <span>Back to Workspace</span>
        <span className="hidden sm:inline-block text-[10px] font-mono text-[var(--text-muted)] border border-[var(--border-color)] rounded px-1 ml-1 bg-[var(--bg-card)]">Esc</span>
      </button>

      {/* Center: Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm sm:text-base font-extrabold text-[var(--text-main)] tracking-tight">
          {roleTitle}
        </h1>
        <span className="text-[11px] font-semibold text-[var(--text-muted)] hidden md:inline">
          · Settings & Preferences
        </span>
      </div>

      {/* Right: Theme Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="size-9 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all shadow-xs active:scale-95"
        >
          {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
