import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Key, 
  Users, 
  BookOpen, 
  BarChart3, 
  Lock, 
  Edit3, 
  Trash2, 
  Calculator, 
  User, 
  Copy, 
  CheckCircle2,
  Zap
} from 'lucide-react';
import { toast } from '../../utils/toast';
import { apiFetch } from '../../utils/api';
import { MasteryMatrix } from './MasteryMatrix';

export interface ClassroomDetailViewProps {
  classroom: {
    id: string;
    teacherName: string;
    subject: string;
    gradeLevel: number;
    sectionName?: string;
    schoolYear?: string;
    term?: string;
    expiresAt?: string | null;
    customItemBank?: any;
  };
  progressLogs: any[];
  onBack: () => void;
  onRefreshLogs: () => void;
  onEditLesson?: (lesson: any) => void;
  onDeleteLesson?: (lesson: any) => void;
  isActive?: boolean;
  onSetActiveClassroom?: (id: string) => void;
}

export const ClassroomDetailView: React.FC<ClassroomDetailViewProps> = ({
  classroom,
  progressLogs,
  onBack,
  onRefreshLogs,
  onEditLesson,
  onDeleteLesson,
  isActive = false,
  onSetActiveClassroom,
}) => {
  const [activeTab, setActiveTab] = useState<'session' | 'students' | 'lessons' | 'mastery'>('session');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  // Filter logs to this classroom
  const classroomLogs = progressLogs.filter(
    l => l.classroomId === classroom.id || (!l.classroomId && l.gradeLevel === classroom.gradeLevel)
  );

  // Extract unique students in this classroom
  const enrolledStudentIds = Array.from(new Set(classroomLogs.map(l => l.studentId)));

  // Extract active classroom lessons from customItemBank
  const getActiveClassroomLessons = () => {
    if (!classroom.customItemBank) return [];
    const list: { subject: string; grade: string; topic: string; questions: any[] }[] = [];
    const bank = classroom.customItemBank;
    Object.keys(bank).forEach(subj => {
      Object.keys(bank[subj] || {}).forEach(gr => {
        Object.keys(bank[subj][gr] || {}).forEach(tp => {
          const rawQ = bank[subj][gr][tp];
          const questions = Array.isArray(rawQ) ? rawQ : Object.values(rawQ);
          list.push({ subject: subj, grade: gr, topic: tp, questions });
        });
      });
    });
    return list;
  };

  const activeLessons = getActiveClassroomLessons();

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classroom.id);
    setCopiedCode(true);
    toast.success(`Copied classroom code ${classroom.id}!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLockSession = async () => {
    setIsLocking(true);
    try {
      const res = await apiFetch('/api/classroom/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: classroom.id })
      });
      if (res.ok) {
        toast.success(`Session ${classroom.id} locked.`);
        onRefreshLogs();
      }
    } catch {
      toast.error('Failed to lock session.');
    } finally {
      setIsLocking(false);
    }
  };

  const isMath = classroom.subject.toLowerCase() === 'mathematics' || classroom.subject.toLowerCase() === 'math';

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 rounded-xl hover:text-white"
        >
          <ArrowLeft size={14} />
          <span>Back to All Classrooms</span>
        </button>

        <div className="flex items-center gap-2.5">
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
              <span>Active Classroom</span>
            </span>
          ) : onSetActiveClassroom ? (
            <button
              type="button"
              onClick={() => onSetActiveClassroom(classroom.id)}
              className="btn btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 rounded-xl shadow-xs cursor-pointer font-bold"
            >
              <Zap size={14} className="text-amber-300" />
              <span>Set as Active Classroom</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCopyCode}
            className="btn btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 rounded-xl cursor-pointer font-semibold"
            title="Copy invite code"
          >
            {copiedCode ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copiedCode ? 'Copied' : 'Share Code'}</span>
          </button>
        </div>
      </div>

      {/* Classroom Hero Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`size-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shrink-0 ${
            isMath ? 'bg-gradient-to-br from-[#11428E] to-[#1C5BC0]' : 'bg-gradient-to-br from-[#0F766E] to-[#14B8A6]'
          }`}>
            {isMath ? <Calculator className="size-7" /> : <BookOpen className="size-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] m-0">
                Grade {classroom.gradeLevel} {classroom.subject}
                {classroom.sectionName ? ` — ${classroom.sectionName}` : ''}
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                {classroom.id}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Teacher: <strong>{classroom.teacherName}</strong> • S.Y. {classroom.schoolYear || '2026-2027'} • {classroom.term || 'Quarter 1'}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-[var(--bg-main)] px-5 py-3 rounded-xl border border-[var(--border-color)]">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Students</span>
            <div className="text-lg font-extrabold text-[var(--text-main)] mt-0.5">{enrolledStudentIds.length}</div>
          </div>
          <div className="w-[1px] h-8 bg-[var(--border-color)]" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Lessons</span>
            <div className="text-lg font-extrabold text-[var(--text-main)] mt-0.5">{activeLessons.length}</div>
          </div>
          <div className="w-[1px] h-8 bg-[var(--border-color)]" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Quizzes Taken</span>
            <div className="text-lg font-extrabold text-emerald-500 mt-0.5">{classroomLogs.length}</div>
          </div>
        </div>
      </div>

      {/* In-Classroom Navigation Sub-Tabs */}
      <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] w-fit flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'session' ? 'bg-[#11428E] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Key size={14} />
          <span>Session PIN & Control</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'students' ? 'bg-[#11428E] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Users size={14} />
          <span>Enrolled Students ({enrolledStudentIds.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lessons')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'lessons' ? 'bg-[#11428E] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <BookOpen size={14} />
          <span>Active Lessons ({activeLessons.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mastery')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'mastery' ? 'bg-[#11428E] text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <BarChart3 size={14} />
          <span>Classroom Gradebook</span>
        </button>
      </div>

      {/* Tab 1: Session PIN & Control */}
      {activeTab === 'session' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4">
            <span className="text-xs uppercase font-extrabold text-[var(--text-muted)] tracking-wider">
              Student Tablet Invite Code
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-extrabold text-[#11428E] dark:text-blue-400 tracking-wider">
              {classroom.id}
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Instruct learners to open GURO on their Android tablets and input this code to link their learner profile.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Copy size={13} />
                <span>Copy Code</span>
              </button>
              <button
                type="button"
                onClick={handleLockSession}
                disabled={isLocking}
                className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 text-rose-400 hover:text-rose-500"
              >
                <Lock size={13} />
                <span>{isLocking ? 'Locking...' : 'Lock Session'}</span>
              </button>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-4 text-xs">
            <h4 className="text-sm font-bold text-[var(--text-main)] m-0">Classroom Metadata</h4>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Subject Focus:</span>
              <strong className="text-[var(--text-main)]">{classroom.subject}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Grade Level:</span>
              <strong className="text-[var(--text-main)]">Grade {classroom.gradeLevel}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">Section:</span>
              <strong className="text-[var(--text-main)]">{classroom.sectionName || 'General Section'}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-muted)]">School Year:</span>
              <strong className="text-[var(--text-main)]">{classroom.schoolYear || '2026-2027'}</strong>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-muted)]">Academic Term:</span>
              <strong className="text-[var(--text-main)]">{classroom.term || 'Quarter 1'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Enrolled Students */}
      {activeTab === 'students' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">Enrolled Student Devices</h3>
            <span className="text-xs text-[var(--text-muted)]">{enrolledStudentIds.length} Active Devices</span>
          </div>

          {enrolledStudentIds.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm italic">
              No students have connected to this classroom session yet. Share code <strong>{classroom.id}</strong> with students.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                    <th className="py-3 px-4 font-bold">Student Identifier</th>
                    <th className="py-3 px-4 font-bold">Quizzes Taken</th>
                    <th className="py-3 px-4 font-bold">Accuracy</th>
                    <th className="py-3 px-4 font-bold">Mastery Level</th>
                    <th className="py-3 px-4 font-bold">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudentIds.map(stId => {
                    const stLogs = classroomLogs.filter(l => l.studentId === stId);
                    const avgPct = stLogs.length > 0
                      ? Math.round((stLogs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0)) / stLogs.length)
                      : 0;

                    return (
                      <tr key={stId} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-main)]">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--text-main)] flex items-center gap-2">
                          <User size={13} className="text-indigo-400" />
                          <span>{stId}</span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-main)]">{stLogs.length} attempts</td>
                        <td className="py-3 px-4 font-bold text-sm">
                          <span style={{ color: avgPct >= 80 ? '#10B981' : avgPct >= 50 ? '#F59E0B' : '#A01322' }}>
                            {avgPct}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            avgPct >= 80 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : avgPct >= 50
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}>
                            {avgPct >= 80 ? 'Mastered' : avgPct >= 50 ? 'Review Needed' : 'Remediation'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-muted)]">
                          {stLogs.length > 0 ? new Date(stLogs[stLogs.length - 1].timestamp).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Active Lessons */}
      {activeTab === 'lessons' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-main)] m-0">Curriculum Lessons Deployed to Classroom</h3>
            <span className="text-xs text-[var(--text-muted)]">{activeLessons.length} Modules</span>
          </div>

          {activeLessons.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] text-sm italic">
              No lessons have been claimed for this classroom yet. Go to the Lesson Library to assign curriculum.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeLessons.map((les) => (
                <div 
                  key={`${les.subject}-${les.grade}-${les.topic}`}
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">{les.subject}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">Grade {les.grade}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-main)] m-0">{les.topic}</h4>
                    <span className="text-xs text-[var(--text-muted)]">{les.questions.length} Questions</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                    {onEditLesson && (
                      <button
                        type="button"
                        onClick={() => onEditLesson(les)}
                        className="btn btn-secondary text-xs px-2.5 py-1 flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                    {onDeleteLesson && (
                      <button
                        type="button"
                        onClick={() => onDeleteLesson(les)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-md"
                        title="Delete lesson"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Classroom Gradebook / Mastery */}
      {activeTab === 'mastery' && (
        <div className="flex flex-col gap-4">
          <MasteryMatrix progressLogs={classroomLogs} />
        </div>
      )}
    </div>
  );
};
