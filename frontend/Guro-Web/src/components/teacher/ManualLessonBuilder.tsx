import React, { useState } from 'react';
import { Plus, Trash2, Save, BookOpen, Languages } from 'lucide-react';

interface Question {
  id: string;
  difficulty: 'Easy' | 'Average' | 'Difficult';
  category: 'Multiple-Choice' | 'Paragraph Comprehension' | 'Figures of Speech';
  questionText: string;
  options: string[];
  correctAnswer: string;
  feedback: {
    en: string;
    fil: string;
  };
}

interface ManualLessonBuilderProps {
  classroomId?: string | null;
}

export const ManualLessonBuilder: React.FC<ManualLessonBuilderProps> = ({ classroomId }) => {
  const [subject, setSubject] = useState('English');
  const [grade, setGrade] = useState('5');
  const [topic, setTopic] = useState('');
  const [lessonText, setLessonText] = useState('');

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'ENG-G5-TOPIC-001',
      difficulty: 'Easy',
      category: 'Multiple-Choice',
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
    setQuestions(prev => updateAllQuestionIds(val, grade, topic, prev));
  };

  const handleGradeChange = (val: string) => {
    setGrade(val);
    setQuestions(prev => updateAllQuestionIds(subject, val, topic, prev));
  };

  const handleTopicChange = (val: string) => {
    setTopic(val);
    setQuestions(prev => updateAllQuestionIds(subject, grade, val, prev));
  };

  // Add a new question slot
  const handleAddQuestion = () => {
    const nextIndex = questions.length;
    const newQ: Question = {
      id: generateQuestionId(nextIndex, subject, grade, topic),
      difficulty: 'Easy',
      category: 'Multiple-Choice',
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
      alert('A lesson must have at least one question.');
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
      alert('Please provide a Topic Title.');
      return;
    }

    if (!lessonText.trim()) {
      alert('Please write the Lesson Summary Content.');
      return;
    }

    // Question validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        alert(`Question #${i + 1} prompt cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          alert(`Option ${String.fromCharCode(65 + j)} for Question #${i + 1} cannot be empty.`);
          return;
        }
      }
      if (!q.correctAnswer) {
        alert(`Please select the correct answer option for Question #${i + 1}.`);
        return;
      }
      if (!q.feedback.en.trim()) {
        alert(`Explanation for Question #${i + 1} is required.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint = classroomId ? '/api/classroom/update-lesson' : '/api/save';
      const payload = classroomId ? {
        classroomId,
        subject,
        grade: parseInt(grade),
        topic: topic.trim(),
        questions
      } : {
        subject,
        grade: parseInt(grade),
        topic: topic.trim(),
        questions
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save lesson');
      }

      alert(`Successfully saved "${topic.trim()}" lesson with ${questions.length} questions manually!`);
      // Reset forms
      setTopic('');
      setLessonText('');
      setQuestions([
        {
          id: 'ENG-G5-TOPIC-001',
          difficulty: 'Easy',
          category: 'Multiple-Choice',
          questionText: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          feedback: { en: '', fil: '' }
        }
      ]);
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving lesson.');
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
            {questions.map((q, idx) => (
              <div key={idx} className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <span className="text-[13px] font-extrabold text-[var(--accent-primary)] uppercase tracking-[0.5px]">Question #{idx + 1}</span>
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
                      <option value="Multiple-Choice">Multiple-Choice</option>
                      <option value="Paragraph Comprehension">Paragraph Comprehension</option>
                      <option value="Figures of Speech">Figures of Speech</option>
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

                <div className="flex flex-col">
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px' }}>
                    Enter 4 Options (Select correct answer radio button)
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
            ))}
          </div>
        </div>
      </div>
    </form>
  );
};


