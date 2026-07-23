import React, { useState, useEffect, useCallback } from 'react';
import { NameInputStep } from '../components/student/NameInputStep';
import { DashboardStep } from '../components/student/DashboardStep';
import { QuestionStep } from '../components/student/QuestionStep';
import { QuizResultsStep } from '../components/student/QuizResultsStep';
import { StudyContentStep } from '../components/student/StudyContentStep';
import { StudentShell, type ShellView } from '../components/student/StudentShell';
import { ProgressView } from '../components/student/ProgressView';
import { BookOpen, Calculator, Inbox, CheckCircle2, Circle, TrendingUp, GraduationCap } from 'lucide-react';
import { getParentAccessCode } from '../utils/security';
import { LogoutConfirmModal } from '../components/shared/LogoutConfirmModal';
import { ClassroomStep } from '../components/student/ClassroomStep';
import { toast } from '../utils/toast';
import { apiFetch } from '../utils/api';

interface QuestionItem {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    feedback: {
        en: string;
        fil: string;
    };
    type?: 'multiple-choice' | 'fill-in-the-blank' | 'drag-drop-matching' | 'true-false' | 'swipe-card' | 'fraction-builder';
    matchingPairs?: Record<string, string>;
}

interface ItemBank {
    [subject: string]: {
        [grade: string]: {
            [topic: string]: {
                studyContent?: any;
                [difficulty: string]: {
                    [category: string]: QuestionItem[];
                } | any;
            };
        };
    };
}

const FALLBACK_ITEM_BANK: ItemBank = {
    "Mathematics": {
        "4": {
            "Fractions": {
                "studyContent": {
                    "introduction": "Welcome to Grade 4 Math! Fractions represent equal parts of a whole or set.",
                    "definitions": [
                        {
                            "term": "Numerator & Denominator",
                            "definition": "The top number (numerator) tells how many parts you have; the bottom number (denominator) tells total equal parts.",
                            "examples": ["In 3/4, 3 is the numerator and 4 is the denominator."]
                        },
                        {
                            "term": "Like Fractions",
                            "definition": "Fractions that have the exact same denominator.",
                            "examples": ["1/4 and 2/4 have the same denominator (4)."]
                        }
                    ],
                    "refresherQuiz": [
                        {
                            "questionText": "Quick Check: In the fraction 3/5, what is the numerator?",
                            "options": ["3", "5", "8", "2"],
                            "correctAnswer": "3",
                            "explanation": "Correct! The numerator is the top number in a fraction."
                        },
                        {
                            "questionText": "Quick Check: What is 1/4 + 2/4?",
                            "options": ["3/8", "3/4", "2/4", "1/2"],
                            "correctAnswer": "3/4",
                            "explanation": "Correct! When denominators match, simply add the top numbers: 1 + 2 = 3/4."
                        }
                    ],
                    "summary": [
                        "Numerators count parts; denominators count total equal pieces.",
                        "To add like fractions, add the top numbers and keep the denominator."
                    ]
                },
                "Easy": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G4-FRAC-001",
                            "questionText": "What is the sum of 1/4 and 2/4?",
                            "options": ["1/4", "2/4", "3/4", "4/4"],
                            "correctAnswer": "3/4",
                            "feedback": {
                                "en": "Since the denominators are the same, simply add the numerators: 1 + 2 = 3. Keep the denominator: 3/4.",
                                "fil": "Since the denominators are the same, simply add the numerators: 1 + 2 = 3. Keep the denominator: 3/4."
                            }
                        }
                    ]
                }
            }
        },
        "5": {
            "Decimals": {
                "studyContent": {
                    "introduction": "Welcome to Grade 5 Math! Decimals express numbers that include whole numbers and fractional tenths or hundredths.",
                    "definitions": [
                        {
                            "term": "Decimal Place Values",
                            "definition": "Positions to the right of the decimal point: tenths (0.1) and hundredths (0.01).",
                            "examples": ["In 0.25, 2 is in the tenths place and 5 is in the hundredths place."]
                        },
                        {
                            "term": "Decimal Multiplication",
                            "definition": "Multiply numbers as whole numbers first, then count total decimal places in factors to place the point in the product.",
                            "examples": ["0.5 × 0.2 = 0.10 (2 decimal places total)."]
                        }
                    ],
                    "refresherQuiz": [
                        {
                            "questionText": "Quick Check: In 0.75, which digit is in the tenths place?",
                            "options": ["7", "5", "0", "75"],
                            "correctAnswer": "7",
                            "explanation": "Correct! The first digit to the right of the decimal point is the tenths place."
                        },
                        {
                            "questionText": "Quick Check: Multiply 0.3 by 0.3. What is the result?",
                            "options": ["0.9", "0.09", "9.0", "0.009"],
                            "correctAnswer": "0.09",
                            "explanation": "Correct! 3 × 3 = 9. Counting 2 decimal places gives 0.09."
                        }
                    ],
                    "summary": [
                        "Decimals extend place values into parts of ten and hundred.",
                        "Always align decimal places when performing arithmetic."
                    ]
                },
                "Average": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G5-DEC-002",
                            "questionText": "Multiply 0.5 by 0.2. What is the product?",
                            "options": ["0.1", "0.01", "1.0", "0.001"],
                            "correctAnswer": "0.1",
                            "feedback": {
                                "en": "Multiplying 5 by 2 gives 10. Since there are two decimal places in total in the factors, place the decimal point two spaces left: 0.10 or 0.1.",
                                "fil": "Multiplying 5 by 2 gives 10. Since there are two decimal places in total in the factors, place the decimal point two spaces left: 0.10 or 0.1."
                            }
                        }
                    ]
                }
            }
        },
        "6": {
            "Algebraic Equations": {
                "studyContent": {
                    "introduction": "Welcome to Grade 6 Math! Algebraic equations express mathematical statements where two expressions are equal.",
                    "definitions": [
                        {
                            "term": "Variable & Equation",
                            "definition": "A variable is a letter representing an unknown number (e.g. x). An equation states that two expressions are equal.",
                            "examples": ["In 3x - 5 = 16, x is the variable."]
                        },
                        {
                            "term": "Inverse Operations",
                            "definition": "Operations that undo each other, used to isolate the variable on one side.",
                            "examples": ["Addition undoes subtraction; division undoes multiplication."]
                        }
                    ],
                    "refresherQuiz": [
                        {
                            "questionText": "Quick Check: To solve x + 8 = 15, what operation should you perform to isolate x?",
                            "options": ["Subtract 8 from both sides", "Add 8 to both sides", "Multiply by 8", "Divide by 15"],
                            "correctAnswer": "Subtract 8 from both sides",
                            "explanation": "Correct! Subtraction is the inverse operation of addition."
                        },
                        {
                            "questionText": "Quick Check: Solve for x in 2x = 10.",
                            "options": ["x = 5", "x = 8", "x = 12", "x = 20"],
                            "correctAnswer": "x = 5",
                            "explanation": "Correct! Divide both sides by 2: 10 / 2 = 5."
                        }
                    ],
                    "summary": [
                        "Variables represent unknown quantities.",
                        "Use inverse operations on both sides of the equation to isolate the variable."
                    ]
                },
                "Difficult": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G6-ALG-003",
                            "questionText": "Solve for x: 3x - 5 = 16.",
                            "options": ["x = 3", "x = 7", "x = 9", "x = 21"],
                            "correctAnswer": "x = 7",
                            "feedback": {
                                "en": "Add 5 to both sides to get 3x = 21, then divide by 3 to find x = 7.",
                                "fil": "Add 5 to both sides to get 3x = 21, then divide by 3 to find x = 7."
                            }
                        }
                    ]
                }
            }
        }
    },
    "English": {
        "4": {
            "Figurative Language": {
                "studyContent": {
                    "introduction": "Welcome to Grade 4 English! Figurative language uses words in imaginative ways to create vivid pictures.",
                    "definitions": [
                        {
                            "term": "Simile",
                            "definition": "Compares two different things using words such as 'like' or 'as'.",
                            "examples": ["Her cheeks are like red roses.", "Brave as a lion."]
                        },
                        {
                            "term": "Metaphor",
                            "definition": "Compares two different things directly without using 'like' or 'as'.",
                            "examples": ["Time is gold.", "He is a shining star."]
                        }
                    ],
                    "refresherQuiz": [
                        {
                            "questionText": "Quick Check: Which sentence uses a Simile?",
                            "options": ["He is a lion in battle.", "She is as fast as a cheetah.", "The wind sang a song.", "Books are keys to wisdom."],
                            "correctAnswer": "She is as fast as a cheetah.",
                            "explanation": "Correct! It uses 'as...as' to make a direct comparison."
                        },
                        {
                            "questionText": "Quick Check: 'Time is money' is an example of which figure of speech?",
                            "options": ["Simile", "Metaphor", "Onomatopoeia", "Hyperbole"],
                            "correctAnswer": "Metaphor",
                            "explanation": "Correct! It compares time directly to money without using 'like' or 'as'."
                        }
                    ],
                    "summary": [
                        "Similes use 'like' or 'as' for comparison.",
                        "Metaphors compare directly without 'like' or 'as'."
                    ]
                },
                "Easy": {
                    "Figures of Speech": [
                        {
                            "id": "ENG-G4-FIG-001",
                            "questionText": "Which of the following sentences is a simile?",
                            "options": [
                                "He is a shining star.",
                                "Her cheeks are like red roses.",
                                "The wind whispered in the night.",
                                "Time is gold."
                            ],
                            "correctAnswer": "Her cheeks are like red roses.",
                            "feedback": {
                                "en": "A simile compares two things using \"like\" or \"as\". Here, cheeks are compared to roses using \"like\".",
                                "fil": "A simile compares two things using \"like\" or \"as\". Here, cheeks are compared to roses using \"like\"."
                            }
                        }
                    ]
                }
            }
        },
        "5": {
            "Adjectives": {
                "studyContent": {
                    "introduction": "Hello learner! Today, we will explore Adjectives. Adjectives are words that describe nouns or pronouns. They tell us more about people, places, animals, or things!",
                    "definitions": [
                        {
                            "term": "Adjective",
                            "definition": "A word that describes or modifies a noun or pronoun (e.g. size, color, shape).",
                            "examples": ["The big blue balloon", "She is a happy student."]
                        },
                        {
                            "term": "Comparative Adjective",
                            "definition": "Used to compare two things, usually ending in '-er' or using 'more'.",
                            "examples": ["This cat is faster than that one.", "Math is more exciting than reading."]
                        }
                    ],
                    "refresherQuiz": [
                        {
                            "questionText": "Quick Check: Which of the following words is an adjective describing size?",
                            "options": ["Run", "Gigantic", "Quickly", "Cat"],
                            "correctAnswer": "Gigantic",
                            "explanation": "Correct! 'Gigantic' is an adjective describing the size of a noun."
                        },
                        {
                            "questionText": "Quick Check: What suffix is added to compare two items (Comparative)?",
                            "options": ["-est", "-ing", "-er", "-ly"],
                            "correctAnswer": "-er",
                            "explanation": "Correct! Comparative adjectives usually end in '-er' (e.g., taller, faster)."
                        }
                    ],
                    "summary": [
                        "Adjectives describe nouns (people, places, things).",
                        "Use comparative adjectives to compare 2 things (usually ending in -er)."
                    ]
                },
                "Average": {
                    "Multiple-Choice": [
                        {
                            "id": "ENG-G5-ADJ-001",
                            "questionText": "Which word in the sentence \"The big dog barked loudly\" is an adjective?",
                            "options": ["The", "big", "dog", "loudly"],
                            "correctAnswer": "big",
                            "feedback": {
                                "en": "An adjective describes a noun or pronoun. In this sentence, \"big\" describes the noun \"dog\".",
                                "fil": "An adjective describes a noun or pronoun. In this sentence, \"big\" describes the noun \"dog\"."
                            }
                        }
                    ]
                }
            },
            "Short Story Comprehension": {
                "Average": {
                    "Paragraph Comprehension": [
                        {
                            "id": "ENG-G5-RC-002",
                            "questionText": "Read the text: \"Maria worked diligently on her science project every night, verifying every source. When the results were announced, she won first place.\" What is the main idea of this paragraph?",
                            "options": [
                                "Maria loves science projects.",
                                "Hard work leads to success.",
                                "The competition was very easy.",
                                "Maria did not sleep well."
                            ],
                            "correctAnswer": "Hard work leads to success.",
                            "feedback": {
                                "en": "The paragraph shows how Maria worked hard (\"diligently every night\") and was rewarded with success (\"won first place\").",
                                "fil": "The paragraph shows how Maria worked hard (\"diligently every night\") and was rewarded with success (\"won first place\")."
                            }
                        }
                    ]
                }
            }
        },
        "6": {
            "Idiomatic Expressions": {
                "Difficult": {
                    "Multiple-Choice": [
                        {
                            "id": "ENG-G6-IDIOM-003",
                            "questionText": "What does the idiom \"burn the midnight oil\" mean?",
                            "options": [
                                "To light a candle during a power outage.",
                                "To work or study late into the night.",
                                "To waste oil or fuel resources.",
                                "To start a fire accidentally."
                            ],
                            "correctAnswer": "To work or study late into the night.",
                            "feedback": {
                                "en": "The idiom refers to staying awake late into the night working or studying, historically by the light of an oil lamp.",
                                "fil": "The idiom refers to staying awake late into the night working or studying, historically by the light of an oil lamp."
                            }
                        }
                    ]
                }
            }
        }
    }
};

interface StudentSpaceProps {
    onExit: () => void;
    onLogout: () => void;
    currentUser?: { name: string; email: string; userId: string; classroomId?: string | null } | null;
    isDarkMode: boolean;
    onToggleTheme: () => void;
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

export const StudentSpace: React.FC<StudentSpaceProps> = ({ onExit, onLogout, currentUser, isDarkMode, onToggleTheme }) => {
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
    const activeStudentId = (storedEmailOrId || userName || 'STUDENT-WEB-USER').trim().replace(/\s+/g, '-').toUpperCase();

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
        if (activeSubjects.length > 0 && !activeSubjects.includes(selectedSubject)) {
            setSelectedSubject(activeSubjects[0] as any);
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
        const mathAvg = computeSubjectAvg('Mathematics', selectedGrade);
        const engAvg = computeSubjectAvg('English', selectedGrade);
        const subjectOrder = mathAvg <= engAvg ? ['Mathematics', 'English'] : ['English', 'Mathematics'];
        
        for (const subject of subjectOrder) {
            if (subject === 'English' && isEnglishLocked) continue;
            const topics = getTopicsForCurrentSelection(subject as 'Mathematics' | 'English');
            
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
            if (raw) return JSON.parse(raw);
        } catch {}
        return null;
    };

    const loadTopicHistory = useCallback(async () => {
        const allEvents: any[] = [];
        const currentStudentId = (userName || 'STUDENT-WEB-USER').trim().replace(/\s+/g, '-').toUpperCase();

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
    }, [userName]);

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
            } else {
                setActiveSubjects(['Mathematics', 'English']);
            }
        } catch (error) {
            console.warn('Could not load online item bank, falling back to local static bank:', error);
            setActiveSubjects(['Mathematics', 'English']);
        } finally {
            setItemBankLoading(false);
        }
    }, [classroomCode]);

    const handleJoinClassroom = async (code: string): Promise<boolean> => {
        try {
            const res = await apiFetch(`/api/classroom/verify?code=${encodeURIComponent(code.trim().toUpperCase())}`);
            if (res.ok) {
                const data = await res.json();
                setClassroomCode(data.classroomId);
                setTeacherName(data.teacherName || '');
                localStorage.setItem('guro_student_classroom_id', data.classroomId);
                localStorage.setItem(`guro_student_classroom_id_${activeStudentId}`, data.classroomId);
                localStorage.setItem('guro_student_teacher_name', data.teacherName || '');
                localStorage.setItem(`guro_student_teacher_name_${activeStudentId}`, data.teacherName || '');
                toast.success(`Successfully joined ${data.teacherName ? `${data.teacherName}'s ` : ''}classroom!`);
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
        localStorage.removeItem('guro_student_classroom_id');
        localStorage.removeItem(`guro_student_classroom_id_${activeStudentId}`);
        localStorage.removeItem('guro_student_teacher_name');
        localStorage.removeItem(`guro_student_teacher_name_${activeStudentId}`);
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
        const subjectNode = itemBank[subject];
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
        const topicNode = itemBank[subject]?.[gradeStr]?.[topicName];
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
        const topicNode = itemBank[subject]?.[gradeStr]?.[topicName] as any;
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

            const studentId = userName.replace(/\s+/g, '-').toUpperCase() || 'STUDENT-WEB-USER';
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
                    onGradeChange={(grade) => { setSelectedGrade(grade); localStorage.setItem(STORAGE_KEY_GRADE, String(grade)); setStep('dashboard'); }}
                    onLogout={handleLogout}
                    isOnline={isOnline}
                    currentView={step === 'dashboard' ? 'dashboard' : step === 'topics' ? 'lessons' : step === 'progress' ? 'progress' : 'classroom'}
                    onViewChange={handleShellViewChange}
                    parentAccessCode={getParentAccessCode(userName.replace(/\s+/g, '-').toUpperCase() || 'STUDENT-WEB-USER')}
                    isDarkMode={isDarkMode}
                    onToggleTheme={onToggleTheme}
                >
                    {step === 'dashboard' && (
                        <DashboardStep
                            activeSubjects={activeSubjects}
                            userName={userName}
                            email={currentUser?.email}
                            selectedGrade={selectedGrade}
                            onBack={() => currentUser ? handleLogout() : setStep('name')}
                            onSelectSubject={handleSelectSubject}
                            mathTopics={mathTopicsList.length > 0 ? mathTopicsList : ['Fractions']}
                            englishTopics={englishTopicsList.length > 0 ? englishTopicsList : ['Short Stories']}
                            mathProgress={liveMathProgress || (selectedGrade === 4 ? 65 : selectedGrade === 5 ? 40 : 15)}
                            englishProgress={liveEnglishProgress || (selectedGrade === 4 ? 75 : selectedGrade === 5 ? 55 : 30)}
                            stats={{
                                lessonsCompleted: lessonsCompleted,
                                averageScore: averageScorePercent || 0,
                                streak: lessonsCompleted > 0 ? 1 : 0
                            }}
                            parentAccessCode={getParentAccessCode(userName.replace(/\s+/g, '-').toUpperCase() || 'STUDENT-WEB-USER')}
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

                            // Classroom Connection
                            classroomCode={classroomCode}
                            teacherName={teacherName}
                            onJoinClassroom={handleJoinClassroom}
                            onLeaveClassroom={handleLeaveClassroom}
                        />
                    )}

                    {step === 'topics' && (
                        <div className="min-h-[calc(100vh-56px)] w-full flex flex-col items-center p-6 md:p-10 relative overflow-hidden select-none fade-in" style={{ background: 'var(--bg-main)' }}>
                            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 rounded-full blur-[160px]" style={{ background: 'rgba(17,66,142,0.12)' }} />
                            <div className="absolute -top-48 right-1/4 size-80 rounded-full blur-[140px]" style={{ background: 'rgba(160,19,34,0.08)' }} />

                            <div className="flex w-full max-w-4xl flex-col items-center gap-8 relative z-10 pt-4">
                                {/* Header */}
                                <div className="flex flex-col items-center text-center w-full">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-main)] flex items-center justify-center gap-2.5 tracking-tight">
                                        {selectedSubject === 'Mathematics' ? (
                                            <><Calculator className="size-7 text-[#11428E] shrink-0" /><span>Math</span></>
                                        ) : (
                                            <><BookOpen className="size-7 text-purple-400 shrink-0" /><span>English</span></>
                                        )}
                                        <span>Practice Topics</span>
                                    </h1>
                                    <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5">
                                        Select a topic to start your diagnostic quest · Grade {selectedGrade}
                                    </p>

                                    {/* English lock banner in topics view */}
                                    {selectedSubject === 'English' && isEnglishLocked && (
                                        <div className="flex items-start gap-2.5 w-full max-w-lg px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mt-2">
                                            <span className="text-amber-500 text-lg shrink-0">🔒</span>
                                            <p className="text-xs font-semibold text-[var(--text-muted)] text-left">{englishLockReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Topics grid */}
                                <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-5">
                                    {itemBankLoading ? (
                                        // Skeleton shimmer cards
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="glass-panel rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-xl bg-[var(--border-color)] shrink-0" />
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <div className="h-4 bg-[var(--border-color)] rounded-full w-3/4" />
                                                        <div className="h-3 bg-[var(--border-color)] rounded-full w-1/2" />
                                                    </div>
                                                </div>
                                                <div className="h-1.5 bg-[var(--border-color)] rounded-full w-full" />
                                            </div>
                                        ))
                                    ) : getTopicsForCurrentSelection(selectedSubject).length === 0 ? (
                                        !classroomCode ? (
                                            <div className="col-span-full glass-panel rounded-3xl p-12 text-center border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-4">
                                                <GraduationCap className="size-12 text-zinc-400 shrink-0" />
                                                <h3 className="text-base font-bold text-[var(--text-main)]">Not Connected to a Classroom</h3>
                                                <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto leading-relaxed">
                                                    Join a classroom using your teacher's code to get custom practice topics and interactive lessons!
                                                </p>
                                                <button
                                                    onClick={() => setStep('classroom')}
                                                    className="px-6 py-2.5 bg-[#11428E] hover:bg-[#0c316b] text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer hover:scale-102 flex items-center gap-1.5"
                                                >
                                                    <GraduationCap className="size-4" />
                                                    <span>Connect to Class</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="col-span-full glass-panel rounded-3xl p-12 text-center border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-3">
                                                <Inbox className="size-10 text-[var(--text-dark)] shrink-0" />
                                                <h3 className="text-base font-bold text-[var(--text-main)]">No topics available yet</h3>
                                                <p className="text-[var(--text-muted)] text-sm">Staged lessons will appear here once loaded by the teacher workspace.</p>
                                            </div>
                                        )
                                    ) : (
                                        getTopicsForCurrentSelection(selectedSubject).map((topicName) => {
                                            const topicKey = `${selectedSubject}-${selectedGrade}-${topicName}`;
                                            const stat = topicHistory[topicKey];
                                            const bestPct = stat ? Math.round(stat.bestScore * 100) : null;
                                            const isMastered = bestPct !== null && bestPct >= 80;
                                            const isStarted = bestPct !== null && !isMastered;
                                            const statusLabel = isMastered ? 'Mastered' : isStarted ? 'In Progress' : 'Not Started';
                                            const statusColor = isMastered ? 'text-emerald-500' : isStarted ? 'text-blue-400' : 'text-[var(--text-dark)]';
                                            const isMath = selectedSubject === 'Mathematics';
                                            return (
                                                <button
                                                    key={topicName}
                                                    onClick={() => handleSelectTopic(topicName)}
                                                    className="group glass-panel rounded-2xl p-5 text-left hover:-translate-y-0.5 hover:border-[var(--accent-primary)] transition-all duration-300 flex flex-col gap-3 cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3.5 rounded-xl text-white shrink-0 ${isMath ? 'bg-[#11428E]' : 'bg-purple-600'}`}>
                                                            {isMath ? <Calculator className="size-5" /> : <BookOpen className="size-5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-base font-extrabold text-[var(--text-main)] tracking-tight group-hover:text-[#11428E] transition-colors truncate">
                                                                {topicName}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {isMastered
                                                                    ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                                                    : isStarted
                                                                    ? <TrendingUp className="size-3.5 text-blue-400 shrink-0" />
                                                                    : <Circle className="size-3.5 text-[var(--text-dark)] shrink-0" />
                                                                }
                                                                <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                                                                {stat && stat.attempts > 0 && (
                                                                    <span className="text-[11px] text-[var(--text-dark)]">· {stat.attempts} attempt{stat.attempts !== 1 ? 's' : ''}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {bestPct !== null && (
                                                            <span className={`text-sm font-extrabold shrink-0 ${isMastered ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}>
                                                                {bestPct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-[var(--border-color)] rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isMastered ? 'bg-emerald-500' : isMath ? 'bg-[#11428E]' : 'bg-purple-500'}`}
                                                            style={{ width: `${bestPct ?? 0}%` }}
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
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
        </div>
    );
};
