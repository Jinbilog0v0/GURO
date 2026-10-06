import React, { useState } from 'react';
import { Users, Key, Plus, Trash2 } from 'lucide-react';
import { toast } from '../../utils/toast';

interface LinkedChild {
  id: string;
  name: string;
  grade: number;
  accessCode: string;
}

interface ParentSettingsProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
  onSaveProfile: (firstName: string, middleName: string, lastName: string) => Promise<boolean>;
}

export const ParentSettings: React.FC<ParentSettingsProps> = ({
  currentUser,
  onSaveProfile,
}) => {
  const parts = currentUser?.name ? currentUser.name.split(' ') : ['Parent', ''];
  const [firstName, setFirstName] = useState(parts[0] || '');
  const [lastName, setLastName] = useState(parts.slice(1).join(' ') || '');

  // Mock linked children stored locally or seeded
  const [children, setChildren] = useState<LinkedChild[]>(() => {
    const cached = localStorage.getItem('guro_parent_linked_children');
    if (cached) {
      try { return JSON.parse(cached); } catch {}
    }
    return [
      { id: 'stud-1', name: 'Maria Santos', grade: 4, accessCode: 'GURO-P-7492' }
    ];
  });

  const [newAccessCode, setNewAccessCode] = useState('');

  // 4-Digit Parent PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newAccessCode.trim().toUpperCase();
    if (!code) return;
    if (children.some(c => c.accessCode === code)) {
      toast.error('This child is already linked to your account.');
      return;
    }
    const newChild: LinkedChild = {
      id: `stud-${Date.now()}`,
      name: `Student (${code.slice(-4)})`,
      grade: 4,
      accessCode: code,
    };
    const updated = [...children, newChild];
    setChildren(updated);
    localStorage.setItem('guro_parent_linked_children', JSON.stringify(updated));
    setNewAccessCode('');
    toast.success(`Successfully linked student with access code ${code}!`);
  };

  const handleUnlinkChild = (id: string, name: string) => {
    const updated = children.filter(c => c.id !== id);
    setChildren(updated);
    localStorage.setItem('guro_parent_linked_children', JSON.stringify(updated));
    toast.success(`Unlinked ${name} from your dashboard.`);
  };

  const handleSaveGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and Last names are required.');
      return;
    }
    await onSaveProfile(firstName.trim(), '', lastName.trim());
    toast.success('Guardian profile saved!');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match.');
      return;
    }
    localStorage.setItem('guro_parent_pin', newPin);
    setNewPin('');
    setConfirmPin('');
    toast.success('Parent Security PIN updated successfully!');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Guardian Profile */}
      <form onSubmit={handleSaveGuardian} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-main)] mb-1">Guardian Identity</h3>
          <p className="text-xs text-[var(--text-muted)]">Your guardian account information for school notifications.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="parent-first-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              First Name
            </label>
            <input
              id="parent-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="parent-last-name" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Last Name
            </label>
            <input
              id="parent-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs w-fit cursor-pointer active:scale-95"
        >
          Save Guardian Profile
        </button>
      </form>

      {/* Linked Children Manager */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">Linked Students Roster</h3>
            <p className="text-xs text-[var(--text-muted)]">Manage the children connected to your parental supervision portal.</p>
          </div>
        </div>

        {/* Existing Children Pills */}
        <div className="flex flex-col gap-2.5">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]"
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-violet-500/10 text-violet-600 font-bold flex items-center justify-center text-xs">
                  {child.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">{child.name}</h4>
                  <p className="text-xs text-[var(--text-muted)]">Grade {child.grade} · Code: {child.accessCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnlinkChild(child.id, child.name)}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Unlink Child"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Link Child Form */}
        <form onSubmit={handleLinkChild} className="flex gap-3 mt-2">
          <input
            type="text"
            required
            placeholder="Enter Student Access Code (e.g. GURO-P-7492)"
            value={newAccessCode}
            onChange={(e) => setNewAccessCode(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] uppercase tracking-wider font-mono focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            <span>Link Child</span>
          </button>
        </form>
      </div>

      {/* 4-Digit Parent Security PIN */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Key className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)]">4-Digit Parent Security PIN</h3>
            <p className="text-xs text-[var(--text-muted)]">Protects parent dashboard analytics from child tampering.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePin} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-parent-pin" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              New 4-Digit PIN
            </label>
            <input
              id="new-parent-pin"
              type="password"
              maxLength={4}
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-center font-mono text-base tracking-widest text-[var(--text-main)] focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-parent-pin" className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Confirm 4-Digit PIN
            </label>
            <input
              id="confirm-parent-pin"
              type="password"
              maxLength={4}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-center font-mono text-base tracking-widest text-[var(--text-main)] focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="sm:col-span-2 py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs w-fit cursor-pointer active:scale-95"
          >
            Update Security PIN
          </button>
        </form>
      </div>
    </div>
  );
};
