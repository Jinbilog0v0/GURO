import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  BookOpen,
  Calculator,
  CheckCircle2,
  Lightbulb,
  BookMarked,
  ClipboardList,
  ChevronRight,
  FileText,
  Layers,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuestionPreviewItem {
  id: string;
  difficulty: string;
  category?: string;
  type?: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  matchingPairs?: Record<string, string>;
  feedback?: {
    en: string;
    fil: string;
  };
  imageUrl?: string;
}

export interface StudyDefinition {
  term: string;
  definition: string;
  examples?: string[];
}

export interface StudyRefresherItem {
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface StudyContent {
  introduction?: string;
  definitions?: StudyDefinition[];
  refresherQuiz?: StudyRefresherItem[];
  summary?: string[];
  imageUrl?: string;
}

export interface LessonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  grade: number | string;
  topic: string;
  questions: QuestionPreviewItem[];
  studyContent?: StudyContent | null;
  isSystemLesson?: boolean;
  onAssignToClass?: () => void;
}

// ─── Difficulty helpers ───────────────────────────────────────────────────────

type DiffFilter = 'All' | 'Easy' | 'Average' | 'Difficult';

function diffBadge(diff: string) {
  const d = (diff || 'Average').toLowerCase();
  if (d === 'easy') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (d === 'difficult') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StudyMaterialsTab: React.FC<{ studyContent: StudyContent | null; isMath: boolean }> = ({
  studyContent,
  isMath,
}) => {
  if (!studyContent) {
    return (
      <div className="text-center py-16 text-[var(--text-muted)] text-sm italic">
        No study material available for this module.
      </div>
    );
  }

  const hasIntro = !!studyContent.introduction;
  const hasDefs = (studyContent.definitions || []).length > 0;
  const hasRefresher = (studyContent.refresherQuiz || []).length > 0;
  const hasSummary = (studyContent.summary || []).length > 0;
  const hasAny = hasIntro || hasDefs || hasRefresher || hasSummary;

  if (!hasAny) {
    return (
      <div className="text-center py-16 text-[var(--text-muted)] text-sm italic">
        No study material available for this module.
      </div>
    );
  }

  const accentClass = isMath
    ? 'from-[#11428E]/10 to-[#1C5BC0]/5 border-[#11428E]/20'
    : 'from-[#0F766E]/10 to-[#14B8A6]/5 border-[#0F766E]/20';

  return (
    <div className="flex flex-col gap-5">
      {/* Introduction */}
      {hasIntro && (
        <div className={`bg-gradient-to-br ${accentClass} border rounded-xl p-4 sm:p-5`}>
          <div className="flex items-center gap-2 mb-2.5">
            <FileText size={15} className={isMath ? 'text-[#1C5BC0]' : 'text-[#14B8A6]'} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Introduction &amp; Overview
            </span>
          </div>
          <p className="text-sm text-[var(--text-main)] leading-relaxed">
            {studyContent.introduction}
          </p>
          {studyContent.imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-[var(--border-color)] max-w-sm bg-black/10">
              <img
                src={studyContent.imageUrl}
                alt="Lesson visual"
                className="max-h-48 object-contain w-full"
              />
            </div>
          )}
        </div>
      )}

      {/* Key Concepts & Definitions */}
      {hasDefs && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookMarked size={15} className="text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Key Concepts &amp; Vocabulary
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {studyContent.definitions!.map((def, i) => (
              <div
                key={i}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-1.5"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 size-5 rounded-md bg-indigo-500/15 text-indigo-500 text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-main)]">{def.term}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-7">
                  {def.definition}
                </p>
                {def.examples && def.examples.length > 0 && (
                  <div className="pl-7 flex flex-col gap-1 mt-0.5">
                    {def.examples.map((ex, ei) => (
                      <div key={ei} className="flex items-start gap-1.5 text-xs text-indigo-400">
                        <ChevronRight size={12} className="shrink-0 mt-0.5" />
                        <span className="italic">{ex}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresher / Pre-test Quiz */}
      {hasRefresher && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={15} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Refresher Quiz (Pre-checks)
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {studyContent.refresherQuiz!.map((rq, i) => (
              <div
                key={i}
                className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-2.5"
              >
                <p className="text-xs font-semibold text-[var(--text-main)] leading-relaxed">
                  <span className="text-amber-500 font-bold mr-1.5">Q{i + 1}.</span>
                  {rq.questionText}
                </p>
                {rq.options && rq.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {rq.options.map((opt, oi) => {
                      const isCorrect =
                        String(opt).trim().toLowerCase() ===
                        String(rq.correctAnswer).trim().toLowerCase();
                      return (
                        <div
                          key={oi}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-1 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-semibold'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isCorrect && <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!rq.options || rq.options.length === 0) && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    <span>Answer: {rq.correctAnswer}</span>
                  </div>
                )}
                {rq.explanation && (
                  <div className="flex items-start gap-1.5 text-[10.5px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                    <Lightbulb size={11} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{rq.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary / Key Takeaways */}
      {hasSummary && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} className="text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Key Takeaways &amp; Summary
            </span>
          </div>
          <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-2">
            {studyContent.summary!.map((point, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="mt-1 shrink-0 size-1.5 rounded-full bg-sky-400" />
                <span className="text-xs text-[var(--text-main)] leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const QuestionsTab: React.FC<{ questions: QuestionPreviewItem[] }> = ({ questions }) => {
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('All');

  const counts = {
    Easy: questions.filter((q) => (q.difficulty || '').toLowerCase() === 'easy').length,
    Average: questions.filter(
      (q) => (q.difficulty || '').toLowerCase() === 'average'
    ).length,
    Difficult: questions.filter(
      (q) => (q.difficulty || '').toLowerCase() === 'difficult'
    ).length,
  };

  const visible =
    diffFilter === 'All'
      ? questions
      : questions.filter(
          (q) => (q.difficulty || '').toLowerCase() === diffFilter.toLowerCase()
        );

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--text-muted)] text-sm italic">
        No assessment questions available for this module.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Difficulty filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', 'Easy', 'Average', 'Difficult'] as DiffFilter[]).map((d) => {
          const count = d === 'All' ? questions.length : counts[d as keyof typeof counts];
          const active = diffFilter === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                active
                  ? d === 'All'
                    ? 'bg-[var(--text-main)] text-[var(--bg-main)] border-transparent'
                    : d === 'Easy'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : d === 'Difficult'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-[var(--text-muted)]'
              }`}
            >
              {d} ({count})
            </button>
          );
        })}
      </div>

      {/* Question Cards */}
      {visible.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)] text-sm italic">
          No {diffFilter.toLowerCase()} questions in this module.
        </div>
      ) : (
        visible.map((q) => {
          // True global index for display
          const globalIdx = questions.indexOf(q);
          const qType = q.type || q.category || 'Multiple Choice';
          return (
            <div
              key={q.id || `q-${globalIdx}`}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs"
            >
              {/* Item header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-md bg-[var(--border-color)]/40 text-[var(--text-main)] text-xs font-bold flex items-center justify-center">
                    {globalIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-main)] capitalize">
                    {qType.replace(/-/g, ' ')}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border capitalize ${diffBadge(
                    q.difficulty
                  )}`}
                >
                  {q.difficulty || 'Average'}
                </span>
              </div>

              {/* Question stem */}
              <p className="text-sm font-semibold text-[var(--text-main)] leading-relaxed">
                {q.questionText}
              </p>

              {/* Image aid */}
              {q.imageUrl && (
                <div className="my-1 rounded-lg overflow-hidden border border-[var(--border-color)] max-w-sm bg-black/10">
                  <img
                    src={q.imageUrl}
                    alt="Visual item aid"
                    className="max-h-48 object-contain w-full"
                  />
                </div>
              )}

              {/* Options (Multiple Choice / True-False) */}
              {q.options && q.options.length > 0 && !q.matchingPairs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect =
                      String(opt).trim().toLowerCase() ===
                      String(q.correctAnswer).trim().toLowerCase();
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`shrink-0 size-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[var(--border-color)]/50 text-[var(--text-muted)]'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                        {isCorrect && (
                          <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matching pairs */}
              {q.matchingPairs && Object.keys(q.matchingPairs).length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Correct Pairs:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(q.matchingPairs).map(([left, right], pIdx) => (
                      <div
                        key={pIdx}
                        className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-[var(--text-main)]">{left}</span>
                        <span className="text-emerald-400 font-bold">⇄</span>
                        <span className="text-emerald-600 font-bold">{right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Identification / fill-in-blank answer */}
              {(!q.options || q.options.length === 0) && !q.matchingPairs && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>Correct Answer: {q.correctAnswer}</span>
                </div>
              )}

              {/* Bilingual feedback / rationale */}
              {q.feedback && (q.feedback.en || q.feedback.fil) && (
                <div className="mt-1 pt-2.5 border-t border-[var(--border-color)] flex flex-col gap-1.5 text-xs">
                  {q.feedback.en && (
                    <div className="flex items-start gap-1.5 text-[var(--text-muted)]">
                      <Lightbulb
                        size={13}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong className="text-[var(--text-main)]">Explanation: </strong>
                        {q.feedback.en}
                      </span>
                    </div>
                  )}
                  {q.feedback.fil && q.feedback.fil !== q.feedback.en && (
                    <div className="flex items-start gap-1.5 text-[var(--text-muted)] pl-4">
                      <span>
                        <strong className="text-[var(--text-main)]">Paliwanag: </strong>
                        {q.feedback.fil}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

type PreviewTab = 'study' | 'questions';

export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  grade,
  topic,
  questions,
  studyContent = null,
  isSystemLesson = false,
  onAssignToClass,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('study');

  if (!isOpen) return null;

  const isMath =
    subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'math';

  const easyCount = questions.filter(
    (q) => (q.difficulty || '').toLowerCase() === 'easy'
  ).length;
  const avgCount = questions.filter(
    (q) => (q.difficulty || '').toLowerCase() === 'average'
  ).length;
  const hardCount = questions.filter(
    (q) => (q.difficulty || '').toLowerCase() === 'difficult'
  ).length;

  const hasStudyContent =
    !!studyContent &&
    !!(
      studyContent.introduction ||
      (studyContent.definitions || []).length > 0 ||
      (studyContent.refresherQuiz || []).length > 0 ||
      (studyContent.summary || []).length > 0
    );

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-preview-title"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`size-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                isMath
                  ? 'bg-gradient-to-br from-[#11428E] to-[#1C5BC0]'
                  : 'bg-gradient-to-br from-[#0F766E] to-[#14B8A6]'
              }`}
            >
              {isMath ? (
                <Calculator className="size-5" />
              ) : (
                <BookOpen className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="lesson-preview-title"
                  className="text-base sm:text-lg font-bold text-[var(--text-main)] truncate"
                >
                  {title || topic}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                    isSystemLesson
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                  }`}
                >
                  {isSystemLesson ? 'Official DepEd Curriculum' : 'Teacher Custom Lesson'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {subject} &bull; Grade {grade} &bull;{' '}
                <span className="text-[var(--text-main)] font-semibold">
                  {questions.length} Questions
                </span>
                {questions.length > 0 && (
                  <span className="ml-1 text-[var(--text-muted)]">
                    (Easy: {easyCount} · Avg: {avgCount} · Diff: {hardCount})
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview modal"
            className="size-8 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-4 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer -mb-px ${
              activeTab === 'study'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BookMarked size={14} />
            Study Materials &amp; Concepts
            {!hasStudyContent && (
              <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-bold bg-[var(--border-color)]/50 text-[var(--text-muted)]">
                N/A
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer -mb-px ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <ClipboardList size={14} />
            Questions &amp; Answer Key
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500">
              {questions.length}
            </span>
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'study' ? (
            <StudyMaterialsTab studyContent={studyContent} isMath={isMath} />
          ) : (
            <QuestionsTab questions={questions} />
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
          <span className="text-xs text-[var(--text-muted)]">
            {activeTab === 'study'
              ? hasStudyContent
                ? 'Viewing study materials'
                : 'No study content available'
              : `Viewing ${questions.length} assessment question${questions.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Close
            </button>
            {onAssignToClass && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssignToClass();
                }}
                className="btn btn-primary text-xs px-4 py-2"
              >
                Assign to Classroom
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
