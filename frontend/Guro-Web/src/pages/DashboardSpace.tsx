import { useState, useEffect } from 'react';
import { BarChart3, RotateCw, Loader2, FolderOpen, Inbox, Calculator, BookOpen, School } from 'lucide-react';

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

export interface DashboardSpaceProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null;
  stagedQuestionsCount: number;
}

interface ItemBankStructure {
  [subject: string]: {
    [grade: string]: {
      [topic: string]: any;
    };
  };
}

export function DashboardSpace({ currentUser, stagedQuestionsCount }: DashboardSpaceProps) {
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
        response = await fetch(`/api/classroom/verify?code=${classCode}`);
        if (response.ok) {
          const data = await response.json();
          db = data.customItemBank || {};
        }
      } else {
        response = await fetch('/api/item-bank');
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

  return (
    <div className="fade-in w-full flex flex-col gap-6 text-[var(--text-main)]">
      {/* Header */}
      <div className="flex items-start gap-[14px] mb-[6px]">
        <div className="w-[46px] h-[46px] shrink-0 rounded-[13px] bg-[var(--accent-primary-glow)] text-[var(--accent-primary)] flex items-center justify-center">
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
        <StatCard label="Subjects Loaded" value={loading ? '–' : dbStats.subjects} accentColor="#11428E" />
        <StatCard label="Unique Topics" value={loading ? '–' : dbStats.topics} accentColor="#CE1126" />
        <StatCard label="Total Questions" value={loading ? '–' : dbStats.questions} accentColor="#16A34A" />
        <StatCard label="Staged Questions" value={stagedQuestionsCount} accentColor="#E8890C" valueColor="#E8890C" />
      </div>

      {/* Classroom Context Info if active */}
      {isTeacher && classCode && (
        <div className="bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 rounded-[12px] px-4 py-3 text-xs text-[var(--accent-primary)] font-semibold flex items-center gap-2">
          <School className="size-4 shrink-0" />
          <span>Connected to classroom <strong>{classCode}</strong>. Showing custom items for this classroom.</span>
        </div>
      )}

      {/* Item Bank Details Panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] p-[24px_28px] flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-[11px]">
          <FolderOpen className="size-[22px] text-[var(--accent-primary)]" />
          <h2 className="text-[18px] font-extrabold text-[var(--text-main)] m-0">Ingested Asset Tree</h2>
        </div>
        <p className="text-[13.5px] text-[var(--text-muted)] font-medium mt-0 mb-2">
          Subjects, grade levels, and topics currently loaded in the database.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <Loader2 className="size-6 text-[var(--accent-primary)] animate-spin" />
            <p className="text-[var(--accent-primary)] text-xs font-semibold">Traversing database tree...</p>
          </div>
        ) : Object.keys(itemBankData).length === 0 ? (
          <div className="text-center p-10 border border-dashed border-[var(--border-color)] rounded-[14px] bg-[var(--bg-main)] flex flex-col items-center gap-3">
            <Inbox className="size-10 text-[var(--text-dark)]" />
            <p className="text-[var(--text-muted)] text-sm font-semibold">Item bank is currently empty.</p>
            <p className="text-[var(--text-dark)] text-xs">Use the Lesson Ingestor to populate subjects and topics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-[18px]">
            {Object.keys(itemBankData).map(subjectName => (
              <div key={subjectName} className="border border-[var(--border-color)] rounded-[15px] p-5 bg-[var(--bg-main)]">
                <div className="flex items-center gap-[10px] mb-4">
                  <div className={`w-[30px] h-[30px] rounded-[9px] flex items-center justify-center ${subjectName === 'Mathematics' ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary)]' : 'bg-[var(--danger-glow)] text-[var(--danger)]'}`}>
                    {subjectName === 'Mathematics' ? <Calculator className="size-[17px]" /> : <BookOpen className="size-[17px]" />}
                  </div>
                  <h3 className="text-[16px] font-extrabold text-[var(--accent-primary)] m-0">{subjectName}</h3>
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
    </div>
  );
}
