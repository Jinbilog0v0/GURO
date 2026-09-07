import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Users, School, Activity, Sparkles, CheckCircle2, RefreshCw, Calculator, BookOpen, Server, Database } from 'lucide-react';
import { toast } from '../../utils/toast';

interface OverviewMetrics {
  totalUsers: number;
  rolesBreakdown: Record<string, number>;
  totalClassrooms: number;
  activeClassrooms: number;
  totalProgressLogs: number;
  totalAiLogs: number;
}

interface SystemHealth {
  database: string;
  cache: string;
  aiEngine: string;
  itemBankStorage: string;
  serverTime: string;
}

interface RecentSync {
  id: number;
  eventId: string;
  student_id: string;
  classroom_id: string | null;
  subject: string;
  grade_level: number;
  topic: string;
  score: number;
  total_questions: number;
  timestamp: string;
}

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export function AdminOverview({ onNavigateTab }: AdminOverviewProps) {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [purgingCache, setPurgingCache] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setHealth(data.health);
        setRecentSyncs(data.recentSyncs || []);
      }
    } catch (e) {
      toast.error('Failed to load administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    try {
      const res = await apiFetch('/api/admin/cache-purge', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Cache purged successfully.');
        fetchOverview();
      } else {
        toast.error('Failed to purge cache.');
      }
    } catch (e) {
      toast.error('Network error while purging cache.');
    } finally {
      setPurgingCache(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="size-8 animate-spin text-[var(--accent-primary)]" />
        <p className="text-sm font-bold text-[var(--text-muted)]">Loading System Overview…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab('users')}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm hover:border-[#11428E]/40 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Total Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">
            {metrics?.totalUsers ?? 0}
          </div>
          <div className="flex gap-2 mt-2 text-[11px] text-[var(--text-muted)] font-semibold">
            <span>Teachers: {metrics?.rolesBreakdown?.teacher || 0}</span>
            <span>•</span>
            <span>Parents: {metrics?.rolesBreakdown?.parent || 0}</span>
            <span>•</span>
            <span>Students: {metrics?.rolesBreakdown?.student || 0}</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('classrooms')}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm hover:border-[#11428E]/40 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">School Sections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <School size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">
            {metrics?.totalClassrooms ?? 0}
          </div>
          <div className="flex gap-2 mt-2 text-[11px] text-emerald-600 font-bold">
            <span>{metrics?.activeClassrooms ?? 0} Active / Open Classrooms</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Telemetry Syncs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">
            {metrics?.totalProgressLogs ?? 0}
          </div>
          <div className="flex gap-2 mt-2 text-[11px] text-[var(--text-muted)] font-semibold">
            <span>Offline &amp; Cloud Batched Quiz Events</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('rate-limits')}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm hover:border-[#11428E]/40 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">AI Generations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">
            {metrics?.totalAiLogs ?? 0}
          </div>
          <div className="flex gap-2 mt-2 text-[11px] text-[var(--text-muted)] font-semibold">
            <span>Gemini API Lesson Ingestions</span>
          </div>
        </div>
      </div>

      {/* ── System Health & Quick Operations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="size-5 text-[#11428E]" />
              <h3 className="font-extrabold text-base text-[var(--text-main)]">Infrastructure Health</h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {health?.serverTime ? new Date(health.serverTime).toLocaleTimeString() : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-[var(--text-main)]">Database Connection</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> {health?.database || 'Healthy'}
              </span>
            </div>

            <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server size={16} className="text-purple-500" />
                <span className="text-xs font-bold text-[var(--text-main)]">Master Item Bank Cache</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {health?.cache || 'Ready'}
              </span>
            </div>

            <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-[var(--text-main)]">Gemini AI Service</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {health?.aiEngine || 'Configured'}
              </span>
            </div>

            <div className="p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-[var(--text-main)]">Offline Asset Bank</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {health?.itemBankStorage || 'Online'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] font-medium">
              Purge system and classroom cached item banks to enforce immediate reload:
            </span>
            <button
              onClick={handlePurgeCache}
              disabled={purgingCache}
              className="btn btn-secondary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={purgingCache ? "animate-spin" : ""} />
              <span>{purgingCache ? 'Purging…' : 'Purge All Caches'}</span>
            </button>
          </div>
        </div>

        {/* ── Real-Time Sync Stream Preview ── */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-500" />
              <h3 className="font-extrabold text-sm text-[var(--text-main)]">Live Telemetry Ingestion</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full animate-pulse">
              Live
            </span>
          </div>

          {recentSyncs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--text-muted)]">
              No recent progress events received yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
              {recentSyncs.map((log, idx) => {
                const percentage = Math.round((log.score / Math.max(1, log.total_questions)) * 100);
                const isPerfect = percentage >= 80;
                return (
                  <div 
                    key={log.id || idx} 
                    className="flex items-center justify-between p-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono font-bold text-[var(--text-main)] text-[11px]">{log.student_id}</span>
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        {log.subject === 'Mathematics' ? <Calculator size={10} className="text-[#11428E]" /> : <BookOpen size={10} className="text-emerald-500" />}
                        {log.topic} (G{log.grade_level})
                      </span>
                    </div>
                    <span className={`font-black text-xs ${isPerfect ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {log.score}/{log.total_questions} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
