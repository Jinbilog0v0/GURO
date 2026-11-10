import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UserX, 
  HelpCircle, 
  Printer, 
  FileSpreadsheet, 
  Save, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

interface LearnerAttendanceItem {
  studentId: string;
  name: string;
  lrn?: string | null;
  gender: string;
  status: 'present' | 'late' | 'absent' | 'excused';
  isRecorded: boolean;
  remarks?: string | null;
}

interface TeacherAttendanceConsoleProps {
  classroomCode: string;
}

export const TeacherAttendanceConsole: React.FC<TeacherAttendanceConsoleProps> = ({ classroomCode }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [learners, setLearners] = useState<LearnerAttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'excused'>('all');
  const [showSf2Modal, setShowSf2Modal] = useState(false);
  const [sf2Summary, setSf2Summary] = useState<any | null>(null);
  const [loadingSf2, setLoadingSf2] = useState(false);

  const fetchAttendance = async (dateStr: string) => {
    if (!classroomCode) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/classroom/attendance?classroomId=${encodeURIComponent(classroomCode)}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setLearners(data.records || []);
      } else {
        toast.error('Failed to load classroom attendance.');
      }
    } catch {
      toast.error('Network error loading attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [classroomCode, selectedDate]);

  const handleStatusChange = (studentId: string, newStatus: 'present' | 'late' | 'absent' | 'excused') => {
    setLearners((prev) =>
      prev.map((l) => (l.studentId === studentId ? { ...l, status: newStatus } : l))
    );
  };

  const handleMarkAllPresent = () => {
    setLearners((prev) => prev.map((l) => ({ ...l, status: 'present' })));
    toast.success('Marked all learners as Present.');
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const payload = {
        classroomId: classroomCode,
        date: selectedDate,
        records: learners.map((l) => ({
          studentId: l.studentId,
          status: l.status,
          remarks: l.remarks || null,
        })),
      };

      const res = await apiFetch('/api/classroom/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Saved attendance for ${data.savedCount} learners.`);
        fetchAttendance(selectedDate);
      } else {
        toast.error(data.error || 'Failed to save attendance.');
      }
    } catch {
      toast.error('Error saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleOpenSf2Modal = async () => {
    setShowSf2Modal(true);
    setLoadingSf2(true);
    try {
      const monthStr = selectedDate.slice(0, 7); // YYYY-MM
      const res = await apiFetch(`/api/classroom/attendance/summary?classroomId=${encodeURIComponent(classroomCode)}&month=${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setSf2Summary(data);
      }
    } catch {
      toast.error('Failed to load SF2 monthly summary.');
    } finally {
      setLoadingSf2(false);
    }
  };

  // Counts
  const presentCount = learners.filter((l) => l.status === 'present').length;
  const lateCount = learners.filter((l) => l.status === 'late').length;
  const absentCount = learners.filter((l) => l.status === 'absent').length;
  const excusedCount = learners.filter((l) => l.status === 'excused').length;

  const filteredLearners = learners.filter((l) => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* ── Top Bar Controls ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2 m-0">
            <Calendar className="size-5 text-[#11428E] dark:text-sky-400" />
            <span>Classroom Daily Attendance Roll Call</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Section: <span className="font-mono font-bold text-[#11428E]">{classroomCode}</span> • DepEd Form SF2 Daily Tracking
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2 py-1 shadow-xs">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="size-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 text-xs font-mono font-bold bg-transparent text-[var(--text-main)] focus:outline-none cursor-pointer"
            />
            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-sidebar)] transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            title="Mark All Present"
          >
            <CheckCircle2 className="size-3.5" />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={handleOpenSf2Modal}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-sidebar)] hover:bg-[var(--border-color)] text-[var(--text-main)] transition-all cursor-pointer flex items-center gap-1.5"
            title="DepEd SF2 Monthly Report"
          >
            <FileSpreadsheet className="size-3.5 text-indigo-500" />
            <span>SF2 Summary</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || learners.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#11428E] hover:bg-[#0d3470] text-white shadow-md shadow-[#11428E]/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Saving...' : 'Save Roll Call'}</span>
          </button>
        </div>
      </div>

      {/* ── Status KPI Counter Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
            statusFilter === 'present'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Present</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold font-mono mt-1 tabular-nums text-emerald-600 dark:text-emerald-400">
            {presentCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
            statusFilter === 'late'
              ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Late</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold font-mono mt-1 tabular-nums text-amber-600 dark:text-amber-400">
            {lateCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
            statusFilter === 'absent'
              ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Absent</span>
            <UserX className="size-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold font-mono mt-1 tabular-nums text-rose-600 dark:text-rose-400">
            {absentCount}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'excused' ? 'all' : 'excused')}
          className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
            statusFilter === 'excused'
              ? 'bg-sky-500/20 border-sky-500 text-sky-800 dark:text-sky-200'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">Excused</span>
            <HelpCircle className="size-4 text-sky-600" />
          </div>
          <p className="text-xl font-extrabold font-mono mt-1 tabular-nums text-sky-600 dark:text-sky-400">
            {excusedCount}
          </p>
        </button>
      </div>

      {/* ── Attendance Roster Table ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            Loading attendance records...
          </div>
        ) : learners.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
            <Users className="size-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <p className="font-bold">No enrolled learners found in this section.</p>
            <p>Enroll students using the "+ Enroll Student" button in the Student Directory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Learner Name</th>
                  <th className="py-3 px-4">12-Digit LRN</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4 text-center">Daily Status (1-Click Toggle)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredLearners.map((learner, idx) => (
                  <tr key={learner.studentId} className="hover:bg-[var(--bg-sidebar)]/50 transition-colors">
                    <td className="py-3 px-4 text-[var(--text-muted)] font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-[var(--text-main)]">
                      {learner.name}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-[var(--text-muted)]">
                      {learner.lrn || '—'}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">
                      {learner.gender}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(learner.studentId, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            learner.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(learner.studentId, 'late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            learner.status === 'late'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-500/10'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(learner.studentId, 'absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            learner.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(learner.studentId, 'excused')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            learner.status === 'excused'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-sky-600 hover:bg-sky-500/10'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DepEd SF2 Monthly Attendance Summary Modal ── */}
      {showSf2Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
                  DepEd School Form 2 (SF2) Monthly Attendance Log
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--border-color)] cursor-pointer flex items-center gap-1"
                >
                  <Printer className="size-3.5" />
                  <span>Print SF2</span>
                </button>
                <button
                  onClick={() => setShowSf2Modal(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
              <div className="border border-[var(--border-color)] p-3 rounded-xl bg-[var(--bg-main)] flex justify-between items-center text-[11px]">
                <div>
                  <span>Month: <strong>{sf2Summary?.month || selectedDate.slice(0, 7)}</strong></span> • 
                  <span> Section: <strong>{classroomCode}</strong></span>
                </div>
                <div>
                  <span>Total School Days Logged: <strong className="text-[#11428E]">{sf2Summary?.totalSchoolDays || 0}</strong></span>
                </div>
              </div>

              {loadingSf2 ? (
                <div className="p-8 text-center text-[var(--text-muted)]">Loading SF2 monthly figures...</div>
              ) : (
                <table className="w-full text-left border-collapse border border-[var(--border-color)]">
                  <thead className="bg-[var(--bg-sidebar)] border-b border-[var(--border-color)] text-[10px] uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="p-2 border-r border-[var(--border-color)]">LRN</th>
                      <th className="p-2 border-r border-[var(--border-color)]">Learner Name</th>
                      <th className="p-2 border-r border-[var(--border-color)] text-center">Present</th>
                      <th className="p-2 border-r border-[var(--border-color)] text-center">Late</th>
                      <th className="p-2 border-r border-[var(--border-color)] text-center">Absent</th>
                      <th className="p-2 border-r border-[var(--border-color)] text-center">Excused</th>
                      <th className="p-2 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[11px]">
                    {sf2Summary?.learners?.map((l: any, i: number) => (
                      <tr key={i} className="hover:bg-[var(--bg-sidebar)]/50">
                        <td className="p-2 border-r border-[var(--border-color)] text-[#11428E] dark:text-sky-400 font-bold">{l.lrn || '—'}</td>
                        <td className="p-2 border-r border-[var(--border-color)] font-sans font-medium text-[var(--text-main)]">{l.name}</td>
                        <td className="p-2 border-r border-[var(--border-color)] text-center text-emerald-600 font-bold">{l.present}</td>
                        <td className="p-2 border-r border-[var(--border-color)] text-center text-amber-600">{l.late}</td>
                        <td className="p-2 border-r border-[var(--border-color)] text-center text-rose-600">{l.absent}</td>
                        <td className="p-2 border-r border-[var(--border-color)] text-center text-sky-600">{l.excused}</td>
                        <td className="p-2 text-right font-bold tabular-nums">
                          <span className={l.attendanceRate >= 90 ? 'text-emerald-600' : l.attendanceRate >= 75 ? 'text-amber-600' : 'text-rose-600'}>
                            {l.attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
