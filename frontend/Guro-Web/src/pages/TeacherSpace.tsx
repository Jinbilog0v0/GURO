import React, { useState, useEffect } from 'react';
import { MasteryMatrix } from '../components/teacher/MasteryMatrix';
import { StudentTile } from '../components/teacher/StudentTile';
import { DiagnosticAlerts } from '../components/teacher/DiagnosticAlerts';
import { ManualLessonBuilder } from '../components/teacher/ManualLessonBuilder';
import { School, TrendingUp, Key, Edit3, RotateCw, Folder, Plus, Zap, Settings, LogOut, Calculator, BookOpen, Check, ClipboardList, X, Lock } from 'lucide-react';

interface SyncedEvent {
  studentId: string;
  eventId: string;
  subject: string;
  gradeLevel: number;
  topic: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  classroomId?: string | null;
}

interface TeacherSpaceProps {
  progressLogs: SyncedEvent[];
  lastUpdatedCell: { studentId: string; topic: string; timestamp: number } | null;
  refreshLogs: () => Promise<void>;
  loading: boolean;
  activeSubTab?: 'analytics' | 'manual-lesson' | 'classroom-pairing';
  setActiveSubTab?: (tab: 'analytics' | 'manual-lesson' | 'classroom-pairing') => void;
}

export function TeacherSpace({ 
  progressLogs, 
  lastUpdatedCell, 
  refreshLogs, 
  loading,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}: TeacherSpaceProps) {
  const [filterText, setFilterText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  const [localActiveSubTab, setLocalActiveSubTab] = useState<'analytics' | 'manual-lesson' | 'classroom-pairing'>('analytics');
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab !== undefined ? propSetActiveSubTab : setLocalActiveSubTab;

  // List of all classrooms created by the teacher (stored in localStorage)
  const [classroomHistory, setClassroomHistory] = useState<{
    id: string;
    teacherName: string;
    subject: string;
    gradeLevel: number;
    expiresAt?: string | null;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('guro_teacher_classroom_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Classroom setup state
  const [classroomCode, setClassroomCode] = useState<string | null>(() => {
    return localStorage.getItem('guro_teacher_classroom_code') || null;
  });
  const [classroomData, setClassroomData] = useState<{
    teacherName: string;
    subject: string;
    gradeLevel: number;
    classroomId: string;
    customItemBank?: any;
    expiresAt?: string | null;
  } | null>(null);

  const [setupName, setSetupName] = useState('');
  const [setupSubject, setSetupSubject] = useState('Mathematics');
  const [setupGrade, setSetupGrade] = useState(4);
  const [setupDuration, setSetupDuration] = useState(0);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchClassroomData = async (code: string) => {
    try {
      const res = await fetch(`/api/classroom/verify?code=${code}`);
      if (res.ok) {
        const data = await res.json();
        setClassroomData(data);
        
        // Add to history if not exists
        setClassroomHistory((prev) => {
          if (prev.some(c => c.id === data.classroomId)) return prev;
          const updated = [...prev, {
            id: data.classroomId,
            teacherName: data.teacherName,
            subject: data.subject,
            gradeLevel: data.gradeLevel,
            expiresAt: data.expiresAt
          }];
          localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
          return updated;
        });
      } else if (res.status === 404) {
        localStorage.removeItem('guro_teacher_classroom_code');
        setClassroomCode(null);
        setClassroomData(null);
        // Also remove from history
        setClassroomHistory((prev) => {
          const updated = prev.filter(c => c.id !== code);
          localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Error fetching classroom data:', e);
    }
  };

  useEffect(() => {
    if (classroomCode) {
      fetchClassroomData(classroomCode);
    }
  }, [classroomCode]);

  const [globalBank, setGlobalBank] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<{subject: string; grade: string; topic: string}[]>([]);

  useEffect(() => {
    if (activeSubTab === 'classroom-pairing' && !globalBank) {
      fetch('/api/item-bank')
        .then(res => res.json())
        .then(data => setGlobalBank(data))
        .catch(err => console.error('Error loading global templates:', err));
    }
  }, [activeSubTab, globalBank]);

  useEffect(() => {
    if (globalBank && classroomData && classroomData.subject && classroomData.gradeLevel !== undefined && selectedModules.length === 0) {
      const recommended: { subject: string; grade: string; topic: string }[] = [];
      Object.keys(globalBank).forEach(subject => {
        Object.keys(globalBank[subject]).forEach(grade => {
          Object.keys(globalBank[subject][grade]).forEach(topic => {
            if (subject.toLowerCase() === classroomData.subject.toLowerCase() && grade === classroomData.gradeLevel.toString()) {
              recommended.push({ subject, grade, topic });
            }
          });
        });
      });
      setSelectedModules(recommended);
    }
  }, [globalBank, classroomData]);

  const getSelectableTopics = () => {
    if (!globalBank) return [];
    const topicsList: { subject: string; grade: string; topic: string }[] = [];
    Object.keys(globalBank).forEach(subject => {
      Object.keys(globalBank[subject]).forEach(grade => {
        if (classroomData && grade !== classroomData.gradeLevel.toString()) {
          return;
        }
        Object.keys(globalBank[subject][grade]).forEach(topic => {
          topicsList.push({ subject, grade, topic });
        });
      });
    });
    return topicsList;
  };

  const isTopicAlreadyClaimed = (subject: string, grade: string, topic: string) => {
    if (!classroomData || !classroomData.customItemBank) return false;
    const bank = classroomData.customItemBank as any;
    return !!(bank[subject] && bank[subject][grade] && bank[subject][grade][topic]);
  };

  // Filter logs based on search, dropdown selections, selected student tile, and classroom
  const filteredLogs = progressLogs.filter((log) => {
    const matchesClassroom = !classroomCode || log.classroomId === classroomCode;
    
    const matchesSearch =
      log.studentId.toLowerCase().includes(filterText.toLowerCase()) ||
      log.topic.toLowerCase().includes(filterText.toLowerCase());
    
    const matchesSubject = selectedSubject === 'All' || log.subject === selectedSubject;
    const matchesStudent = !selectedStudentId || log.studentId === selectedStudentId;
    
    return matchesClassroom && matchesSearch && matchesSubject && matchesStudent;
  });

  // Math helper
  const getAverageAccuracy = () => {
    if (filteredLogs.length === 0) return 0;
    const totalPercentage = filteredLogs.reduce((sum, log) => {
      return sum + (log.score / log.totalQuestions) * 100;
    }, 0);
    return Math.round(totalPercentage / filteredLogs.length);
  };

  // Get unique students list (filtered by classroom if active)
  const uniqueStudents = Array.from(new Set(
    progressLogs
      .filter((log) => !classroomCode || log.classroomId === classroomCode)
      .map(l => l.studentId)
  ));

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    } else {
      setSelectedStudentId(studentId);
    }
  };

  return (
    <div className="fade-in flex flex-col gap-6 w-full">
      {propActiveSubTab === undefined && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-[28px]">
            <h2 className="flex items-center gap-2">
              <School className="size-6 text-[#11428E] shrink-0" />
              <span>Teacher Console</span>
            </h2>
            <div className="flex bg-white/5 border border-[var(--border-color)] rounded-[10px] p-1 gap-1">
              <button
                onClick={() => setActiveSubTab('analytics')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'analytics'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <TrendingUp size={14} className="shrink-0" />
                <span>Classroom Analytics</span>
              </button>
              <button
                onClick={() => setActiveSubTab('classroom-pairing')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'classroom-pairing'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <Key size={14} className="shrink-0" />
                <span>Classroom Setup</span>
              </button>
              <button
                onClick={() => setActiveSubTab('manual-lesson')}
                className={`px-3.5 py-1.5 border-none font-semibold text-xs rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                  activeSubTab === 'manual-lesson'
                    ? 'bg-white/10 text-[var(--text-main)]'
                    : 'bg-transparent text-[var(--text-muted)]'
                }`}
              >
                <Edit3 size={14} className="shrink-0" />
                <span>Create Lesson Manually</span>
              </button>
            </div>
          </div>
          {activeSubTab === 'analytics' && (
            <button className="bg-white/4 border border-[var(--border-color)] text-[var(--text-main)] px-4 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:bg-white/10 transition-colors flex items-center gap-1.5" onClick={refreshLogs}>
              <RotateCw size={14} />
              <span>Refresh Logs</span>
            </button>
          )}
        </div>
      )}

      {activeSubTab === 'classroom-pairing' ? (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', fontWeight: 700, margin: 0, paddingLeft: '4px' }}>
            Active Classroom Config & Pairing
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>

          {/* Left Column: Classroom Directory & Creation Form */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 2px 10px rgba(20,30,55,0.06)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={18} className="text-[#11428E] shrink-0" />
              <span>Classroom Directory</span>
            </h3>

            {/* Switch / Select Classroom List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Select Active Classroom Session</label>
              {classroomHistory.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
                  No classrooms created yet. Use the form below to get started!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {classroomHistory.map(c => {
                    const isActive = classroomCode === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          localStorage.setItem('guro_teacher_classroom_code', c.id);
                          setClassroomCode(c.id);
                          setClassroomData({
                            classroomId: c.id,
                            teacherName: c.teacherName,
                            subject: c.subject,
                            gradeLevel: c.gradeLevel,
                            expiresAt: c.expiresAt
                          });
                          setSelectedModules([]);
                        }}
                        className="btn btn-secondary"
                        style={{
                          justifyContent: 'flex-start',
                          padding: '10px 14px',
                          border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'rgba(255,255,255,0.02)',
                          color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                          fontSize: '13px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ fontWeight: isActive ? 800 : 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isActive ? (
                            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_#10B981]" />
                          ) : (
                            <Key size={12} className="text-[var(--text-muted)] inline-block shrink-0" />
                          )}
                          <span>{c.id} - {c.teacherName} ({c.subject} • Grade {c.gradeLevel})</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Creation Form (Always Visible) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={16} className="text-[#11428E] shrink-0" /> Setup a New Classroom
              </span>

              <div className="form-group">
                <label>Teacher Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Teacher Maria" 
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  style={{ padding: '10px 14px' }}
                />
              </div>

              <div className="form-group">
                <label>Subject Focus</label>
                <select 
                  value={setupSubject} 
                  onChange={(e) => setSetupSubject(e.target.value)}
                  style={{ padding: '10px 14px' }}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="form-group">
                <label>Grade Level</label>
                <select 
                  value={setupGrade} 
                  onChange={(e) => setSetupGrade(Number(e.target.value))}
                  style={{ padding: '10px 14px' }}
                >
                  <option value={4}>Grade 4</option>
                  <option value={5}>Grade 5</option>
                  <option value={6}>Grade 6</option>
                </select>
              </div>

              <div className="form-group">
                <label>Session Invite Duration</label>
                <select 
                  value={setupDuration} 
                  onChange={(e) => setSetupDuration(Number(e.target.value))}
                  style={{ padding: '10px 14px' }}
                >
                  <option value={0}>No Limit (Always Open)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                  <option value={1440}>24 Hours</option>
                </select>
              </div>

              <button 
                type="button" 
                className="btn btn-primary"
                disabled={isCreatingClass}
                onClick={async () => {
                  if (!setupName.trim()) {
                    alert('Please enter your name.');
                    return;
                  }
                  setIsCreatingClass(true);
                  try {
                    const res = await fetch('/api/classroom/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        teacherName: setupName.trim(),
                        subject: setupSubject,
                        gradeLevel: setupGrade,
                        duration: setupDuration
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      localStorage.setItem('guro_teacher_classroom_code', data.classroomId);
                      setClassroomCode(data.classroomId);
                      setClassroomData(data);
                      setSetupName('');
                      
                      // Add to history
                      setClassroomHistory((prev) => {
                        if (prev.some(c => c.id === data.classroomId)) return prev;
                        const updated = [...prev, {
                          id: data.classroomId,
                          teacherName: data.teacherName,
                          subject: data.subject,
                          gradeLevel: data.gradeLevel,
                          expiresAt: data.expiresAt
                        }];
                        localStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
                        return updated;
                      });
                    } else {
                      throw new Error('Failed to create classroom.');
                    }
                  } catch (e: any) {
                    alert(e.message || 'Error occurred.');
                  } finally {
                    setIsCreatingClass(false);
                  }
                }}
                style={{ marginTop: '5px' }}
              >
                {isCreatingClass ? 'Generating Code...' : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap size={14} className="shrink-0" />
                    <span>Generate Classroom Invite Code</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Active Session Configurations */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '24px', boxShadow: '0 2px 10px rgba(20,30,55,0.06)' }}>
            {classroomCode && classroomData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings size={18} className="text-[#11428E] shrink-0" />
                    <span>Session Control</span>
                  </h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem('guro_teacher_classroom_code');
                      setClassroomCode(null);
                      setClassroomData(null);
                      setSelectedModules([]);
                    }}
                    className="btn btn-secondary flex items-center gap-1.5"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <LogOut size={12} className="shrink-0" />
                    <span>Deselect Session</span>
                  </button>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--accent-primary-glow)', border: '1px solid var(--accent-primary-glow)', borderRadius: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Invite Code for Students</span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: '#11428E', letterSpacing: '3px', marginTop: '6px', fontFamily: 'monospace' }}>
                    {classroomCode}
                  </div>
                  
                  {/* Expiration timer display */}
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <InviteExpirationTimer 
                      classroomCode={classroomCode}
                      expiresAt={classroomData.expiresAt} 
                      onExpired={() => {
                        fetchClassroomData(classroomCode);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-main)', backgroundColor: 'var(--bg-main)', padding: '14px', borderRadius: '11px', border: '1px solid var(--border-color)' }}>
                  <div><strong>Teacher Name:</strong> {classroomData.teacherName}</div>
                  <div><strong>Subject Focus:</strong> {classroomData.subject}</div>
                  <div><strong>Grade Level:</strong> Grade {classroomData.gradeLevel}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Modules to Claim:
                  </span>
                  {globalBank ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-main)' }}>
                      {getSelectableTopics().map((mod) => {
                        const isClaimed = isTopicAlreadyClaimed(mod.subject, mod.grade, mod.topic);
                        const isSelected = isClaimed || selectedModules.some(
                          s => s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic
                        );
                        return (
                          <label 
                            key={`${mod.subject}-${mod.grade}-${mod.topic}`} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              cursor: isClaimed ? 'not-allowed' : 'pointer', 
                              fontSize: '13px', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              color: isClaimed ? 'var(--text-muted)' : 'var(--text-main)',
                              backgroundColor: isClaimed ? 'rgba(255,255,255,0.01)' : isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              opacity: isClaimed ? 0.7 : 1,
                              transition: 'background-color 0.2s',
                              textTransform: 'none'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              disabled={isClaimed}
                              onChange={() => {
                                if (isClaimed) return;
                                if (isSelected) {
                                  setSelectedModules(prev => prev.filter(
                                    s => !(s.subject === mod.subject && s.grade === mod.grade && s.topic === mod.topic)
                                  ));
                                } else {
                                  setSelectedModules(prev => [...prev, mod]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: isClaimed ? 'not-allowed' : 'pointer' }}
                            />
                            <span className="flex items-center gap-1.5">
                              {mod.subject === 'Mathematics' ? (
                                <Calculator size={14} className="text-[#11428E] shrink-0" />
                              ) : (
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                              )}
                              <strong>{mod.subject === 'Mathematics' ? 'Math' : 'English'}</strong> (Grade {mod.grade}) - {mod.topic}
                              {isClaimed && (
                                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block shadow-[0_0_6px_#10B981]" />
                                  <span>Claimed</span>
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Loading available templates...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  {(() => {
                    const selectable = getSelectableTopics();
                    const unclaimedSelectable = selectable.filter(m => !isTopicAlreadyClaimed(m.subject, m.grade, m.topic));
                    const newClaims = selectedModules.filter(m => !isTopicAlreadyClaimed(m.subject, m.grade, m.topic));
                    const allClaimed = unclaimedSelectable.length === 0;

                    return (
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        disabled={isClaiming || allClaimed || newClaims.length === 0}
                        onClick={async () => {
                          if (newClaims.length === 0) {
                            alert('Please select at least one new module to claim.');
                            return;
                          }
                          setIsClaiming(true);
                          try {
                            const res = await fetch('/api/classroom/claim', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                classroomId: classroomCode,
                                selections: newClaims
                              })
                            });
                            if (res.ok) {
                              const data = await res.json();
                              alert(`Successfully claimed ${newClaims.length} curriculum template(s)!`);
                              setClassroomData(prev => prev ? {
                                ...prev,
                                customItemBank: data.customItemBank
                              } : null);
                            } else {
                              throw new Error('Failed to claim template.');
                            }
                          } catch (e: any) {
                            alert(e.message || 'Error claiming template.');
                          } finally {
                            setIsClaiming(false);
                          }
                        }}
                        style={{ 
                          flex: 1,
                          opacity: allClaimed ? 0.5 : 1,
                          cursor: allClaimed ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isClaiming ? (
                          'Claiming Templates...'
                        ) : allClaimed ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Check size={16} className="text-[#10B981] shrink-0" strokeWidth={3} />
                            <span>All Curriculum Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <ClipboardList size={16} className="shrink-0" />
                            <span>Claim Selected ({newClaims.length} New)</span>
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
                <School size={48} className="text-slate-400 shrink-0" />
                <span style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>No Active Classroom Selected</span>
                <span style={{ fontSize: '12px', textAlign: 'center', maxWidth: '300px' }}>
                  Select an existing classroom from the Directory on the left, or create a new session code to begin managing paired templates.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      ) : activeSubTab === 'manual-lesson' ? (
        <ManualLessonBuilder classroomId={classroomCode} />
      ) : (
        <>
          {classroomCode && classroomData && (
            <div className="px-6 py-3.5 flex justify-between items-center bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)]/20 rounded-[12px] mb-2">
              <span className="text-[13px] color-[var(--accent-secondary)] font-semibold flex items-center gap-2">
                <School className="size-4 text-sky-500 shrink-0" />
                <span>Filtered to Classroom Invite Code: <strong className="text-[var(--text-main)] font-mono text-[14px] tracking-[1px]">{classroomCode}</strong> ({classroomData.subject} • Grade {classroomData.gradeLevel})</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                Deselect/switch classroom setup in the Setup tab to view all logs.
              </span>
            </div>
          )}
          {/* Analytics Summary Row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Sync Reports" value={progressLogs.length} accentColor="#11428E" />
            <StatCard label="Filtered Logs" value={filteredLogs.length} accentColor="#CE1126" />
            <StatCard label="Classroom Accuracy" value={`${getAverageAccuracy()}%`} accentColor="#16A34A" valueColor="#16A34A" />
            <StatCard label="Active Devices" value={uniqueStudents.length} accentColor="#11428E" valueColor="#11428E" />
          </div>

          {/* Diagnostics Alerts Row */}
          {!loading && progressLogs.length > 0 && (
            <DiagnosticAlerts progressLogs={progressLogs} />
          )}

          {/* Classroom Mastery Matrix */}
          {!loading && progressLogs.length > 0 && (
            <MasteryMatrix progressLogs={progressLogs} lastUpdatedCell={lastUpdatedCell} />
          )}

          {/* Interactive Student profile cards grid */}
          {!loading && uniqueStudents.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Students Telemetry Profiles</h3>
              <div className="grid grid-cols-4 gap-4">
                {uniqueStudents.map(studentId => {
                  const studentLogs = progressLogs.filter(l => l.studentId === studentId);
                  return (
                    <StudentTile
                      key={studentId}
                      studentId={studentId}
                      logs={studentLogs}
                      onSelect={handleSelectStudent}
                      isSelected={selectedStudentId === studentId}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters Area */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] px-6 py-[22px] flex items-end gap-5 shadow-sm">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Search Student or Topic</label>
              <input
                type="text"
                placeholder="Search by student identifier or topic..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Filter by Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="All">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
              </select>
            </div>
            {selectedStudentId && (
              <div className="flex flex-col">
                <label style={{ display: 'block', marginBottom: '8px' }}>Active Filter</label>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="btn btn-secondary px-3.5 py-2 text-xs font-bold text-[var(--accent-primary)] border border-[var(--accent-primary-glow)] bg-[var(--accent-primary-glow)] flex items-center justify-center gap-1.5"
                >
                  <Key size={12} className="shrink-0" />
                  <span>{selectedStudentId}</span>
                  <X size={12} className="shrink-0 ml-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[18px] overflow-x-auto shadow-sm">
            {loading ? (
              <div className="text-center p-10">
                <div className="spinner" style={{ margin: '20px auto' }}></div>
                <p style={{ color: '#11428E', fontWeight: 600 }}>Loading sync records...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-10">
                <p style={{ color: '#64748B', fontStyle: 'italic', padding: 20 }}>
                  No synced progress logs found matching criteria.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Student / Device ID</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Subject</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Grade</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Topic</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Accuracy Score</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Status</th>
                    <th className="px-5 py-4 border-b border-[var(--border-color)] text-[var(--text-muted)] font-bold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const percentage = Math.round((log.score / log.totalQuestions) * 100);
                    return (
                      <tr key={log.eventId} className="border-b border-[var(--border-color)]">
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span className="bg-[var(--border-color)] px-2 py-1 rounded-md font-mono text-xs border border-[var(--border-color)] flex items-center gap-1.5 w-fit">
                            <Key size={12} className="text-[#F59E0B] shrink-0" />
                            <span>{log.studentId}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span style={{ fontWeight: 600 }} className="flex items-center gap-1.5">
                            {log.subject === 'Mathematics' ? (
                              <>
                                <Calculator size={14} className="text-[#11428E] shrink-0" />
                                <span>Math</span>
                              </>
                            ) : (
                              <>
                                <BookOpen size={14} className="text-emerald-500 shrink-0" />
                                <span>English</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">Grade {log.gradeLevel}</td>
                        <td className="px-5 py-4 text-[var(--text-main)]">{log.topic}</td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <div className="flex items-baseline gap-1.5">
                            <span style={{ fontWeight: 800, color: percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#A01322' }}>
                              {percentage}%
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] font-medium">({log.score}/{log.totalQuestions})</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">
                          <span className={
                            percentage >= 80 
                              ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" 
                              : percentage >= 50 
                                ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20" 
                                : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#A01322]/10 text-[#A01322] border border-[#A01322]/20"
                          }>
                            {percentage >= 80 ? 'Mastery' : percentage >= 50 ? 'Review' : 'Remediation'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-main)]">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accentColor, valueColor }: {
  label: string; value: React.ReactNode; accentColor: string; valueColor?: string;
}) {
  return (
    <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[16px] p-[18px_20px_20px] overflow-hidden shadow-sm">
      <span className="absolute left-0 top-4 bottom-4 w-1 rounded-[0_4px_4px_0]" style={{ background: accentColor }} />
      <div className="text-[11px] font-extrabold tracking-[0.08em] uppercase text-[var(--text-muted)]">{label}</div>
      <div className="text-[34px] font-extrabold mt-2 text-[var(--text-main)]" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
    </div>
  );
}

function InviteExpirationTimer({ 
  classroomCode, 
  expiresAt, 
  onExpired 
}: { 
  classroomCode: string; 
  expiresAt?: string | null; 
  onExpired: () => void 
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft('Always Open (No Limit)');
      setIsExpired(false);
      return;
    }

    const checkExpiry = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const diff = expiryTime - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired / Locked');
        setIsExpired(true);
        onExpired();
        return true;
      }
      
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`Expires in ${mins}m ${secs}s`);
      setIsExpired(false);
      return false;
    };

    const expired = checkExpiry();
    if (expired) return;

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, classroomCode]);

  const handleLockNow = async () => {
    setIsLocking(true);
    try {
      const res = await fetch('/api/classroom/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: classroomCode })
      });
      if (res.ok) {
        onExpired();
      }
    } catch (e) {
      console.error('Error locking session:', e);
    } finally {
      setIsLocking(false);
    }
  };

  if (isExpired) {
    return (
      <span className="text-xs text-[var(--danger)] font-bold inline-flex items-center gap-1.5">
        <Lock size={12} /> Expiration Status: Locked / Closed
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--success)] font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_8px_#10B981]" />
        <span>Active - {timeLeft}</span>
      </span>
      {expiresAt && (
        <button
          onClick={handleLockNow}
          disabled={isLocking}
          className="btn btn-secondary px-2 py-1 text-[10px] rounded flex items-center gap-1"
        >
          <Lock size={10} className="shrink-0" />
          <span>Lock Now</span>
        </button>
      )}
    </div>
  );
}



