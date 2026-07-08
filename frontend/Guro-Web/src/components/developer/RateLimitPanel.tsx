import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../utils/api';
import {
  Zap, Shield, Clock, Users, Trash2, Plus, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, ToggleLeft, ToggleRight,
} from 'lucide-react';

interface RateLimitConfig {
  id: number;
  role: string;
  max_requests: number;
  window_minutes: number;
  is_enabled: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UsageUser {
  user_id: number;
  name: string;
  email: string;
  count: number;
  over_limit: boolean;
}

interface RoleUsage {
  role: string;
  max_requests: number;
  window_minutes: number;
  users: UsageUser[];
}

const ROLE_OPTIONS = ['teacher', 'lesson-builder', 'developer'];

const ROLE_COLORS: Record<string, string> = {
  teacher: '#11428E',
  'lesson-builder': '#7C3AED',
  developer: '#CE1126',
};

function formatWindow(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function RateLimitPanel() {
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [usage, setUsage] = useState<RoleUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageLoading, setUsageLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add-form state
  const [newRole, setNewRole] = useState('teacher');
  const [newMax, setNewMax] = useState(5);
  const [newWindow, setNewWindow] = useState(60);
  const [newNotes, setNewNotes] = useState('');

  // Edit-in-place
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RateLimitConfig>>({});

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccessMsg(msg);
    else setError(msg);
    setTimeout(() => { setSuccessMsg(null); setError(null); }, 3500);
  };

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/dev/rate-limits');
      if (res.ok) setConfigs(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  const fetchUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const res = await apiFetch('/api/dev/rate-limits/usage');
      if (res.ok) setUsage(await res.json());
    } catch { /* silently fail */ }
    finally { setUsageLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigs();
    fetchUsage();
  }, [fetchConfigs, fetchUsage]);

  const handleSave = async (role: string, values: Partial<RateLimitConfig>) => {
    setSaving(role);
    try {
      const res = await apiFetch(`/api/dev/rate-limits/${role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        flash(`Rate limit for "${role}" saved.`, 'success');
        setEditingId(null);
        setEditValues({});
        await fetchConfigs();
        await fetchUsage();
      } else {
        const d = await res.json();
        flash(d.message || 'Failed to save.', 'error');
      }
    } catch { flash('Network error.', 'error'); }
    finally { setSaving(null); }
  };

  const handleDelete = async (role: string) => {
    if (!confirm(`Remove rate limit rule for "${role}"?`)) return;
    try {
      await apiFetch(`/api/dev/rate-limits/${role}`, { method: 'DELETE' });
      flash(`Removed rule for "${role}".`, 'success');
      await fetchConfigs();
      await fetchUsage();
    } catch { flash('Failed to delete.', 'error'); }
  };

  const handleAdd = async () => {
    await handleSave(newRole, {
      max_requests: newMax,
      window_minutes: newWindow,
      is_enabled: true,
      notes: newNotes || null,
    });
    setShowAddForm(false);
    setNewRole('teacher');
    setNewMax(5);
    setNewWindow(60);
    setNewNotes('');
  };

  const toggleEnabled = async (cfg: RateLimitConfig) => {
    await handleSave(cfg.role, { ...cfg, is_enabled: !cfg.is_enabled });
  };

  const startEdit = (cfg: RateLimitConfig) => {
    setEditingId(cfg.id);
    setEditValues({
      max_requests: cfg.max_requests,
      window_minutes: cfg.window_minutes,
      is_enabled: cfg.is_enabled,
      notes: cfg.notes ?? '',
    });
  };

  const usageByRole = (role: string) => usage.find(u => u.role === role);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#CE1126]/10 border border-[#CE1126]/20 flex items-center justify-center">
            <Shield size={18} className="text-[#CE1126]" />
          </div>
          <div>
            <h2 className="text-[16px] font-extrabold text-[var(--text-main)] m-0">AI Ingestion Rate Limits</h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Control how many times teachers can call the AI generator per time window.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchConfigs(); fetchUsage(); }}
            className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw size={12} className={usageLoading || loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 bg-[#CE1126]/10 border border-[#CE1126]/30 text-[#CE1126] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#CE1126]/20 transition-all"
          >
            <Plus size={12} />
            Add Rule
          </button>
        </div>
      </div>

      {/* ── Feedback banners ── */}
      {error && (
        <div className="flex items-center gap-2 bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] px-4 py-2.5 rounded-xl text-sm font-semibold">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] px-4 py-2.5 rounded-xl text-sm font-semibold">
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}

      {/* ── Add New Rule Form ── */}
      {showAddForm && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[16px] p-5 flex flex-col gap-4">
          <p className="text-[13px] font-extrabold text-[var(--text-main)] m-0">New Rate Limit Rule</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] font-semibold"
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Max Requests</label>
              <input
                type="number" min={1} max={1000} value={newMax}
                onChange={e => setNewMax(Number(e.target.value))}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Window (minutes)</label>
              <input
                type="number" min={1} max={1440} value={newWindow}
                onChange={e => setNewWindow(Number(e.target.value))}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Notes (optional)</label>
              <input
                type="text" value={newNotes} placeholder="e.g. conservative daily cap"
                onChange={e => setNewNotes(e.target.value)}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-muted)]">
              <Zap size={13} className="text-[#F59E0B]" />
              <span>Limit: <strong className="text-[var(--text-main)]">{newMax}</strong> requests per <strong className="text-[var(--text-main)]">{formatWindow(newWindow)}</strong></span>
            </div>
            <div className="flex-1" />
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold hover:bg-white/6 transition-all">Cancel</button>
            <button
              onClick={handleAdd}
              disabled={saving === newRole}
              className="px-4 py-2 rounded-lg bg-[#CE1126] text-white text-xs font-bold hover:bg-[#b30f20] transition-all disabled:opacity-50"
            >
              {saving === newRole ? 'Saving…' : 'Create Rule'}
            </button>
          </div>
        </div>
      )}

      {/* ── Config Cards ── */}
      {loading ? (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm">Loading rate limit configs…</div>
      ) : configs.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-[16px] p-8 text-center">
          <Shield size={28} className="mx-auto mb-3 text-[var(--text-dark)]" />
          <p className="text-[14px] font-bold text-[var(--text-main)] mb-1">No Rate Limits Configured</p>
          <p className="text-[12px] text-[var(--text-muted)]">Teachers can call the AI generator unlimited times. Add a rule above to restrict usage.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {configs.map(cfg => {
            const accentColor = ROLE_COLORS[cfg.role] ?? '#6B7280';
            const roleUsage = usageByRole(cfg.role);
            const isEditing = editingId === cfg.id;
            const isSavingThis = saving === cfg.role;
            const overLimitUsers = roleUsage?.users.filter(u => u.over_limit) ?? [];

            return (
              <div
                key={cfg.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[16px] overflow-hidden"
                style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}
              >
                {/* ── Card Header ── */}
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex-1 flex items-center gap-3">
                    <div
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                    >
                      {cfg.role}
                    </div>
                    {!cfg.is_enabled && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--text-dark)]/10 text-[var(--text-dark)] text-[10px] font-bold uppercase">Disabled</span>
                    )}
                    {overLimitUsers.length > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] text-[10px] font-bold">
                        <AlertTriangle size={10} /> {overLimitUsers.length} over limit
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} style={{ color: accentColor }} />
                      <span className="font-bold text-[var(--text-main)]">{cfg.max_requests}</span> req
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatWindow(cfg.window_minutes)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle enabled */}
                    <button
                      onClick={() => toggleEnabled(cfg)}
                      title={cfg.is_enabled ? 'Disable rule' : 'Enable rule'}
                      className="p-1.5 rounded-lg hover:bg-white/6 transition-all"
                    >
                      {cfg.is_enabled
                        ? <ToggleRight size={18} className="text-[var(--success)]" />
                        : <ToggleLeft size={18} className="text-[var(--text-dark)]" />}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(cfg)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-semibold hover:bg-white/6 transition-all"
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(cfg.role)}
                      className="p-1.5 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--danger)] transition-all"
                      title="Delete rule"
                    >
                      <Trash2 size={14} />
                    </button>
                    {/* Expand usage */}
                    <button
                      onClick={() => setExpandedRole(v => v === cfg.role ? null : cfg.role)}
                      className="p-1.5 rounded-lg hover:bg-white/6 transition-all text-[var(--text-muted)]"
                      title="View usage"
                    >
                      {expandedRole === cfg.role ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* ── Inline Edit Form ── */}
                {isEditing && (
                  <div className="border-t border-[var(--border-color)] bg-[var(--bg-main)] px-5 py-4 flex flex-col gap-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1">Edit Rule — {cfg.role}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Max Requests</label>
                        <input
                          type="number" min={1} max={1000}
                          value={editValues.max_requests ?? cfg.max_requests}
                          onChange={e => setEditValues(v => ({ ...v, max_requests: Number(e.target.value) }))}
                          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] font-semibold"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Window (minutes)</label>
                        <input
                          type="number" min={1} max={1440}
                          value={editValues.window_minutes ?? cfg.window_minutes}
                          onChange={e => setEditValues(v => ({ ...v, window_minutes: Number(e.target.value) }))}
                          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)] font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Notes</label>
                      <input
                        type="text"
                        value={editValues.notes ?? cfg.notes ?? ''}
                        onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-main)]"
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2">
                        <Zap size={12} className="text-[#F59E0B]" />
                        <span>Preview: <strong className="text-[var(--text-main)]">{editValues.max_requests ?? cfg.max_requests}</strong> req / <strong className="text-[var(--text-main)]">{formatWindow((editValues.window_minutes ?? cfg.window_minutes) as number)}</strong></span>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleSave(cfg.role, { ...cfg, ...editValues })}
                        disabled={isSavingThis}
                        className="px-4 py-2 rounded-lg bg-[#CE1126] text-white text-xs font-bold hover:bg-[#b30f20] transition-all disabled:opacity-50"
                      >
                        {isSavingThis ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Usage Breakdown ── */}
                {expandedRole === cfg.role && (
                  <div className="border-t border-[var(--border-color)] px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Users size={13} className="text-[var(--text-muted)]" />
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                        Active usage — last {formatWindow(cfg.window_minutes)}
                      </span>
                    </div>
                    {usageLoading ? (
                      <p className="text-[12px] text-[var(--text-muted)]">Loading usage…</p>
                    ) : !roleUsage || roleUsage.users.length === 0 ? (
                      <p className="text-[12px] text-[var(--text-muted)]">No usage in this window.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {roleUsage.users.map(u => {
                          const pct = Math.min(100, Math.round((u.count / cfg.max_requests) * 100));
                          return (
                            <div key={u.user_id} className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-4 py-3 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-[var(--text-main)] truncate">{u.name}</p>
                                <p className="text-[10.5px] text-[var(--text-muted)] truncate">{u.email}</p>
                                <div className="mt-1.5 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden w-full">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: u.over_limit ? 'var(--danger)' : accentColor,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-[14px] font-extrabold ${u.over_limit ? 'text-[var(--danger)]' : 'text-[var(--text-main)]'}`}>
                                  {u.count}<span className="text-[11px] font-semibold text-[var(--text-muted)]">/{cfg.max_requests}</span>
                                </p>
                                {u.over_limit && <p className="text-[10px] text-[var(--danger)] font-bold">OVER LIMIT</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {cfg.notes && (
                      <p className="mt-3 text-[11px] italic text-[var(--text-muted)] border-t border-[var(--border-color)] pt-2">📝 {cfg.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
