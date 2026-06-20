import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { BookOpenText, Wrench, FolderOpen, Folder, FileText, Star, BookOpen, FileCheck, Loader2, X, Zap, Briefcase, Check, AlertTriangle, Hourglass, Languages } from 'lucide-react';

export interface Question {
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

export interface LessonSpaceProps {
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null;
  stagedQuestions?: Question[];
  setStagedQuestions?: React.Dispatch<React.SetStateAction<Question[]>>;
}

export function LessonSpace({ 
  currentUser, 
  stagedQuestions: propStagedQuestions, 
  setStagedQuestions: propSetStagedQuestions 
}: LessonSpaceProps) {
  const [localStagedQuestions, setLocalStagedQuestions] = useState<Question[]>([]);
  const stagedQuestions = propStagedQuestions !== undefined ? propStagedQuestions : localStagedQuestions;
  const setStagedQuestions = propSetStagedQuestions !== undefined ? propSetStagedQuestions : setLocalStagedQuestions;
  
  const [subject, setSubject] = useState('English');
  const [grade, setGrade] = useState('5');
  const [topic, setTopic] = useState('');
  const [lessonText, setLessonText] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isCommiting, setIsCommiting] = useState(false);

  const [stagedStudyContent, setStagedStudyContent] = useState<{
    introduction: string;
    definitions: { term: string; definition: string; examples: string[] }[];
    summary: string[];
  } | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'study' | 'questions'>('study');

  const updateIntro = (val: string) => {
    if (!stagedStudyContent) return;
    setStagedStudyContent({ ...stagedStudyContent, introduction: val });
  };

  const updateDefinitionTerm = (idx: number, termVal: string) => {
    if (!stagedStudyContent) return;
    const defs = [...stagedStudyContent.definitions];
    defs[idx] = { ...defs[idx], term: termVal };
    setStagedStudyContent({ ...stagedStudyContent, definitions: defs });
  };

  const updateDefinitionText = (idx: number, defVal: string) => {
    if (!stagedStudyContent) return;
    const defs = [...stagedStudyContent.definitions];
    defs[idx] = { ...defs[idx], definition: defVal };
    setStagedStudyContent({ ...stagedStudyContent, definitions: defs });
  };

  const updateDefinitionExample = (defIdx: number, exIdx: number, val: string) => {
    if (!stagedStudyContent) return;
    const defs = [...stagedStudyContent.definitions];
    const examples = [...defs[defIdx].examples];
    examples[exIdx] = val;
    defs[defIdx] = { ...defs[defIdx], examples };
    setStagedStudyContent({ ...stagedStudyContent, definitions: defs });
  };

  const updateSummaryItem = (idx: number, val: string) => {
    if (!stagedStudyContent) return;
    const summary = [...stagedStudyContent.summary];
    summary[idx] = val;
    setStagedStudyContent({ ...stagedStudyContent, summary });
  };

  const isTeacher = currentUser?.role === 'teacher';
  const classCode = isTeacher ? (currentUser?.classroomId || localStorage.getItem('guro_teacher_classroom_code')) : null;
  const isMissingClassroom = isTeacher && !classCode;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a valid PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        setPdfBase64(base64);
        setPdfFileName(file.name);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearFile = () => {
    setPdfBase64(null);
    setPdfFileName(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    if (!lessonText.trim() && !pdfBase64) {
      toast.error('Please provide either lesson text or upload a PDF file.');
      return;
    }
    if (isMissingClassroom) {
      toast.error('Classroom Code Required. Please setup a classroom code in Setup first.');
      return;
    }

    setLoading(true);
    setStagedQuestions([]);
    setStagedStudyContent(null);
    const loadingToastId = toast.loading('Parsing lesson content & generating items...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade: parseInt(grade),
          topic: topic.trim(),
          lessonText: lessonText.trim() || null,
          pdf: pdfBase64,
        }),
      });

      if (!response.ok) {
        let errMsg = `Server error (status: ${response.status}).`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          if (pdfBase64) {
            errMsg += ' Gemini failed to parse the PDF document. Ensure the PDF is not password-protected, corrupted, or too large.';
          } else {
            errMsg += ' The server encountered an internal error processing the request.';
          }
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setStagedQuestions(data.questions || []);
      setStagedStudyContent(data.studyContent || null);
      toast.success('Successfully parsed lesson and generated questions!', { id: loadingToastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Generation failed.', { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (stagedQuestions.length === 0) return;
    if (isTeacher && !classCode) {
      toast.error('Active Classroom Code Required.');
      return;
    }

    setIsCommiting(true);
    const saveToastId = toast.loading('Saving questions to database...');
    try {
      const endpoint = isTeacher ? '/api/classroom/update-lesson' : '/api/save';
      const payload = isTeacher ? {
        classroomId: classCode,
        subject,
        grade: parseInt(grade),
        topic: topic.trim(),
        questions: stagedQuestions,
        studyContent: stagedStudyContent,
      } : {
        subject,
        grade: parseInt(grade),
        topic: topic.trim(),
        questions: stagedQuestions,
        studyContent: stagedStudyContent,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to save questions' }));
        throw new Error(err.error || 'Failed to save questions');
      }

      const count = stagedQuestions.length;
      if (isTeacher) {
        toast.success(`Successfully committed ${count} questions to your classroom's custom bank!`, { id: saveToastId });
      } else {
        toast.success(`Successfully committed ${count} questions to Guro-Mobile global item bank!`, { id: saveToastId });
      }
      setStagedQuestions([]);
      setStagedStudyContent(null);
      setTopic('');
      setLessonText('');
      setPdfBase64(null);
      setPdfFileName(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to write questions.', { id: saveToastId });
    } finally {
      setIsCommiting(false);
    }
  };

  // Inline edit handlers
  const updateField = (index: number, field: keyof Question, value: string) => {
    const updated = [...stagedQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setStagedQuestions(updated);
  };

  const updateOption = (index: number, optIdx: number, value: string) => {
    const updated = [...stagedQuestions];
    const oldVal = updated[index].options[optIdx];
    updated[index].options[optIdx] = value;
    
    // If the changed option was selected as correct, update correct answer key
    if (updated[index].correctAnswer === oldVal) {
      updated[index].correctAnswer = value;
    }
    setStagedQuestions(updated);
  };

  const setCorrectAnswer = (index: number, optIdx: number) => {
    const updated = [...stagedQuestions];
    updated[index].correctAnswer = updated[index].options[optIdx];
    setStagedQuestions(updated);
  };

  useEffect(() => {
    let interval: any;
    if (loading) {
      setProgressPercent(0);
      setProgressStage('Initializing ingestion pipeline...');
      setShowProgressModal(true);
      setIsMinimized(false);

      const startTime = Date.now();
      const expectedDuration = 15000; // 15 seconds expected duration

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let pct = Math.floor((elapsed / expectedDuration) * 95);
        if (pct > 95) pct = 95;

        setProgressPercent(pct);

        if (pct < 15) {
          setProgressStage('Reading and processing document structures...');
        } else if (pct < 45) {
          setProgressStage('Gemini analyzing lesson summary matrix...');
        } else if (pct < 70) {
          setProgressStage('Synthesizing Easy, Average, and Difficult tiers...');
        } else if (pct < 90) {
          setProgressStage('Formatting structured explanations (English)...');
        } else {
          setProgressStage('Polishing and validating structured response...');
        }
      }, 100);
    } else {
      setProgressPercent(100);
      setProgressStage('Structured questions generated!');
      const timeout = setTimeout(() => {
        setShowProgressModal(false);
        setIsMinimized(false);
      }, 800);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const renderFloatingBubble = () => {
    if (!loading || !isMinimized) return null;
    return (
      <div
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.2)',
          zIndex: 9999,
          transition: 'transform 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', margin: 0 }}></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>
            Generating Items
          </span>
          <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, marginTop: '2px', lineHeight: 1.2 }}>
            {progressPercent}% completed (Click to view)
          </span>
        </div>
      </div>
    );
  };

  const renderProgressModal = () => {
    if (!showProgressModal || isMinimized) return null;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center',
          }}
        >
          <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 0 }}>
            <Zap className="size-4.5 text-[#3b82f6] shrink-0" /> Ingestion Pipeline Active
          </h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
            Topic: <strong style={{ color: '#3b82f6' }}>{topic || 'Untitled Lesson'}</strong>
          </p>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '9999px', height: '10px', marginBottom: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                borderRadius: '9999px',
                transition: 'width 0.1s ease',
              }}
            ></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              {progressStage}
            </span>
            <span style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 700 }}>
              {progressPercent}%
            </span>
          </div>

          {loading ? (
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Briefcase size={14} className="shrink-0" /> Run in Background (Minimize)
            </button>
          ) : (
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Check size={14} className="shrink-0" /> Ingestion Complete!
            </div>
          )}
        </div>
      </div>
    );
  };

  const updateFeedback = (index: number, value: string) => {
    const updated = [...stagedQuestions];
    updated[index].feedback = {
      en: value,
      fil: value,
    };
    setStagedQuestions(updated);
  };

  return (
    <div className="fade-in w-full">
      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-7 items-start">
        {/* Left Form Panel */}
        <form onSubmit={handleGenerate} className="glass-panel p-6 flex flex-col gap-[18px]">
          <h3 className="text-lg flex items-center gap-2">
            <BookOpenText className="size-5 text-blue-500" /> Lesson Plan Ingestion
          </h3>
          
          {isMissingClassroom && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(160, 19, 34, 0.1)',
              border: '1px solid rgba(160, 19, 34, 0.2)',
              borderRadius: '8px',
              color: '#A01322',
              fontSize: '12px',
              lineHeight: '18px',
              fontWeight: 600,
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>Active Classroom Code Required: Go to the <strong>Classroom Setup</strong> tab in the Teacher Console first so that your custom ingested lessons can be saved to your classroom's private bank.</span>
            </div>
          )}
          
          <div className="form-group">
            <label>Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="English">English</option>
              <option value="Mathematics">Mathematics</option>
            </select>
          </div>

          <div className="form-group">
            <label>Grade Level</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>

          <div className="form-group">
            <label>Topic Title</label>
            <input
              type="text"
              placeholder="e.g. Metric Conversions, Adverbs"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Lesson Summary Content (Optional if PDF uploaded)</label>
            <textarea
              placeholder="Paste textbook chapter summary, learning materials, or core concepts..."
              value={lessonText}
              onChange={(e) => setLessonText(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label>Upload Lesson PDF (Optional if text provided)</label>
            {!pdfFileName ? (
              <div 
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ display: 'block', marginBottom: '8px' }}>
                  <Folder className="size-8 text-slate-400 mx-auto" />
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Drag & drop or click to upload PDF
                </span>
                <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                  Max size: 10MB
                </span>
              </div>
            ) : (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <FileText className="size-5 text-blue-400 shrink-0" />
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#93C5FD', 
                    whiteSpace: 'nowrap', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden',
                    fontWeight: 500
                  }}>
                    {pdfFileName}
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={handleClearFile}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s',
                  }}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary flex items-center justify-center gap-2" style={{ marginTop: '8px' }} disabled={loading || isMissingClassroom}>
            {loading ? (
              <>
                <Hourglass className="size-4 animate-spin shrink-0" />
                <span>Splitting Content...</span>
              </>
            ) : (
              <>
                <Zap className="size-4 shrink-0" />
                <span>Parse & Generate Items</span>
              </>
            )}
          </button>
        </form>

        {/* Right Preview/Editor Panel */}
        <div className="glass-panel p-6 flex flex-col min-h-[500px]">

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-white/10 pb-4 mb-5">
            <h3 className="text-lg flex items-center gap-2">
              <Wrench className="size-5 text-purple-500" /> Review & Commit Workspace
            </h3>
            <button
              onClick={handleSave}
              className={`btn btn-primary flex items-center gap-2 ${stagedQuestions.length === 0 || isCommiting || isMissingClassroom ? 'btn-disabled' : ''}`}
              disabled={stagedQuestions.length === 0 || isCommiting || isMissingClassroom}
            >
              {isCommiting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FileCheck className="size-4" /> Commit {stagedQuestions.length} Items to Disk
                </>
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10">
                <Loader2 className="size-8 text-[#11428E] animate-spin" />
                <p className="text-[13px] font-bold text-[#11428E] tracking-[0.5px]">GEMINI FRAGMENTING LESSON MATRIX</p>
                <p className="text-xs text-[var(--text-muted)] text-center">Synthesizing questions and writing explanations...</p>
              </div>
            ) : (!stagedStudyContent && stagedQuestions.length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10">
                <FolderOpen className="size-12 text-slate-500 opacity-40" />
                <p className="text-[var(--text-main)] font-bold text-sm">No content currently staged.</p>
                <p className="text-xs text-[var(--text-muted)] text-center">Submit a lesson plan on the left to start the ingestion pipeline.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Tabs Header */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceTab('study')}
                    style={{
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeWorkspaceTab === 'study' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeWorkspaceTab === 'study' ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <BookOpen className="size-4" /> Study Content Guide
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWorkspaceTab('questions')}
                    style={{
                      padding: '10px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeWorkspaceTab === 'questions' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeWorkspaceTab === 'questions' ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Wrench className="size-4" /> Question Bank ({stagedQuestions.length})
                  </button>
                </div>

                {activeWorkspaceTab === 'study' ? (
                  /* Render Study Content Editor */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {stagedStudyContent ? (
                      <>
                        {/* Introduction Card */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#93C5FD', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star className="size-4" /> Lesson Introduction
                          </h4>
                          <div className="form-group" style={{ margin: 0 }}>
                            <textarea
                              value={stagedStudyContent.introduction}
                              onChange={(e) => updateIntro(e.target.value)}
                              rows={4}
                              style={{ width: '100%', minHeight: '80px', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
                            />
                          </div>
                        </div>

                        {/* Definitions Card */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#93C5FD', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpenText className="size-4" /> Key Vocabulary & Definitions
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {stagedStudyContent.definitions.map((def, defIdx) => (
                              <div key={defIdx} style={{ borderBottom: defIdx === stagedStudyContent.definitions.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)', paddingBottom: defIdx === stagedStudyContent.definitions.length - 1 ? 0 : '16px' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '12px' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Term</label>
                                    <input
                                      type="text"
                                      value={def.term}
                                      onChange={(e) => updateDefinitionTerm(defIdx, e.target.value)}
                                      style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginTop: '4px' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 600 }}>Simple Definition</label>
                                    <input
                                      type="text"
                                      value={def.definition}
                                      onChange={(e) => updateDefinitionText(defIdx, e.target.value)}
                                      style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', marginTop: '4px' }}
                                    />
                                  </div>
                                </div>
                                
                                <div style={{ paddingLeft: '12px', borderLeft: '2px solid rgba(59, 130, 246, 0.3)' }}>
                                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Examples</label>
                                  {def.examples.map((ex, exIdx) => (
                                    <input
                                      key={exIdx}
                                      type="text"
                                      value={ex}
                                      onChange={(e) => updateDefinitionExample(defIdx, exIdx, e.target.value)}
                                      placeholder={`Example ${exIdx + 1}`}
                                      style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', padding: '6px 8px', borderRadius: '4px', fontSize: '12px', marginBottom: '6px' }}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary Card */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#93C5FD', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText className="size-4" /> Key Takeaways & Summary
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stagedStudyContent.summary.map((sumItem, sumIdx) => (
                              <div key={sumIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: '#8b5cf6', fontSize: '16px' }}>•</span>
                                <input
                                  type="text"
                                  value={sumItem}
                                  onChange={(e) => updateSummaryItem(sumIdx, e.target.value)}
                                  style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: '13px' }}>No study content structure generated.</p>
                    )}
                  </div>
                ) : (
                  /* Render Questions List */
                  <div className="flex flex-col gap-4">
                    {stagedQuestions.map((q, idx) => {
                      const badgeClass = q.difficulty.toLowerCase();
                      return (
                        <div key={idx} className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-[12px] p-4 flex flex-col gap-3.5">
                          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.75 rounded-md text-[10px] font-bold uppercase ${
                                badgeClass === 'easy' 
                                  ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' 
                                  : badgeClass === 'average' 
                                    ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' 
                                    : 'bg-[#A01322]/10 text-[#A01322] border border-[#A01322]/20'
                              }`}>
                                {q.difficulty}
                              </span>
                              <span className="px-2 py-0.75 rounded-md text-[10px] font-bold uppercase bg-[#11428E]/10 text-[var(--accent-primary)] border border-[#11428E]/20">
                                {q.category}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={q.id}
                              onChange={(e) => updateField(idx, 'id', e.target.value)}
                              className="bg-transparent border-none border-b border-dashed border-[var(--border-color)] font-['Space_Grotesk',sans-serif] font-bold text-xs text-[var(--text-main)] px-1 py-0.5 w-[150px] rounded-none focus:outline-none"
                            />
                          </div>

                          <div className="form-group">
                            <label>Question Prompt</label>
                            <input
                              type="text"
                              value={q.questionText}
                              onChange={(e) => updateField(idx, 'questionText', e.target.value)}
                              className="form-control w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label>Multiple Choice options (Check the correct answer)</label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-1.5">
                              {q.options.map((option, optIdx) => {
                                const isCorrect = option === q.correctAnswer;
                                return (
                                  <div key={optIdx} className="flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-2">
                                    <span className="text-[10px] font-extrabold text-[var(--text-muted)] bg-[var(--border-color)] w-4.5 h-4.5 rounded flex items-center justify-center">{String.fromCharCode(65 + optIdx)}</span>
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                      className="flex-1 bg-transparent border-none py-2 px-1 text-[13px] text-[var(--text-main)] focus:outline-none"
                                    />
                                    <input
                                      type="radio"
                                      name={`correct-${idx}`}
                                      checked={isCorrect}
                                      onChange={() => setCorrectAnswer(idx, optIdx)}
                                      className="w-4 h-4 accent-[#10B981]"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="form-group mt-3">
                            <label className="flex items-center gap-1.5">
                              <Languages size={14} className="text-[#38BDF8] shrink-0" />
                              <span>Explanation</span>
                            </label>
                            <input
                              type="text"
                              value={q.feedback.en}
                              onChange={(e) => updateFeedback(idx, e.target.value)}
                              className="form-control w-full bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] text-[13px]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {renderFloatingBubble()}
      {renderProgressModal()}
    </div>
  );
}


