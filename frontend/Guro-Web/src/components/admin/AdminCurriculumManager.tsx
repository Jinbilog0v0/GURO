import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { BookOpen, Calculator, Download, RefreshCw, ChevronDown, ChevronUp, FolderOpen, Layers } from 'lucide-react';
import { toast } from '../../utils/toast';

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

export function AdminCurriculumManager() {
  const [loading, setLoading] = useState(true);
  const [purgingCache, setPurgingCache] = useState(false);
  const [itemBankData, setItemBankData] = useState<ItemBankStructure>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [dbStats, setDbStats] = useState({ subjects: 0, topics: 0, questions: 0 });

  const fetchCurriculum = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/item-bank');
      if (res.ok) {
        const db = await res.json();
        setItemBankData(db);

        const subjectsCount = Object.keys(db).length;
        let topicsCount = 0;
        let questionsCount = 0;

        Object.keys(db).forEach(sub => {
          if (db[sub]) {
            Object.keys(db[sub]).forEach(gradeKey => {
              if (db[sub][gradeKey]) {
                Object.keys(db[sub][gradeKey]).forEach(topicKey => {
                  topicsCount++;
                  const topicNode = db[sub][gradeKey][topicKey];
                  if (topicNode && typeof topicNode === 'object') {
                    Object.keys(topicNode).forEach(diff => {
                      if (diff === 'studyContent') return;
                      const diffNode = topicNode[diff];
                      if (diffNode && typeof diffNode === 'object') {
                        Object.keys(diffNode).forEach(cat => {
                          const qList = diffNode[cat];
                          if (Array.isArray(qList)) {
                            questionsCount += qList.length;
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

        setDbStats({ subjects: subjectsCount, topics: topicsCount, questions: questionsCount });
      } else {
        toast.error('Failed to load master item bank.');
      }
    } catch (e) {
      toast.error('Network error loading item bank.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  const toggleTopic = (key: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    try {
      const res = await apiFetch('/api/admin/cache-purge', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Item bank caches purged.');
        fetchCurriculum();
      } else {
        toast.error('Failed to purge cache.');
      }
    } catch (e) {
      toast.error('Network error during cache purge.');
    } finally {
      setPurgingCache(false);
    }
  };

  const handleDownloadJSON = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(itemBankData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `GURO_Master_Item_Bank_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Master Item Bank JSON downloaded.');
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
              });
            });
          }
        });
      }
    });

    return list;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <RefreshCw className="size-8 animate-spin text-[#11428E]" />
        <p className="text-sm font-bold text-[var(--text-muted)]">Loading Master Item Bank…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header and Action Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 shadow-sm">
        <div>
          <h3 className="font-extrabold text-lg text-[var(--text-main)] flex items-center gap-2">
            <BookOpen className="size-5 text-[#11428E]" />
            Master Curriculum &amp; Item Bank Governance
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Global repository of DepEd MELC-aligned competencies that seed all student and classroom assessments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePurgeCache}
            disabled={purgingCache}
            className="btn btn-secondary text-xs px-3.5 py-2 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={purgingCache ? 'animate-spin' : ''} />
            <span>{purgingCache ? 'Purging…' : 'Purge Cache'}</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download size={13} />
            <span>Download JSON Snapshot</span>
          </button>
        </div>
      </div>

      {/* ── Metric Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Master Subjects</span>
          <div className="text-3xl font-extrabold text-[#11428E] mt-2">
            {dbStats.subjects}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold">Mathematics &amp; English</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Curriculum Topics</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {dbStats.topics}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold">Across Grades 4, 5, and 6</div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-5 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Verified Questions</span>
          <div className="text-3xl font-extrabold text-purple-600 mt-2">
            {dbStats.questions}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 font-semibold">Multiple formats, matching &amp; math models</div>
        </div>
      </div>

      {/* ── Curriculum Hierarchy Explorer ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 shadow-sm flex flex-col gap-6">
        <h4 className="font-extrabold text-base text-[var(--text-main)] flex items-center gap-2">
          <Layers size={18} className="text-[#11428E]" />
          Curriculum Topic Tree
        </h4>

        {Object.keys(itemBankData).map(subject => {
          const isMath = subject.toLowerCase() === 'mathematics';
          return (
            <div key={subject} className="flex flex-col gap-4 border border-[var(--border-color)] rounded-2xl p-5 bg-[var(--bg-main)]/50">
              <div className="flex items-center gap-2">
                {isMath ? <Calculator size={18} className="text-[#11428E]" /> : <BookOpen size={18} className="text-emerald-600" />}
                <h5 className="font-black text-base text-[var(--text-main)]">{subject}</h5>
              </div>

              {Object.keys(itemBankData[subject] || {}).map(gradeKey => (
                <div key={gradeKey} className="flex flex-col gap-3 pl-4 border-l-2 border-[var(--border-color)]">
                  <div className="font-extrabold text-xs text-[var(--text-muted)] uppercase tracking-wider">
                    Grade {gradeKey} Curriculum
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {Object.keys(itemBankData[subject][gradeKey] || {}).map(topicName => {
                      const topicKey = `${subject}-${gradeKey}-${topicName}`;
                      const isExpanded = !!expandedTopics[topicKey];
                      const questions = getTopicQuestions(itemBankData[subject][gradeKey][topicName]);

                      return (
                        <div key={topicKey} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xs">
                          <div 
                            onClick={() => toggleTopic(topicKey)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-main)]/60 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <FolderOpen size={16} className="text-[#11428E]" />
                              <span className="font-extrabold text-xs text-[var(--text-main)]">{topicName}</span>
                              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] border border-[var(--border-color)] px-2 py-0.5 rounded-full">
                                {questions.length} questions
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 flex flex-col gap-3">
                              {questions.map((q, qIdx) => (
                                <div key={q.id || qIdx} className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-col gap-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[var(--text-main)]">
                                      #{qIdx + 1}. {q.questionText}
                                    </span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase bg-[var(--bg-main)] px-2 py-0.5 rounded">
                                      {q.difficulty} • {q.type || 'multiple-choice'}
                                    </span>
                                  </div>
                                  {q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                                      {q.options.map((opt, optIdx) => (
                                        <div 
                                          key={optIdx} 
                                          className={`p-1.5 rounded text-[11px] border ${
                                            opt === q.correctAnswer 
                                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold' 
                                              : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                                          }`}
                                        >
                                          {opt === q.correctAnswer ? '✓ ' : '• '}{opt}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
