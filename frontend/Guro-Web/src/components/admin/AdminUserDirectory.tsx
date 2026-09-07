import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Users, Search, KeyRound, Trash2, Edit3, RefreshCw, X, AlertCircle } from 'lucide-react';
import { toast } from '../../utils/toast';

interface UserRecord {
  id: number;
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  classroomId?: string | null;
  parentAccessToken?: string | null;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  schoolName?: string | null;
  schoolIdNumber?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
}

const ROLE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  teacher: { bg: 'bg-[#11428E]/10 border-[#11428E]/30', text: 'text-[#11428E]', label: 'Teacher' },
  parent: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600', label: 'Parent' },
  student: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600', label: 'Student' },
  admin: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-600', label: 'Admin' },
  developer: { bg: 'bg-purple-500/10 border-purple-500/30', text: 'text-purple-600', label: 'Developer' },
  'lesson-builder': { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-600', label: 'Lesson Builder' },
};

export function AdminUserDirectory() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState('teacher');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Password Reset Modal
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Delete User Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set('search', search.trim());
      if (selectedRole !== 'all') q.set('role', selectedRole);

      const res = await apiFetch(`/api/admin/users?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to load user accounts.');
      }
    } catch (e) {
      toast.error('Network error loading users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setUpdatingRole(true);
    try {
      const res = await apiFetch(`/api/admin/users/${editingUser.id}/update-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${newRole}.`);
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update role.');
      }
    } catch (e) {
      toast.error('Error updating user role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser || !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) {
      toast.error('Password must be at least 8 characters and contain letters, numbers, and at least one special symbol.');
      return;
    }
    setSubmittingReset(true);
    try {
      const res = await apiFetch(`/api/admin/users/${resettingUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        toast.success(`Password reset for ${resettingUser.name}.`);
        setResettingUser(null);
        setNewPassword('');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to reset password.');
      }
    } catch (e) {
      toast.error('Error resetting password.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setSubmittingDelete(true);
    try {
      const res = await apiFetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`User ${deletingUser.name} deleted.`);
        setDeletingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete user.');
      }
    } catch (e) {
      toast.error('Error deleting user.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters and Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'teacher', 'parent', 'student', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedRole === r
                  ? 'bg-[#11428E] text-white shadow-sm'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[#11428E]/40'
              }`}
            >
              {r === 'admin' ? 'Admin / Dev' : r}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, ID…"
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[#11428E]"
            />
          </div>
          <button type="submit" className="btn btn-primary text-xs px-3 py-1.5 font-bold cursor-pointer">
            Search
          </button>
          <button 
            type="button" 
            onClick={() => { setSearch(''); fetchUsers(); }}
            className="btn btn-secondary text-xs px-2.5 py-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* ── User Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-[var(--text-muted)]">
            <RefreshCw className="size-6 animate-spin text-[#11428E]" />
            <span className="text-xs font-bold">Loading accounts…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-center text-[var(--text-muted)]">
            <Users className="size-8 opacity-40" />
            <p className="text-sm font-bold text-[var(--text-main)]">No users found</p>
            <p className="text-xs">Try adjusting your search filter or role selector.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]/60 text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Identifier / Code</th>
                  <th className="py-3 px-4">Associated Room</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {users.map(u => {
                  const badge = ROLE_BADGES[u.role] || { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-500', label: u.role };
                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center font-bold text-xs text-[var(--text-main)]">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-[var(--text-main)] text-xs">{u.name || 'Anonymous User'}</span>
                            <span className="text-[11px] text-[var(--text-muted)]">{u.email}</span>
                            {u.schoolName && (
                              <span className="text-[10px] text-[var(--text-dark)] font-medium">🏫 {u.schoolName}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                          {u.role === 'teacher' && (
                            u.verificationStatus === 'pending' ? (
                              <span className="text-[9px] font-extrabold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                ⏳ Pending
                              </span>
                            ) : u.verificationStatus === 'rejected' ? (
                              <span className="text-[9px] font-extrabold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                ✕ Rejected
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                ✓ Verified
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                        {u.userId}
                        {u.parentAccessToken && (
                          <div className="text-[10px] text-emerald-600 font-bold">Code: {u.parentAccessToken}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-main)]">
                        {u.classroomId ? (
                          <span className="bg-[#11428E]/10 text-[#11428E] px-2 py-0.5 rounded-md font-bold">
                            {u.classroomId}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-muted)]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setEditingUser(u); setNewRole(u.role); }}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#11428E] hover:bg-[#11428E]/10 transition-all cursor-pointer"
                            title="Change Role"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => { setResettingUser(u); setNewPassword(''); }}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-500/10 transition-all cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Role Update Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[var(--text-main)]">Change Role</h4>
              <button onClick={() => setEditingUser(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Modify access permissions for <strong className="text-[var(--text-main)]">{editingUser.name}</strong> ({editingUser.email}):
            </p>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-bold focus:outline-none focus:border-[#11428E]"
            >
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
              <option value="developer">Developer</option>
              <option value="lesson-builder">Lesson Builder</option>
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="btn btn-secondary text-xs px-3.5 py-2 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={updatingRole}
                className="btn btn-primary text-xs px-4 py-2 font-bold cursor-pointer disabled:opacity-50"
              >
                {updatingRole ? 'Updating…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Reset Modal ── */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[var(--text-main)]">Reset Password</h4>
              <button onClick={() => setResettingUser(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Set a new password for <strong className="text-[var(--text-main)]">{resettingUser.name}</strong>:
            </p>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="btn btn-secondary text-xs px-3.5 py-2 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={submittingReset || newPassword.length < 6}
                className="btn bg-amber-500 text-white hover:bg-amber-600 text-xs px-4 py-2 font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {submittingReset ? 'Resetting…' : 'Apply Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle size={20} />
              <h4 className="font-extrabold text-base">Delete User Account</h4>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to delete <strong className="text-[var(--text-main)]">{deletingUser.name}</strong> ({deletingUser.email})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="btn btn-secondary text-xs px-3.5 py-2 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={submittingDelete}
                className="btn bg-rose-600 text-white hover:bg-rose-700 text-xs px-4 py-2 font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {submittingDelete ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
