import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Download, AlertTriangle, CheckCircle2, Calculator, BookOpen, RefreshCw, Award } from 'lucide-react';
import { toast } from '../../utils/toast';

interface GradeMetrics {
  totalAttempts: number;
  averageScore: number;
  masteryRate: number;
}

interface TopicMastery {
  key: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  totalAttempts: number;
  averageScore: number;
  masteryRate: number;
  isStruggling: boolean;
}

interface ReportsData {
  totalAssessments: number;
  mathAverage: number;
  englishAverage: number;
  gradeBreakdown: Record<string, GradeMetrics>;
  topicMastery: TopicMastery[];
}

export function AdminReportsView() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/reports/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('Failed to load institutional reports.');
      }
    } catch (e) {
      toast.error('Network error loading reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (!data || !data.topicMastery || data.topicMastery.length === 0) {
      toast.error('No assessment data available to export.');
      return;
    }

    const headers = ['Subject', 'Grade Level', 'Topic Name', 'Total Attempts', 'Average Score (%)', 'Mastery Rate (%)', 'Diagnostic Status'];
    const rows = data.topicMastery.map(t => [
      t.subject,
      `Grade ${t.gradeLevel}`,
      `"${t.topic}"`,
      t.totalAttempts,
      `${t.averageScore}%`,
      `${t.masteryRate}%`,
      t.isStruggling ? 'Priority Intervention Required' : 'On-Track / Mastered'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GURO_DepEd_Division_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('DepEd Division Report CSV exported.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="size-8 animate-spin text-[#11428E]" />
        <p className="text-sm font-bold text-[var(--text-muted)]">Computing Division Analytics…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header & Export Action ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 shadow-sm">
        <div>
          <h3 className="font-extrabold text-lg text-[var(--text-main)] flex items-center gap-2">
            <Award className="size-5 text-[#11428E]" />
            Division &amp; School-Wide Diagnostic Reports
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Aggregated competency telemetry aligned with DepEd MELC Grade 4–6 standards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchReports}
            className="btn btn-secondary text-xs px-3 py-2 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download size={13} />
            <span>Export DepEd CSV</span>
          </button>
        </div>
      </div>

      {/* ── High-Level Comparison Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Total Quizzes Logged</span>
          <div className="text-3xl font-extrabold text-[var(--text-main)] mt-2">
            {data?.totalAssessments ?? 0}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold">
            Across all enrolled sections &amp; offline syncs
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Mathematics Proficiency</span>
            <Calculator size={16} className="text-[#11428E]" />
          </div>
          <div className="text-3xl font-extrabold text-[#11428E] mt-2">
            {data?.mathAverage ?? 0}%
          </div>
          <div className="w-full bg-[var(--bg-main)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--border-color)]">
            <div 
              className="bg-[#11428E] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, data?.mathAverage ?? 0)}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">English Proficiency</span>
            <BookOpen size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {data?.englishAverage ?? 0}%
          </div>
          <div className="w-full bg-[var(--bg-main)] h-2 rounded-full mt-2 overflow-hidden border border-[var(--border-color)]">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, data?.englishAverage ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Grade Level Breakdown Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Grade 4', 'Grade 5', 'Grade 6'].map(grade => {
          const metrics = data?.gradeBreakdown?.[grade] || { totalAttempts: 0, averageScore: 0, masteryRate: 0 };
          return (
            <div key={grade} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[var(--text-main)]">{grade}</span>
                <span className="text-xs font-bold text-[var(--text-muted)]">{metrics.totalAttempts} attempts</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[var(--text-main)]">{metrics.averageScore}%</span>
                <span className="text-xs text-[var(--text-muted)] font-semibold">avg. score</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold pt-2 border-t border-[var(--border-color)]">
                <span>Mastery Rate:</span>
                <span className="text-emerald-600">{metrics.masteryRate}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Topic Mastery Matrix Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <h4 className="font-extrabold text-sm text-[var(--text-main)]">Competency Breakdown by Topic</h4>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {data?.topicMastery?.length || 0} active curriculum competencies
          </span>
        </div>

        {(!data?.topicMastery || data.topicMastery.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--text-muted)]">
            No assessment logs available yet to generate topic breakdowns.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]/60 text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Subject &amp; Grade</th>
                  <th className="py-3 px-4">Competency / Topic</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Average Score</th>
                  <th className="py-3 px-4">Mastery Rate</th>
                  <th className="py-3 px-4 text-right">Diagnostic Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {data.topicMastery.map((t, idx) => (
                  <tr key={t.key || idx} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-xs text-[var(--text-main)]">
                      <div className="flex items-center gap-1.5">
                        {t.subject === 'Mathematics' ? <Calculator size={13} className="text-[#11428E]" /> : <BookOpen size={13} className="text-emerald-600" />}
                        <span>{t.subject} (G{t.gradeLevel})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-xs text-[var(--text-main)]">
                      {t.topic}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-muted)] font-mono">
                      {t.totalAttempts}
                    </td>
                    <td className="py-3 px-4 font-bold text-xs text-[var(--text-main)]">
                      {t.averageScore}%
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-emerald-600">{t.masteryRate}%</span>
                        <div className="w-16 bg-[var(--bg-main)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, t.masteryRate)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.isStruggling ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <AlertTriangle size={11} /> Priority Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> On Track
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
