import { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/api';
import { toast } from '../utils/toast';
import { 
  BarChart3, 
  RotateCw, 
  Loader2, 
  FolderOpen, 
  Inbox, 
  Calculator, 
  BookOpen, 
  School, 
  GraduationCap, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Users, 
  Layers, 
  Award, 
  Zap, 
  ShieldCheck, 
  Key, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Radio, 
  Copy, 
  Target,
  Calendar
} from 'lucide-react';
import { RateLimitPanel } from '../components/developer/RateLimitPanel';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminUserDirectory } from '../components/admin/AdminUserDirectory';
import { AdminTeacherVerifications } from '../components/admin/AdminTeacherVerifications';
import { AdminClassroomsDirectory } from '../components/admin/AdminClassroomsDirectory';
import { AdminCurriculumManager } from '../components/admin/AdminCurriculumManager';
import { AdminReportsView } from '../components/admin/AdminReportsView';

function formatRelativeTime(timestamp: string): string {
  try {
    const time = new Date(timestamp).getTime();
    if (isNaN(time)) return timestamp;
    const diffSec = Math.floor((Date.now() - time) / 1000);

    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return timestamp;
  }
}

function StatCard({ label, value, accentColor, valueColor }: {
  label: string; value: React.ReactNode; accentColor: string; valueColor?: string;
}) {
  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[16px] p-[18px_20px_20px] overflow-hidden shadow-sm">
      <span className="absolute left-0 top-4 bottom-4 w-1 rounded-[0_4px_4px_0]" style={{ background: accentColor }} />
      <div className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-[var(--text-muted)]">{label}</div>
      <div className="text-[34px] font-extrabold mt-2 text-[var(--text-main)]" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
    </div>
  );
}

export interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  classroomId?: string | null;
}

export interface DashboardSpaceProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null;
  stagedQuestionsCount: number;
  progressLogs?: SyncedEvent[];
  progressLoading?: boolean;
  onNavigate?: (tab: 'teacher' | 'parent' | 'lesson-builder' | 'dashboard', subTab?: string) => void;
}

interface ItemBankStructure {
  [subject: string]: {
    [grade: string]: {
      [topic: string]: any;
    };
  };
}

interface QuestionItem {
  id?: string;
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  feedback?: string | { en?: string; fil?: string };
  type?: string;
  matchingPairs?: Record<string, string> | null;
  difficulty?: string;
  category?: string;
}

export function DashboardSpace({ 
  currentUser, 
  stagedQuestionsCount,
  progressLogs = [],
  progressLoading = false,
  onNavigate
}: DashboardSpaceProps) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'verifications' | 'classrooms' | 'curriculum' | 'rate-limits' | 'reports'>('overview');

  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({
    subjects: 0,
    topics: 0,
    questions: 0,
  });
  const [itemBankData, setItemBankData] = useState<ItemBankStructure>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (key: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getTopicQuestions = (topicNode: Record<string, Record<string, QuestionItem[]>> | undefined) => {
    const list: QuestionItem[] = [];

    if (!topicNode) return list;

    Object.keys(topicNode).forEach(diff => {
      if (diff === 'studyContent') return;
      const diffNode = topicNode[diff];
      if (diffNode && typeof diffNode === 'object') {
        Object.keys(diffNode).forEach(cat => {
          const qList = diffNode[cat];
          if (Array.isArray(qList)) {
            (qList as QuestionItem[]).forEach((q: QuestionItem) => {
              list.push({
                id: q.id || '',
                questionText: q.questionText || '',
                difficulty: diff,
                category: cat,
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                feedback: q.feedback,
                type: q.type,
                matchingPairs: q.matchingPairs,
              });
            });
          }
        });
      }
    });

    return list;
  };

  const isTeacher = currentUser?.role === 'teacher';
  const getTeacherClassCode = () => {
    if (!isTeacher) return null;
    if (currentUser?.classroomId) return currentUser.classroomId;
    if (currentUser?.userId) {
      const userScoped = localStorage.getItem(`guro_teacher_classroom_code_${currentUser.userId}`);
      if (userScoped) return userScoped;
    }
    const legacy = localStorage.getItem('guro_teacher_classroom_code');
    return legacy || null;
  };
  const classCode = getTeacherClassCode();

  const fetchStats = async () => {
    setLoading(true);
    try {
      let db: any = {};
      if (isTeacher) {
        if (classCode) {
          const response = await apiFetch(`/api/classroom/verify?code=${encodeURIComponent(classCode)}`);
          if (response.ok) {
            const data = await response.json();
            db = data.customItemBank || {};
          }
        } else {
          // Brand new teacher with no classroom has an empty item bank / clean blank dashboard
          db = {};
        }
      } else {
        const response = await apiFetch('/api/item-bank');
        if (response.ok) {
          db = await response.json();
        }
      }

      setItemBankData(db);

      const subjectsCount = Object.keys(db).length;
      const topicsList: string[] = [];
      let totalQuestions = 0;

      Object.keys(db).forEach(sub => {
        if (db[sub]) {
          Object.keys(db[sub]).forEach(gradeKey => {
            if (db[sub][gradeKey]) {
              Object.keys(db[sub][gradeKey]).forEach(topicKey => {
                if (!topicsList.includes(topicKey)) {
                  topicsList.push(topicKey);
                }
                const topicNode = db[sub][gradeKey][topicKey];
                if (topicNode && typeof topicNode === 'object') {
                  Object.keys(topicNode).forEach(diff => {
                    if (diff === 'studyContent') return;
                    const diffNode = topicNode[diff];
                    if (diffNode && typeof diffNode === 'object') {
                      Object.keys(diffNode).forEach(cat => {
                        const qList = diffNode[cat];
                        if (Array.isArray(qList)) {
                          totalQuestions += qList.length;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      setDbStats({
        subjects: subjectsCount,
        topics: topicsList.length,
        questions: totalQuestions,
      });
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  // Activity feed filtering & smart insights
  const [activityFilter, setActivityFilter] = useState<'all' | 'struggling' | 'mastered'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // Compute student stats
  const filteredLogs = progressLogs.filter((log) => {
    return !classCode || !log.classroomId || log.classroomId.toUpperCase() === classCode.toUpperCase();
  });

  const uniqueStudentsCount = new Set(filteredLogs.map(l => l.studentId)).size;
  
  const getAverageAccuracy = () => {
    if (filteredLogs.length === 0) return 0;
    const totalPercentage = filteredLogs.reduce((sum, log) => {
      return sum + (log.score / log.totalQuestions) * 100;
    }, 0);
    return Math.round(totalPercentage / filteredLogs.length);
  };

  const avgAccuracy = getAverageAccuracy();
  const latestSyncs = filteredLogs.slice(0, 5);

  const { bottlenecks, strugglingLogs, masteredLogs } = useMemo(() => {
    const topicMap = new Map<string, { totalScore: number; totalQuestions: number; count: number; strugglingCount: number; subject: string; gradeLevel: number }>();
    const struggling: SyncedEvent[] = [];
    const mastered: SyncedEvent[] = [];

    filteredLogs.forEach(log => {
      const pct = log.totalQuestions > 0 ? (log.score / log.totalQuestions) * 100 : 0;
      if (pct < 50) struggling.push(log);
      if (pct >= 80) mastered.push(log);

      const existing = topicMap.get(log.topic) || {
        totalScore: 0,
        totalQuestions: 0,
        count: 0,
        strugglingCount: 0,
        subject: log.subject,
        gradeLevel: log.gradeLevel,
      };

      existing.totalScore += log.score;
      existing.totalQuestions += log.totalQuestions;
      existing.count += 1;
      if (pct < 50) existing.strugglingCount += 1;

      topicMap.set(log.topic, existing);
    });

    const bList = Array.from(topicMap.entries())
      .map(([topic, data]) => {
        const avg = data.totalQuestions > 0 ? Math.round((data.totalScore / data.totalQuestions) * 100) : 0;
        return {
          topic,
          subject: data.subject,
          gradeLevel: data.gradeLevel,
          attempts: data.count,
          avgAccuracy: avg,
          strugglingCount: data.strugglingCount,
        };
      })
      .filter(item => item.avgAccuracy < 60 || item.strugglingCount >= 2)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

    return {
      bottlenecks: bList,
      strugglingLogs: struggling,
      masteredLogs: mastered,
    };
  }, [filteredLogs]);

  const displayActivities = useMemo(() => {
    if (activityFilter === 'struggling') return strugglingLogs;
    if (activityFilter === 'mastered') return masteredLogs;
    return filteredLogs;
  }, [activityFilter, filteredLogs, strugglingLogs, masteredLogs]);

  const handleCopyCode = (codeToCopy: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    toast.success(`Pairing code ${codeToCopy} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Render Admin Governance Cockpit ──
  if (isAdmin) {
    return (
      <div className="fade-in w-full flex flex-col gap-6 text-[var(--text-main)] pb-12">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#CE1126]/10 text-[#CE1126] border border-[#CE1126]/20 flex items-center justify-center">
              <Shield className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-main)] m-0">
                  Staff &amp; IT Administration Console
                </h1>
                <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#CE1126]/10 text-[#CE1126] border border-[#CE1126]/20">
                  Root
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5 mb-0">
                School-wide identity management, classroom rosters, item bank governance, and division diagnostics.
              </p>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('lesson-builder')}
              className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <Zap size={14} />
              <span>Open Lesson Ingestor</span>
            </button>
          )}
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] pb-3">
          {[
            { id: 'overview', label: 'Overview & Health', icon: BarChart3 },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'verifications', label: 'Teacher Verifications', icon: ShieldCheck },
            { id: 'classrooms', label: 'School Classrooms', icon: School },
            { id: 'curriculum', label: 'Master Curriculum', icon: Layers },
            { id: 'rate-limits', label: 'AI & Rate Limits', icon: Shield },
            { id: 'reports', label: 'Division Reports', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#11428E] text-white shadow-sm'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[#11428E]/40 hover:text-[var(--text-main)]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Sub-Tab Content */}
        {adminTab === 'overview' && <AdminOverview onNavigateTab={t => setAdminTab(t as any)} />}
        {adminTab === 'users' && <AdminUserDirectory />}
        {adminTab === 'verifications' && <AdminTeacherVerifications />}
        {adminTab === 'classrooms' && <AdminClassroomsDirectory />}
        {adminTab === 'curriculum' && <AdminCurriculumManager />}
        {adminTab === 'rate-limits' && <RateLimitPanel />}
        {adminTab === 'reports' && <AdminReportsView />}
      </div>
    );
  }

  // ── Render Teacher / Standard Space ──
  return (
    <div className="fade-in w-full flex flex-col gap-6 text-[var(--text-main)] pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-start gap-[14px]">
          <div className="w-[46px] h-[46px] shrink-0 rounded-[13px] bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] flex items-center justify-center">
            <BarChart3 className="size-[23px]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-[var(--text-main)] m-0">
                {isTeacher && currentUser?.name ? `Welcome back, ${currentUser.name}!` : 'Database & System Dashboard'}
              </h1>
              {isTeacher && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream Active
                </span>
              )}
            </div>
            <p className="text-[13px] text-[var(--text-muted)] font-medium mt-1 mb-0">
              {isTeacher 
                ? 'Real-time student activity feed, classroom telemetry, and intervention alerts.' 
                : 'Real-time telemetry and overview of GURO curriculum assets.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {isTeacher && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold shadow-xs">
              <Calendar size={13} className="text-sky-500 shrink-0" />
              <span>S.Y. 2026-2027 • Quarter 1</span>
            </div>
          )}
          <button
            onClick={fetchStats}
            className="btn btn-secondary flex items-center gap-2 text-xs cursor-pointer shrink-0 py-2 px-3 rounded-xl"
            disabled={loading}
          >
            {loading ? <><Loader2 className="size-3.5 animate-spin" />Fetching...</> : <><RotateCw className="size-3.5" />Refresh Data</>}
          </button>
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isTeacher ? (
          <>
            <StatCard label="Active Student Devices" value={progressLoading && filteredLogs.length === 0 ? '–' : uniqueStudentsCount} accentColor="#11428E" />
            <StatCard label="Total Synced Quizzes" value={progressLoading && filteredLogs.length === 0 ? '–' : filteredLogs.length} accentColor="#CE1126" />
            <StatCard label="Classroom Accuracy" value={progressLoading && filteredLogs.length === 0 ? '–' : `${avgAccuracy}%`} accentColor="#16A34A" valueColor={avgAccuracy >= 80 ? '#16A34A' : avgAccuracy >= 50 ? '#E8890C' : '#CE1126'} />
            <StatCard label="Classroom Topics" value={loading ? '–' : dbStats.topics} accentColor="#E8890C" />
          </>
        ) : (
          <>
            <StatCard label="Subjects Loaded" value={loading ? '–' : dbStats.subjects} accentColor="#11428E" />
            <StatCard label="Unique Topics" value={loading ? '–' : dbStats.topics} accentColor="#CE1126" />
            <StatCard label="Total Questions" value={loading ? '–' : dbStats.questions} accentColor="#16A34A" />
            <StatCard label="Staged Questions" value={stagedQuestionsCount} accentColor="#E8890C" valueColor="#E8890C" />
          </>
        )}
      </div>

      {/* Classroom Context Info if active */}
      {isTeacher && classCode && (
        <div className="bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 rounded-[12px] px-4 py-3 text-xs text-[var(--accent-primary-text)] font-semibold flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <School className="size-4 shrink-0 text-sky-500" />
            <span>Connected to classroom <strong>{classCode}</strong>. Showing custom items and student telemetry for this classroom.</span>
          </div>
          <button
            onClick={() => handleCopyCode(classCode)}
            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <Copy size={11} />
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      )}

      {/* Teacher Live Stream & Recommendations Hub */}
      {isTeacher && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Real-Time Student Activity Stream */}
          <div className="xl:col-span-7 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-main)] m-0">Live Student Activity Stream</h2>
                  <p className="text-[11px] text-[var(--text-muted)] m-0">Real-time sync telemetry from student practice sessions</p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)] text-xs">
                <button
                  type="button"
                  onClick={() => setActivityFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activityFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  All ({filteredLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('struggling')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activityFilter === 'struggling' ? 'bg-rose-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  Needs Review ({strugglingLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('mastered')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activityFilter === 'mastered' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  High Scores ({masteredLogs.length})
                </button>
              </div>
            </div>

            {/* Activity List */}
            {displayActivities.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-[var(--border-color)] rounded-[14px] bg-[var(--bg-main)] flex flex-col items-center gap-2">
                <Inbox className="size-8 text-[var(--text-muted)] opacity-60" />
                <p className="text-xs font-bold text-[var(--text-main)] m-0">No activity events found</p>
                <p className="text-[11px] text-[var(--text-muted)] max-w-sm m-0">
                  {activityFilter === 'all' 
                    ? `When students complete quizzes while paired to code ${classCode || 'your classroom'}, their submissions will appear here live.`
                    : `No student submissions currently match the "${activityFilter}" filter.`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {displayActivities.slice(0, 15).map((log, idx) => {
                  const percentage = log.totalQuestions > 0 ? Math.round((log.score / log.totalQuestions) * 100) : 0;
                  const isPerfect = percentage >= 80;
                  const isStruggling = percentage < 50;
                  const isMath = (log.subject || '').toLowerCase() === 'mathematics' || (log.subject || '').toLowerCase() === 'math';

                  return (
                    <div
                      key={`${log.eventId || log.timestamp}-${idx}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-indigo-500/30 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isMath ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {isMath ? <Calculator size={16} /> : <BookOpen size={16} />}
                        </div>

                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[var(--text-main)] bg-[var(--border-color)]/50 px-1.5 py-0.5 rounded">
                              {log.studentId}
                            </span>
                            <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[160px] sm:max-w-[220px]">
                              {log.topic}
                            </span>
                            {percentage === 100 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                🌟 Perfect 100%
                              </span>
                            )}
                            {isStruggling && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                ⚠️ Review
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                            <span>Grade {log.gradeLevel} • {isMath ? 'Math' : 'English'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatRelativeTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border font-mono ${
                          isPerfect 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : isStruggling 
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {log.score}/{log.totalQuestions} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Action Required & Quick Launchpad */}
          <div className="xl:col-span-5 flex flex-col gap-5">
            {/* Action Required Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-5 sm:p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={15} />
                <span>Action Required &amp; Insights</span>
              </div>

              {bottlenecks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-[var(--text-muted)] m-0">
                    Identified <strong className="text-[var(--text-main)]">{bottlenecks.length} topic(s)</strong> with struggling students:
                  </p>
                  {bottlenecks.slice(0, 2).map((b, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[180px]">
                          {b.topic}
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                          {b.avgAccuracy}% Avg
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] m-0 leading-relaxed">
                        {b.strugglingCount} student(s) scored below 50%. A short 5-question remedial check is recommended.
                      </p>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => onNavigate('teacher', 'manual-lesson')}
                          className="btn btn-secondary text-[11px] py-1.5 px-3 flex items-center justify-center gap-1.5 self-start text-indigo-600 dark:text-indigo-400 font-bold border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer"
                        >
                          <Target size={12} />
                          <span>Create Remedial Quiz</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 m-0">Curriculum Running Smoothly</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 mb-0 leading-relaxed">
                      No severe bottlenecks detected. All attempted topics are maintaining healthy student accuracy.
                    </p>
                  </div>
                </div>
              )}

              {/* Active Classroom Pairing Card */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Key size={13} className="text-amber-500" />
                    <span>Invite / Pairing Code</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {classCode || 'ROOM1'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] m-0 leading-relaxed">
                  Share this code with your class so student apps stream sync reports directly to your overview.
                </p>
                <button
                  type="button"
                  onClick={() => handleCopyCode(classCode || 'ROOM1')}
                  className="btn btn-secondary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                >
                  <Copy size={13} />
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Pairing Code'}</span>
                </button>
              </div>
            </div>

            {/* Quick Launchpad Card */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-5 sm:p-6 flex flex-col gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
                <Zap size={15} />
                <span>Quick Launchpad</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate?.('teacher', 'classrooms')}
                  className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-all group flex flex-col gap-1 cursor-pointer"
                >
                  <School size={16} className="text-sky-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-[var(--text-main)]">My Classrooms</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Roster &amp; Pairing</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('teacher', 'lessons')}
                  className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-all group flex flex-col gap-1 cursor-pointer"
                >
                  <BookOpen size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-[var(--text-main)]">Lesson Library</span>
                  <span className="text-[10px] text-[var(--text-muted)]">DepEd &amp; Custom</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('teacher', 'lesson-ingestor')}
                  className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-all group flex flex-col gap-1 cursor-pointer"
                >
                  <Sparkles size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-[var(--text-main)]">AI Ingestor</span>
                  <span className="text-[10px] text-[var(--text-muted)]">PDF to Questions</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate?.('teacher', 'analytics')}
                  className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-indigo-500/40 text-left transition-all group flex flex-col gap-1 cursor-pointer"
                >
                  <TrendingUp size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-[var(--text-main)]">Analytics</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Mastery Matrix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Assets vs Student syncs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Columns (Ingested Asset Tree) */}
        <div className="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-[24px_28px] flex flex-col gap-4 shadow-sm h-fit">
          <div className="flex items-center gap-[11px]">
            <FolderOpen className="size-[22px] text-[var(--accent-primary-text)]" />
            <h2 className="text-[18px] font-extrabold text-[var(--text-main)] m-0">Ingested Asset Tree</h2>
          </div>
          <p className="text-[13.5px] text-[var(--text-muted)] font-medium mt-0 mb-2">
            Subjects, grade levels, and topics currently loaded in the database.
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="size-6 text-[var(--accent-primary-text)] animate-spin" />
              <p className="text-[var(--accent-primary-text)] text-xs font-semibold">Traversing database tree...</p>
            </div>
          ) : Object.keys(itemBankData).length === 0 ? (
            <div className="text-center p-10 border border-dashed border-[var(--border-color)] rounded-[14px] bg-[var(--bg-main)] flex flex-col items-center gap-3">
              <Inbox className="size-10 text-[var(--text-dark)]" />
              <p className="text-[var(--text-muted)] text-sm font-semibold">
                {isTeacher
                  ? (classCode ? 'No custom lessons assigned to this classroom yet.' : 'No active classroom session or lessons found.')
                  : 'Item bank is currently empty.'}
              </p>
              <p className="text-[var(--text-dark)] text-xs">
                {isTeacher
                  ? (classCode ? 'Go to Classroom Setup or Lesson Ingestor to claim or build lessons for your students.' : 'Create a classroom in Teacher Console to assign curriculum lessons.')
                  : 'Use the Lesson Ingestor to populate subjects and topics.'}
              </p>
              {isTeacher && onNavigate && (
                <button
                  onClick={() => onNavigate('teacher', 'classroom-pairing')}
                  className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2 cursor-pointer mt-1"
                >
                  <Key size={14} />
                  <span>Go to Classroom Setup</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
              {Object.keys(itemBankData).map(subjectName => (
                <div key={subjectName} className="border border-[var(--border-color)] rounded-[15px] p-5 bg-[var(--bg-main)]">
                  <div className="flex items-center gap-[10px] mb-4">
                    <div className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center ${subjectName === 'Mathematics' ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)]' : 'bg-[var(--danger-glow)] text-[var(--danger)]'}`}>
                      {subjectName === 'Mathematics' ? <Calculator className="size-[17px]" /> : <BookOpen className="size-[17px]" />}
                    </div>
                    <h3 className="text-[16px] font-extrabold text-[var(--accent-primary-text)] m-0">{subjectName}</h3>
                  </div>

                  {Object.keys(itemBankData[subjectName] || {}).map(gradeLevel => {
                    const topics = Object.keys(itemBankData[subjectName][gradeLevel] || {});
                    return (
                      <div key={gradeLevel} className="mb-[13px] last:mb-0">
                        <div className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-[var(--success)] mb-[7px]">Grade {gradeLevel}</div>
                        <div className="flex flex-col gap-[8px]">
                          {topics.map(topicName => {
                            const topicNode = itemBankData[subjectName][gradeLevel][topicName];
                            
                            let qCount = 0;
                            if (topicNode) {
                              Object.keys(topicNode).forEach(diff => {
                                if (diff === 'studyContent') return;
                                const diffNode = topicNode[diff];
                                if (diffNode && typeof diffNode === 'object') {
                                  Object.keys(diffNode).forEach(cat => {
                                    if (Array.isArray(diffNode[cat])) {
                                      qCount += diffNode[cat].length;
                                    }
                                  });
                                }
                              });
                            }

                            const topicKey = `${subjectName}-${gradeLevel}-${topicName}`;
                            const isExpanded = expandedTopics[topicKey];
                            const questions = getTopicQuestions(topicNode);

                            return (
                              <div key={topicName} className="border border-[var(--border-color)] rounded-[11px] bg-[var(--bg-card)] overflow-hidden transition-all duration-200">
                                <div
                                  onClick={() => toggleTopic(topicKey)}
                                  className="flex items-center justify-between px-[15px] py-[12px] cursor-pointer hover:bg-[var(--bg-main)] transition-colors select-none"
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronUp className="size-4 text-[var(--text-muted)] shrink-0" />
                                    ) : (
                                      <ChevronDown className="size-4 text-[var(--text-muted)] shrink-0" />
                                    )}
                                    <span className="font-bold text-[14px] text-[var(--text-main)]">{topicName}</span>
                                  </div>
                                  <span className="text-[11.5px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] px-[10px] py-[4px] rounded-full">
                                    {qCount} {qCount === 1 ? 'item' : 'items'}
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-[var(--border-color)] bg-[var(--bg-main)] p-4 flex flex-col gap-3">
                                    {questions.length === 0 ? (
                                      <div className="text-[12px] text-[var(--text-muted)] font-medium italic text-center py-2">
                                        No questions generated or loaded for this topic.
                                      </div>
                                    ) : (
                                      questions.map((q, qIdx) => {
                                        const difficultyColor = q.difficulty === 'Easy' ? 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/20' : q.difficulty === 'Difficult' ? 'text-[#CE1126] bg-[#CE1126]/10 border-[#CE1126]/20' : 'text-[#E8890C] bg-[#E8890C]/10 border-[#E8890C]/20';
                                        return (
                                          <div key={q.id || qIdx} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[8px] flex flex-col gap-2 shadow-sm">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[11px] font-bold text-[var(--accent-primary-text)] bg-[var(--accent-primary-glow)] px-2 py-0.5 rounded border border-[var(--accent-primary)]/20">
                                                {q.id || `Item ${qIdx + 1}`} ({q.category})
                                              </span>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${difficultyColor}`}>
                                                {q.difficulty}
                                              </span>
                                            </div>

                                            <p className="text-[13px] font-bold text-[var(--text-main)] m-0 leading-relaxed">
                                              {q.questionText}
                                            </p>

                                            {q.options && q.options.length > 0 && (
                                              <div className="grid grid-cols-1 gap-1.5 mt-1 pl-1">
                                                {q.options.map((opt, oIdx) => {
                                                  const isCorrect = opt === q.correctAnswer;
                                                  return (
                                                    <div key={oIdx} className="flex items-start gap-2 text-[12.5px]">
                                                      <span className={`font-mono font-bold ${isCorrect ? 'text-[#16A34A]' : 'text-[var(--text-muted)]'}`}>
                                                        {String.fromCharCode(65 + oIdx)}.
                                                      </span>
                                                      <span className={`inline-flex items-center gap-1 ${isCorrect ? 'text-[#16A34A] font-bold' : 'text-[var(--text-main)]'}`}>
                                                        <span>{opt}</span>
                                                        {isCorrect && <Check size={13} className="text-[#16A34A] shrink-0 inline" strokeWidth={2.5} />}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}

                                            {q.matchingPairs && Object.keys(q.matchingPairs).length > 0 && (
                                              <div className="flex flex-col gap-1.5 mt-1.5 pl-1 text-[12.5px]">
                                                <span className="font-bold text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Matching Pairs:</span>
                                                {Object.entries(q.matchingPairs).map(([left, right], pIdx) => (
                                                  <div key={pIdx} className="flex items-center gap-2">
                                                    <span className="text-[var(--text-main)] font-semibold">{left}</span>
                                                    <span className="text-[var(--text-muted)]">&rarr;</span>
                                                    <span className="text-[#16A34A] font-bold">{String(right)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {q.feedback && (
                                              <div className="mt-1 text-[11.5px] italic text-[var(--text-muted)] bg-[var(--bg-main)] p-2 rounded border border-[var(--border-color)] leading-normal">
                                                <strong>Feedback:</strong> {typeof q.feedback === 'object' ? q.feedback.en || q.feedback.fil || JSON.stringify(q.feedback) : q.feedback}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Student Telemetry / Recent Activity) */}
        {isTeacher && (
          <div className="xl:col-span-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-[24px_28px] flex flex-col gap-4 shadow-sm h-fit">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-[11px]">
                <GraduationCap className="size-[22px] text-[var(--success)]" />
                <h2 className="text-[18px] font-extrabold text-[var(--text-main)] m-0 font-display">Student Telemetry</h2>
              </div>
              {onNavigate && filteredLogs.length > 0 && (
                <button 
                  onClick={() => onNavigate('teacher', 'analytics')}
                  className="text-xs font-bold text-[#11428E] hover:underline cursor-pointer border-none bg-transparent"
                >
                  View Details &rarr;
                </button>
              )}
            </div>
            <p className="text-[13.5px] text-[var(--text-muted)] font-medium mt-0 mb-2">
              Recent sync reports from active student devices.
            </p>

            {progressLoading && filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3">
                <Loader2 className="size-6 text-[var(--success)] animate-spin" />
                <p className="text-[var(--success)] text-xs font-semibold">Fetching telemetry logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-[var(--border-color)] rounded-[14px] bg-[var(--bg-main)] flex flex-col items-center gap-3">
                <School className="size-10 text-[var(--text-dark)]" />
                <p className="text-[var(--text-muted)] text-sm font-bold">No students synced yet</p>
                <p className="text-[var(--text-dark)] text-xs leading-relaxed max-w-[200px] mx-auto">
                  Provide code <strong className="text-[var(--text-main)] font-mono">{classCode || 'ROOM1'}</strong> to students so they can join and stream progress.
                </p>
                {onNavigate && (
                  <button 
                    onClick={() => onNavigate('teacher', 'classroom-pairing')}
                    className="btn btn-secondary text-xs px-3 py-1.5 mt-1 cursor-pointer font-bold"
                  >
                    Setup Classroom
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {latestSyncs.map((log) => {
                  const percentage = Math.round((log.score / log.totalQuestions) * 100);
                  const isPerfect = percentage >= 80;
                  const isStruggling = percentage < 50;

                  return (
                    <div 
                      key={log.eventId} 
                      className="flex flex-col gap-2 p-3.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-[14px] hover:border-[#11428E]/30 transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-extrabold text-[var(--text-main)] bg-[var(--border-color)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                          {log.studentId}
                        </span>
                        <span className={`text-xs font-black ${
                          isPerfect ? 'text-[#16A34A]' : isStruggling ? 'text-[#CE1126]' : 'text-[#E8890C]'
                        }`}>
                          {log.score}/{log.totalQuestions} ({percentage}%)
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-semibold">
                        <span className="flex items-center gap-1">
                          {log.subject === 'Mathematics' ? (
                            <Calculator size={11} className="text-[#11428E] shrink-0" />
                          ) : (
                            <BookOpen size={11} className="text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{log.topic}</span>
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={11} className="shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
