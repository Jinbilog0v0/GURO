import React, { useState, useEffect } from 'react';
import { MasteryMatrix } from '../components/teacher/MasteryMatrix';
import { StudentTile } from '../components/teacher/StudentTile';
import { DiagnosticAlerts } from '../components/teacher/DiagnosticAlerts';
import { ManualLessonBuilder } from '../components/teacher/ManualLessonBuilder';
import { styles } from '../styles/teacherSpaceStyles';
import { Lock } from 'lucide-react';

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
    <div className="fade-in" style={styles.container}>
      {propActiveSubTab === undefined && (
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <h2>🏫 Teacher Console</h2>
            <div style={styles.subTabGroup}>
              <button
                onClick={() => setActiveSubTab('analytics')}
                style={{
                  ...styles.subTabBtn,
                  ...(activeSubTab === 'analytics' ? styles.subTabBtnActive : {}),
                }}
              >
                📈 Classroom Analytics
              </button>
              <button
                onClick={() => setActiveSubTab('classroom-pairing')}
                style={{
                  ...styles.subTabBtn,
                  ...(activeSubTab === 'classroom-pairing' ? styles.subTabBtnActive : {}),
                }}
              >
                🔑 Classroom Setup
              </button>
              <button
                onClick={() => setActiveSubTab('manual-lesson')}
                style={{
                  ...styles.subTabBtn,
                  ...(activeSubTab === 'manual-lesson' ? styles.subTabBtnActive : {}),
                }}
              >
                ✍️ Create Lesson Manually
              </button>
            </div>
          </div>
          {activeSubTab === 'analytics' && (
            <button style={styles.refreshBtn} onClick={refreshLogs}>🔄 Refresh Logs</button>
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
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
              📁 Classroom Directory
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
                        <span style={{ fontWeight: isActive ? 800 : 500 }}>
                          {isActive ? '🟢 ' : '🔑 '}
                          {c.id} - {c.teacherName} ({c.subject} • Grade {c.gradeLevel})
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Creation Form (Always Visible) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 700 }}>
                ➕ Setup a New Classroom
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
                {isCreatingClass ? 'Generating Code...' : '⚡ Generate Classroom Invite Code'}
              </button>
            </div>
          </div>

          {/* Right Column: Active Session Configurations */}
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {classroomCode && classroomData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>
                    ⚙️ Session Control
                  </h3>
                  <button
                    onClick={() => {
                      localStorage.removeItem('guro_teacher_classroom_code');
                      setClassroomCode(null);
                      setClassroomData(null);
                      setSelectedModules([]);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    🚪 Deselect Session
                  </button>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Invite Code for Students</span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-secondary)', letterSpacing: '3px', marginTop: '6px', fontFamily: 'monospace' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-main)', backgroundColor: 'rgba(99, 102, 241, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div><strong>Teacher Name:</strong> {classroomData.teacherName}</div>
                  <div><strong>Subject Focus:</strong> {classroomData.subject}</div>
                  <div><strong>Grade Level:</strong> Grade {classroomData.gradeLevel}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Modules to Claim:
                  </span>
                  {globalBank ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.15)' }}>
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
                            <span>
                              <strong>{mod.subject === 'Mathematics' ? '🧮 Math' : '📚 English'}</strong> (Grade {mod.grade}) - {mod.topic}
                              {isClaimed && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--success)', fontWeight: 700 }}>🟢 Claimed</span>}
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
                        {isClaiming ? 'Claiming Templates...' : allClaimed ? '✔️ All Curriculum Active' : `📋 Claim Selected (${newClaims.length} New)`}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '48px' }}>🏫</span>
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
            <div className="glass-panel" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(14, 165, 233, 0.08)', borderColor: 'var(--border-color)', borderRadius: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                🏫 Filtered to Classroom Invite Code: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{classroomCode}</strong> ({classroomData.subject} • Grade {classroomData.gradeLevel})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Deselect/switch classroom setup in the Setup tab to view all logs.
              </span>
            </div>
          )}
          {/* Analytics Summary Row */}
          <div style={styles.summaryRow}>
            <div className="glass-panel" style={styles.summaryCard}>
              <TextLabel>Total Sync Reports</TextLabel>
              <TextValue>{progressLogs.length}</TextValue>
            </div>
            <div className="glass-panel" style={styles.summaryCard}>
              <TextLabel>Filtered Logs</TextLabel>
              <TextValue>{filteredLogs.length}</TextValue>
            </div>
            <div className="glass-panel" style={styles.summaryCard}>
              <TextLabel>Classroom Accuracy</TextLabel>
              <TextValue style={{ color: '#10B981' }}>{getAverageAccuracy()}%</TextValue>
            </div>
            <div className="glass-panel" style={styles.summaryCard}>
              <TextLabel>Unique Active Devices</TextLabel>
              <TextValue style={{ color: '#0EA5E9' }}>
                {uniqueStudents.length}
              </TextValue>
            </div>
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
            <div style={styles.gridSection}>
              <h3 style={styles.sectionTitle}>Students Telemetry Profiles</h3>
              <div style={styles.studentGrid}>
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
          <div className="glass-panel" style={styles.filterBar}>
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
              <div style={styles.filterChipContainer}>
                <label style={{ display: 'block', marginBottom: '8px' }}>Active Filter</label>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="btn btn-secondary"
                  style={styles.filterChip}
                >
                  🔑 {selectedStudentId} ✕
                </button>
              </div>
            )}
          </div>

          {/* Progress Table */}
          <div className="glass-panel" style={styles.tableContainer}>
            {loading ? (
              <div style={styles.centered}>
                <div className="spinner" style={{ margin: '20px auto' }}></div>
                <p style={{ color: '#6366F1', fontWeight: 600 }}>Loading sync records...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={styles.centered}>
                <p style={{ color: '#64748B', fontStyle: 'italic', padding: 20 }}>
                  No synced progress logs found matching criteria.
                </p>
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Student / Device ID</th>
                    <th style={styles.th}>Subject</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Topic</th>
                    <th style={styles.th}>Accuracy Score</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const percentage = Math.round((log.score / log.totalQuestions) * 100);
                    return (
                      <tr key={log.eventId} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={styles.studentIdBadge}>🔑 {log.studentId}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 600 }}>
                            {log.subject === 'Mathematics' ? '🧮 Math' : '📚 English'}
                          </span>
                        </td>
                        <td style={styles.td}>Grade {log.gradeLevel}</td>
                        <td style={styles.td}>{log.topic}</td>
                        <td style={styles.td}>
                          <div style={styles.scoreCell}>
                            <span style={{ fontWeight: 800, color: percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444' }}>
                              {percentage}%
                            </span>
                            <span style={styles.fractionText}>({log.score}/{log.totalQuestions})</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={percentage >= 80 ? styles.badgeSuccess : percentage >= 50 ? styles.badgeWarning : styles.badgeDanger}>
                            {percentage >= 80 ? 'Mastery' : percentage >= 50 ? 'Review' : 'Remediation'}
                          </span>
                        </td>
                        <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
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

// Inline components for styles structure
function TextLabel({ children }: { children: React.ReactNode }) {
  return <span style={styles.cardLabel}>{children}</span>;
}

function TextValue({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ ...styles.cardValue, ...style }}>{children}</span>;
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
      <span style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <Lock size={12} /> Expiration Status: Locked / Closed
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 700 }}>
        🟢 Active - {timeLeft}
      </span>
      {expiresAt && (
        <button
          onClick={handleLockNow}
          disabled={isLocking}
          className="btn btn-secondary"
          style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px' }}
        >
          🔒 Lock Now
        </button>
      )}
    </div>
  );
}



