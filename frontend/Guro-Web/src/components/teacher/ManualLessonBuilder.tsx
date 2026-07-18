import React, { useState } from 'react';
import { Plus, Trash2, Save, BookOpen, Languages } from 'lucide-react';
import { toast } from '../../utils/toast';

interface Question {
  id: string;
  difficulty: 'Easy' | 'Average' | 'Difficult';
  category: string;
  type?: 'multiple-choice' | 'fill-in-the-blank' | 'drag-drop-matching' | 'true-false' | 'swipe-card' | 'fraction-builder';
  questionText: string;
  options: string[];
  correctAnswer: string;
  matchingPairs?: Record<string, string>;
  feedback: {
    en: string;
    fil: string;
  };
}

interface ManualLessonBuilderProps {
  classroomId?: string | null;
}

export const ManualLessonBuilder: React.FC<ManualLessonBuilderProps> = ({ classroomId }) => {
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

  const [subject, setSubject] = useState('English');
  const [grade, setGrade] = useState('5');
  const [topic, setTopic] = useState('');
  const [lessonText, setLessonText] = useState('');

  const [refresherQuestions, setRefresherQuestions] = useState<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[]>([
    { questionText: '', options: ['', '', ''], correctAnswer: '', explanation: '' }
  ]);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'ENG-G5-TOPIC-001',
      difficulty: 'Easy',
      category: 'Reading/Paragraph Comprehension',
      type: 'multiple-choice',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      feedback: { en: '', fil: '' }
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to generate a standardized ID for a question index
  const generateQuestionId = (index: number, currentSubject: string, currentGrade: string, currentTopic: string) => {
    const subCode = currentSubject.substring(0, 3).toUpperCase();
    const cleanTopic = currentTopic.trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const topicCode = cleanTopic || 'TOP';
    return `${subCode}-G${currentGrade}-${topicCode}-${String(index + 1).padStart(3, '0')}`;
  };

  // Sync all question IDs when subject/grade/topic changes
  const updateAllQuestionIds = (newSubject: string, newGrade: string, newTopic: string, currentQuestions: Question[]) => {
    return currentQuestions.map((q, idx) => ({
      ...q,
      id: generateQuestionId(idx, newSubject, newGrade, newTopic)
    }));
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    const { categories: newCats } = getCategoriesAndTypes(val, grade);
    const fallbackCat = newCats[0] || 'Figures of Speech';
    setQuestions(prev => {
      const updated = prev.map(q => ({
        ...q,
        category: newCats.includes(q.category) ? q.category : fallbackCat
      }));
      return updateAllQuestionIds(val, grade, topic, updated);
    });
  };

  const handleGradeChange = (val: string) => {
    setGrade(val);
    const { categories: newCats } = getCategoriesAndTypes(subject, val);
    const fallbackCat = newCats[0] || 'Figures of Speech';
    setQuestions(prev => {
      const updated = prev.map(q => ({
        ...q,
        category: newCats.includes(q.category) ? q.category : fallbackCat
      }));
      return updateAllQuestionIds(subject, val, topic, updated);
    });
  };

  const handleTopicChange = (val: string) => {
    setTopic(val);
    setQuestions(prev => updateAllQuestionIds(subject, grade, val, prev));
  };

  // Add a new question slot
  const handleAddQuestion = () => {
    const nextIndex = questions.length;
    const { categories: currentCats } = getCategoriesAndTypes(subject, grade);
    const fallbackCat = currentCats[0] || 'Figures of Speech';
    const newQ: Question = {
      id: generateQuestionId(nextIndex, subject, grade, topic),
      difficulty: 'Easy',
      category: fallbackCat,
      type: 'multiple-choice',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      feedback: { en: '', fil: '' }
    };
    setQuestions([...questions, newQ]);
  };

  // Remove a question slot
  const handleRemoveQuestion = (indexToRemove: number) => {
    if (questions.length === 1) {
      toast.error('A lesson must have at least one question.');
      return;
    }
    const filtered = questions.filter((_, idx) => idx !== indexToRemove);
    // Re-index all IDs
    setQuestions(updateAllQuestionIds(subject, grade, topic, filtered));
  };

  // Update specific question field
  const handleUpdateField = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Update specific option text
  const handleUpdateOption = (qIdx: number, optIdx: number, value: string) => {
    const updated = [...questions];
    const oldVal = updated[qIdx].options[optIdx];
    updated[qIdx].options[optIdx] = value;
    
    // If the correct answer matches the old value, update it
    if (updated[qIdx].correctAnswer === oldVal) {
      updated[qIdx].correctAnswer = value;
    }
    setQuestions(updated);
  };

  // Set the correct answer for a question
  const handleSetCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = updated[qIdx].options[optIdx];
    setQuestions(updated);
  };

  // Update feedback translations
  const handleUpdateFeedback = (qIdx: number, value: string) => {
    const updated = [...questions];
    updated[qIdx].feedback = {
      en: value,
      fil: value
    };
    setQuestions(updated);
  };

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error('Please provide a Topic Title.');
      return;
    }

    if (!lessonText.trim()) {
      toast.error('Please write the Lesson Summary Content.');
      return;
    }

    // Question validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question #${i + 1} prompt cannot be empty.`);
        return;
      }
      
      const qType = q.type || 'multiple-choice';

      if (qType === 'fill-in-the-blank') {
        if (!q.questionText.includes('[[blank]]')) {
          toast.error(`Question #${i + 1} prompt is missing the '[[blank]]' placeholder.`);
          return;
        }
      }

      if (qType === 'multiple-choice' || qType === 'fill-in-the-blank') {
        if (!q.options || q.options.length < 4) {
          toast.error(`Question #${i + 1} must have 4 options.`);
          return;
        }
        for (let j = 0; j < 4; j++) {
          if (!q.options[j] || !q.options[j].trim()) {
            toast.error(`Option ${String.fromCharCode(65 + j)} for Question #${i + 1} cannot be empty.`);
            return;
          }
        }
        if (!q.correctAnswer) {
          toast.error(`Please select the correct answer option for Question #${i + 1}.`);
          return;
        }
      } else if (qType === 'drag-drop-matching') {
        if (!q.matchingPairs || Object.keys(q.matchingPairs).length === 0) {
          toast.error(`Question #${i + 1} must have at least one matching pair.`);
          return;
        }
        for (const [key, val] of Object.entries(q.matchingPairs)) {
          if (!key.trim() || !val.trim()) {
            toast.error(`Matching pair items in Question #${i + 1} cannot be empty.`);
            return;
          }
        }
      }

      if (!q.feedback.en.trim()) {
        toast.error(`Explanation for Question #${i + 1} is required.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint = classroomId ? '/api/classroom/update-lesson' : '/api/save';
      const validRefreshers = refresherQuestions
        .filter(q => q.questionText.trim() && q.options.every(o => o.trim()) && q.correctAnswer)
        .map(q => {
          const idx = q.correctAnswer === 'A' ? 0 : (q.correctAnswer === 'B' ? 1 : 2);
          return {
            questionText: q.questionText.trim(),
            options: q.options.map(o => o.trim()),
            correctAnswer: q.options[idx].trim(),
            explanation: q.explanation.trim() || 'Great job!'
          };
        });

      const studyContent = lessonText.trim()
        ? { 
            introduction: lessonText.trim(), 
            vocabulary: [], 
            summary: [],
            refresherQuiz: validRefreshers
          }
        : null;
      const payload = classroomId
        ? { classroomId, subject, grade: parseInt(grade), topic: topic.trim(), studyContent, questions }
        : { subject, grade: parseInt(grade), topic: topic.trim(), studyContent, questions };

      const token = localStorage.getItem('guro_auth_token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save lesson');
      }

      toast.success(`Successfully saved "${topic.trim()}" lesson with ${questions.length} questions manually!`);
      // Reset forms
      setTopic('');
      setLessonText('');
      setQuestions([
        {
          id: 'ENG-G5-TOPIC-001',
          difficulty: 'Easy',
          category: 'Figures of Speech',
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          feedback: { en: '', fil: '' }
        }
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while saving lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full fade-in">
      <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left Form: Lesson details */}
        <div className="glass-panel p-6 flex flex-col gap-4.5">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-1">
            <BookOpen size={18} className="text-[#11428E]" />
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">Lesson Profile</h3>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select value={subject} onChange={(e) => handleSubjectChange(e.target.value)}>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div className="form-group">
            <label>Grade Level</label>
            <select value={grade} onChange={(e) => handleGradeChange(e.target.value)}>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>

          <div className="form-group">
            <label>Topic Title</label>
            <input
              type="text"
              placeholder="e.g. Adjectives, Metric Systems"
              value={topic}
              onChange={(e) => handleTopicChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Lesson Summary Content</label>
            <textarea
              placeholder="Write the summarized explanation or key rules that the students will learn..."
              value={lessonText}
              onChange={(e) => setLessonText(e.target.value)}
              className="min-h-[180px] resize-y"
              required
            />
          </div>

          <div className="form-group border-t border-[var(--border-color)] pt-4 mt-2.5">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[13px] font-extrabold text-[var(--accent-primary-text)] uppercase tracking-[0.5px]">
                Refresher Quiz Checkpoints (1 to 3 Activities)
              </h4>
              {refresherQuestions.length < 3 && (
                <button
                  type="button"
                  onClick={() => setRefresherQuestions(prev => [...prev, { questionText: '', options: ['', '', ''], correctAnswer: '', explanation: '' }])}
                  className="btn btn-secondary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  + Add Checkpoint
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {refresherQuestions.map((q, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-4 bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">Checkpoint Activity #{idx + 1}</span>
                    {refresherQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRefresherQuestions(prev => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block">Refresher Question Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Which word is a simile?"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...refresherQuestions];
                        updated[idx].questionText = e.target.value;
                        setRefresherQuestions(updated);
                      }}
                      className="w-full text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['A', 'B', 'C'].map((optLabel, optIdx) => (
                      <div key={optLabel}>
                        <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block">Option {optLabel}</label>
                        <input
                          type="text"
                          placeholder={`Option ${optLabel}`}
                          value={q.options[optIdx]}
                          onChange={(e) => {
                            const updated = [...refresherQuestions];
                            const opts = [...updated[idx].options];
                            opts[optIdx] = e.target.value;
                            updated[idx].options = opts;
                            setRefresherQuestions(updated);
                          }}
                          className="w-full text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block">Correct Option</label>
                      <select
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const updated = [...refresherQuestions];
                          updated[idx].correctAnswer = e.target.value;
                          setRefresherQuestions(updated);
                        }}
                        className="w-full text-xs"
                      >
                        <option value="">-- Select --</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block">Explanation</label>
                      <input
                        type="text"
                        placeholder="relatable explanation..."
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...refresherQuestions];
                          updated[idx].explanation = e.target.value;
                          setRefresherQuestions(updated);
                        }}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-2.5 w-full flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <Save size={16} />
            {isSubmitting ? 'Saving Lesson...' : 'Save Lesson & Questions'}
          </button>
        </div>

        {/* Right Editor: Add questions list manually */}
        <div className="glass-panel p-6 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4 mb-5">
            <h3 className="text-[15px] font-bold text-[var(--text-main)]">Manually Write Questions</h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add Question Slot
            </button>
          </div>

          <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-1.5">
            {(() => {
              const { categories: currentCats, types: currentTypes } = getCategoriesAndTypes(subject, grade);
              return questions.map((q, idx) => (
                <div key={idx} className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                    <span className="text-[13px] font-extrabold text-[var(--accent-primary-text)] uppercase tracking-[0.5px]">Question #{idx + 1}</span>
                    <input
                      type="text"
                      value={q.id}
                      disabled
                      className="bg-transparent border-none text-[var(--text-muted)] font-mono text-[11px] font-bold w-[180px] text-center cursor-default"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="bg-transparent border-none text-[#A01322] cursor-pointer opacity-70 hover:opacity-100 transition-opacity duration-200"
                      title="Delete question slot"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex gap-3.5">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Difficulty</label>
                      <select
                        value={q.difficulty}
                        onChange={(e) => handleUpdateField(idx, 'difficulty', e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Average">Average</option>
                        <option value="Difficult">Difficult</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1.5 }}>
                      <label>Assessment Category</label>
                      <select
                        value={q.category}
                        onChange={(e) => handleUpdateField(idx, 'category', e.target.value)}
                      >
                        {currentCats.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Question Prompt / Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Which of the following is an adjective?"
                      value={q.questionText}
                      onChange={(e) => handleUpdateField(idx, 'questionText', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group mt-3">
                    <label>Question Type / Format</label>
                    <select
                      value={q.type || 'multiple-choice'}
                    onChange={(e) => {
                        const newType = e.target.value as any;
                        const updated = [...questions];
                        const currentCat = updated[idx].category;
                        const safeCategory = currentCats.includes(currentCat) ? currentCat : (currentCats[0] || 'Figures of Speech');
                        updated[idx] = { 
                          ...updated[idx], 
                          type: newType,
                          category: safeCategory,
                          matchingPairs: newType === 'drag-drop-matching' ? (updated[idx].matchingPairs || { "Example Key": "Example Value" }) : undefined
                        };
                        if (newType === 'drag-drop-matching') {
                          const pairs = updated[idx].matchingPairs || {};
                          updated[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                          updated[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                        } else if (newType === 'true-false') {
                          updated[idx].options = ['True', 'False'];
                          updated[idx].correctAnswer = 'True';
                        } else if (newType === 'swipe-card') {
                          updated[idx].options = ['Literal', 'Metaphor'];
                          updated[idx].correctAnswer = 'Literal';
                        } else if (newType === 'fraction-builder') {
                          updated[idx].options = ['2', '4'];
                          updated[idx].correctAnswer = '2';
                        } else {
                          updated[idx].options = ['', '', '', ''];
                          updated[idx].correctAnswer = '';
                        }
                        setQuestions(updated);
                      }}
                      className="form-control w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg py-2 px-3 text-[13px]"
                    >
                      {currentTypes.map((t) => {
                        const typeLabels: Record<string, string> = {
                          'multiple-choice': 'Multiple Choice (Standard)',
                          'fill-in-the-blank': 'Fill-in-the-Blank (Interactive bubbles)',
                          'drag-drop-matching': 'Drag & Drop Matching (Columns)',
                          'true-false': 'True or False',
                          'swipe-card': 'Swipe Card (Classification)',
                          'fraction-builder': 'Fraction Builder (Interactive Pie)',
                        };
                        return (
                          <option key={t} value={t}>
                            {typeLabels[t] || t}
                          </option>
                        );
                      })}
                    </select>
                </div>

                {(!q.type || q.type === 'multiple-choice' || q.type === 'fill-in-the-blank') && (
                  <div className="flex flex-col mt-3">
                    <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                      <span>Enter 4 Options (Select correct answer radio button)</span>
                      {q.type === 'fill-in-the-blank' && (
                        <span className="text-[11px] text-[#38BDF8] mt-0.5 font-medium">
                          💡 Prompt must contain exactly one <strong>[[blank]]</strong> placeholder.
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2.5 py-1">
                          <span className="text-[11px] font-extrabold text-[var(--text-muted)] bg-[var(--border-color)] w-5 h-5 rounded-md flex items-center justify-center">{String.fromCharCode(65 + optIdx)}</span>
                          <input
                            type="text"
                            placeholder={`Option value...`}
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none px-1 py-2 text-[13px] outline-none text-[var(--text-main)]"
                            required
                          />
                          <input
                            type="radio"
                            name={`correct-radio-${idx}`}
                            checked={q.correctAnswer === opt && opt !== ''}
                            onChange={() => handleSetCorrect(idx, optIdx)}
                            className="w-4 h-4 accent-[#10B981] cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.type === 'true-false' && (
                  <div className="flex flex-col mt-3">
                    <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                      <span>Select the Correct Answer</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl font-semibold text-[13px] text-[var(--text-main)]">
                        <input
                          type="radio"
                          name={`manual-tf-correct-${idx}`}
                          checked={q.correctAnswer === 'True'}
                          onChange={() => {
                            const updated = [...questions];
                            updated[idx].correctAnswer = 'True';
                            setQuestions(updated);
                          }}
                          className="accent-[#10B981] w-4 h-4"
                        />
                        <span>True</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-[var(--bg-main)] border border-[var(--border-color)] px-4 py-2.5 rounded-xl font-semibold text-[13px] text-[var(--text-main)]">
                        <input
                          type="radio"
                          name={`manual-tf-correct-${idx}`}
                          checked={q.correctAnswer === 'False'}
                          onChange={() => {
                            const updated = [...questions];
                            updated[idx].correctAnswer = 'False';
                            setQuestions(updated);
                          }}
                          className="accent-[#10B981] w-4 h-4"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                )}

                {q.type === 'swipe-card' && (
                  <div className="flex flex-col mt-3">
                    <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                      <span>Swipe Card Categories (Define Left/Right targets & Select correct)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Left Target (Swipe Left)', 'Right Target (Swipe Right)'].map((label, optIdx) => {
                        const option = q.options[optIdx] || '';
                        const isCorrect = option === q.correctAnswer;
                        return (
                          <div key={optIdx} className="flex flex-col gap-1.5 bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-xl p-3">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{label}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const updated = [...questions];
                                  const oldVal = updated[idx].options[optIdx];
                                  updated[idx].options[optIdx] = e.target.value;
                                  if (updated[idx].correctAnswer === oldVal) {
                                    updated[idx].correctAnswer = e.target.value;
                                  }
                                  setQuestions(updated);
                                }}
                                className="flex-1 bg-transparent border border-[var(--border-color)] rounded py-1 px-2 text-[13px] text-[var(--text-main)] focus:outline-none"
                                placeholder={optIdx === 0 ? "e.g., Literal" : "e.g., Metaphor"}
                                required
                              />
                              <input
                                type="radio"
                                name={`manual-swipe-correct-${idx}`}
                                checked={isCorrect && option !== ''}
                                onChange={() => {
                                  const updated = [...questions];
                                  updated[idx].correctAnswer = updated[idx].options[optIdx];
                                  setQuestions(updated);
                                }}
                                className="w-4 h-4 accent-[#10B981] cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {q.type === 'fraction-builder' && (
                  <div className="flex flex-col mt-3 gap-3 bg-[var(--bg-main)] border border-[var(--border-color)] p-4 rounded-2xl">
                    <label className="text-[11px] font-bold text-[var(--accent-primary-text)] uppercase tracking-wider block">
                      Fraction Builder Setup
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-[var(--text-muted)] font-semibold mb-1 block">Denominator (Total Slices)</label>
                        <select
                          value={q.options[1] || '4'}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].options = [q.options[0] || '2', e.target.value];
                            setQuestions(updated);
                          }}
                          className="w-full text-xs bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[13px] text-[var(--text-main)]"
                        >
                          {['3', '4', '5', '6', '8', '10', '12'].map(v => (
                            <option key={v} value={v}>{v} slices</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-[var(--text-muted)] font-semibold mb-1 block">Correct Numerator (Shaded Slices)</label>
                        <select
                          value={q.options[0] || '2'}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[idx].options = [e.target.value, q.options[1] || '4'];
                            updated[idx].correctAnswer = e.target.value;
                            setQuestions(updated);
                          }}
                          className="w-full text-xs bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-lg py-2 px-3 text-[13px] text-[var(--text-main)]"
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
                  <div className="flex flex-col mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <label style={{ fontSize: '11px' }}>Matching Pairs (Pairs of Antonyms, Synonyms, etc.)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...questions];
                          const pairs = { ...updated[idx].matchingPairs };
                          const nextIdx = Object.keys(pairs).length + 1;
                          pairs[`Key ${nextIdx}`] = `Val ${nextIdx}`;
                          updated[idx].matchingPairs = pairs;
                          updated[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                          updated[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                          setQuestions(updated);
                        }}
                        className="text-[11px] text-[#38BDF8] font-bold hover:underline bg-transparent border-none cursor-pointer"
                      >
                        + Add Pair
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {Object.entries(q.matchingPairs || {}).map(([key, val], pairIdx) => (
                        <div key={pairIdx} className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-2.5">
                          <input
                            type="text"
                            value={key}
                            placeholder="Left Item"
                            onChange={(e) => {
                              const newKey = e.target.value;
                              if (!newKey) return;
                              const updated = [...questions];
                              const pairs = { ...updated[idx].matchingPairs };
                              delete pairs[key];
                              pairs[newKey] = val;
                              updated[idx].matchingPairs = pairs;
                              updated[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                              updated[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                              setQuestions(updated);
                            }}
                            className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded py-1.5 px-2 text-[13px] text-[var(--text-main)] outline-none"
                            required
                          />
                          <span className="text-[var(--text-muted)] text-[12px] font-bold">⇄</span>
                          <input
                            type="text"
                            value={val}
                            placeholder="Right Item"
                            onChange={(e) => {
                              const newVal = e.target.value;
                              const updated = [...questions];
                              const pairs = { ...updated[idx].matchingPairs };
                              pairs[key] = newVal;
                              updated[idx].matchingPairs = pairs;
                              updated[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                              updated[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                              setQuestions(updated);
                            }}
                            className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded py-1.5 px-2 text-[13px] text-[var(--text-main)] outline-none"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...questions];
                              const pairs = { ...updated[idx].matchingPairs };
                              delete pairs[key];
                              updated[idx].matchingPairs = pairs;
                              updated[idx].options = [...Object.keys(pairs), ...Object.values(pairs)];
                              updated[idx].correctAnswer = Object.entries(pairs).map(([k, v]) => `${k}-${v}`).join(', ');
                              setQuestions(updated);
                            }}
                            className="text-red-500 hover:text-red-600 px-2 font-bold text-[14px] bg-transparent border-none cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="flex items-center gap-1.5">
                    <Languages size={14} className="text-[#38BDF8] shrink-0" />
                    <span>Explanation</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Explain why this option is correct..."
                    value={q.feedback.en}
                    onChange={(e) => handleUpdateFeedback(idx, e.target.value)}
                    required
                  />
                </div>
              </div>
            ));
          })()}
          </div>
        </div>
      </div>
    </form>
  );
};


