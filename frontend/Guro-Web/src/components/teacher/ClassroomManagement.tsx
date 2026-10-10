import React, { useState, useEffect } from 'react';
import { 
  School, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ArrowRight, 
  LogOut, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Inbox
} from 'lucide-react';
import { ClassroomCard, type ClassroomItem } from './ClassroomCard';
import { CreateClassroomModal, type ClassroomCreationData } from './CreateClassroomModal';
import { toast } from '../../utils/toast';

export interface ClassroomManagementProps {
  classrooms: ClassroomItem[];
  activeClassroomCode: string | null;
  activeClassroomData: any | null;
  onSelectActiveClassroom: (id: string) => void;
  onDeselectActiveClassroom: () => void;
  onViewClassroomDetails: (id: string) => void;
  onCreateClassroom: (data: ClassroomCreationData) => Promise<boolean | void>;
  defaultTeacherName?: string;
  isPendingVerification?: boolean;
  isRejectedVerification?: boolean;

  // Curriculum topics claiming
  selectableTopics?: Array<{ subject: string; grade: string; topic: string }>;
  isTopicClaimed?: (subject: string, grade: string, topic: string) => boolean;
  onClaimTopics?: (topics: Array<{ subject: string; grade: string; topic: string }>) => Promise<void>;
  isClaiming?: boolean;
  activeClassroomTopics?: Array<{ subject: string; grade: string; topic: string; data: any }>;
  onEditLesson?: (subject: string, grade: string, topic: string, data: any) => void;
  onDeleteLesson?: (subject: string, grade: string, topic: string) => void;
  onLockClassroom?: () => Promise<void>;
}

export const ClassroomManagement: React.FC<ClassroomManagementProps> = ({
  classrooms,
  activeClassroomCode,
  activeClassroomData,
  onSelectActiveClassroom,
  onDeselectActiveClassroom,
  onViewClassroomDetails,
  onCreateClassroom,
  defaultTeacherName = '',
  isPendingVerification = false,
  isRejectedVerification = false,
  selectableTopics = [],
  isTopicClaimed = () => false,
  onClaimTopics,
  isClaiming = false,
  activeClassroomTopics = [],
  onEditLesson,
  onDeleteLesson,
  onLockClassroom,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClaimPanelOpen, setIsClaimPanelOpen] = useState(false);
  const [selectedToClaim, setSelectedToClaim] = useState<Array<{ subject: string; grade: string; topic: string }>>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Expiration countdown
  const [now, setNow] = useState(() => Date.now());
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    if (!activeClassroomData?.expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeClassroomData?.expiresAt, activeClassroomCode]);

  const expiryTime = activeClassroomData?.expiresAt ? new Date(activeClassroomData.expiresAt).getTime() : null;
  const diff = expiryTime !== null ? expiryTime - now : null;
  const isExpired = diff !== null && diff <= 0;
  const timeLeftString = !activeClassroomData?.expiresAt
    ? 'Always Open (No Limit)'
    : isExpired
      ? 'Expired / Locked'
      : `Expires in ${Math.floor(diff! / 60000)}m ${Math.floor((diff! % 60000) / 1000)}s`;

  // Copy active code handler
  const handleCopyActiveCode = () => {
    if (!activeClassroomCode) return;
    navigator.clipboard.writeText(activeClassroomCode);
    setCopiedCode(true);
    toast.success(`Copied classroom code ${activeClassroomCode}!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Lock classroom session
  const handleLockSession = async () => {
    if (!onLockClassroom) return;
    setIsLocking(true);
    try {
      await onLockClassroom();
      toast.success('Classroom session locked.');
    } catch {
      toast.error('Failed to lock classroom session.');
    } finally {
      setIsLocking(false);
    }
  };

  // Filter classrooms
  const filteredClassrooms = classrooms.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      c.id.toLowerCase().includes(q) || 
      (c.sectionName && c.sectionName.toLowerCase().includes(q)) ||
      c.teacherName.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q);

    const matchesSubject = subjectFilter === 'All' || 
      (subjectFilter === 'Mathematics' && (c.subject.toLowerCase() === 'mathematics' || c.subject.toLowerCase() === 'math')) ||
      (subjectFilter === 'English' && c.subject.toLowerCase() === 'english');

    return matchesSearch && matchesSubject;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ── Toolbar Header ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-[#11428E] to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
            <School size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight m-0">
              My Classrooms
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Manage live classroom sessions, device pairing codes, and curriculum claiming.
            </p>
          </div>
        </div>

        {/* Action Button: Set Up New Room */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary px-5 py-3 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Set Up New Classroom</span>
        </button>
      </div>

      {/* ── Active Classroom Hero Card ── */}
      {activeClassroomCode && activeClassroomData && (
        <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border-2 border-[#11428E]/40 rounded-3xl p-6 md:p-8 shadow-md flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#11428E]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
                <span>Active Classroom Session</span>
              </span>
              <span className="text-xs text-[var(--text-muted)] font-semibold hidden md:inline">
                Students can pair using this code
              </span>
            </div>

            <button
              type="button"
              onClick={onDeselectActiveClassroom}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <LogOut size={13} />
              <span>Deselect Session</span>
            </button>
          </div>

          {/* Hero Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Invite Code Card */}
            <div className="lg:col-span-5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                Student Pairing Code
              </span>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl md:text-4xl font-black font-mono tracking-widest text-[#11428E] select-all">
                  {activeClassroomCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyActiveCode}
                  className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#11428E] hover:border-[#11428E] transition-all cursor-pointer shadow-2xs"
                  title="Copy code"
                >
                  {copiedCode ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>

              {/* Expiration Timer & Lock */}
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isExpired ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  <span className={`size-1.5 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span>{timeLeftString}</span>
                </span>
                {activeClassroomData?.expiresAt && !isExpired && onLockClassroom && (
                  <button
                    type="button"
                    onClick={handleLockSession}
                    disabled={isLocking}
                    className="px-2 py-0.5 rounded-md border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)] hover:text-rose-500 hover:border-rose-500/20 transition-colors"
                  >
                    Lock Now
                  </button>
                )}
              </div>
            </div>

            {/* Right: Classroom Attributes & Quick Actions */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Section</span>
                  <span className="text-sm font-extrabold text-[var(--text-main)] truncate block mt-0.5">
                    {activeClassroomData.sectionName || 'General Section'}
                  </span>
                </div>

                <div className="bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-color)]">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Subject &amp; Grade</span>
                  <span className="text-sm font-extrabold text-[var(--text-main)] truncate block mt-0.5">
                    {activeClassroomData.subject} &bull; G{activeClassroomData.gradeLevel}
                  </span>
                </div>

                <div className="bg-[var(--bg-main)] p-3 rounded-2xl border border-[var(--border-color)] col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Academic Term</span>
                  <span className="text-sm font-extrabold text-[var(--text-main)] truncate block mt-0.5">
                    {activeClassroomData.term || 'Q1'} ({activeClassroomData.schoolYear || '2026-2027'})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onViewClassroomDetails(activeClassroomCode)}
                  className="btn btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>Classroom Details &amp; Students Roster</span>
                  <ArrowRight size={14} />
                </button>

                {onClaimTopics && (
                  <button
                    type="button"
                    onClick={() => setIsClaimPanelOpen(!isClaimPanelOpen)}
                    className="btn btn-secondary px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers size={14} className="text-[#11428E]" />
                    <span>Curriculum Topics ({activeClassroomTopics.length})</span>
                    {isClaimPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Curriculum Claiming Panel */}
          {isClaimPanelOpen && onClaimTopics && (
            <div className="mt-2 pt-5 border-t border-[var(--border-color)] flex flex-col gap-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-main)] m-0">
                    Curriculum Modules &amp; Lessons
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Claim official DepEd learning modules to activate them for enrolled students in this classroom.
                  </p>
                </div>

                {selectedToClaim.length > 0 && (
                  <button
                    type="button"
                    disabled={isClaiming}
                    onClick={async () => {
                      await onClaimTopics(selectedToClaim);
                      setSelectedToClaim([]);
                    }}
                    className="btn btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <Check size={14} />
                    <span>Claim Selected ({selectedToClaim.length})</span>
                  </button>
                )}
              </div>

              {/* Module selection checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
                {selectableTopics.map((mod) => {
                  const isClaimed = isTopicClaimed(mod.subject, mod.grade, mod.topic);
                  const isChecked = isClaimed || selectedToClaim.some(
                    (s) => s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic
                  );

                  return (
                    <label
                      key={`${mod.subject}-${mod.grade}-${mod.topic}`}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold transition-all ${
                        isClaimed
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--text-muted)] cursor-default'
                          : isChecked
                            ? 'bg-[#11428E]/10 border-[#11428E] text-[var(--text-main)] cursor-pointer'
                            : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[#11428E]/40 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isClaimed}
                        onChange={() => {
                          if (isClaimed) return;
                          if (isChecked) {
                            setSelectedToClaim((prev) =>
                              prev.filter((s) => !(s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic))
                            );
                          } else {
                            setSelectedToClaim((prev) => [...prev, mod]);
                          }
                        }}
                        className="rounded border-[var(--border-color)] text-[#11428E] focus:ring-[#11428E] size-4"
                      />
                      <span className="flex-1 truncate">
                        <strong>{mod.topic}</strong> (G{mod.grade})
                      </span>
                      {isClaimed && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Claimed
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Active claimed topics list with edit/delete */}
              {activeClassroomTopics.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
                  <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
                    Active Claimed Lessons ({activeClassroomTopics.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {activeClassroomTopics.map((mod) => (
                      <div
                        key={`${mod.subject}-${mod.grade}-${mod.topic}`}
                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {mod.subject === 'Mathematics' ? (
                            <Calculator size={14} className="text-[#11428E] shrink-0" />
                          ) : (
                            <BookOpen size={14} className="text-purple-500 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-[var(--text-main)] truncate">
                            {mod.topic}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onEditLesson && (
                            <button
                              type="button"
                              onClick={() => onEditLesson(mod.subject, mod.grade, mod.topic, mod.data)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-[#11428E] transition-colors"
                              title="Edit Lesson"
                            >
                              <Edit3 size={13} />
                            </button>
                          )}
                          {onDeleteLesson && (
                            <button
                              type="button"
                              onClick={() => onDeleteLesson(mod.subject, mod.grade, mod.topic)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Classrooms Directory Section ── */}
      <div className="flex flex-col gap-4">
        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[var(--text-main)] m-0">
              Classroom Directory
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
              {filteredClassrooms.length} Room{filteredClassrooms.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search code, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[#11428E] transition-colors"
              />
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] self-start sm:self-auto">
              {(['All', 'Mathematics', 'English'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subjectFilter === sub
                      ? 'bg-[#11428E] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {sub === 'Mathematics' ? 'Math' : sub}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {filteredClassrooms.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Inbox size={40} className="text-slate-400 opacity-60" />
            <h4 className="text-base font-bold text-[var(--text-main)] m-0">
              {classrooms.length === 0 ? 'No Classrooms Created Yet' : 'No Classrooms Match Search'}
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
              {classrooms.length === 0
                ? 'Set up a new classroom to generate a live invite code and sync learning progress with your students.'
                : 'Try clearing your search query or switching subject filters to view your other classrooms.'}
            </p>
            {classrooms.length === 0 && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 mt-2 shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                <span>Set Up Your First Classroom</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClassrooms.map((c) => (
              <ClassroomCard
                key={c.id}
                classroom={c}
                isActive={activeClassroomCode === c.id}
                onSelectActive={onSelectActiveClassroom}
                onViewDetails={onViewClassroomDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Set Up New Classroom Modal ── */}
      <CreateClassroomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onCreateClassroom}
        defaultTeacherName={defaultTeacherName}
        isPendingVerification={isPendingVerification}
        isRejectedVerification={isRejectedVerification}
      />
    </div>
  );
};
