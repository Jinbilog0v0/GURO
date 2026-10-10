import React, { useState, useEffect, useCallback } from 'react';
import { NameInputStep } from '../components/student/NameInputStep';
import { DashboardStep } from '../components/student/DashboardStep';
import { QuestionStep } from '../components/student/QuestionStep';
import { QuizResultsStep } from '../components/student/QuizResultsStep';
import { StudyContentStep } from '../components/student/StudyContentStep';
import { StudentShell, type ShellView } from '../components/student/StudentShell';
import { ProgressView } from '../components/student/ProgressView';
import { TopicSelectionStep } from '../components/student/TopicSelectionStep';
import { FALLBACK_ITEM_BANK, type QuestionItem, type ItemBank } from '../constants/fallbackItemBank';
import { getParentAccessCode } from '../utils/security';
import { LogoutConfirmModal } from '../components/shared/LogoutConfirmModal';
import { ConfirmModal } from '../components/shared/ConfirmModal';
import { ClassroomStep } from '../components/student/ClassroomStep';
import { toast } from '../utils/toast';
import { apiFetch } from '../utils/api';


interface StudentSpaceProps {
    onExit: () => void;
    onLogout: () => void;
    currentUser?: { name: string; email: string; userId: string; classroomId?: string | null } | null;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    onOpenSettings?: () => void;
}

type StepType = 'name' | 'grade' | 'dashboard' | 'topics' | 'progress' | 'study' | 'quiz' | 'results' | 'classroom';

interface AnsweredQuestion {
    questionText: string;
    selectedOption: string;
    correctOption: string;
    explanationEn: string;
    isCorrect: boolean;
}

interface TopicStat {
    bestScore: number;
    lastScore: number;
    attempts: number;
}

const STORAGE_KEY_NAME = 'guro_student_name';
const STORAGE_KEY_GRADE = 'guro_student_grade';

export const StudentSpace: React.FC<StudentSpaceProps> = ({ onExit, onLogout, currentUser, isDarkMode, onToggleTheme, onOpenSettings }) => {
    const savedName = !currentUser ? (localStorage.getItem(STORAGE_KEY_NAME) ?? '') : '';
    const savedGrade = parseInt(localStorage.getItem(STORAGE_KEY_GRADE) ?? '4', 10) || 4;

    const [step, setStep] = useState<StepType>(() => {
        const storedStep = localStorage.getItem('guro_student_step') as StepType;
        if (storedStep && ['dashboard', 'topics', 'progress'].includes(storedStep)) {
            return storedStep;
        }
        if (currentUser) return 'dashboard';
        if (savedName) return 'dashboard'; // skip name step if name is saved
        return 'name';
    });
    const [userName, setUserName] = useState(currentUser ? currentUser.name : savedName);
    const storedEmailOrId = localStorage.getItem('guro_student_email_or_id') || (currentUser ? currentUser.email : '');
    const activeStudentId = currentUser?.userId || (storedEmailOrId || userName || 'STUDENT-WEB-USER').trim().replace(/\s+/g, '-').toUpperCase();

    const [selectedGrade, setSelectedGrade] = useState<number>(savedGrade);
    const [selectedSubject, setSelectedSubject] = useState<'Mathematics' | 'English'>(() => {
        const stored = localStorage.getItem('guro_student_subject');
        if (stored === 'Mathematics' || stored === 'English') return stored;
        return 'Mathematics';
    });
    const [selectedTopic, setSelectedTopic] = useState(() => {
        return localStorage.getItem('guro_student_topic') ?? '';
    });
    const [classroomCode, setClassroomCode] = useState(() => {
        const currentUserClassroom = currentUser?.classroomId;
        return currentUserClassroom || localStorage.getItem(`guro_student_classroom_id_${activeStudentId}`) || localStorage.getItem('guro_student_classroom_id') || '';
    });
    const [teacherName, setTeacherName] = useState(() => {
        return localStorage.getItem(`guro_student_teacher_name_${activeStudentId}`) || localStorage.getItem('guro_student_teacher_name') || '';
    });
    const [activeSchoolYear, setActiveSchoolYear] = useState(() => {
        return localStorage.getItem(`guro_student_school_year_${activeStudentId}`) || localStorage.getItem('guro_student_school_year') || '2026-2027';
    });
    const [activeTerm, setActiveTerm] = useState(() => {
        return localStorage.getItem(`guro_student_term_${activeStudentId}`) || localStorage.getItem('guro_student_term') || 'Quarter 1';
    });
    const [activeSectionName, setActiveSectionName] = useState(() => {
        return localStorage.getItem(`guro_student_section_${activeStudentId}`) || localStorage.getItem('guro_student_section') || '';
    });

    // Quiz execution state
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answeredHistory, setAnsweredHistory] = useState<AnsweredQuestion[]>([]);

    // Per-topic progress history (key: `${subject}-${grade}-${topic}`) scoped to current student account
    const [topicHistory, setTopicHistory] = useState<Record<string, TopicStat>>(() => {
        try {
            const raw = localStorage.getItem(`guro_student_topic_history_${activeStudentId}`);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    const [pendingGradeSwitch, setPendingGradeSwitch] = useState<{ targetGrade: number; classGrade: number; classroomCode: string } | null>(null);

    // Sync metrics history scoped to current student account
    const [lessonsCompleted, setLessonsCompleted] = useState<number>(() => {
        return parseInt(localStorage.getItem(`guro_student_lessons_completed_${activeStudentId}`) ?? '0', 10) || 0;
    });
    const [totalScoreSum, setTotalScoreSum] = useState<number>(() => {
        return parseInt(localStorage.getItem(`guro_student_score_sum_${activeStudentId}`) ?? '0', 10) || 0;
    });
    const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(() => {
        return parseInt(localStorage.getItem(`guro_student_questions_answered_${activeStudentId}`) ?? '0', 10) || 0;
    });

    // Dynamic item bank loading
    const [itemBank, setItemBank] = useState<ItemBank>(FALLBACK_ITEM_BANK);
    const [itemBankLoading, setItemBankLoading] = useState(true);
    const [activeSubjects, setActiveSubjects] = useState<string[]>(['Mathematics', 'English']);

    // Gamification & Rewards
    const [stars, setStars] = useState<number>(() => parseInt(localStorage.getItem('guro_student_stars') ?? '0', 10) || 0);
    const [avatarEmoji, setAvatarEmoji] = useState<string>(() => localStorage.getItem('guro_student_avatar') ?? '🦉');
    const [activeOutfit, setActiveOutfit] = useState<string>(() => localStorage.getItem('guro_student_outfit') ?? 'default');
    const [ownedOutfits, setOwnedOutfits] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('guro_student_owned_outfits') ?? '["default"]');
        } catch {
            return ['default'];
        }
    });
    const [xpPoints, setXpPoints] = useState<number>(() => parseInt(localStorage.getItem('guro_student_xp') ?? '0', 10) || 0);

    // Sync avatar and outfit live from modal
    useEffect(() => {
        const handleAvatarSync = (e: any) => {
            if (e.detail?.avatar) setAvatarEmoji(e.detail.avatar);
            if (e.detail?.outfit) setActiveOutfit(e.detail.outfit);
        };
        window.addEventListener('guro_avatar_updated', handleAvatarSync);
        return () => window.removeEventListener('guro_avatar_updated', handleAvatarSync);
    }, []);

    // Screen Time Limits
    const [dailyMinutesUsed, setDailyMinutesUsed] = useState<number>(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastActiveDay = localStorage.getItem('guro_student_last_active_day');
        if (lastActiveDay !== today) {
            localStorage.setItem('guro_student_last_active_day', today);
            localStorage.setItem('guro_student_minutes_used', '0');
            return 0;
        }
        return parseFloat(localStorage.getItem('guro_student_minutes_used') ?? '0') || 0;
    });

    const [dailyTimeLimit] = useState<number>(() => parseInt(localStorage.getItem('guro_parent_time_limit') ?? '0', 10) || 0);
    const isTimeLimitExceeded = dailyTimeLimit > 0 && dailyMinutesUsed >= dailyTimeLimit;

    useEffect(() => {
        localStorage.setItem('guro_student_step', step);
    }, [step]);

    useEffect(() => {
        localStorage.setItem('guro_student_subject', selectedSubject);
    }, [selectedSubject]);

    useEffect(() => {
        const validSubjects = Array.from(new Set(['Mathematics', 'English', ...(activeSubjects || [])]));
        if (validSubjects.length > 0 && !validSubjects.includes(selectedSubject)) {
            setSelectedSubject(validSubjects[0] as any);
        }
    }, [activeSubjects, selectedSubject]);

    useEffect(() => {
        localStorage.setItem('guro_student_topic', selectedTopic);
    }, [selectedTopic]);

    // Active screen time tracker using focus and active interaction deltas
    useEffect(() => {
        let lastTickTime = Date.now();
        let lastInteractionTime = Date.now();

        const updateInteraction = () => {
            lastInteractionTime = Date.now();
        };

        // Track user activity
        window.addEventListener('mousedown', updateInteraction);
        window.addEventListener('keydown', updateInteraction);
        window.addEventListener('touchstart', updateInteraction);

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsedMs = now - lastTickTime;
            lastTickTime = now;

            // Only count if document is visible and user has interacted in the last 60 seconds
            const isTabVisible = document.visibilityState === 'visible';
            const isUserActive = now - lastInteractionTime < 60000;

            if (isTabVisible && isUserActive) {
                const today = new Date().toISOString().split('T')[0];
                const lastActiveDay = localStorage.getItem('guro_student_last_active_day');
                
                let currentMinutes = parseFloat(localStorage.getItem('guro_student_minutes_used') ?? '0') || 0;
                
                if (lastActiveDay !== today) {
                    localStorage.setItem('guro_student_last_active_day', today);
                    currentMinutes = 0;
                }
                
                const addedMinutes = elapsedMs / 60000;
                const nextMinutes = currentMinutes + addedMinutes;
                localStorage.setItem('guro_student_minutes_used', String(nextMinutes));
                setDailyMinutesUsed(nextMinutes);
            }
        }, 15000);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('mousedown', updateInteraction);
            window.removeEventListener('keydown', updateInteraction);
            window.removeEventListener('touchstart', updateInteraction);
        };
    }, []);

    const handlePurchaseOutfit = (key: string, cost: number): boolean => {
        if (stars >= cost && !ownedOutfits.includes(key)) {
            const updatedStars = stars - cost;
            const updatedOwned = [...ownedOutfits, key];
            setStars(updatedStars);
            setOwnedOutfits(updatedOwned);
            setActiveOutfit(key);
            
            localStorage.setItem('guro_student_stars', String(updatedStars));
            localStorage.setItem('guro_student_owned_outfits', JSON.stringify(updatedOwned));
            localStorage.setItem('guro_student_outfit', key);
            
            toast.success(`Unlocked ${key.replace('_', ' ')}! Equipped mascot.`);
            return true;
        }
        return false;
    };

    const handleEquipOutfit = (key: string) => {
        if (ownedOutfits.includes(key)) {
            setActiveOutfit(key);
            localStorage.setItem('guro_student_outfit', key);
            toast.success(`Equipped outfit: ${key.replace('_', ' ')}`);
        }
    };
    
    const handleSelectAvatarEmoji = (emoji: string) => {
        setAvatarEmoji(emoji);
        localStorage.setItem('guro_student_avatar', emoji);
        toast.success('Avatar emoji updated!');
    };

    const getRecommendedLesson = () => {
        const availableSubjects = activeSubjects.filter((s): s is 'Mathematics' | 'English' => s === 'Mathematics' || s === 'English');
        if (availableSubjects.length === 0) return null;

        const mathAvg = computeSubjectAvg('Mathematics', selectedGrade);
        const engAvg = computeSubjectAvg('English', selectedGrade);
        const defaultOrder: ('Mathematics' | 'English')[] = mathAvg <= engAvg ? ['Mathematics', 'English'] : ['English', 'Mathematics'];
        const subjectOrder = defaultOrder.filter((s) => (availableSubjects as string[]).includes(s));
        
        for (const subject of subjectOrder) {
            if (subject === 'English' && isEnglishLocked) continue;
            const topics = getTopicsForCurrentSelection(subject);
            
            // Priority 1: Needs Improvement (40% - 79%)
            for (const topic of topics) {
                const key = `${subject}-${selectedGrade}-${topic}`;
                const stat = topicHistory[key];
                if (stat && stat.bestScore >= 0.4 && stat.bestScore < 0.8) {
                    return { subject, topic, reason: 'Needs Improvement' };
                }
            }
            
            // Priority 2: Not Started
            for (const topic of topics) {
                const key = `${subject}-${selectedGrade}-${topic}`;
                const stat = topicHistory[key];
                if (!stat || stat.attempts === 0) {
                    return { subject, topic, reason: 'Not Started' };
                }
            }
        }
        return null;
    };

    const getLastActivity = () => {
        try {
            const raw = localStorage.getItem('guro_last_activity');
            if (raw) {
                const act = JSON.parse(raw);
                if (act && act.subject && activeSubjects.includes(act.subject) && Number(act.gradeLevel) === Number(selectedGrade)) {
                    return act;
                }
            }
        } catch {}
        return null;
    };

    const loadTopicHistory = useCallback(async () => {
        const allEvents: any[] = [];
        const currentStudentId = activeStudentId;

        // 1. Add local queue items matching current student ID
        const queueJson = localStorage.getItem('guro_sync_queue');
        if (queueJson) {
            try {
                const queue = JSON.parse(queueJson);
                if (Array.isArray(queue)) {
                    queue.forEach((item: any) => {
                        if (item.event && (!item.studentId || item.studentId === currentStudentId)) {
                            allEvents.push(item.event);
                        }
                    });
                }
            } catch (e) {
                console.error('[Sync] Error parsing local sync queue:', e);
            }
        }

        // 2. Fetch already synced events from server when online
        if (navigator.onLine && userName) {
            const accessCode = getParentAccessCode(currentStudentId);
            try {
                const res = await apiFetch(`/api/progress?studentId=${encodeURIComponent(currentStudentId)}&accessCode=${encodeURIComponent(accessCode)}`);
                if (res.ok) {
                    const serverEvents = await res.json();
                    if (Array.isArray(serverEvents)) {
                        serverEvents.forEach((evt: any) => {
                            if (!allEvents.some((qEvt) => qEvt.eventId === evt.eventId)) {
                                allEvents.push(evt);
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn('[Sync] Could not fetch student progress from server:', err);
            }
        }

        // Sort by timestamp ascending so that as we process them, the last one processed is the newest
        allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Load existing stored local topic history first for current student account
        let history: Record<string, TopicStat> = {};
        try {
            const stored = localStorage.getItem(`guro_student_topic_history_${currentStudentId}`);
            if (stored) history = JSON.parse(stored);
        } catch (e) {}

        allEvents.forEach((evt) => {
            const key = `${evt.subject}-${evt.gradeLevel}-${evt.topic}`;
            const pct = evt.score / evt.totalQuestions;
            const existing = history[key];
            if (!existing) {
                history[key] = { bestScore: pct, lastScore: pct, attempts: 1 };
            } else {
                history[key] = {
                    bestScore: Math.max(existing.bestScore, pct),
                    lastScore: pct,
                    attempts: existing.attempts + 1,
                };
            }
        });

        setTopicHistory(history);
        localStorage.setItem(`guro_student_topic_history_${currentStudentId}`, JSON.stringify(history));
    }, [activeStudentId, userName]);

    const fetchItemBank = useCallback(async (forceCode?: string) => {
        setItemBankLoading(true);
        const activeCode = forceCode !== undefined ? forceCode : (localStorage.getItem('guro_student_classroom_id') || classroomCode);
        const url = activeCode ? `/api/item-bank?classroomId=${encodeURIComponent(activeCode)}` : '/api/item-bank';
        try {
            const res = await apiFetch(url);
            if (res.ok) {
                const data = await res.json();
                if (Object.keys(data).length > 0) {
                    setItemBank(data);
                } else if (activeCode) {
                    setItemBank(FALLBACK_ITEM_BANK);
                }
            }

            // Also fetch active subjects offered by the teacher
            if (activeCode) {
                const subRes = await apiFetch(`/api/classroom/active-subjects?classroomId=${encodeURIComponent(activeCode)}`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    if (subData.subjects && Array.isArray(subData.subjects)) {
                        setActiveSubjects(subData.subjects);
                    }
                }

                // Auto-verify and populate teacherName, schoolYear, term, and sectionName if not already cached
                try {
                    const verRes = await apiFetch(`/api/classroom/verify?code=${encodeURIComponent(activeCode.trim().toUpperCase())}`);
                    if (verRes.ok) {
                        const verData = await verRes.json();
                        if (verData.teacherName) {
                            setTeacherName(verData.teacherName);
                            localStorage.setItem('guro_student_teacher_name', verData.teacherName);
                            localStorage.setItem(`guro_student_teacher_name_${activeStudentId}`, verData.teacherName);
                        }
                        if (verData.schoolYear) {
                            setActiveSchoolYear(verData.schoolYear);
                            localStorage.setItem('guro_student_school_year', verData.schoolYear);
                            localStorage.setItem(`guro_student_school_year_${activeStudentId}`, verData.schoolYear);
                        }
                        if (verData.term) {
                            setActiveTerm(verData.term);
                            localStorage.setItem('guro_student_term', verData.term);
                            localStorage.setItem(`guro_student_term_${activeStudentId}`, verData.term);
                        }
                        if (verData.sectionName) {
                            setActiveSectionName(verData.sectionName);
                            localStorage.setItem('guro_student_section', verData.sectionName);
                            localStorage.setItem(`guro_student_section_${activeStudentId}`, verData.sectionName);
                        }
                    }
                } catch (e) {}
            } else {
                setActiveSubjects(['Mathematics', 'English']);
            }
        } catch (error) {
            console.warn('Could not load online item bank, falling back to local static bank:', error);
            setActiveSubjects(['Mathematics', 'English']);
        } finally {
            setItemBankLoading(false);
        }
    }, [classroomCode, activeStudentId]);

    const handleJoinClassroom = async (code: string): Promise<boolean> => {
        try {
            const res = await apiFetch(`/api/classroom/verify?code=${encodeURIComponent(code.trim().toUpperCase())}`);
            if (res.ok) {
                const data = await res.json();
                
                // Strict Grade Level Enforcement
                if (data.gradeLevel && Number(data.gradeLevel) !== Number(selectedGrade)) {
                    toast.error(`Grade Level Mismatch: Classroom "${data.classroomId}" is strictly for Grade ${data.gradeLevel} students only. Your profile is currently set to Grade ${selectedGrade}.`);
                    return false;
                }

                setClassroomCode(data.classroomId);
                setTeacherName(data.teacherName || '');
                localStorage.setItem('guro_student_classroom_id', data.classroomId);
                localStorage.setItem(`guro_student_classroom_id_${activeStudentId}`, data.classroomId);
                localStorage.setItem('guro_student_teacher_name', data.teacherName || '');
                localStorage.setItem(`guro_student_teacher_name_${activeStudentId}`, data.teacherName || '');
                
                if (data.schoolYear) {
                    setActiveSchoolYear(data.schoolYear);
                    localStorage.setItem('guro_student_school_year', data.schoolYear);
                    localStorage.setItem(`guro_student_school_year_${activeStudentId}`, data.schoolYear);
                }
                if (data.term) {
                    setActiveTerm(data.term);
                    localStorage.setItem('guro_student_term', data.term);
                    localStorage.setItem(`guro_student_term_${activeStudentId}`, data.term);
                }
                if (data.sectionName) {
                    setActiveSectionName(data.sectionName);
                    localStorage.setItem('guro_student_section', data.sectionName);
                    localStorage.setItem(`guro_student_section_${activeStudentId}`, data.sectionName);
                }

                // Pair this student name on the server as a classroom member
                const pairRes = await apiFetch('/api/classroom/pair', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: activeStudentId, classroomId: data.classroomId, gradeLevel: selectedGrade })
                }).catch(() => null);

                if (pairRes && !pairRes.ok) {
                    const pairErr = await pairRes.json().catch(() => ({}));
                    toast.error(pairErr.error || 'Failed to enroll in classroom.');
                    return false;
                }

                toast.success(`Successfully joined ${data.teacherName ? `${data.teacherName}'s ` : ''}Grade ${data.gradeLevel} classroom!`);
                fetchItemBank(data.classroomId);
                return true;
            } else {
                const errData = await res.json().catch(() => ({}));
                toast.error(errData.error || 'Invalid classroom code.');
                return false;
            }
        } catch (error) {
            toast.error('Network error. Failed to join classroom.');
            return false;
        }
    };

    const handleLeaveClassroom = () => {
        setClassroomCode('');
        setTeacherName('');
        setActiveSchoolYear('2026-2027');
        setActiveTerm('Quarter 1');
        setActiveSectionName('');
        localStorage.removeItem('guro_student_classroom_id');
        localStorage.removeItem(`guro_student_classroom_id_${activeStudentId}`);
        localStorage.removeItem('guro_student_teacher_name');
        localStorage.removeItem(`guro_student_teacher_name_${activeStudentId}`);
        localStorage.removeItem('guro_student_school_year');
        localStorage.removeItem(`guro_student_school_year_${activeStudentId}`);
        localStorage.removeItem('guro_student_term');
        localStorage.removeItem(`guro_student_term_${activeStudentId}`);
        localStorage.removeItem('guro_student_section');
        localStorage.removeItem(`guro_student_section_${activeStudentId}`);
        toast.success('Successfully left classroom.');
        fetchItemBank('');
    };

    const flushSyncQueue = useCallback(async () => {
        const queueJson = localStorage.getItem('guro_sync_queue');
        if (!queueJson) return;
        try {
            const queue = JSON.parse(queueJson);
            if (!Array.isArray(queue) || queue.length === 0) return;

            console.log(`[Sync] Attempting to sync ${queue.length} queued progress reports...`);

            // Group queue items by studentId and classroomId to send batched payloads
            const grouped: { [key: string]: { studentId: string; classroomId: string; events: any[] } } = {};
            queue.forEach((item: any) => {
                const cId = item.classroomId || localStorage.getItem('guro_student_classroom_id') || '';
                const key = `${item.studentId}_${cId}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        studentId: item.studentId,
                        classroomId: cId,
                        events: []
                    };
                }
                grouped[key].events.push(item.event);
            });

            const keys = Object.keys(grouped);
            const successfullySyncedKeys: string[] = [];

            for (const key of keys) {
                const { studentId, classroomId, events } = grouped[key];
                try {
                    const response = await apiFetch('/api/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            studentId,
                            classroomId: classroomId || undefined,
                            events
                        })
                    });
                    if (response.ok) {
                        successfullySyncedKeys.push(key);
                    }
                } catch (err) {
                    console.warn(`[Sync] Failed to upload telemetry for student "${studentId}" under classroom "${classroomId}". Will retry when online.`);
                }
            }

            if (successfullySyncedKeys.length > 0) {
                const remainingQueue = queue.filter((item: any) => {
                    const cId = item.classroomId || localStorage.getItem('guro_student_classroom_id') || '';
                    const key = `${item.studentId}_${cId}`;
                    return !successfullySyncedKeys.includes(key);
                });
                if (remainingQueue.length > 0) {
                    localStorage.setItem('guro_sync_queue', JSON.stringify(remainingQueue));
                } else {
                    localStorage.removeItem('guro_sync_queue');
                }
                console.log(`[Sync] Successfully uploaded telemetry batches.`);
                loadTopicHistory();
            }
        } catch (e) {
            console.error('[Sync] Error parsing sync queue from local storage', e);
            localStorage.removeItem('guro_sync_queue');
        }
    }, [classroomCode, loadTopicHistory]);

    useEffect(() => {
        fetchItemBank();
        loadTopicHistory();
        // Flush any pending progress reports from previous offline sessions on load
        flushSyncQueue();

        const handleOnline = () => {
            console.log('[Sync] Network connection detected. Flushing local storage queue.');
            flushSyncQueue();
        };

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [fetchItemBank, loadTopicHistory, flushSyncQueue]);

    // Helper to get available topics for a subject & grade level
    const getTopicsForCurrentSelection = (subject: 'Mathematics' | 'English'): string[] => {
        const gradeStr = selectedGrade.toString();
        const subjectNode = itemBank[subject] || FALLBACK_ITEM_BANK[subject];
        if (!subjectNode) return [];
        const gradeNode = subjectNode[gradeStr];
        if (!gradeNode) return [];
        return Object.keys(gradeNode);
    };

    const handleSelectSubject = (subject: string) => {
        const selected = subject as 'Mathematics' | 'English';
        setSelectedSubject(selected);
        setStep('topics');
    };

    // Collect and shuffle questions for a topic, return the slice ready for quiz
    const prepareQuestions = (topicName: string, subjectName?: string): QuestionItem[] | null => {
        const gradeStr = selectedGrade.toString();
        const subject = subjectName || selectedSubject;
        const topicNode = itemBank[subject]?.[gradeStr]?.[topicName] || FALLBACK_ITEM_BANK[subject]?.[gradeStr]?.[topicName];
        if (!topicNode) return null;

        const allQuestions: QuestionItem[] = [];
        Object.keys(topicNode).forEach((difficulty) => {
            if (difficulty === 'studyContent') return;
            const categories = topicNode[difficulty] as Record<string, QuestionItem[]>;
            Object.keys(categories).forEach((category) => {
                const qList = categories[category];
                if (Array.isArray(qList)) {
                    qList.forEach((q) => {
                        let detectedType = q.type;
                        if (!detectedType || detectedType === 'multiple-choice') {
                            if (q.matchingPairs && Object.keys(q.matchingPairs).length > 0) {
                                detectedType = 'drag-drop-matching';
                            } else if (q.questionText.includes('[[blank]]') || q.questionText.includes('____') || q.questionText.includes('______')) {
                                detectedType = 'fill-in-the-blank';
                            } else if (q.options && q.options.length === 2 && ((q.options[0] === 'True' && q.options[1] === 'False') || (q.options[0] === 'False' && q.options[1] === 'True'))) {
                                detectedType = 'true-false';
                            } else {
                                detectedType = 'multiple-choice';
                            }
                        }
                        allQuestions.push({
                            id: q.id,
                            questionText: q.questionText,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            feedback: q.feedback,
                            type: detectedType,
                            matchingPairs: q.matchingPairs,
                        });
                    });
                }
            });
        });

        if (allQuestions.length === 0) return null;
        return [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 5);
    };

    // Select a topic — show study content first, then quiz
    const handleSelectTopic = (topicName: string, subjectName?: string) => {
        const subject = subjectName || selectedSubject;
        if (subject === 'English' && isEnglishLocked) {
            toast.error(englishLockReason ?? 'Unlock English by scoring 80%+ in Mathematics first.');
            return;
        }

        // If a specific subject is passed, update selection state
        if (subjectName && subjectName !== selectedSubject) {
            setSelectedSubject(subjectName as 'Mathematics' | 'English');
        }

        const quizSlice = prepareQuestions(topicName, subject);
        if (!quizSlice) {
            toast.error('No questions staged in this topic yet. Check back soon!');
            return;
        }
        setSelectedTopic(topicName);
        setQuestions(quizSlice);
        setCurrentQuestionIndex(0);
        setScore(0);
        setAnsweredHistory([]);

        // Check for study content
        const gradeStr = selectedGrade.toString();
        const topicNode = (itemBank[subject]?.[gradeStr]?.[topicName] || FALLBACK_ITEM_BANK[subject]?.[gradeStr]?.[topicName]) as any;
        const hasStudyContent =
            topicNode?.studyContent &&
            (topicNode.studyContent.introduction || topicNode.studyContent.definitions?.length > 0);

        setStep(hasStudyContent ? 'study' : 'quiz');
    };

    // Called by StudyContentStep "Start Quiz" button
    const handleStartQuiz = () => setStep('quiz');

    // Handler when an answer is submitted and the student clicks next
    const handleQuestionNext = async (
        isCorrect: boolean,
        details?: { questionText: string; selectedOption: string; correctOption: string; explanationEn: string },
    ) => {
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);

        if (details) {
            setAnsweredHistory((prev) => [...prev, { ...details, isCorrect }]);
        }

        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Quiz completed! Save & Sync progress report
            const nextLessonsCompleted = lessonsCompleted + 1;
            const nextTotalScoreSum = totalScoreSum + newScore;
            const nextTotalQuestionsAnswered = totalQuestionsAnswered + questions.length;

            setLessonsCompleted(nextLessonsCompleted);
            setTotalScoreSum(nextTotalScoreSum);
            setTotalQuestionsAnswered(nextTotalQuestionsAnswered);

            localStorage.setItem(`guro_student_lessons_completed_${activeStudentId}`, String(nextLessonsCompleted));
            localStorage.setItem(`guro_student_score_sum_${activeStudentId}`, String(nextTotalScoreSum));
            localStorage.setItem(`guro_student_questions_answered_${activeStudentId}`, String(nextTotalQuestionsAnswered));

            // Calculate XP and Stars
            const isPerfect = newScore === questions.length;
            const earnedXP = newScore * 10 + (isPerfect ? 50 : 0);
            const earnedStars = newScore * 2 + (isPerfect ? 10 : 0);

            const nextXp = xpPoints + earnedXP;
            const nextStars = stars + earnedStars;
            setXpPoints(nextXp);
            setStars(nextStars);

            localStorage.setItem(`guro_student_xp_${activeStudentId}`, String(nextXp));
            localStorage.setItem(`guro_student_stars_${activeStudentId}`, String(nextStars));

            // Record last activity
            const activityData = {
                subject: selectedSubject,
                topic: selectedTopic,
                gradeLevel: selectedGrade,
                score: newScore,
                totalQuestions: questions.length
            };
            localStorage.setItem(`guro_last_activity_${activeStudentId}`, JSON.stringify(activityData));

            // Update per-topic history for activeStudentId
            const topicKey = `${selectedSubject}-${selectedGrade}-${selectedTopic}`;
            const pct = newScore / questions.length;
            setTopicHistory((prev) => {
                const existing = prev[topicKey];
                const updatedHistory = {
                    ...prev,
                    [topicKey]: {
                        bestScore: existing ? Math.max(existing.bestScore, pct) : pct,
                        lastScore: pct,
                        attempts: existing ? existing.attempts + 1 : 1,
                    },
                };
                localStorage.setItem(`guro_student_topic_history_${activeStudentId}`, JSON.stringify(updatedHistory));
                return updatedHistory;
            });

            const studentId = activeStudentId;
            const newEvent = {
                eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                subject: selectedSubject,
                gradeLevel: selectedGrade,
                topic: selectedTopic,
                score: newScore,
                totalQuestions: questions.length,
                timestamp: new Date().toISOString()
            };

            // Retrieve current queue, append new item, and save back to LocalStorage
            const currentQueueJson = localStorage.getItem('guro_sync_queue');
            let currentQueue = [];
            try {
                currentQueue = currentQueueJson ? JSON.parse(currentQueueJson) : [];
            } catch (e) {
                currentQueue = [];
            }
            currentQueue.push({ studentId, classroomId: classroomCode || '', event: newEvent });
            localStorage.setItem('guro_sync_queue', JSON.stringify(currentQueue));

            // Attempt immediate telemetry upload
            flushSyncQueue();

            // Badge unlock toasts
            if (lessonsCompleted === 0) toast('👣 Badge unlocked: First Step!', { icon: '🏅' });
            if (isPerfect) toast('💯 Perfect score! Badge unlocked: Perfect 100%!', { icon: '🌟' });
            if (newScore > 0 && lessonsCompleted > 0 && lessonsCompleted % 2 === 0) {
                toast(`🔥 ${lessonsCompleted + 1} lessons completed! Keep it up!`, { icon: '🔥' });
            }

            setStep('results');
        }
    };

    // Calculate dynamic stats
    const averageScorePercent = totalQuestionsAnswered > 0
        ? Math.round((totalScoreSum / totalQuestionsAnswered) * 100)
        : 0;

    // Derive real subject progress % from topicHistory
    const computeSubjectAvg = (subject: string, grade: number): number => {
        const topics = getTopicsForCurrentSelection(subject as 'Mathematics' | 'English');
        if (topics.length === 0) return 0;
        let sumPct = 0;
        topics.forEach((topic) => {
            const key = `${subject}-${grade}-${topic}`;
            if (topicHistory[key]) {
                sumPct += topicHistory[key].bestScore;
            }
        });
        return Math.round((sumPct / topics.length) * 100);
    };

    // Collect all progress events (from queue & topicHistory) for ProgressView
    const getFullStudentProgressEvents = (): any[] => {
        const events: any[] = [];
        try {
            const q = localStorage.getItem('guro_sync_queue');
            if (q) {
                const parsed = JSON.parse(q);
                if (Array.isArray(parsed)) {
                    parsed.forEach((item: any) => {
                        if (item.event && (!item.studentId || item.studentId === activeStudentId)) {
                            events.push(item.event);
                        }
                    });
                }
            }
        } catch (e) {}

        Object.keys(topicHistory).forEach((key) => {
            const parts = key.split('-');
            if (parts.length >= 3) {
                const subject = parts[0];
                const gradeLevel = parseInt(parts[1], 10) || 4;
                const topic = parts.slice(2).join('-');
                const stat = topicHistory[key];
                if (!events.some((e) => e.topic === topic && e.subject === subject && e.gradeLevel === gradeLevel)) {
                    events.push({
                        eventId: `hist-${key}`,
                        subject,
                        gradeLevel,
                        topic,
                        score: Math.round(stat.lastScore * 5),
                        totalQuestions: 5,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        });

        return events;
    };

    const liveMathProgress = computeSubjectAvg('Mathematics', selectedGrade);
    const liveEnglishProgress = computeSubjectAvg('English', selectedGrade);

    // Math-before-English lock: do NOT lock if enrolled in a teacher classroom or Math has not been attempted
    const isEnrolledInClassroom = Boolean(classroomCode && classroomCode.trim().length > 0);
    const mathAttempted = Object.keys(topicHistory).some(k => k.startsWith(`Mathematics-${selectedGrade}-`));
    const isEnglishLocked = isEnrolledInClassroom ? false : (mathAttempted && liveMathProgress < 80);
    const englishLockReason = isEnglishLocked
        ? `Score at least 80% in Grade ${selectedGrade} Mathematics to unlock English. Your current Math score: ${liveMathProgress}%.`
        : undefined;

    const mathTopicsList = getTopicsForCurrentSelection('Mathematics');
    const englishTopicsList = getTopicsForCurrentSelection('English');

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnlineChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleOnlineChange);
        window.addEventListener('offline', handleOnlineChange);
        return () => {
            window.removeEventListener('online', handleOnlineChange);
            window.removeEventListener('offline', handleOnlineChange);
        };
    }, []);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        localStorage.removeItem('guro_user_session');
        localStorage.removeItem('guro_auth_token');
        localStorage.removeItem(STORAGE_KEY_NAME);
        localStorage.removeItem(STORAGE_KEY_GRADE);
        localStorage.removeItem('guro_student_step');
        localStorage.removeItem('guro_student_subject');
        localStorage.removeItem('guro_student_topic');
        localStorage.removeItem('guro_student_classroom_id');
        localStorage.removeItem('guro_student_teacher_name');
        localStorage.removeItem('guro_student_stars');
        localStorage.removeItem('guro_student_avatar');
        localStorage.removeItem('guro_student_outfit');
        localStorage.removeItem('guro_student_owned_outfits');
        localStorage.removeItem('guro_student_xp');
        localStorage.removeItem('guro_student_last_active_day');
        localStorage.removeItem('guro_student_minutes_used');
        localStorage.removeItem('guro_parent_time_limit');
        localStorage.removeItem('guro_active_tab');
        localStorage.removeItem('guro_active_sub_tab');
        onLogout();
        toast.success('Logged out successfully.');
    };



    const handleShellViewChange = (view: ShellView) => {
        if (view === 'dashboard') setStep('dashboard');
        else if (view === 'lessons') setStep('topics');
        else if (view === 'progress') setStep('progress');
        else if (view === 'classroom') setStep('classroom');
    };

    const OUTFIT_EMOJIS: Record<string, string> = {
        default: '',
        graduation_cap: '🎓',
        detective_hat: '🕵️‍♂️',
        space_visor: '🧑‍🚀',
        wizard_cape: '🧙‍♂️',
        crown: '👑',
        superhero_cape: '🦸',
        party_hat: '🥳',
        artist_beret: '🎨',
        scientist_goggles: '🔬',
    };
    const outfitEmoji = OUTFIT_EMOJIS[activeOutfit] || '';

    return (
        <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>


            {step === 'name' && (
                <NameInputStep
                    onBack={onExit}
                    onStartLearning={(name) => {
                        setUserName(name);
                        localStorage.setItem(STORAGE_KEY_NAME, name);
                        setStep('dashboard');
                    }}
                />
            )}

            {/* ── Shell — wraps dashboard, topics, and progress views ── */}
            {(step === 'dashboard' || step === 'topics' || step === 'progress' || step === 'classroom') && (
                <StudentShell
                    userName={userName}
                    email={currentUser?.email}
                    selectedGrade={selectedGrade}
                    schoolYear={activeSchoolYear}
                    term={activeTerm}
                    onGradeChange={(grade) => {
                        if (classroomCode) {
                            const classGradeMatch = classroomCode.match(/-G([4-6])-/i);
                            const classGrade = classGradeMatch ? parseInt(classGradeMatch[1], 10) : null;
                            if (classGrade && classGrade !== grade) {
                                setPendingGradeSwitch({ targetGrade: grade, classGrade, classroomCode });
                                return;
                            }
                        }
                        setSelectedGrade(grade);
                        localStorage.setItem(STORAGE_KEY_GRADE, String(grade));
                        setStep('dashboard');
                    }}
                    onLogout={handleLogout}
                    isOnline={isOnline}
                    currentView={step === 'dashboard' ? 'dashboard' : step === 'topics' ? 'lessons' : step === 'progress' ? 'progress' : 'classroom'}
                    onViewChange={handleShellViewChange}
                    parentAccessCode={getParentAccessCode(activeStudentId)}
                    isDarkMode={isDarkMode}
                    onToggleTheme={onToggleTheme}
                    onOpenSettings={onOpenSettings}
                >
                    {step === 'dashboard' && (
                        <DashboardStep
                            activeSubjects={activeSubjects}
                            userName={userName}
                            email={currentUser?.email}
                            selectedGrade={selectedGrade}
                            onBack={() => currentUser ? handleLogout() : setStep('name')}
                            onSelectSubject={handleSelectSubject}
                            mathTopics={mathTopicsList}
                            englishTopics={englishTopicsList}
                            mathProgress={liveMathProgress || (selectedGrade === 4 ? 65 : selectedGrade === 5 ? 40 : 15)}
                            englishProgress={liveEnglishProgress || (selectedGrade === 4 ? 75 : selectedGrade === 5 ? 55 : 30)}
                            stats={{
                                lessonsCompleted: lessonsCompleted,
                                averageScore: averageScorePercent || 0,
                                streak: lessonsCompleted > 0 ? 1 : 0
                            }}
                            parentAccessCode={getParentAccessCode(activeStudentId)}
                            isEnglishLocked={isEnglishLocked}
                            englishLockReason={englishLockReason}
                            inShell
                            
                            // Gamification
                            stars={stars}
                            avatarEmoji={avatarEmoji}
                            activeOutfit={activeOutfit}
                            ownedOutfits={ownedOutfits}
                            xpPoints={xpPoints}
                            onPurchaseOutfit={handlePurchaseOutfit}
                            onEquipOutfit={handleEquipOutfit}
                            onSelectAvatarEmoji={handleSelectAvatarEmoji}

                            // Recommendation
                            recommendedLesson={getRecommendedLesson()}
                            lastActivity={getLastActivity()}
                            onResumeQuiz={(subject, topic) => handleSelectTopic(topic, subject)}

                            // Time Limits
                            dailyMinutesUsed={dailyMinutesUsed}
                            dailyTimeLimit={dailyTimeLimit}
                            isTimeLimitExceeded={isTimeLimitExceeded}

                            // Classroom Connection & Academic Term
                            classroomCode={classroomCode}
                            teacherName={teacherName}
                            sectionName={activeSectionName}
                            schoolYear={activeSchoolYear}
                            term={activeTerm}
                            onJoinClassroom={handleJoinClassroom}
                            onLeaveClassroom={handleLeaveClassroom}
                        />
                    )}

                    {step === 'topics' && (
                        <TopicSelectionStep
                            selectedSubject={selectedSubject}
                            selectedGrade={selectedGrade}
                            isEnglishLocked={isEnglishLocked}
                            englishLockReason={englishLockReason}
                            itemBankLoading={itemBankLoading}
                            topics={getTopicsForCurrentSelection(selectedSubject)}
                            classroomCode={classroomCode}
                            topicHistory={topicHistory}
                            onSelectTopic={handleSelectTopic}
                            onConnectClassroom={() => setStep('classroom')}
                        />
                    )}

                    {step === 'progress' && (
                        <ProgressView
                            studentProgress={getFullStudentProgressEvents()}
                            streakCount={lessonsCompleted > 0 ? 1 : 0}
                            xpPoints={xpPoints}
                        />
                    )}

                    {step === 'classroom' && (
                        <ClassroomStep
                            classroomCode={classroomCode}
                            teacherName={teacherName}
                            sectionName={activeSectionName}
                            schoolYear={activeSchoolYear}
                            term={activeTerm}
                            onJoinClassroom={handleJoinClassroom}
                            onLeaveClassroom={handleLeaveClassroom}
                        />
                    )}
                </StudentShell>
            )}

            {step === 'study' && (
                <StudyContentStep
                    subject={selectedSubject}
                    gradeLevel={selectedGrade}
                    topic={selectedTopic}
                    studyContent={
                        (itemBank[selectedSubject]?.[selectedGrade.toString()]?.[selectedTopic] as any)?.studyContent ?? null
                    }
                    onStartQuiz={handleStartQuiz}
                    onBack={() => setStep('topics')}
                    avatarEmoji={avatarEmoji}
                    outfitEmoji={outfitEmoji}
                />
            )}

            {step === 'quiz' && questions.length > 0 && (
                <QuestionStep
                    currentQuestionIndex={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                    score={score}
                    questionText={questions[currentQuestionIndex].questionText}
                    options={questions[currentQuestionIndex].options}
                    correctOption={questions[currentQuestionIndex].correctAnswer}
                    explanationEn={questions[currentQuestionIndex].feedback.en}
                    type={questions[currentQuestionIndex].type}
                    matchingPairs={questions[currentQuestionIndex].matchingPairs}
                    onBack={() => setStep('study')}
                    onNextOrFinish={handleQuestionNext}
                    answeredHistory={answeredHistory}
                    avatarEmoji={avatarEmoji}
                    outfitEmoji={outfitEmoji}
                    imageUrl={questions[currentQuestionIndex].imageUrl}
                    subject={selectedSubject}
                />
            )}

            {step === 'results' && (
                <QuizResultsStep
                    correctAnswersCount={score}
                    totalQuestionsCount={questions.length}
                    topicName={selectedTopic}
                    subject={selectedSubject}
                    earnedXP={score * 10 + (score === questions.length ? 50 : 0)}
                    answeredQuestions={answeredHistory}
                    onBackToSubjects={() => setStep('dashboard')}
                    onTryAgain={() => {
                        const quizSlice = prepareQuestions(selectedTopic);
                        if (quizSlice) setQuestions(quizSlice);
                        setCurrentQuestionIndex(0);
                        setScore(0);
                        setAnsweredHistory([]);
                        setStep('quiz');
                    }}
                    onSelectPrerequisite={(prereqTopic, prereqGrade) => {
                        setSelectedGrade(prereqGrade);
                        setSelectedTopic(prereqTopic);
                        setStep('study');
                    }}
                    onStudyReview={() => {
                        setStep('study');
                    }}
                />
            )}
            <LogoutConfirmModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
            />
            <ConfirmModal
                isOpen={!!pendingGradeSwitch}
                title="Switch Grade Level?"
                description={
                    pendingGradeSwitch
                        ? `You are currently enrolled in a Grade ${pendingGradeSwitch.classGrade} classroom (${pendingGradeSwitch.classroomCode}). Switching to Grade ${pendingGradeSwitch.targetGrade} will disconnect you from this classroom.`
                        : ''
                }
                confirmText="Leave & Switch Grade"
                cancelText="Keep Current Grade"
                variant="warning"
                onClose={() => setPendingGradeSwitch(null)}
                onConfirm={() => {
                    if (pendingGradeSwitch) {
                        handleLeaveClassroom();
                        setSelectedGrade(pendingGradeSwitch.targetGrade);
                        localStorage.setItem(STORAGE_KEY_GRADE, String(pendingGradeSwitch.targetGrade));
                        setStep('dashboard');
                        setPendingGradeSwitch(null);
                    }
                }}
            />
        </div>
    );
};
