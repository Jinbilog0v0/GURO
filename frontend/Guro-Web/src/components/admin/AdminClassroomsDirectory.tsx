import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { School, Search, Lock, Unlock, Users, Trash2, Edit3, Calculator, BookOpen, RefreshCw, X, AlertCircle } from 'lucide-react';
import { toast } from '../../utils/toast';

interface ClassroomRecord {
  id: number;
  classroomId: string;
  teacherUserId?: number | null;
  teacherName: string;
  subject: string;
  gradeLevel: number;
  enrolledStudents: number;
  isLocked: boolean;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export function AdminClassroomsDirectory() {
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Reassign Modal
  const [reassigningClassroom, setReassigningClassroom] = useState<ClassroomRecord | null>(null);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [submittingReassign, setSubmittingReassign] = useState(false);

  // Delete Modal
  const [deletingClassroom, setDeletingClassroom] = useState<ClassroomRecord | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.set('search', search.trim());
      if (selectedSubject !== 'all') q.set('subject', selectedSubject);

      const res = await apiFetch(`/api/admin/classrooms?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setClassrooms(data.classrooms || []);
      } else {
        toast.error('Failed to load classrooms.');
      }
    } catch (e) {
      toast.error('Network error loading classrooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [selectedSubject]);

  const handleToggleLock = async (c: ClassroomRecord) => {
    try {
      const res = await apiFetch(`/api/admin/classrooms/${c.id}/toggle-lock`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Lock status changed.');
        fetchClassrooms();
      } else {
        toast.error('Failed to change lock status.');
      }
    } catch (e) {
      toast.error('Error updating classroom lock.');
    }
  };

  const handleReassign = async () => {
    if (!reassigningClassroom || !newTeacherName.trim()) return;
    setSubmittingReassign(true);
    try {
      const res = await apiFetch(`/api/admin/classrooms/${reassigningClassroom.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_name: newTeacherName.trim() }),
      });
      if (res.ok) {
        toast.success('Teacher reassigned successfully.');
        setReassigningClassroom(null);
        fetchClassrooms();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to reassign teacher.');
      }
    } catch (e) {
      toast.error('Error reassigning classroom.');
    } finally {
      setSubmittingReassign(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClassroom) return;
    setSubmittingDelete(true);
    try {
      const res = await apiFetch(`/api/admin/classrooms/${deletingClassroom.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Classroom archived and removed.');
        setDeletingClassroom(null);
        fetchClassrooms();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete classroom.');
      }
    } catch (e) {
      toast.error('Error deleting classroom.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          {['all', 'Mathematics', 'English'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedSubject(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer ${
                selectedSubject === s
                  ? 'bg-[#11428E] text-white shadow-sm'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[#11428E]/40'
              }`}
            >
              {s === 'all' ? 'All Subjects' : s}
            </button>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); fetchClassrooms(); }} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search code or teacher…"
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-none focus:border-[#11428E]"
            />
          </div>
          <button type="submit" className="btn btn-primary text-xs px-3 py-1.5 font-bold cursor-pointer">
            Search
          </button>
          <button 
            type="button" 
            onClick={() => { setSearch(''); fetchClassrooms(); }}
            className="btn btn-secondary text-xs px-2.5 py-1.5 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* ── Classrooms Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-[var(--text-muted)]">
            <RefreshCw className="size-6 animate-spin text-[#11428E]" />
            <span className="text-xs font-bold">Loading school sections…</span>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-center text-[var(--text-muted)]">
            <School className="size-8 opacity-40" />
            <p className="text-sm font-bold text-[var(--text-main)]">No classrooms found</p>
            <p className="text-xs">No active classrooms match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]/60 text-[var(--text-muted)] font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Classroom Pairing Code</th>
                  <th className="py-3 px-4">Subject &amp; Grade</th>
                  <th className="py-3 px-4">Assigned Teacher</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Pairing Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {classrooms.map(c => {
                  const isMath = c.subject.toLowerCase() === 'mathematics';
                  return (
                    <tr key={c.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-xs text-[var(--text-main)]">
                        <span className="bg-[#11428E]/10 text-[#11428E] px-2.5 py-1 rounded-lg border border-[#11428E]/20">
                          {c.classroomId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-main)]">
                          {isMath ? <Calculator size={13} className="text-[#11428E]" /> : <BookOpen size={13} className="text-emerald-600" />}
                          <span>{c.subject}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">Grade {c.gradeLevel}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-xs text-[var(--text-main)]">
                        {c.teacherName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] px-2.5 py-0.5 rounded-full">
                          <Users size={12} className="text-[var(--text-muted)]" />
                          {c.enrolledStudents} students
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {c.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            <Lock size={11} /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Unlock size={11} /> Open
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleLock(c)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              c.isLocked 
                                ? 'text-emerald-600 hover:bg-emerald-500/10' 
                                : 'text-amber-600 hover:bg-amber-500/10'
                            }`}
                            title={c.isLocked ? 'Unlock Classroom' : 'Lock Classroom'}
                          >
                            {c.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                          <button
                            onClick={() => { setReassigningClassroom(c); setNewTeacherName(c.teacherName); }}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#11428E] hover:bg-[#11428E]/10 transition-all cursor-pointer"
                            title="Reassign Teacher"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingClassroom(c)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Archive / Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Reassign Modal ── */}
      {reassigningClassroom && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-[var(--text-main)]">Reassign Teacher</h4>
              <button onClick={() => setReassigningClassroom(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Change the designated teacher for section <strong className="text-[var(--text-main)] font-mono">{reassigningClassroom.classroomId}</strong>:
            </p>
            <input
              type="text"
              value={newTeacherName}
              onChange={e => setNewTeacherName(e.target.value)}
              placeholder="e.g. Maria Santos"
              className="w-full p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-bold focus:outline-none focus:border-[#11428E]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReassigningClassroom(null)}
                className="btn btn-secondary text-xs px-3.5 py-2 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={submittingReassign || !newTeacherName.trim()}
                className="btn btn-primary text-xs px-4 py-2 font-bold cursor-pointer disabled:opacity-50"
              >
                {submittingReassign ? 'Saving…' : 'Reassign Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deletingClassroom && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[20px] p-6 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle size={20} />
              <h4 className="font-extrabold text-base">Archive Classroom</h4>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to archive and remove classroom <strong className="text-[var(--text-main)] font-mono">{deletingClassroom.classroomId}</strong> ({deletingClassroom.subject} Grade {deletingClassroom.gradeLevel})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClassroom(null)}
                className="btn btn-secondary text-xs px-3.5 py-2 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submittingDelete}
                className="btn bg-rose-600 text-white hover:bg-rose-700 text-xs px-4 py-2 font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {submittingDelete ? 'Archiving…' : 'Archive Classroom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
