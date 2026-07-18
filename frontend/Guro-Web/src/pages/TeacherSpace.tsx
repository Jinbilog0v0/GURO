import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MasteryMatrix } from '../components/teacher/MasteryMatrix';
import { StudentTile } from '../components/teacher/StudentTile';
import { DiagnosticAlerts } from '../components/teacher/DiagnosticAlerts';
import { ManualLessonBuilder } from '../components/teacher/ManualLessonBuilder';
import { SkeletonStatCards, SkeletonCard, SkeletonTable } from '../components/shared/SkeletonLoader';
import { School, TrendingUp, Key, Edit3, RotateCw, Folder, Plus, Zap, Settings, LogOut, Calculator, BookOpen, Check, ClipboardList, X, Lock, Search, User, Trash2 } from 'lucide-react';
import { toast } from '../utils/toast';
import { apiFetch } from '../utils/api';

interface SyncedEvent {
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

interface TeacherSpaceProps {
  progressLogs: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
  refreshLogs: () => Promise<void>;
  loading: boolean;
  activeSubTab?: 'analytics' | 'manual-lesson' | 'classroom-pairing';
  setActiveSubTab?: (tab: 'analytics' | 'manual-lesson' | 'classroom-pairing') => void;
}

const getCategoriesAndTypes = (currentSubject: string, currentGrade: string | number) => {
  const gNum = Number(currentGrade);
  let categories: string[] = [];
  let types = ['multiple-choice', 'fill-in-the-blank', 'drag-drop-matching', 'true-false'];

  if (currentSubject.toLowerCase() === 'mathematics') {
    if (gNum === 4) {
      categories = ['Fractions'];
      types.push('fraction-builder');
    } else if (gNum === 5) {
      categories = ['Decimals'];
    } else {
      categories = ['Algebraic Equations'];
    }
  } else { // English
    if (gNum === 4) {
      categories = ['Figures of Speech'];
      types.push('swipe-card');
    } else if (gNum === 5) {
      categories = ['Reading/Paragraph Comprehension'];
    } else {
      categories = ['Idiomatic Expressions'];
    }
  }
  return { categories, types };
};

export function TeacherSpace({ 
  progressLogs, 
  lastUpdatedCell, 
  refreshLogs, 
  loading,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}: TeacherSpaceProps) {
  const [filterText, setFilterText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'analytics' | 'manual-lesson' | 'classroom-pairing'>('analytics');
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab !== undefined ? propSetActiveSubTab : setLocalActiveSubTab;

  // List of all classrooms created by the teacher (stored in localStorage)
  const [classroomHistory, setClassroomHistory] = useState<{
    id: string;
    teacherName: string;
    subject: string;
    gradeLevel: number;
    expiresAt?: string | null;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('guro_teacher_classroom_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Classroom setup state
  const [classroomCode, setClassroomCode] = useState<string | null>(() => {
    return localStorage.getItem('guro_teacher_classroom_code') || null;
  });
  const [classroomData, setClassroomData] = useState<{
    teacherName: string;
    subject: string;
    gradeLevel: number;
    classroomId: string;
    customItemBank?: any;
    expiresAt?: string | null;
  } | null>(null);

  const [setupName, setSetupName] = useState('');
  const [setupSubject, setSetupSubject] = useState('Mathematics');
  const [setupGrade, setSetupGrade] = useState(4);
  const [setupDuration, setSetupDuration] = useState(0);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchClassroomData = async (code: string) => {
    try {
      const res = await apiFetch(`/api/classroom/verify?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setClassroomData(data);
        
        // Add to history if not exists
        setClassroomHistory((prev) => {
          if (prev.some(c => c.id === data.classroomId)) return prev;
          const updated = [...prev, {
            id: data.classroomId,
            teacherName: data.teacherName,
            subject: data.subject,
            gradeLevel: data.gradeLevel,
            expiresAt: data.expiresAt
          }];
          localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
          return updated;
        });
      } else if (res.status === 404) {
        localStorage.removeItem('guro_teacher_classroom_code');
        setClassroomCode(null);
        setClassroomData(null);
        // Also remove from history
        setClassroomHistory((prev) => {
          const updated = prev.filter(c => c.id !== code);
          localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Error fetching classroom data:', e);
    }
  };

  useEffect(() => {
    if (classroomCode) {
      fetchClassroomData(classroomCode);
    }
  }, [classroomCode]);

  // Auto-refresh telemetry every 45 seconds so teachers see live student progress without a manual reload
  useEffect(() => {
    const interval = setInterval(() => {
      refreshLogs();
    }, 45000);
    return () => clearInterval(interval);
  }, [refreshLogs]);

  const [editingLesson, setEditingLesson] = useState<{
    subject: string;
    grade: string;
    topic: string;
    studyContent: {
      introduction: string;
      definitions: { term: string; definition: string; examples: string[] }[];
      summary: string[];
    };
    questions: any[];
  } | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'study' | 'questions'>('study');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const getActiveClassroomTopics = () => {
    if (!classroomData || !classroomData.customItemBank) return [];
    const activeList: { subject: string; grade: string; topic: string; data: any }[] = [];
    const bank = classroomData.customItemBank as any;
    Object.keys(bank).forEach(subject => {
      Object.keys(bank[subject] || {}).forEach(grade => {
        Object.keys(bank[subject][grade] || {}).forEach(topic => {
          activeList.push({
            subject,
            grade,
            topic,
            data: bank[subject][grade][topic]
          });
        });
      });
    });
    return activeList;
  };

  const handleDeleteTopic = async (subject: string, grade: string, topic: string) => {
    if (!classroomCode) return;
    if (!window.confirm(`Are you sure you want to delete the lesson "${topic}" from your classroom? Students will no longer see it.`)) {
      return;
    }

    try {
      const res = await apiFetch('/api/classroom/delete-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: classroomCode,
          subject,
          grade,
          topic
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Successfully deleted lesson "${topic}"!`);
        setClassroomData(prev => prev ? {
          ...prev,
          customItemBank: data.customItemBank
        } : null);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to delete lesson' }));
        throw new Error(err.error || 'Failed to delete lesson');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error deleting lesson');
    }
  };

  const handleStartEdit = (subject: string, grade: string, topic: string, topicNode: any) => {
    const flatQuestions: any[] = [];
    if (topicNode) {
      ['Easy', 'Average', 'Difficult'].forEach(difficulty => {
        const diffNode = topicNode[difficulty];
        if (diffNode) {
          Object.keys(diffNode).forEach(category => {
            const list = diffNode[category];
            if (Array.isArray(list)) {
              list.forEach(q => {
                flatQuestions.push({
                  ...q,
                  difficulty,
                  category
                });
              });
            }
          });
        }
      });
    }

    const studyContent = topicNode?.studyContent || {
      introduction: '',
      definitions: [],
      summary: []
    };

    setEditingLesson({
      subject,
      grade,
      topic,
      studyContent: {
        introduction: studyContent.introduction || '',
        definitions: studyContent.definitions || [],
        summary: studyContent.summary || []
      },
      questions: flatQuestions
    });
    setActiveEditTab('study');
  };

  const handleSaveEdit = async () => {
    if (!editingLesson || !classroomCode) return;
    if (editingLesson.questions.length === 0) {
      toast.error('At least one question is required.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await apiFetch('/api/classroom/update-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: classroomCode,
          subject: editingLesson.subject,
          grade: editingLesson.grade,
          topic: editingLesson.topic,
          questions: editingLesson.questions,
          studyContent: editingLesson.studyContent
        })
      });

      if (res.ok) {
        toast.success(`Successfully updated lesson "${editingLesson.topic}"!`);
        await fetchClassroomData(classroomCode);
        setEditingLesson(null);
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to update lesson' }));
        throw new Error(err.error || 'Failed to update lesson');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error updating lesson');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const [globalBank, setGlobalBank] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<{subject: string; grade: string; topic: string}[]>([]);

  useEffect(() => {
    if (activeSubTab === 'classroom-pairing' && !globalBank) {
      apiFetch('/api/item-bank')
        .then(res => res.json())
        .then(data => setGlobalBank(data))
        .catch(err => console.error('Error loading global templates:', err));
    }
  }, [activeSubTab, globalBank]);

  useEffect(() => {
    if (globalBank && classroomData && classroomData.subject && classroomData.gradeLevel !== undefined && selectedModules.length === 0) {
      const recommended: { subject: string; grade: string; topic: string }[] = [];
      Object.keys(globalBank).forEach(subject => {
        Object.keys(globalBank[subject]).forEach(grade => {
          Object.keys(globalBank[subject][grade]).forEach(topic => {
            if (subject.toLowerCase() === classroomData.subject.toLowerCase() && grade === classroomData.gradeLevel.toString()) {
              recommended.push({ subject, grade, topic });
            }
          });
        });
      });
      setSelectedModules(recommended);
    }
  }, [globalBank, classroomData]);

  const getSelectableTopics = () => {
    if (!globalBank) return [];
    const topicsList: { subject: string; grade: string; topic: string }[] = [];
    Object.keys(globalBank).forEach(subject => {
      Object.keys(globalBank[subject]).forEach(grade => {
        if (classroomData && grade !== classroomData.gradeLevel.toString()) {
          return;
        }
        Object.keys(globalBank[subject][grade]).forEach(topic => {
          topicsList.push({ subject, grade, topic });
        });
      });
    });
    return topicsList;
  };

  const isTopicAlreadyClaimed = (subject: string, grade: string, topic: string) => {
    if (!classroomData || !classroomData.customItemBank) return false;
    const bank = classroomData.customItemBank as any;
    return !!(bank[subject] && bank[subject][grade] && bank[subject][grade][topic]);
  };

  // Filter logs based on search, dropdown selections, selected student tile, and classroom
  const filteredLogs = progressLogs.filter((log) => {
    const matchesClassroom = !classroomCode || log.classroomId === classroomCode;
    
    const matchesSearch =
      log.studentId.toLowerCase().includes(filterText.toLowerCase()) ||
      log.topic.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || log.subject === selectedSubject;
    const matchesStudent = !selectedStudentId || log.studentId === selectedStudentId;
    
    return matchesClassroom && matchesSearch && matchesSubject && matchesStudent;
  });

  // Math helper
  const getAverageAccuracy = () => {
    if (filteredLogs.length === 0) return 0;
    const totalPercentage = filteredLogs.reduce((sum, log) => {
      return sum + (log.score / log.totalQuestions) * 100;
    }, 0);
    return Math.round(totalPercentage / filteredLogs.length);
  };

  // Get unique students list (filtered by classroom and search query if active)
  const uniqueStudents = Array.from(new Set(
    progressLogs
      .filter((log) => {
        const matchesClassroom = !classroomCode || log.classroomId === classroomCode;
        const matchesSearch = !filterText || 
          log.studentId.toLowerCase().includes(filterText.toLowerCase()) ||
          log.topic.toLowerCase().includes(filterText.toLowerCase());
        return matchesClassroom && matchesSearch;
      })
      .map(l => l.studentId)
  ));

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    } else {
      setSelectedStudentId(studentId);
    }
  };

  const renderEditModal = () => {
    if (!editingLesson) return null;

    const updateIntro = (val: string) => {
      setEditingLesson(prev => prev ? {
        ...prev,
        studyContent: { ...prev.studyContent, introduction: val }
      } : null);
    };

    const updateDefinitionTerm = (idx: number, termVal: string) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const defs = [...prev.studyContent.definitions];
        defs[idx] = { ...defs[idx], term: termVal };
        return { ...prev, studyContent: { ...prev.studyContent, definitions: defs } };
      });
    };

    const updateDefinitionText = (idx: number, defVal: string) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const defs = [...prev.studyContent.definitions];
        defs[idx] = { ...defs[idx], definition: defVal };
        return { ...prev, studyContent: { ...prev.studyContent, definitions: defs } };
      });
    };

    const updateDefinitionExample = (defIdx: number, exIdx: number, val: string) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const defs = [...prev.studyContent.definitions];
        const examples = [...defs[defIdx].examples];
        examples[exIdx] = val;
        defs[defIdx] = { ...defs[defIdx], examples };
        return { ...prev, studyContent: { ...prev.studyContent, definitions: defs } };
      });
    };

    const addDefinition = () => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const defs = [...prev.studyContent.definitions, { term: '', definition: '', examples: ['', '', ''] }];
        return { ...prev, studyContent: { ...prev.studyContent, definitions: defs } };
      });
    };

    const removeDefinition = (idx: number) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const defs = prev.studyContent.definitions.filter((_, i) => i !== idx);
        return { ...prev, studyContent: { ...prev.studyContent, definitions: defs } };
      });
    };

    const updateSummaryItem = (idx: number, val: string) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const summary = [...prev.studyContent.summary];
        summary[idx] = val;
        return { ...prev, studyContent: { ...prev.studyContent, summary } };
      });
    };

    const addSummaryItem = () => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const summary = [...prev.studyContent.summary, ''];
        return { ...prev, studyContent: { ...prev.studyContent, summary } };
      });
    };

    const removeSummaryItem = (idx: number) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const summary = prev.studyContent.summary.filter((_, i) => i !== idx);
        return { ...prev, studyContent: { ...prev.studyContent, summary } };
      });
    };

    const updateQuestionField = (qIdx: number, field: string, val: any) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const questions = [...prev.questions];
        questions[qIdx] = { ...questions[qIdx], [field]: val };
        return { ...prev, questions };
      });
    };

    const updateQuestionOption = (qIdx: number, optIdx: number, val: string) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const questions = [...prev.questions];
        const oldVal = questions[qIdx].options[optIdx];
        const options = [...questions[qIdx].options];
        options[optIdx] = val;
        
        let correctAnswer = questions[qIdx].correctAnswer;
        if (correctAnswer === oldVal) {
          correctAnswer = val;
        }
        questions[qIdx] = { ...questions[qIdx], options, correctAnswer };
        return { ...prev, questions };
      });
    };

    const setCorrectOption = (qIdx: number, optIdx: number) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const questions = [...prev.questions];
        questions[qIdx] = { ...questions[qIdx], correctAnswer: questions[qIdx].options[optIdx] };
        return { ...prev, questions };
      });
    };

    const addQuestion = () => {
      setEditingLesson(prev => {
        if (!prev) return null;
        const id = `${prev.subject.toUpperCase().slice(0, 3)}-G${prev.grade}-${prev.topic.toUpperCase().slice(0, 3).replace(/\s/g, '')}-${Date.now().toString().slice(-3)}`;
        const newQ = {
          id,
          difficulty: 'Easy',
          category: 'Multiple-Choice',
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          feedback: { en: '', fil: '' }
        };
        return { ...prev, questions: [...prev.questions, newQ] };
      });
    };

    const removeQuestion = (idx: number) => {
      setEditingLesson(prev => {
        if (!prev) return null;
        return { ...prev, questions: prev.questions.filter((_, i) => i !== idx) };
      });
    };

    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '90%',
            maxWidth: '900px',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '24px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>
                Edit Custom Lesson: {editingLesson.topic}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Subject: {editingLesson.subject} • Grade {editingLesson.grade}
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setEditingLesson(null)}
              className="bg-transparent border-none text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', gap: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveEditTab('study')}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeEditTab === 'study' ? '2px solid var(--accent-primary-text)' : '2px solid transparent',
                color: activeEditTab === 'study' ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Study Guide Content
            </button>
            <button
              type="button"
              onClick={() => setActiveEditTab('questions')}
              style={{
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeEditTab === 'questions' ? '2px solid var(--accent-primary-text)' : '2px solid transparent',
                color: activeEditTab === 'questions' ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Question Bank ({editingLesson.questions.length})
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
            {activeEditTab === 'study' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Introduction */}
                <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
                    Lesson Introduction
                  </h4>
                  <div className="form-group" style={{ margin: 0 }}>
                    <textarea
                      value={editingLesson.studyContent.introduction}
                      onChange={(e) => updateIntro(e.target.value)}
                      rows={4}
                      style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Vocabulary */}
                <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
                      Vocabulary & Definitions
                    </h4>
                    <button
                      type="button"
                      onClick={addDefinition}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      + Add Term
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {editingLesson.studyContent.definitions.map((def, defIdx) => (
                      <div 
                        key={defIdx} 
                        style={{ 
                          borderBottom: defIdx === editingLesson.studyContent.definitions.length - 1 ? 'none' : '1px solid var(--border-color)', 
                          paddingBottom: defIdx === editingLesson.studyContent.definitions.length - 1 ? 0 : '16px',
                          position: 'relative'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => removeDefinition(defIdx)}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-secondary)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <X size={14} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '12px', paddingRight: '24px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Term</label>
                            <input
                              type="text"
                              value={def.term}
                              onChange={(e) => updateDefinitionTerm(defIdx, e.target.value)}
                              style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Simple Definition</label>
                            <input
                              type="text"
                              value={def.definition}
                              onChange={(e) => updateDefinitionText(defIdx, e.target.value)}
                              style={{ width: '100%', marginTop: '4px', padding: '8px 12px' }}
                            />
                          </div>
                        </div>

                        <div style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(59, 130, 246, 0.3)' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-dark)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Examples</label>
                          {def.examples.map((ex, exIdx) => (
                            <input
                              key={exIdx}
                              type="text"
                              value={ex}
                              onChange={(e) => updateDefinitionExample(defIdx, exIdx, e.target.value)}
                              placeholder={`Example ${exIdx + 1}`}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', marginBottom: '6px' }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {editingLesson.studyContent.definitions.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>No vocabulary terms defined.</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontWeight: 600 }}>
                      Key Takeaways & Summary Points
                    </h4>
                    <button
                      type="button"
                      onClick={addSummaryItem}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      + Add Point
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {editingLesson.studyContent.summary.map((sumItem, sumIdx) => (
                      <div key={sumIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#8b5cf6', fontSize: '16px' }}>•</span>
                        <input
                          type="text"
                          value={sumItem}
                          onChange={(e) => updateSummaryItem(sumIdx, e.target.value)}
                          style={{ flex: 1, padding: '8px 12px' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeSummaryItem(sumIdx)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', padding: '6px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {editingLesson.studyContent.summary.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>No summary points defined.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="btn btn-secondary flex items-center gap-1"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Plus size={12} /> Add Question Slot
                  </button>
                </div>

                {editingLesson.questions.map((q, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-secondary)',
                        cursor: 'pointer',
                        padding: '6px'
                      }}
                      title="Delete Question"
                    >
                      <X size={16} />
                    </button>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', paddingRight: '24px' }}>
                      <div className="form-group" style={{ margin: 0, width: '110px' }}>
                        <label style={{ fontSize: '10px' }}>Difficulty</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => updateQuestionField(idx, 'difficulty', e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '12px', marginTop: '4px' }}
                        >
                          <option value="Easy">Easy</option>
                          <option value="Average">Average</option>
                          <option value="Difficult">Difficult</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0, width: '180px' }}>
                        <label style={{ fontSize: '10px' }}>Category</label>
                        {(() => {
                          const { categories } = getCategoriesAndTypes(editingLesson?.subject || 'English', editingLesson?.grade || 5);
                          return (
                            <select
                              value={q.category}
                              onChange={(e) => updateQuestionField(idx, 'category', e.target.value)}
                              style={{ padding: '6px 10px', fontSize: '12px', marginTop: '4px' }}
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          );
                        })()}
                      </div>
                      <div className="form-group" style={{ margin: 0, width: '180px' }}>
                        <label style={{ fontSize: '10px' }}>Format / Type</label>
                        {(() => {
                          const { categories, types } = getCategoriesAndTypes(editingLesson?.subject || 'English', editingLesson?.grade || 5);
                          return (
                            <select
                              value={q.type || 'multiple-choice'}
                              onChange={(e) => {
                                const newType = e.target.value as any;
                                setEditingLesson(prev => {
                                  if (!prev) return null;
                                  const questions = [...prev.questions];
                                  const currentCat = questions[idx].category;
                                  const safeCategory = categories.includes(currentCat) ? currentCat : (categories[0] || 'Figures of Speech');
                                  questions[idx] = { 
                                    ...questions[idx], 
                                    type: newType,
                                    category: safeCategory,
                                    matchingPairs: newType === 'drag-drop-matching' ? (questions[idx].matchingPairs || { "Example Key": "Example Value" }) : undefined
                                  };
                                  if (newType === 'drag-drop-matching') {
                                    const pairs = questions[idx].matchingPairs || {};
                                    questions[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                                    questions[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                                  } else if (newType === 'true-false') {
                                    questions[idx].options = ['True', 'False'];
                                    questions[idx].correctAnswer = 'True';
                                  } else if (newType === 'swipe-card') {
                                    questions[idx].options = ['Literal', 'Metaphor'];
                                    questions[idx].correctAnswer = 'Literal';
                                  } else if (newType === 'fraction-builder') {
                                    questions[idx].options = ['2', '4'];
                                    questions[idx].correctAnswer = '2';
                                  } else {
                                    questions[idx].options = ['', '', '', ''];
                                    questions[idx].correctAnswer = '';
                                  }
                                  return { ...prev, questions };
                                });
                              }}
                              style={{ padding: '6px 10px', fontSize: '12px', marginTop: '4px' }}
                            >
                              {types.map((t) => {
                                const typeLabels: Record<string, string> = {
                                  'multiple-choice': 'Multiple Choice',
                                  'fill-in-the-blank': 'Fill-in-the-Blank',
                                  'drag-drop-matching': 'Drag & Drop Matching',
                                  'true-false': 'True or False',
                                  'swipe-card': 'Swipe Card',
                                  'fraction-builder': 'Fraction Builder',
                                };
                                return (
                                  <option key={t} value={t}>
                                    {typeLabels[t] || t}
                                  </option>
                                );
                              })}
                            </select>
                          );
                        })()}
                      </div>
                      <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '10px' }}>Question ID</label>
                        <input
                          type="text"
                          value={q.id}
                          onChange={(e) => updateQuestionField(idx, 'id', e.target.value)}
                          style={{ marginTop: '4px', padding: '6px 10px', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '10px' }}>Question Text</label>
                      <input
                        type="text"
                        value={q.questionText}
                        onChange={(e) => updateQuestionField(idx, 'questionText', e.target.value)}
                        style={{ marginTop: '4px', padding: '8px 12px', fontSize: '13px' }}
                      />
                    </div>

                    {(!q.type || q.type === 'multiple-choice' || q.type === 'fill-in-the-blank') && (
                      <div className="flex flex-col gap-2">
                        <label style={{ fontSize: '10px' }}>
                          Options (Check correct answer)
                          {q.type === 'fill-in-the-blank' && (
                            <span style={{ fontSize: '10px', color: '#38BDF8', marginLeft: '6px', fontWeight: 'bold' }}>
                              (💡 Prompt must contain exactly one [[blank]] placeholder)
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <div key={optIdx} className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2" style={{ padding: '2px 8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', backgroundColor: 'var(--border-color)', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                                  style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px 4px', fontSize: '12px' }}
                                />
                                <input
                                  type="radio"
                                  name={`correct-edit-${idx}`}
                                  checked={isCorrect}
                                  onChange={() => setCorrectOption(idx, optIdx)}
                                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {q.type === 'true-false' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <label style={{ fontSize: '10px' }}>Select the Correct Answer</label>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                            <input
                              type="radio"
                              name={`edit-tf-correct-${idx}`}
                              checked={q.correctAnswer === 'True'}
                              onChange={() => {
                                setEditingLesson(prev => {
                                  if (!prev) return null;
                                  const questions = [...prev.questions];
                                  questions[idx] = { ...questions[idx], correctAnswer: 'True' };
                                  return { ...prev, questions };
                                });
                              }}
                              className="accent-[#10B981]"
                              style={{ cursor: 'pointer' }}
                            />
                            <span>True</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                            <input
                              type="radio"
                              name={`edit-tf-correct-${idx}`}
                              checked={q.correctAnswer === 'False'}
                              onChange={() => {
                                setEditingLesson(prev => {
                                  if (!prev) return null;
                                  const questions = [...prev.questions];
                                  questions[idx] = { ...questions[idx], correctAnswer: 'False' };
                                  return { ...prev, questions };
                                });
                              }}
                              className="accent-[#10B981]"
                              style={{ cursor: 'pointer' }}
                            />
                            <span>False</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {q.type === 'swipe-card' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <label style={{ fontSize: '10px' }}>Swipe Card Categories (Define Left/Right targets & Select correct)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                          {['Left Target (Swipe Left)', 'Right Target (Swipe Right)'].map((label, optIdx) => {
                            const option = q.options[optIdx] || '';
                            const isCorrect = option === q.correctAnswer;
                            return (
                              <div key={optIdx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px' }}>
                                <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      setEditingLesson(prev => {
                                        if (!prev) return null;
                                        const questions = [...prev.questions];
                                        const oldVal = questions[idx].options[optIdx];
                                        const options = [...questions[idx].options];
                                        options[optIdx] = newVal;
                                        let correctAnswer = questions[idx].correctAnswer;
                                        if (correctAnswer === oldVal) {
                                          correctAnswer = newVal;
                                        }
                                        questions[idx] = { ...questions[idx], options, correctAnswer };
                                        return { ...prev, questions };
                                      });
                                    }}
                                    style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                                    placeholder={optIdx === 0 ? "e.g., Literal" : "e.g., Metaphor"}
                                    required
                                  />
                                  <input
                                    type="radio"
                                    name={`edit-swipe-correct-${idx}`}
                                    checked={isCorrect && option !== ''}
                                    onChange={() => {
                                      setEditingLesson(prev => {
                                        if (!prev) return null;
                                        const questions = [...prev.questions];
                                        questions[idx] = { ...questions[idx], correctAnswer: questions[idx].options[optIdx] };
                                        return { ...prev, questions };
                                      });
                                    }}
                                    className="accent-[#10B981]"
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {q.type === 'fraction-builder' && (
                      <div className="flex flex-col gap-2 mt-2" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-primary-text)', textTransform: 'uppercase' }}>Fraction Builder Setup</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Denominator (Total Slices)</label>
                            <select
                              value={q.options[1] || '4'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingLesson(prev => {
                                  if (!prev) return null;
                                  const questions = [...prev.questions];
                                  const options = [questions[idx].options[0] || '2', val];
                                  questions[idx] = { ...questions[idx], options };
                                  return { ...prev, questions };
                                });
                              }}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', marginTop: '4px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px' }}
                            >
                              {['3', '4', '5', '6', '8', '10', '12'].map(v => (
                                <option key={v} value={v}>{v} slices</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '10px' }}>Correct Numerator (Shaded Slices)</label>
                            <select
                              value={q.options[0] || '2'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingLesson(prev => {
                                  if (!prev) return null;
                                  const questions = [...prev.questions];
                                  const options = [val, questions[idx].options[1] || '4'];
                                  questions[idx] = { ...questions[idx], options, correctAnswer: val };
                                  return { ...prev, questions };
                                });
                              }}
                              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', marginTop: '4px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px' }}
                            >
                              {Array.from({ length: parseInt(q.options[1] || '4') }).map((_, i) => (
                                <option key={i + 1} value={(i + 1).toString()}>{i + 1} shaded</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {q.type === 'drag-drop-matching' && (
                      <div className="flex flex-col gap-2 mt-2">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '10px' }}>Matching Pairs (Pairs of Antonyms, Synonyms, etc.)</label>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLesson(prev => {
                                if (!prev) return null;
                                const questions = [...prev.questions];
                                const pairs = { ...questions[idx].matchingPairs };
                                const nextIdx = Object.keys(pairs).length + 1;
                                pairs[`Key ${nextIdx}`] = `Val ${nextIdx}`;
                                questions[idx] = {
                                  ...questions[idx],
                                  matchingPairs: pairs,
                                  options: [...Object.keys(pairs), ...Object.values(pairs)],
                                  correctAnswer: Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ')
                                };
                                return { ...prev, questions };
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#38BDF8', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            + Add Pair
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {Object.entries(q.matchingPairs || {}).map(([key, val], pairIdx) => (
                            <div key={pairIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px' }}>
                              <input
                                type="text"
                                value={key as string}
                                placeholder="Left Item"
                                onChange={(e) => {
                                  const newKey = e.target.value;
                                  if (!newKey) return;
                                  setEditingLesson(prev => {
                                    if (!prev) return null;
                                    const questions = [...prev.questions];
                                    const pairs = { ...questions[idx].matchingPairs };
                                    delete pairs[key];
                                    pairs[newKey] = val;
                                    questions[idx] = {
                                      ...questions[idx],
                                      matchingPairs: pairs,
                                      options: [...Object.keys(pairs), ...Object.values(pairs)],
                                      correctAnswer: Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ')
                                    };
                                    return { ...prev, questions };
                                  });
                                }}
                                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                                required
                              />
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 'bold' }}>⇄</span>
                              <input
                                type="text"
                                value={val as string}
                                placeholder="Right Item"
                                onChange={(e) => {
                                  const newVal = e.target.value;
                                  setEditingLesson(prev => {
                                    if (!prev) return null;
                                    const questions = [...prev.questions];
                                    const pairs = { ...questions[idx].matchingPairs };
                                    pairs[key] = newVal;
                                    questions[idx] = {
                                      ...questions[idx],
                                      matchingPairs: pairs,
                                      options: [...Object.keys(pairs), ...Object.values(pairs)],
                                      correctAnswer: Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ')
                                    };
                                    return { ...prev, questions };
                                  });
                                }}
                                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', color: 'var(--text-main)', outline: 'none' }}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLesson(prev => {
                                    if (!prev) return null;
                                    const questions = [...prev.questions];
                                    const pairs = { ...questions[idx].matchingPairs };
                                    delete pairs[key];
                                    questions[idx] = {
                                      ...questions[idx],
                                      matchingPairs: pairs,
                                      options: [...Object.keys(pairs), ...Object.values(pairs)],
                                      correctAnswer: Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ')
                                    };
                                    return { ...prev, questions };
                                  });
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#EF4444', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', padding: '0 4px' }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-group mt-3">
                      <label style={{ fontSize: '10px' }}>Explanation</label>
                      <input
                        type="text"
                        value={q.feedback?.en || ''}
                        onChange={(e) => {
                          const feedbackVal = e.target.value;
                          setEditingLesson(prev => {
                            if (!prev) return null;
                            const questions = [...prev.questions];
                            questions[idx] = {
                              ...questions[idx],
                              feedback: { en: feedbackVal, fil: feedbackVal }
                            };
                            return { ...prev, questions };
                          });
                        }}
                        style={{ marginTop: '4px', padding: '8px 12px', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>
                ))}
                {editingLesson.questions.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No questions in this lesson. Add one above!</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingLesson(null)}
              disabled={isSavingEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
            >
              {isSavingEdit ? 'Saving Changes...' : 'Save & Overwrite Lesson'}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="fade-in flex flex-col gap-6 w-full">
      {propActiveSubTab === undefined && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[28px]">
            <h2 className="flex items-center gap-2">
              <School className="size-6 text-[#11428E] shrink-0" />
              <span>Teacher Console</span>
            </h2>
            <div className="flex bg-white/5 border border-[var(--border-color)] rounded-[10px] p-1 gap-1">
              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'analytics'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <TrendingUp size={14} className="shrink-0" />
                <span>Classroom Analytics</span>
              </button>
              <button
                onClick={() => setActiveSubTab('classroom-pairing')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'classroom-pairing'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <Key size={14} className="shrink-0" />
                <span>Classroom Setup</span>
              </button>
              <button
                onClick={() => setActiveSubTab('manual-lesson')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'manual-lesson'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <Edit3 size={14} className="shrink-0" />
                <span>Create Lesson Manually</span>
              </button>
            </div>
          </div>
          {activeSubTab === 'analytics' && (
            <button className="bg-white/4 border border-[var(--border-color)] text-[var(--text-main)] px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5" onClick={refreshLogs}>
              <RotateCw size={14} />
              <span>Refresh Logs</span>
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'classroom-pairing' ? (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', fontWeight: 700, margin: 0, paddingLeft: '4px' }}>
            Active Classroom Config & Pairing
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>

          {/* Left Column: Classroom Directory & Creation Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 2px 10px rgba(20,30,55,0.06)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={18} className="text-[#11428E] shrink-0" />
              <span>Classroom Directory</span>
            </h3>

            {/* Switch / Select Classroom List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Select Active Classroom Session</label>
              {classroomHistory.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  No classrooms created yet. Use the form below to get started!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {classroomHistory.map(c => {
                    const isActive = classroomCode === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          localStorage.setItem('guro_teacher_classroom_code', c.id);
                          setClassroomCode(c.id);
                          setClassroomData({
                            classroomId: c.id,
                            teacherName: c.teacherName,
                            subject: c.subject,
                            gradeLevel: c.gradeLevel,
                            expiresAt: c.expiresAt
                          });
                          setSelectedModules([]);
                          refreshLogs();
                        }}
                        className="btn btn-secondary"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '10px 14px',
                          border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                          fontSize: '13px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontWeight: isActive ? 800 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_#10B981]" />
                          ) : (
                            <Key size={12} className="text-[var(--text-muted)] inline-block shrink-0" />
                          )}
                          <span>{c.id} - {c.teacherName} ({c.subject} • Grade {c.gradeLevel})</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Creation Form (Always Visible) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} className="text-[#11428E] shrink-0" /> Setup a New Classroom
              </span>

              <div className="form-group">
                <label>Teacher Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Teacher Maria" 
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  style={{ padding: '10px 14px' }}
                />
              </div>

              <div className="form-group">
                <label>Subject Focus</label>
                <select 
                  value={setupSubject} 
                  onChange={(e) => setSetupSubject(e.target.value)}
                  style={{ padding: '10px 14px' }}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="form-group">
                <label>Grade Level</label>
                <select 
                  value={setupGrade} 
                  onChange={(e) => setSetupGrade(Number(e.target.value))}
                  style={{ padding: '10px 14px' }}
                >
                  <option value={4}>Grade 4</option>
                  <option value={5}>Grade 5</option>
                  <option value={6}>Grade 6</option>
                </select>
              </div>

              <div className="form-group">
                <label>Session Invite Duration</label>
                <select 
                  value={setupDuration} 
                  onChange={(e) => setSetupDuration(Number(e.target.value))}
                  style={{ padding: '10px 14px' }}
                >
                  <option value={0}>No Limit (Always Open)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <button 
                type="button" 
                className="btn btn-primary"
                disabled={isCreatingClass}
                onClick={async () => {
                  if (!setupName.trim()) {
                    toast.error('Please enter your name.');
                    return;
                  }
                  setIsCreatingClass(true);
                  try {
                    const res = await apiFetch('/api/classroom/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        teacherName: setupName.trim(),
                        subject: setupSubject,
                        gradeLevel: setupGrade,
                        duration: setupDuration
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      localStorage.setItem('guro_teacher_classroom_code', data.classroomId);
                      setClassroomCode(data.classroomId);
                      setClassroomData(data);
                      setSetupName('');
                      refreshLogs();
                      
                      // Add to history
                      setClassroomHistory((prev) => {
                        if (prev.some(c => c.id === data.classroomId)) return prev;
                        const updated = [...prev, {
                          id: data.classroomId,
                          teacherName: data.teacherName,
                          subject: data.subject,
                          gradeLevel: data.gradeLevel,
                          expiresAt: data.expiresAt
                        }];
                        localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
                        return updated;
                      });
                    } else {
                      throw new Error('Failed to create classroom.');
                    }
                  } catch (e: any) {
                    toast.error(e.message || 'Error occurred.');
                  } finally {
                    setIsCreatingClass(false);
                  }
                }}
                style={{ marginTop: '5px' }}
              >
                {isCreatingClass ? 'Generating Code...' : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap size={14} className="shrink-0" />
                    <span>Generate Classroom Invite Code</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Active Session Configurations */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 2px 10px rgba(20,30,55,0.06)' }}>
            {classroomCode && classroomData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} className="text-[#11428E] shrink-0" />
                    <span>Session Control</span>
                  </h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem('guro_teacher_classroom_code');
                      setClassroomCode(null);
                      setClassroomData(null);
                      setSelectedModules([]);
                      refreshLogs();
                    }}
                    className="btn btn-secondary flex items-center gap-1.5"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <LogOut size={12} className="shrink-0" />
                    <span>Deselect Session</span>
                  </button>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--accent-primary-glow)', border: '1px solid var(--accent-primary-glow)', borderRadius: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Invite Code for Students</span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#11428E', letterSpacing: '3px', marginTop: '6px', fontFamily: 'monospace' }}>
                    {classroomCode}
                  </div>
                  
                  {/* Expiration timer display */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <InviteExpirationTimer 
                      classroomCode={classroomCode}
                      expiresAt={classroomData.expiresAt} 
                      onExpired={() => {
                        fetchClassroomData(classroomCode);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-main)', backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '11px', border: '1px solid var(--border-color)' }}>
                  <div><strong>Teacher Name:</strong> {classroomData.teacherName}</div>
                  <div><strong>Subject Focus:</strong> {classroomData.subject}</div>
                  <div><strong>Grade Level:</strong> Grade {classroomData.gradeLevel}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Modules to Claim:
                  </span>
                  {globalBank ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-main)' }}>
                      {getSelectableTopics().map((mod) => {
                        const isClaimed = isTopicAlreadyClaimed(mod.subject, mod.grade, mod.topic);
                        const isSelected = isClaimed || selectedModules.some(
                          s => s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic
                        );
                        return (
                          <label 
                            key={`${mod.subject}-${mod.grade}-${mod.topic}`} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              cursor: isClaimed ? 'not-allowed' : 'pointer', 
                              fontSize: '13px', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              color: isClaimed ? 'var(--text-muted)' : 'var(--text-main)',
                              backgroundColor: isClaimed ? 'rgba(255,255,255,0.01)' : isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              opacity: isClaimed ? 0.7 : 1,
                              transition: 'background-color 0.2s',
                              textTransform: 'none'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              disabled={isClaimed}
                              onChange={() => {
                                if (isClaimed) return;
                                if (isSelected) {
                                  setSelectedModules(prev => prev.filter(
                                    s => !(s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic)
                                  ));
                                } else {
                                  setSelectedModules(prev => [...prev, mod]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: isClaimed ? 'not-allowed' : 'pointer' }}
                            />
                            <span className="flex items-center gap-1.5">
                              {mod.subject === 'Mathematics' ? (
                                <Calculator size={14} className="text-[#11428E] shrink-0" />
                              ) : (
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                              )}
                              <strong>{mod.subject === 'Mathematics' ? 'Math' : 'English'}</strong> (Grade {mod.grade}) - {mod.topic}
                              {isClaimed && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block shadow-[0_0_6px_#10B981]" />
                                  <span>Claimed</span>
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Loading available templates...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  {(() => {
                    const selectable = getSelectableTopics();
                    const unclaimedSelectable = selectable.filter(m => !isTopicAlreadyClaimed(m.subject, m.grade, m.topic));
                    const newClaims = selectedModules.filter(m => !isTopicAlreadyClaimed(m.subject, m.grade, m.topic));
                    const allClaimed = unclaimedSelectable.length === 0;

                    return (
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        disabled={isClaiming || allClaimed || newClaims.length === 0}
                        onClick={async () => {
                          if (newClaims.length === 0) {
                            toast.error('Please select at least one new module to claim.');
                            return;
                          }
                          setIsClaiming(true);
                          try {
                            const res = await apiFetch('/api/classroom/claim', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                classroomId: classroomCode,
                                selections: newClaims
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              toast.success(`Successfully claimed ${newClaims.length} curriculum template(s)!`);
                              setClassroomData(prev => prev ? {
                                ...prev,
                                customItemBank: data.customItemBank
                              } : null);
                            } else {
                              throw new Error('Failed to claim template.');
                            }
                          } catch (e: any) {
                            toast.error(e.message || 'Error claiming template.');
                          } finally {
                            setIsClaiming(false);
                          }
                        }}
                        style={{ 
                          flex: 1,
                          opacity: allClaimed ? 0.5 : 1,
                          cursor: allClaimed ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isClaiming ? (
                          'Claiming Templates...'
                        ) : allClaimed ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Check size={16} className="text-[#10B981] shrink-0" strokeWidth={3} />
                            <span>All Curriculum Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <ClipboardList size={16} className="shrink-0" />
                            <span>Claim Selected ({newClaims.length} New)</span>
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>

                {/* Active Classroom Lessons (Edit & Delete) */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Classroom Lessons ({getActiveClassroomTopics().length}):
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {getActiveClassroomTopics().map((mod) => (
                      <div 
                        key={`${mod.subject}-${mod.grade}-${mod.topic}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-main)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          {mod.subject === 'Mathematics' ? (
                            <Calculator size={14} className="text-[#3b82f6] shrink-0" />
                          ) : (
                            <BookOpen size={14} className="text-emerald-500 shrink-0" />
                          )}
                          <span style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            <strong>{mod.topic}</strong> (G{mod.grade})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(mod.subject, mod.grade, mod.topic, mod.data)}
                            className="bg-transparent border-none text-[var(--accent-primary-text)] hover:opacity-80 cursor-pointer p-1"
                            title="Edit Lesson"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(mod.subject, mod.grade, mod.topic)}
                            className="bg-transparent border-none text-[var(--accent-secondary)] hover:opacity-80 cursor-pointer p-1"
                            title="Delete Lesson"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {getActiveClassroomTopics().length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                        No lessons claimed yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
                <School size={48} className="text-slate-400 shrink-0" />
                <span style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>No Active Classroom Selected</span>
                <span style={{ fontSize: '12px', textAlign: 'center', maxWidth: '300px' }}>
                  Select an existing classroom from the Directory on the left, or create a new session code to begin managing paired templates.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : activeSubTab === 'manual-lesson' ? (
        <ManualLessonBuilder classroomId={classroomCode} />
      ) : (
        <>
          {classroomCode && classroomData && (
            <div className="px-6 py-3.5 flex justify-between items-center bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 rounded-[12px] mb-2">
              <span className="text-[13px] color-[var(--accent-secondary)] font-semibold flex items-center gap-2">
                <School className="size-4 text-sky-500 shrink-0" />
                <span>Filtered to Classroom Invite Code: <strong className="text-[var(--text-main)] font-mono text-[14px] tracking-[1px]">{classroomCode}</strong> ({classroomData.subject} • Grade {classroomData.gradeLevel})</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Deselect/switch classroom setup in the Setup tab to view all logs.
              </span>
            </div>
          )}
          {loading && progressLogs.length === 0 ? (
            <div className="flex flex-col gap-5">
              <SkeletonStatCards count={4} />
              <SkeletonCard rows={3} />
              <SkeletonTable rows={4} cols={5} />
            </div>
          ) : (
            <>
              {/* Analytics Summary Row */}
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total Sync Reports" value={progressLogs.length} accentColor="#11428E" />
                <StatCard label="Filtered Logs" value={filteredLogs.length} accentColor="#CE1126" />
                <StatCard label="Classroom Accuracy" value={`${getAverageAccuracy()}%`} accentColor="#16A34A" valueColor="#16A34A" />
                <StatCard label="Active Devices" value={uniqueStudents.length} accentColor="#11428E" valueColor="#11428E" />
              </div>

              {/* Diagnostics Alerts Row */}
              {progressLogs.length > 0 && (
                <DiagnosticAlerts progressLogs={progressLogs} />
              )}

              {/* Classroom Mastery Matrix */}
              <MasteryMatrix
                progressLogs={progressLogs}
                lastUpdatedCell={lastUpdatedCell}
                onGoToClassroomSetup={() => setActiveSubTab('classroom-pairing')}
              />
            </>
          )}

          {/* Interactive Student profile cards grid */}
          {!loading && uniqueStudents.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Students Telemetry Profiles</h3>
              <div className="grid grid-cols-4 gap-4">
                {uniqueStudents.map(studentId => {
                  const studentLogs = progressLogs.filter(l => l.studentId === studentId);
                  return (
                    <StudentTile
                      key={studentId}
                      studentId={studentId}
                      logs={studentLogs}
                      onSelect={handleSelectStudent}
                      isSelected={selectedStudentId === studentId}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters Area */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] px-6 py-[22px] flex items-end gap-5 shadow-sm">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setFilterText(searchInput);
              }}
              className="flex items-end gap-3"
              style={{ flex: 2 }}
            >
              <div className="form-group flex-1">
                <label>Search Student or Topic</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search by student identifier or topic..."
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (e.target.value === '') {
                        setFilterText('');
                      }
                    }}
                    className="w-full pr-10"
                    style={{ padding: '10px 14px' }}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setFilterText('');
                      }}
                      className="absolute right-3 p-1 rounded-full hover:bg-white/10 text-[var(--text-muted)] cursor-pointer flex items-center justify-center border-none bg-transparent"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-1.5 shrink-0"
                style={{ height: '42px', padding: '0 20px', borderRadius: '10px' }}
              >
                <Search size={14} />
                <span>Search</span>
              </button>
            </form>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Filter by Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="All">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
              </select>
            </div>
            {selectedStudentId && (
              <div className="flex flex-col">
                <label style={{ display: 'block', marginBottom: '8px' }}>Active Filter</label>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="btn btn-secondary px-3.5 py-2 text-xs font-bold text-[var(--accent-primary)] border border-[var(--accent-primary-glow)] bg-[var(--accent-primary-glow)] flex items-center justify-center gap-1.5"
                >
                  <User size={12} className="shrink-0" />
                  <span>{selectedStudentId}</span>
                  <X size={12} className="shrink-0 ml-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] overflow-x-auto shadow-sm">
            {loading ? (
              <div className="text-center p-10">
                <div className="spinner" style={{ margin: '20px auto' }}></div>
                <p style={{ color: '#11428E', fontWeight: 600 }}>Loading sync records...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-10">
                <p style={{ color: '#64748B', fontStyle: 'italic', padding: 20 }}>
                  No synced progress logs found matching criteria.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Student / Device ID</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Subject</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Grade</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Topic</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Accuracy Score</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Status</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const percentage = Math.round((log.score / log.totalQuestions) * 100);
                    return (
                      <tr key={log.eventId} className="border-b border-[var(--border-color)]">
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span className="bg-[var(--border-color)] px-2 py-1 rounded-md font-mono text-xs border border-[var(--border-color)] flex items-center gap-1.5 w-fit">
                            <User size={12} className="text-[#11428E] shrink-0" />
                            <span>{log.studentId}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span style={{ fontWeight: 600 }} className="flex items-center gap-1.5">
                            {log.subject === 'Mathematics' ? (
                              <>
                                <Calculator size={14} className="text-[#11428E] shrink-0" />
                                <span>Math</span>
                              </>
                            ) : (
                              <>
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                                <span>English</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">Grade {log.gradeLevel}</td>
                        <td className="px-5 py-4 text-[var(--text-main)]">{log.topic}</td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <div className="flex items-baseline gap-1.5">
                            <span style={{ fontWeight: 800, color: percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#A01322' }}>
                              {percentage}%
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-medium">({log.score}/{log.totalQuestions})</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span className={
                            percentage >= 80 
                              ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" 
                              : percentage >= 50 
                                ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20" 
                                : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#A01322]/10 text-[#A01322] border border-[#A01322]/20"
                          }>
                            {percentage >= 80 ? 'Mastery' : percentage >= 50 ? 'Review' : 'Remediation'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      {editingLesson && renderEditModal()}
    </div>
  );
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

function InviteExpirationTimer({ 
  classroomCode, 
  expiresAt, 
  onExpired 
}: { 
  classroomCode: string; 
  expiresAt?: string | null; 
  onExpired: () => void 
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('Always Open (No Limit)');
      setIsExpired(false);
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;

    const checkExpiry = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const diff = expiryTime - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired / Locked');
        setIsExpired(true);
        clearInterval(intervalId);
        onExpired();
        return true;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`Expires in ${mins}m ${secs}s`);
      setIsExpired(false);
      return false;
    };

    const expired = checkExpiry();
    if (expired) return;

    intervalId = setInterval(checkExpiry, 1000);
    return () => clearInterval(intervalId);
  }, [expiresAt, classroomCode]);

  const handleLockNow = async () => {
    setIsLocking(true);
    try {
      const res = await apiFetch('/api/classroom/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: classroomCode })
      });
      if (res.ok) {
        onExpired();
      }
    } catch (e) {
      console.error('Error locking session:', e);
    } finally {
      setIsLocking(false);
    }
  };

  if (isExpired) {
    return (
      <span className="text-xs text-[var(--danger)] font-bold inline-flex items-center gap-1.5">
        <Lock size={12} /> Expiration Status: Locked / Closed
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--success)] font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_#10B981]" />
        <span>Active - {timeLeft}</span>
      </span>
      {expiresAt && (
        <button
          onClick={handleLockNow}
          disabled={isLocking}
          className="btn btn-secondary px-2 py-1 text-[10px] rounded flex items-center gap-1"
        >
          <Lock size={10} className="shrink-0" />
          <span>Lock Now</span>
        </button>
      )}
    </div>
  );
}



