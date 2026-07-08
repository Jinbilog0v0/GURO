import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { BarChart3, RotateCw, Loader2, FolderOpen, Inbox, Calculator, BookOpen, School, GraduationCap, Clock } from 'lucide-react';
import { RateLimitPanel } from '../components/developer/RateLimitPanel';

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
  onNavigate?: (tab: 'teacher' | 'parent' | 'lesson-builder' | 'dashboard', subTab?: 'analytics' | 'manual-lesson' | 'classroom-pairing') => void;
}

interface ItemBankStructure {
  [subject: string]: {
    [grade: string]: {
      [topic: string]: any;
    };
  };
}

export function DashboardSpace({ 
  currentUser, 
  stagedQuestionsCount,
  progressLogs = [],
  progressLoading = false,
  onNavigate
}: DashboardSpaceProps) {
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState({
    subjects: 0,
    topics: 0,
    questions: 0,
  });
  const [itemBankData, setItemBankData] = useState<ItemBankStructure>({});

  const isTeacher = currentUser?.role === 'teacher';
  const classCode = isTeacher ? (currentUser?.classroomId || localStorage.getItem('guro_teacher_classroom_code')) : null;

  const fetchStats = async () => {
    setLoading(true);
    try {
      let db: any = {};
      let response;
      if (isTeacher && classCode) {
        response = await apiFetch(`/api/classroom/verify?code=${classCode}`);
        if (response.ok) {
          const data = await response.json();
          db = data.customItemBank || {};
        }
      } else {
        response = await apiFetch('/api/item-bank');
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
                if (!topicsList.includes(topicKey)) topicsList.push(topicKey);
                const topicNode = db[sub][gradeKey][topicKey];
                if (topicNode) {
                  Object.keys(topicNode).forEach(diff => {
                    const diffNode = topicNode[diff];
                    if (diffNode) {
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

  // Compute student stats
  const filteredLogs = progressLogs.filter((log) => {
    return !classCode || log.classroomId === classCode;
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

  return (
    <div className="fade-in w-full flex flex-col gap-6 text-[var(--text-main)]">
      {/* Header */}
      <div className="flex items-start gap-[14px] mb-[6px]">
        <div className="w-[46px] h-[46px] shrink-0 rounded-[13px] bg-[var(--accent-primary-glow)] text-[var(--accent-primary-text)] flex items-center justify-center">
          <BarChart3 className="size-[23px]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[25px] font-extrabold tracking-[-0.02em] text-[var(--text-main)] m-0">Database &amp; System Dashboard</h1>
          <p className="text-[14px] text-[var(--text-muted)] font-medium mt-1 mb-0">Real-time telemetry and overview of GURO curriculum assets.</p>
        </div>
        <button
          onClick={fetchStats}
          className="btn btn-secondary flex items-center gap-2 text-xs self-start cursor-pointer shrink-0"
          disabled={loading}
        >
          {loading ? <><Loader2 className="size-3.5 animate-spin" />Fetching...</> : <><RotateCw className="size-3.5" />Refresh Data</>}
        </button>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <div className="bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 rounded-[12px] px-4 py-3 text-xs text-[var(--accent-primary-text)] font-semibold flex items-center gap-2">
          <School className="size-4 shrink-0" />
          <span>Connected to classroom <strong>{classCode}</strong>. Showing custom items and student telemetry for this classroom.</span>
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
              <p className="text-[var(--text-muted)] text-sm font-semibold">Item bank is currently empty.</p>
              <p className="text-[var(--text-dark)] text-xs">Use the Lesson Ingestor to populate subjects and topics.</p>
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
                                const diffNode = topicNode[diff];
                                if (diffNode) Object.keys(diffNode).forEach(cat => { if (Array.isArray(diffNode[cat])) qCount += diffNode[cat].length; });
                              });
                            }
                            return (
                              <div key={topicName} className="flex items-center justify-between px-[15px] py-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[11px]">
                                <span className="font-bold text-[14px] text-[var(--text-main)]">{topicName}</span>
                                <span className="text-[11.5px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] px-[10px] py-[4px] rounded-full">{qCount} {qCount === 1 ? 'item' : 'items'}</span>
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

      {/* ── Rate Limit Controls (Admin / Developer only) ── */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'developer') && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6">
          <RateLimitPanel />
        </div>
      )}
    </div>
  );
}
