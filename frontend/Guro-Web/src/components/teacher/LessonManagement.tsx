import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calculator, 
  Plus, 
  Search, 
  Eye, 
  Send, 
  Trash2, 
  Edit3, 
  Sparkles,
  School,
  Layers,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';
import { LessonPreviewModal } from './LessonPreviewModal';
import type { QuestionPreviewItem } from './LessonPreviewModal';

export interface ClassroomOption {
  id: string;
  teacherName: string;
  subject: string;
  gradeLevel: number;
  sectionName?: string;
}

export interface LessonManagementProps {
  activeClassroomId?: string | null;
  classrooms?: ClassroomOption[];
  initialTab?: 'system' | 'custom';
  onTabChange?: (tab: 'system' | 'custom') => void;
  onCreateLesson?: () => void;
  onOpenCreateLesson?: () => void;
  onEditCustomLesson?: (lesson: any) => void;
  onAssignLessonToClassroom?: (classroomId: string, moduleInfo: { subject: string; grade: string; topic: string }) => Promise<boolean>;
}

export const LessonManagement: React.FC<LessonManagementProps> = ({
  activeClassroomId: _activeClassroomId,
  classrooms = [],
  initialTab,
  onTabChange,
  onCreateLesson,
  onOpenCreateLesson,
  onEditCustomLesson,
  onAssignLessonToClassroom,
}) => {
  const [activeTab, setActiveTab] = useState<'system' | 'custom'>(initialTab || 'system');

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [globalBank, setGlobalBank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [gradeFilter, setGradeFilter] = useState<'All' | '4' | '5' | '6'>('All');

  // Preview Modal state
  const [previewLesson, setPreviewLesson] = useState<{
    title: string;
    subject: string;
    grade: string | number;
    topic: string;
    questions: QuestionPreviewItem[];
    isSystemLesson: boolean;
  } | null>(null);

  // Assign Modal state
  const [assigningLesson, setAssigningLesson] = useState<{
    subject: string;
    grade: string;
    topic: string;
  } | null>(null);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Teacher Custom Lessons
  const [customLessons, setCustomLessons] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('guro_teacher_custom_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setIsLoading(true);
    apiFetch('/api/item-bank')
      .then(res => res.json())
      .then(data => {
        setGlobalBank(data);
      })
      .catch(err => {
        console.error('Error fetching global item bank:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Extract all official lessons
  const officialLessons: {
    subject: string;
    grade: string;
    topic: string;
    questions: QuestionPreviewItem[];
  }[] = [];

  if (globalBank) {
    Object.keys(globalBank).forEach(subj => {
      Object.keys(globalBank[subj]).forEach(gr => {
        Object.keys(globalBank[subj][gr]).forEach(tp => {
          const rawQuestions = globalBank[subj][gr][tp];
          const questionsList: QuestionPreviewItem[] = Array.isArray(rawQuestions) 
            ? rawQuestions 
            : Object.values(rawQuestions);

          officialLessons.push({
            subject: subj,
            grade: gr,
            topic: tp,
            questions: questionsList,
          });
        });
      });
    });
  }

  // Filter lessons based on active filters
  const filteredOfficial = officialLessons.filter(item => {
    if (subjectFilter !== 'All' && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
    if (gradeFilter !== 'All' && String(item.grade) !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.topic.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredCustom = customLessons.filter(item => {
    if (subjectFilter !== 'All' && item.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
    if (gradeFilter !== 'All' && String(item.gradeLevel || item.grade) !== gradeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (item.title || item.topic || '').toLowerCase().includes(q) || (item.subject || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAssignModal = (lesson: { subject: string; grade: string | number; topic: string }) => {
    setAssigningLesson({
      subject: lesson.subject,
      grade: String(lesson.grade),
      topic: lesson.topic,
    });
    if (classrooms.length > 0) {
      setSelectedClassroomId(classrooms[0].id);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assigningLesson || !selectedClassroomId) {
      toast.error('Please select a target classroom.');
      return;
    }
    setIsAssigning(true);
    try {
      if (onAssignLessonToClassroom) {
        const success = await onAssignLessonToClassroom(selectedClassroomId, assigningLesson);
        if (success) {
          toast.success(`Lesson "${assigningLesson.topic}" assigned to classroom!`);
          setAssigningLesson(null);
        }
      } else {
        const res = await apiFetch('/api/classroom/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classroomId: selectedClassroomId,
            selections: [assigningLesson]
          })
        });
        if (res.ok) {
          toast.success(`Lesson "${assigningLesson.topic}" assigned to classroom!`);
          setAssigningLesson(null);
        } else {
          toast.error('Failed to assign lesson to classroom.');
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Error assigning lesson.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteCustomLesson = (lessonId: string, title: string) => {
    const updated = customLessons.filter(l => (l.id || l.topic) !== lessonId);
    setCustomLessons(updated);
    localStorage.setItem('guro_teacher_custom_lessons', JSON.stringify(updated));
    toast.success(`Deleted custom lesson "${title}"`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Quick Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
            <BookOpen className="size-6 text-[#11428E]" />
            <span>Lesson Library & Curriculum Management</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Browse official DepEd lessons, preview question answer keys, and manage teacher-authored quizzes.
          </p>
        </div>

        {(onCreateLesson || onOpenCreateLesson) && (
          <button
            type="button"
            onClick={() => (onCreateLesson ? onCreateLesson() : onOpenCreateLesson?.())}
            className="btn btn-primary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl shadow-md"
          >
            <Plus size={16} />
            <span>Create New Custom Lesson</span>
          </button>
        )}
      </div>

      {/* Tabs and Filters Navigation */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
        {/* Sub-Tabs: System vs Custom */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="flex bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('system');
                onTabChange?.('system');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'system'
                  ? 'bg-[#11428E] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Layers size={14} />
              <span>Official DepEd Lessons ({officialLessons.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('custom');
                onTabChange?.('custom');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'custom'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sparkles size={14} />
              <span>My Custom Lessons ({customLessons.length})</span>
            </button>
          </div>

          <span className="text-xs text-[var(--text-muted)]">
            Showing {activeTab === 'system' ? filteredOfficial.length : filteredCustom.length} active module(s)
          </span>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 size-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by topic, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="English">English</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div className="flex items-center gap-2">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Grades (4–6)</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lesson Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-[var(--text-muted)] text-sm">
          <div className="spinner mx-auto mb-3" />
          Loading curriculum assets...
        </div>
      ) : activeTab === 'system' ? (
        filteredOfficial.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-[var(--text-muted)] text-sm">
            No official DepEd lessons match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfficial.map((item, idx) => {
              const isMath = item.subject.toLowerCase() === 'mathematics' || item.subject.toLowerCase() === 'math';
              return (
                <div
                  key={`${item.subject}-${item.grade}-${item.topic}-${idx}`}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                          isMath ? 'bg-[#11428E]' : 'bg-[#0F766E]'
                        }`}>
                          {isMath ? <Calculator size={16} /> : <BookOpen size={16} />}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wide">
                          {isMath ? 'Math' : 'English'}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                        Grade {item.grade}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[var(--text-main)] group-hover:text-indigo-400 transition-colors mt-1">
                      {item.topic}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      DepEd official curriculum module containing {item.questions.length} interactive assessment items.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setPreviewLesson({
                        title: item.topic,
                        subject: item.subject,
                        grade: item.grade,
                        topic: item.topic,
                        questions: item.questions,
                        isSystemLesson: true,
                      })}
                      className="btn btn-secondary flex-1 text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(item)}
                      className="btn btn-primary flex-1 text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                    >
                      <Send size={13} />
                      <span>Assign</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Custom Lessons Tab */
        filteredCustom.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
            <Sparkles className="size-10 text-purple-400 opacity-60" />
            <h4 className="text-sm font-bold text-[var(--text-main)] m-0">No Custom Lessons Created Yet</h4>
            <p className="text-xs max-w-md mx-auto">
              You haven't authored any custom lessons yet. Use the Lesson Builder to create questions, visual puzzles, and tailored diagnostic quizzes.
            </p>
            {onOpenCreateLesson && (
              <button
                type="button"
                onClick={onOpenCreateLesson}
                className="btn btn-primary text-xs px-4 py-2 mt-2"
              >
                Create Your First Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustom.map((item, idx) => {
              const isMath = (item.subject || '').toLowerCase() === 'mathematics' || (item.subject || '').toLowerCase() === 'math';
              const questionsList = item.questions || [];
              const lessonId = item.id || item.topic || `custom-${idx}`;
              const title = item.title || item.topic || 'Custom Lesson';

              return (
                <div
                  key={lessonId}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md group"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="size-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-purple-600">
                          {isMath ? <Calculator size={16} /> : <BookOpen size={16} />}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wide">
                          {item.subject}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Grade {item.gradeLevel || item.grade}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[var(--text-main)] group-hover:text-purple-400 transition-colors mt-1">
                      {title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      Teacher-authored assessment with {questionsList.length} customized items.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => setPreviewLesson({
                        title,
                        subject: item.subject,
                        grade: item.gradeLevel || item.grade,
                        topic: item.topic || title,
                        questions: questionsList,
                        isSystemLesson: false,
                      })}
                      className="btn btn-secondary flex-1 text-xs py-2 px-2 flex items-center justify-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>
                    {onEditCustomLesson && (
                      <button
                        type="button"
                        onClick={() => onEditCustomLesson(item)}
                        className="btn btn-secondary text-xs py-2 px-2.5 flex items-center justify-center"
                        title="Edit lesson"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal({
                        subject: item.subject,
                        grade: item.gradeLevel || item.grade,
                        topic: item.topic || title,
                      })}
                      className="btn btn-primary flex-1 text-xs py-2 px-2 flex items-center justify-center gap-1"
                    >
                      <Send size={13} />
                      <span>Assign</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomLesson(lessonId, title)}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete custom lesson"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Preview Modal */}
      {previewLesson && (
        <LessonPreviewModal
          isOpen={!!previewLesson}
          onClose={() => setPreviewLesson(null)}
          title={previewLesson.title}
          subject={previewLesson.subject}
          grade={previewLesson.grade}
          topic={previewLesson.topic}
          questions={previewLesson.questions}
          isSystemLesson={previewLesson.isSystemLesson}
          onAssignToClass={() => handleOpenAssignModal(previewLesson)}
        />
      )}

      {/* Assign to Classroom Modal */}
      {assigningLesson && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md p-6 flex flex-col gap-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <School className="size-5 text-[#11428E]" />
                <h3 className="text-base font-bold text-[var(--text-main)] m-0">
                  Assign Lesson to Classroom
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningLesson(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs flex flex-col gap-1">
              <span className="font-bold text-[var(--text-main)] text-sm">{assigningLesson.topic}</span>
              <span className="text-[var(--text-muted)]">{assigningLesson.subject} • Grade {assigningLesson.grade}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Select Target Classroom
              </label>
              {classrooms.length === 0 ? (
                <p className="text-xs text-amber-500 italic">
                  No active classrooms found. Please create a classroom session first in "My Classrooms".
                </p>
              ) : (
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} - Grade {c.gradeLevel} ({c.subject}{c.sectionName ? ` • Sec: ${c.sectionName}` : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningLesson(null)}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigning || classrooms.length === 0}
                onClick={handleConfirmAssign}
                className="btn btn-primary text-xs px-5 py-2"
              >
                {isAssigning ? 'Deploying...' : 'Deploy to Classroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
