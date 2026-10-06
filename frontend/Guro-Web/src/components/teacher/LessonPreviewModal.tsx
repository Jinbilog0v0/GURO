import React from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Calculator, CheckCircle2, Lightbulb } from 'lucide-react';

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

export interface LessonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject: string;
  grade: number | string;
  topic: string;
  questions: QuestionPreviewItem[];
  isSystemLesson?: boolean;
  onAssignToClass?: () => void;
}

export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subject,
  grade,
  topic,
  questions,
  isSystemLesson = false,
  onAssignToClass,
}) => {
  if (!isOpen) return null;

  const isMath = subject.toLowerCase() === 'mathematics' || subject.toLowerCase() === 'math';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-preview-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
              isMath ? 'bg-gradient-to-br from-[#11428E] to-[#1C5BC0]' : 'bg-gradient-to-br from-[#0F766E] to-[#14B8A6]'
            }`}>
              {isMath ? <Calculator className="size-5" /> : <BookOpen className="size-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="lesson-preview-title" className="text-base sm:text-lg font-bold text-[var(--text-main)] truncate">
                  {title || topic}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                  isSystemLesson 
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                    : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                }`}>
                  {isSystemLesson ? 'Official DepEd Curriculum' : 'Teacher Custom Lesson'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {subject} • Grade {grade} • {questions.length} Items Total
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

        {/* Question List Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm italic">
              No questions found for this lesson module.
            </div>
          ) : (
            questions.map((q, idx) => {
              const diff = (q.difficulty || 'Average').toLowerCase();
              const diffBadgeClass = 
                diff === 'easy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                diff === 'difficult' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                'bg-amber-500/10 text-amber-500 border-amber-500/20';

              return (
                <div 
                  key={q.id || idx}
                  className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xs"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-md bg-[var(--border-color)]/40 text-[var(--text-main)] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-main)] capitalize">
                        {(q.type || 'Multiple Choice').replace(/-/g, ' ')}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border capitalize ${diffBadgeClass}`}>
                      {q.difficulty || 'Average'}
                    </span>
                  </div>

                  {/* Question Stem */}
                  <p className="text-sm font-semibold text-[var(--text-main)] leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Question Image if present */}
                  {q.imageUrl && (
                    <div className="my-1 rounded-lg overflow-hidden border border-[var(--border-color)] max-w-sm bg-black/10">
                      <img src={q.imageUrl} alt="Visual item aid" className="max-h-48 object-contain w-full" />
                    </div>
                  )}

                  {/* Options (Multiple Choice or True/False) */}
                  {q.options && q.options.length > 0 && !q.matchingPairs && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = String(opt).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                        return (
                          <div 
                            key={optIdx}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold' 
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                            }`}
                          >
                            <span className="truncate">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Matching Pairs Display */}
                  {q.matchingPairs && Object.keys(q.matchingPairs).length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Matching Keys:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(q.matchingPairs).map(([left, right], pIdx) => (
                          <div key={pIdx} className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs flex items-center justify-between gap-2">
                            <span className="font-semibold text-[var(--text-main)]">{left}</span>
                            <span className="text-indigo-400 font-bold">⇄</span>
                            <span className="text-emerald-500 font-bold">{right}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Single Correct Answer (Fill in the blank / other) */}
                  {(!q.options || q.options.length === 0) && !q.matchingPairs && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={14} />
                      <span>Correct Answer: {q.correctAnswer}</span>
                    </div>
                  )}

                  {/* Feedback / Rationale */}
                  {q.feedback && (q.feedback.en || q.feedback.fil) && (
                    <div className="mt-1 pt-2 border-t border-[var(--border-color)] flex flex-col gap-1 text-xs">
                      {q.feedback.en && (
                        <div className="flex items-start gap-1.5 text-[var(--text-muted)]">
                          <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
                          <span><strong>Explanation:</strong> {q.feedback.en}</span>
                        </div>
                      )}
                      {q.feedback.fil && q.feedback.fil !== q.feedback.en && (
                        <div className="flex items-start gap-1.5 text-[var(--text-muted)] pl-4">
                          <span><strong>Paliwanag:</strong> {q.feedback.fil}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-sidebar)]">
          <span className="text-xs text-[var(--text-muted)]">
            Viewing {questions.length} questions
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
