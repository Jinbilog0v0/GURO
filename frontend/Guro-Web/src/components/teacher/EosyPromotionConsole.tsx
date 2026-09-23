import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';
import { 
  GraduationCap, 
  Award, 
  FileText, 
  Printer, 
  Download,
  X, 
  Search, 
  RotateCw,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface TermAverages {
  Q1: number | null;
  Q2: number | null;
  Q3: number | null;
  Q4: number | null;
}

interface StudentRosterItem {
  studentId: string;
  studentName?: string | null;
  status: string;
  promotedToGrade: number | null;
  promotedAt: string | null;
  preTestAvg: number | null;
  postTestAvg: number | null;
  learningGain: number | null;
  termAverages: TermAverages;
  generalAverage: number;
  currentGrade: number;
  suggestedGrade: number;
  totalQuizzesTaken: number;
}

interface EosyReportData {
  classroomId: string;
  subject: string;
  gradeLevel: number;
  sectionName?: string;
  schoolYear: string;
  term: string;
  roster: StudentRosterItem[];
}

interface EosyPromotionConsoleProps {
  classroomCode: string | null;
  onGoToClassroomSetup?: () => void;
}

export const EosyPromotionConsole: React.FC<EosyPromotionConsoleProps> = ({
  classroomCode,
  onGoToClassroomSetup,
}) => {
  const [reportData, setReportData] = useState<EosyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionRemarks, setPromotionRemarks] = useState('');
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [sf9Student, setSf9Student] = useState<StudentRosterItem | null>(null);

  // Signatory Customization State (Adviser & Principal names)
  const [adviserName, setAdviserName] = useState(() => {
    return localStorage.getItem('guro_sf9_adviser_name') || '';
  });
  const [principalName, setPrincipalName] = useState(() => {
    return localStorage.getItem('guro_sf9_principal_name') || '';
  });

  const handleAdviserChange = (val: string) => {
    setAdviserName(val);
    localStorage.setItem('guro_sf9_adviser_name', val);
  };

  const handlePrincipalChange = (val: string) => {
    setPrincipalName(val);
    localStorage.setItem('guro_sf9_principal_name', val);
  };

  const handleDownloadSf9Txt = (student: StudentRosterItem) => {
    const adv = adviserName || 'Class Adviser';
    const princ = principalName || 'School Head';

    const textContent = `======================================================================
REPUBLIC OF THE PHILIPPINES · DEPARTMENT OF EDUCATION
SCHOOL FORM 9 (SF9) / LEARNER PROGRESS REPORT (FORM 138)
School Year: ${reportData?.schoolYear || '2026-2027'}
======================================================================

LEARNER INFORMATION:
  Learner Name:     ${student.studentName || student.studentId}
  Learner ID / LRN: ${student.studentId}
  Grade & Section:  Grade ${student.currentGrade}${reportData?.sectionName ? ` - ${reportData.sectionName}` : ''}
  Learning Area:    ${reportData?.subject || 'Mathematics'} (${classroomCode || 'N/A'})

QUARTERLY RATINGS (DEPED STANDARDS):
  Quarter 1 (Term 1): ${student.termAverages.Q1 !== null ? `${student.termAverages.Q1}%` : '—'}
  Quarter 2 (Term 2): ${student.termAverages.Q2 !== null ? `${student.termAverages.Q2}%` : '—'}
  Quarter 3 (Term 3): ${student.termAverages.Q3 !== null ? `${student.termAverages.Q3}%` : '—'}
  Quarter 4 (Term 4): ${student.termAverages.Q4 !== null ? `${student.termAverages.Q4}%` : '—'}
  --------------------------------------------------------------------
  GENERAL FINAL AVERAGE: ${student.generalAverage}% (${student.generalAverage >= 75 ? 'PASSED' : 'REMEDIAL'})
  DepEd Descriptor:      ${
    student.generalAverage >= 90 ? 'Outstanding (O)' :
    student.generalAverage >= 85 ? 'Very Satisfactory (VS)' :
    student.generalAverage >= 80 ? 'Satisfactory (S)' :
    student.generalAverage >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet Expectations'
  }

DIAGNOSTIC & FORMATIVE GAIN:
  Pre-Test Baseline:   ${student.preTestAvg !== null ? `${student.preTestAvg}%` : '—'}
  Summative Post-Test: ${student.postTestAvg !== null ? `${student.postTestAvg}%` : '—'}
  Normalized Gain (g): ${student.learningGain !== null ? `g = ${student.learningGain}%` : '—'}

OFFICIAL ACTION ON PROMOTION:
  Status: ${
    student.status.toLowerCase() === 'promoted'
      ? `Promoted and Eligible for admission to Grade ${student.promotedToGrade || student.suggestedGrade}`
      : student.generalAverage >= 75
        ? `Eligible for promotion to Grade ${student.suggestedGrade}`
        : `Retained / Needs remedial coursework in Grade ${student.currentGrade}`
  }
  ${student.promotedAt ? `Promoted on: ${new Date(student.promotedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}

SIGNATORIES:
  Class Adviser:  ${adv}
  School Head:    ${princ}
  Exported on:    ${new Date().toLocaleString()}
======================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (student.studentName || student.studentId).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `SF9_${safeName}_Grade${student.currentGrade}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('SF9 transcript downloaded.');
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSf9Student(null);
        setIsPromoteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchEosyReport = useCallback(async () => {
    if (!classroomCode) {
      setReportData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`/api/classroom/eosy-report?classroomId=${encodeURIComponent(classroomCode)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error('Failed to load End-of-School-Year report.');
      }
    } catch (e) {
      console.error('Error fetching EOSY report:', e);
      toast.error('Network error loading EOSY report.');
    } finally {
      setLoading(false);
    }
  }, [classroomCode]);

  useEffect(() => {
    fetchEosyReport();
  }, [fetchEosyReport]);

  const handlePromoteSelected = async () => {
    if (!classroomCode || selectedStudentIds.length === 0) return;

    setIsPromoting(true);
    try {
      const res = await apiFetch('/api/classroom/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: classroomCode,
          studentIds: selectedStudentIds,
          remarks: promotionRemarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Students successfully promoted!');
        setIsPromoteModalOpen(false);
        setSelectedStudentIds([]);
        setPromotionRemarks('');
        fetchEosyReport();
      } else {
        toast.error(data.error || 'Failed to promote students.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error promoting students.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (!classroomCode) {
    return (
      <div className="glass-panel p-10 text-center border border-[var(--border-color)] rounded-2xl flex flex-col items-center justify-center gap-4 w-full">
        <div className="w-14 h-14 rounded-2xl bg-[#11428E]/10 flex items-center justify-center text-[#11428E]">
          <GraduationCap size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-main)]">No Active Classroom Selected</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-md mx-auto">
            Please select or setup an active classroom first to view End-of-School-Year (EOSY) records, compute quarterly DepEd general averages, and promote eligible learners.
          </p>
        </div>
        {onGoToClassroomSetup && (
          <button
            onClick={onGoToClassroomSetup}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl mt-2 font-bold"
          >
            Go to Classroom Setup
          </button>
        )}
      </div>
    );
  }

  const roster = reportData?.roster || [];
  const filteredRoster = roster.filter(s => 
    !searchFilter.trim() || s.studentId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const eligibleCount = roster.filter(s => s.status === 'ELIGIBLE FOR PROMOTION').length;
  const promotedCount = roster.filter(s => s.status.toLowerCase() === 'promoted').length;
  const remedialCount = roster.filter(s => s.status === 'CONDITIONAL / REMEDIAL').length;
  const retainedCount = roster.filter(s => s.status === 'RETAINED').length;

  const currentGrade = reportData?.gradeLevel || 4;
  const nextGrade = currentGrade < 6 ? currentGrade + 1 : 6;

  const selectAllEligible = () => {
    const eligibleIds = roster
      .filter(s => s.status === 'ELIGIBLE FOR PROMOTION')
      .map(s => s.studentId);
    setSelectedStudentIds(eligibleIds);
  };

  const toggleSelectStudent = (sId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full fade-in">
      {/* Header Banner */}
      <div className="flex justify-between items-start flex-wrap gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase bg-[#11428E]/10 text-[#11428E] border border-[#11428E]/20">
              DepEd Form 138 / SF9 Standard
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Calendar size={11} />
              <span>SY {reportData?.schoolYear || '2026-2027'} • {reportData?.term || 'Quarter 1'}</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] mt-2 flex items-center gap-2">
            <GraduationCap className="size-6 text-[#11428E] shrink-0" />
            <span>End-of-School-Year (EOSY) Promotion Console</span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Review learner general averages, pre/post learning gains, and issue permanent academic promotions for <strong>Grade {currentGrade} → Grade {nextGrade}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchEosyReport}
            disabled={loading}
            className="btn btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh EOSY</span>
          </button>
          
          <button
            onClick={() => setIsPromoteModalOpen(true)}
            disabled={selectedStudentIds.length === 0}
            className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#11428E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Award size={15} />
            <span>Promote Selected ({selectedStudentIds.length})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Eligible for Promotion</div>
          <div className="text-3xl font-extrabold mt-2 text-[#16A34A]">{eligibleCount}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Passing standard (Avg ≥ 75%)</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Already Promoted</div>
          <div className="text-3xl font-extrabold mt-2 text-[#11428E]">{promotedCount}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Permanent SF9 records logged</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Needs Remediation</div>
          <div className="text-3xl font-extrabold mt-2 text-amber-500">{remedialCount}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Average 60% – 74%</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
          <div className="text-[11px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">Retained</div>
          <div className="text-3xl font-extrabold mt-2 text-[#CE1126]">{retainedCount}</div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Average &lt; 60%</p>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search student ID..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#11428E]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={selectAllEligible}
            className="btn btn-secondary px-3 py-1.5 text-xs font-semibold rounded-lg"
          >
            Select All Eligible ({eligibleCount})
          </button>
          {selectedStudentIds.length > 0 && (
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] font-semibold transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* DepEd SF9 Academic Roster Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm" role="table" aria-label="DepEd Form 138 Promotion Table">
            <thead>
              <tr className="bg-[var(--bg-sidebar)] border-b border-[var(--border-color)]">
                <th className="px-4 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={roster.length > 0 && selectedStudentIds.length === roster.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(roster.map(s => s.studentId));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer accent-[#11428E]"
                  />
                </th>
                <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase">Learner ID</th>
                <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Pre / Post Gain</th>
                <th className="px-3 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Q1</th>
                <th className="px-3 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Q2</th>
                <th className="px-3 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Q3</th>
                <th className="px-3 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Q4</th>
                <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Final General Avg</th>
                <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">DepEd Status</th>
                <th className="px-4 py-3.5 text-xs font-bold text-[var(--text-muted)] uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredRoster.map((student) => {
                const isSelected = selectedStudentIds.includes(student.studentId);
                const isPromoted = student.status.toLowerCase() === 'promoted';
                const isEligible = student.status === 'ELIGIBLE FOR PROMOTION';
                const avg = student.generalAverage;

                let statusBadgeBg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                if (isPromoted) {
                  statusBadgeBg = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30';
                } else if (isEligible) {
                  statusBadgeBg = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
                } else if (student.status === 'CONDITIONAL / REMEDIAL') {
                  statusBadgeBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
                } else {
                  statusBadgeBg = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
                }

                return (
                  <tr key={student.studentId} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-[#11428E]/5' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(student.studentId)}
                        className="w-4 h-4 cursor-pointer accent-[#11428E]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-mono font-bold text-xs text-[var(--text-main)]">{student.studentId}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {isPromoted ? (
                          <span className="text-purple-500 font-bold">Promoted to Grade {student.promotedToGrade || nextGrade}</span>
                        ) : (
                          <span>Grade {student.currentGrade} • {student.totalQuizzesTaken} Quizzes</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-[var(--text-main)]">
                          {student.preTestAvg !== null ? `${student.preTestAvg}%` : '—'} → {student.postTestAvg !== null ? `${student.postTestAvg}%` : '—'}
                        </span>
                        {student.learningGain !== null && (
                          <span className={`text-[10.5px] font-extrabold ${student.learningGain >= 0 ? 'text-[#10B981]' : 'text-[#CE1126]'}`}>
                            g = {student.learningGain}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-semibold text-[var(--text-main)]">
                      {student.termAverages.Q1 !== null ? `${student.termAverages.Q1}%` : '—'}
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-semibold text-[var(--text-main)]">
                      {student.termAverages.Q2 !== null ? `${student.termAverages.Q2}%` : '—'}
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-semibold text-[var(--text-main)]">
                      {student.termAverages.Q3 !== null ? `${student.termAverages.Q3}%` : '—'}
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-semibold text-[var(--text-main)]">
                      {student.termAverages.Q4 !== null ? `${student.termAverages.Q4}%` : '—'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono text-sm font-extrabold ${avg >= 75 ? 'text-[#16A34A]' : 'text-[#CE1126]'}`}>
                        {avg}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase ${statusBadgeBg}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSf9Student(student)}
                        className="btn btn-secondary px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 mx-auto"
                        title="View Official Form 138 / SF9 Report Card"
                      >
                        <FileText size={13} />
                        <span>SF9 Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promotion Confirmation Modal */}
      {isPromoteModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPromoteModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Promote Learners"
        >
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 my-auto relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[var(--text-main)]">Promote Learners</h3>
                  <p className="text-xs text-[var(--text-muted)]">Grade {currentGrade} → Grade {nextGrade} (SY {reportData?.schoolYear || '2026-2027'})</p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close promote modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-4 mb-4">
              <div className="text-xs font-bold text-[var(--text-main)] mb-1">
                You are promoting {selectedStudentIds.length} learner(s):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto mt-2">
                {selectedStudentIds.map(id => (
                  <span key={id} className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#11428E]/10 text-[#11428E] border border-[#11428E]/20">
                    {id}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mb-6">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Official Promotion Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={promotionRemarks}
                onChange={(e) => setPromotionRemarks(e.target.value)}
                placeholder={`e.g. Promoted to Grade ${nextGrade} with satisfactory academic mastery.`}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#11428E]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePromoteSelected}
                disabled={isPromoting}
                className="flex-1 py-2.5 bg-gradient-to-tr from-[#11428E] to-[#2563EB] hover:from-[#0d3470] hover:to-[#1d4ed8] text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[#11428E]/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isPromoting ? (
                  <span>Recording Promotions...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Confirm Promotion to Grade {nextGrade}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DepEd SF9 / Form 138 Official Transcript Modal */}
      {sf9Student && typeof document !== 'undefined' && createPortal(
        <div 
          className="sf9-print-portal fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSf9Student(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="School Form 9 (SF9) / Learner Progress Report"
        >
          {/* Print Style Injector */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }

              /* Reset page background and force light theme */
              html, body {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
              }

              /* Hide all page content except the SF9 print portal */
              body > *:not(.sf9-print-portal) {
                display: none !important;
              }

              /* Normalize portal container for standard document flow */
              .sf9-print-portal {
                position: static !important;
                display: block !important;
                background: transparent !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                z-index: auto !important;
              }

              /* Expand SF9 card naturally */
              #sf9-printable-card {
                position: static !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                overflow: visible !important;
                max-height: none !important;
                transform: none !important;
                animation: none !important;
              }

              .sf9-sticky-header {
                position: static !important;
                padding-top: 0 !important;
              }

              /* Hide non-printable interactive elements */
              .sf9-no-print {
                display: none !important;
              }

              /* Input print styling */
              input {
                border: none !important;
                border-bottom: 1px solid #475569 !important;
                background: transparent !important;
                box-shadow: none !important;
                color: #0f172a !important;
                text-align: center !important;
              }

              /* Force rich colors, backgrounds, and borders to print */
              #sf9-printable-card, #sf9-printable-card * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
          `}</style>

          <div 
            id="sf9-printable-card"
            className="bg-white text-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 border border-slate-200 relative"
          >
            {/* DepEd SF9 Header */}
            <div className="sf9-sticky-header flex justify-between items-start border-b-2 border-slate-900/80 pb-5 mb-5 sticky top-0 bg-white pt-1 z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#11428E] flex flex-col items-center justify-center text-white shadow-md print:border print:border-slate-800 shrink-0">
                  <span className="font-black text-xs tracking-wider">DEPED</span>
                  <span className="text-[8px] font-bold tracking-widest uppercase opacity-80">SF9</span>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-widest uppercase text-slate-500">
                    Republic of the Philippines • Department of Education
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    School Form 9 (SF9) / Learner Progress Report
                  </h3>
                  <div className="text-xs font-bold text-[#11428E] mt-0.5">
                    Official Form 138 • School Year {reportData?.schoolYear || '2026-2027'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSf9Student(null)}
                className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors sf9-no-print cursor-pointer bg-slate-100/80 border border-slate-200 shadow-sm shrink-0"
                aria-label="Close SF9 Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Learner & Institutional Info Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Learner Name:</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5 truncate" title={sf9Student.studentName || sf9Student.studentId}>
                  {sf9Student.studentName || sf9Student.studentId}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Learner ID / LRN:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{sf9Student.studentId}</div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Grade & Section:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  Grade {sf9Student.currentGrade}{reportData?.sectionName ? ` - ${reportData.sectionName}` : ''}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Learning Area / Code:</span>
                <div className="font-bold text-[#11428E] mt-0.5">
                  {reportData?.subject || 'Mathematics'} <span className="font-mono font-semibold text-slate-500">({classroomCode})</span>
                </div>
              </div>
            </div>

            {/* Quarterly Breakdown Table (Form 138 Standard) */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden mb-5">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10.5px]">
                  <tr>
                    <th className="px-4 py-3">Quarter / Evaluation Period</th>
                    <th className="px-4 py-3 text-center">Periodic Rating</th>
                    <th className="px-4 py-3 text-center">DepEd Descriptor</th>
                    <th className="px-4 py-3 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Quarter 1 (Term 1)</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{sf9Student.termAverages.Q1 !== null ? `${sf9Student.termAverages.Q1}%` : '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {sf9Student.termAverages.Q1 !== null ? (
                        sf9Student.termAverages.Q1 >= 90 ? 'Outstanding (O)' :
                        sf9Student.termAverages.Q1 >= 85 ? 'Very Satisfactory (VS)' :
                        sf9Student.termAverages.Q1 >= 80 ? 'Satisfactory (S)' :
                        sf9Student.termAverages.Q1 >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet (DNME)'
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-xs">
                      {sf9Student.termAverages.Q1 !== null ? (
                        sf9Student.termAverages.Q1 >= 75 ? (
                          <span className="text-emerald-700">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Quarter 2 (Term 2)</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{sf9Student.termAverages.Q2 !== null ? `${sf9Student.termAverages.Q2}%` : '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {sf9Student.termAverages.Q2 !== null ? (
                        sf9Student.termAverages.Q2 >= 90 ? 'Outstanding (O)' :
                        sf9Student.termAverages.Q2 >= 85 ? 'Very Satisfactory (VS)' :
                        sf9Student.termAverages.Q2 >= 80 ? 'Satisfactory (S)' :
                        sf9Student.termAverages.Q2 >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet (DNME)'
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-xs">
                      {sf9Student.termAverages.Q2 !== null ? (
                        sf9Student.termAverages.Q2 >= 75 ? (
                          <span className="text-emerald-700">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Quarter 3 (Term 3)</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{sf9Student.termAverages.Q3 !== null ? `${sf9Student.termAverages.Q3}%` : '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {sf9Student.termAverages.Q3 !== null ? (
                        sf9Student.termAverages.Q3 >= 90 ? 'Outstanding (O)' :
                        sf9Student.termAverages.Q3 >= 85 ? 'Very Satisfactory (VS)' :
                        sf9Student.termAverages.Q3 >= 80 ? 'Satisfactory (S)' :
                        sf9Student.termAverages.Q3 >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet (DNME)'
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-xs">
                      {sf9Student.termAverages.Q3 !== null ? (
                        sf9Student.termAverages.Q3 >= 75 ? (
                          <span className="text-emerald-700">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-800">Quarter 4 (Term 4)</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{sf9Student.termAverages.Q4 !== null ? `${sf9Student.termAverages.Q4}%` : '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-600">
                      {sf9Student.termAverages.Q4 !== null ? (
                        sf9Student.termAverages.Q4 >= 90 ? 'Outstanding (O)' :
                        sf9Student.termAverages.Q4 >= 85 ? 'Very Satisfactory (VS)' :
                        sf9Student.termAverages.Q4 >= 80 ? 'Satisfactory (S)' :
                        sf9Student.termAverages.Q4 >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet (DNME)'
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-xs">
                      {sf9Student.termAverages.Q4 !== null ? (
                        sf9Student.termAverages.Q4 >= 75 ? (
                          <span className="text-emerald-700">Passed</span>
                        ) : (
                          <span className="text-red-600">Failed</span>
                        )
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="px-4 py-3.5 uppercase tracking-wide">General Final Average</td>
                    <td className="px-4 py-3.5 text-center font-mono text-base text-[#11428E]">{sf9Student.generalAverage}%</td>
                    <td className="px-4 py-3.5 text-center font-bold">
                      {sf9Student.generalAverage >= 90 ? 'Outstanding (O)' :
                       sf9Student.generalAverage >= 85 ? 'Very Satisfactory (VS)' :
                       sf9Student.generalAverage >= 80 ? 'Satisfactory (S)' :
                       sf9Student.generalAverage >= 75 ? 'Fairly Satisfactory (FS)' : 'Did Not Meet Expectations'}
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm">
                      <span className={sf9Student.generalAverage >= 75 ? 'text-emerald-700 font-black' : 'text-red-600 font-black'}>
                        {sf9Student.generalAverage >= 75 ? 'PASSED' : 'REMEDIAL'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DepEd Grading Scale Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-5 text-[10px] text-center text-slate-600">
              <div><strong>90–100:</strong> Outstanding (O)</div>
              <div><strong>85–89:</strong> Very Satisfactory (VS)</div>
              <div><strong>80–84:</strong> Satisfactory (S)</div>
              <div><strong>75–79:</strong> Fairly Satisfactory (FS)</div>
              <div><strong>&lt; 75:</strong> Did Not Meet (DNME)</div>
            </div>

            {/* Diagnostic Pre/Post Growth Summary */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 mb-5 flex justify-between items-center text-xs">
              <div>
                <div className="font-extrabold text-blue-950">Diagnostic Baseline vs Summative Mastery</div>
                <div className="text-[11px] text-blue-800 mt-0.5">
                  Pre-Test Baseline: <strong>{sf9Student.preTestAvg !== null ? `${sf9Student.preTestAvg}%` : '—'}</strong> • Post-Test Summative: <strong>{sf9Student.postTestAvg !== null ? `${sf9Student.postTestAvg}%` : '—'}</strong>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-extrabold text-blue-900 uppercase">Normalized Gain</div>
                <div className="font-mono text-sm font-black text-[#11428E]">
                  {sf9Student.learningGain !== null ? `g = ${sf9Student.learningGain}%` : '—'}
                </div>
              </div>
            </div>

            {/* Certificate of Promotion (Official DepEd Action) */}
            <div className="border border-slate-200 bg-slate-50/60 rounded-2xl p-4 text-center mb-5">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-slate-500">
                Official Action on Promotion
              </div>
              <div className="text-sm font-black text-slate-900 mt-1">
                {sf9Student.status.toLowerCase() === 'promoted' 
                  ? `Promoted and Eligible for admission to Grade ${sf9Student.promotedToGrade || nextGrade}`
                  : sf9Student.generalAverage >= 75
                    ? `Eligible for promotion to Grade ${nextGrade}`
                    : `Retained / Needs remedial coursework in Grade ${sf9Student.currentGrade}`}
              </div>
              {sf9Student.promotedAt && (
                <div className="text-[10px] text-slate-500 mt-1 font-medium">
                  Promoted on: {new Date(sf9Student.promotedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>

            {/* Signatures Block with Editable Inputs */}
            <div className="grid grid-cols-2 gap-8 pt-4 pb-2 border-t border-slate-200 text-center text-xs">
              <div>
                <input
                  type="text"
                  value={adviserName}
                  onChange={(e) => handleAdviserChange(e.target.value)}
                  placeholder="Class Adviser / Teacher Name"
                  className="w-48 max-w-full text-center font-bold text-slate-800 border-b border-slate-400 pb-1 mb-1 bg-transparent focus:outline-none focus:border-[#11428E] transition-colors placeholder:text-slate-400 text-xs"
                  aria-label="Class Adviser Name"
                />
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Teacher / Class Adviser</div>
              </div>
              <div>
                <input
                  type="text"
                  value={principalName}
                  onChange={(e) => handlePrincipalChange(e.target.value)}
                  placeholder="Principal / School Head Name"
                  className="w-48 max-w-full text-center font-bold text-slate-800 border-b border-slate-400 pb-1 mb-1 bg-transparent focus:outline-none focus:border-[#11428E] transition-colors placeholder:text-slate-400 text-xs"
                  aria-label="Principal / School Head Name"
                />
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Principal / Administrator</div>
              </div>
            </div>

            {/* Print, Download & Close Actions */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 mt-6 sf9-no-print">
              <button
                type="button"
                onClick={() => setSf9Student(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadSf9Txt(sf9Student)}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10"
              >
                <Download size={15} />
                <span>Download SF9 (.txt)</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-3 bg-[#11428E] hover:bg-[#0d3470] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#11428E]/20"
              >
                <Printer size={15} />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
