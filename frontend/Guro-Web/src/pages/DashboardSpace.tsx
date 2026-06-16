import { useState, useEffect } from 'react';

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
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2">
            📊 Database & System Dashboard
          </h2>
          <p className="text-[var(--text-muted)] text-xs mt-1">
            Real-time telemetry and overview of Guro curriculum assets
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="btn btn-secondary flex items-center gap-2 transition-all text-xs self-start lg:self-auto"
          disabled={loading}
        >
          {loading ? '⌛ Fetching...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex flex-col gap-1 border-l-4 border-l-sky-500 shadow-md">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Subjects Loaded</span>
          <span className="text-2xl font-extrabold text-[var(--text-main)]">{loading ? '-' : dbStats.subjects}</span>
        </div>
        
        <div className="glass-panel p-4 flex flex-col gap-1 border-l-4 border-l-indigo-500 shadow-md">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unique Topics</span>
          <span className="text-2xl font-extrabold text-[var(--text-main)]">{loading ? '-' : dbStats.topics}</span>
        </div>

        <div className="glass-panel p-4 flex flex-col gap-1 border-l-4 border-l-emerald-500 shadow-md">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Questions</span>
          <span className="text-2xl font-extrabold text-[var(--text-main)]">{loading ? '-' : dbStats.questions}</span>
        </div>

        <div className="glass-panel p-4 flex flex-col gap-1 border-l-4 border-l-amber-500 shadow-md">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Staged Questions</span>
          <span className="text-2xl font-extrabold text-amber-500">{stagedQuestionsCount}</span>
        </div>
      </div>

      {/* Classroom Context Info if active */}
      {isTeacher && classCode && (
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4 text-xs text-sky-500 font-semibold">
          🏫 Connected to classroom <strong>{classCode}</strong>. Showing custom items loaded for this specific classroom.
        </div>
      )}

      {/* Item Bank Details Panel */}
      <div className="glass-panel p-6 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-[var(--text-main)]">📂 Ingested Asset Tree</h3>
        <p className="text-[var(--text-muted)] text-xs">
          Explore subjects, grade levels, and topics currently loaded in the database.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <div className="spinner"></div>
            <p className="text-[var(--accent-primary)] text-xs font-semibold">Traversing database tree...</p>
          </div>
        ) : Object.keys(itemBankData).length === 0 ? (
          <div className="text-center p-8 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-main)]">
            <span className="text-3xl">📭</span>
            <p className="text-[var(--text-muted)] text-sm font-semibold mt-2">Item bank is currently empty.</p>
            <p className="text-[var(--text-muted)] opacity-60 text-xs mt-1">Use the Lesson Ingestor to populate subjects and topics.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-2">
            {Object.keys(itemBankData).map(subjectName => (
              <div key={subjectName} className="border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)] p-4">
                <h4 className="text-md font-bold text-[var(--accent-primary)] border-b border-[var(--border-color)] pb-2 mb-3 flex items-center gap-2">
                  {subjectName === 'Mathematics' ? '🧮' : '📚'} {subjectName}
                </h4>

                <div className="flex flex-col gap-4">
                  {Object.keys(itemBankData[subjectName] || {}).map(gradeLevel => (
                    <div key={gradeLevel} className="flex flex-col gap-2 pl-2">
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        Grade {gradeLevel}
                      </span>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {Object.keys(itemBankData[subjectName][gradeLevel] || {}).map(topicName => {
                          const topicNode = itemBankData[subjectName][gradeLevel][topicName];
                          let qCount = 0;
                          if (topicNode) {
                            Object.keys(topicNode).forEach(diff => {
                              const diffNode = topicNode[diff];
                              if (diffNode) {
                                Object.keys(diffNode).forEach(cat => {
                                  if (Array.isArray(diffNode[cat])) {
                                    qCount += diffNode[cat].length;
                                  }
                                });
                              }
                            });
                          }

                          return (
                            <div key={topicName} className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-lg p-3 flex justify-between items-center hover:border-[var(--text-muted)] transition-colors">
                              <span className="text-xs font-semibold text-[var(--text-main)]">{topicName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--border-color)] text-[var(--text-muted)] font-bold">
                                {qCount} items
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
