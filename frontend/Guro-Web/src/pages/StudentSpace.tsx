import React, { useState, useEffect } from 'react';
import { NameInputStep } from '../components/student/NameInputStep';
import { GradeSelectionStep } from '../components/student/GradeSelectionStep';
import { DashboardStep } from '../components/student/DashboardStep';
import { QuestionStep } from '../components/student/QuestionStep';
import { QuizResultsStep } from '../components/student/QuizResultsStep';
import { ArrowLeft, BookOpen, Calculator, Award } from 'lucide-react';
import { getParentAccessCode } from '../utils/security';
import { LogoutConfirmModal } from '../components/shared/LogoutConfirmModal';
import { toast } from 'react-hot-toast';

interface QuestionItem {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    feedback: {
        en: string;
        fil: string;
    };
}

interface ItemBank {
    [subject: string]: {
        [grade: string]: {
            [topic: string]: {
                [difficulty: string]: {
                    [category: string]: QuestionItem[];
                };
            };
        };
    };
}

const FALLBACK_ITEM_BANK: ItemBank = {
    "Mathematics": {
        "4": {
            "Fractions": {
                "Easy": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G4-FRAC-001",
                            "questionText": "What is the sum of 1/4 and 2/4?",
                            "options": ["1/4", "2/4", "3/4", "4/4"],
                            "correctAnswer": "3/4",
                            "feedback": {
                                "en": "Since the denominators are the same, simply add the numerators: 1 + 2 = 3. Keep the denominator: 3/4.",
                                "fil": "Dahil pareho ang denominator, idagdag lamang ang mga numerator: 1 + 2 = 3. Panatilihin ang denominator: 3/4."
                            }
                        }
                    ]
                }
            }
        },
        "5": {
            "Decimals": {
                "Average": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G5-DEC-002",
                            "questionText": "Multiply 0.5 by 0.2. What is the product?",
                            "options": ["0.1", "0.01", "1.0", "0.001"],
                            "correctAnswer": "0.1",
                            "feedback": {
                                "en": "Multiplying 5 by 2 gives 10. Since there are two decimal places in total in the factors, place the decimal point two spaces left: 0.10 or 0.1.",
                                "fil": "Ang pag-multiply ng 5 sa 2 ay nagbibigay ng 10. Dahil may dalawang decimal places sa kabuuan, ilagay ang decimal point dalawang puwang pakaliwa: 0.10 o 0.1."
                            }
                        }
                    ]
                }
            }
        },
        "6": {
            "Algebraic Equations": {
                "Difficult": {
                    "Multiple-Choice": [
                        {
                            "id": "MATH-G6-ALG-003",
                            "questionText": "Solve for x: 3x - 5 = 16.",
                            "options": ["x = 3", "x = 7", "x = 9", "x = 21"],
                            "correctAnswer": "x = 7",
                            "feedback": {
                                "en": "Add 5 to both sides to get 3x = 21, then divide by 3 to find x = 7.",
                                "fil": "Idagdag ang 5 sa magkabilang panig upang makuha ang 3x = 21, pagkatapos ay i-divide sa 3 upang makuha ang x = 7."
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
                                "fil": "Ang simile ay naghahambing ng dalawang bagay gamit ang \"like\" o \"as\" (tulad ng/parang). Dito, inihambing ang pisngi sa rosas gamit ang \"like\"."
                            }
                        }
                    ]
                }
            }
        },
        "5": {
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
                                "fil": "Ipinapakita ng talata kung paano nagsumikap si Maria (\"masigasig gabi-gabi\") at nagbunga ito ng tagumpay (\"nanalo ng unang puwesto\")."
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
                                "fil": "Ang idyomang ito ay tumutukoy sa pagpupuyat sa gabi para magtrabaho o mag-aral, na hango sa paggamit ng ilawan noon."
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
    currentUser?: { name: string; email: string; userId: string } | null;
}

type StepType = 'name' | 'grade' | 'dashboard' | 'topics' | 'quiz' | 'results';

export const StudentSpace: React.FC<StudentSpaceProps> = ({ onExit, currentUser }) => {
    const [step, setStep] = useState<StepType>(currentUser ? 'grade' : 'name');
    const [userName, setUserName] = useState(currentUser ? currentUser.name : '');
    const [selectedGrade, setSelectedGrade] = useState<number>(4);
    const [selectedSubject, setSelectedSubject] = useState<'Mathematics' | 'English'>('Mathematics');
    const [selectedTopic, setSelectedTopic] = useState('');

    // Quiz execution state
    const [questions, setQuestions] = useState<QuestionItem[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

    // Sync metrics history
    const [lessonsCompleted, setLessonsCompleted] = useState(0);
    const [totalScoreSum, setTotalScoreSum] = useState(0);
    const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);

    // Dynamic item bank loading
    const [itemBank, setItemBank] = useState<ItemBank>(FALLBACK_ITEM_BANK);

    const fetchItemBank = async () => {
        try {
            const res = await fetch('/api/item-bank');
            if (res.ok) {
                const data = await res.json();
                // If the bank is not empty, merge/set it
                if (Object.keys(data).length > 0) {
                    setItemBank(data);
                }
            }
        } catch (error) {
            console.warn('Could not load online item bank, falling back to local static bank:', error);
        }
    };

    const flushSyncQueue = async () => {
        const queueJson = localStorage.getItem('guro_sync_queue');
        if (!queueJson) return;
        try {
            const queue = JSON.parse(queueJson);
            if (!Array.isArray(queue) || queue.length === 0) return;

            console.log(`[Sync] Attempting to sync ${queue.length} queued progress reports...`);

            // Group queue items by studentId to send batched payloads
            const grouped: { [studentId: string]: any[] } = {};
            queue.forEach((item: any) => {
                if (!grouped[item.studentId]) grouped[item.studentId] = [];
                grouped[item.studentId].push(item.event);
            });

            const studentIds = Object.keys(grouped);
            const successfullySyncedIds: string[] = [];

            for (const studentId of studentIds) {
                try {
                    const response = await fetch('/api/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            studentId,
                            events: grouped[studentId]
                        })
                    });
                    if (response.ok) {
                        successfullySyncedIds.push(studentId);
                    }
                } catch (err) {
                    console.warn(`[Sync] Failed to upload telemetry for student "${studentId}". Will retry when online.`);
                }
            }

            if (successfullySyncedIds.length > 0) {
                const remainingQueue = queue.filter((item: any) => !successfullySyncedIds.includes(item.studentId));
                if (remainingQueue.length > 0) {
                    localStorage.setItem('guro_sync_queue', JSON.stringify(remainingQueue));
                } else {
                    localStorage.removeItem('guro_sync_queue');
                }
                console.log(`[Sync] Successfully uploaded telemetry for ${successfullySyncedIds.length} student profiles.`);
            }
        } catch (e) {
            console.error('[Sync] Error parsing sync queue from local storage', e);
            localStorage.removeItem('guro_sync_queue');
        }
    };

    useEffect(() => {
        fetchItemBank();
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
    }, []);

    // Helper to get available topics for a subject & grade level
    const getTopicsForCurrentSelection = (subject: 'Mathematics' | 'English'): string[] => {
        const gradeStr = selectedGrade.toString();
        const subjectNode = itemBank[subject];
        if (!subjectNode) return [];
        const gradeNode = subjectNode[gradeStr];
        if (!gradeNode) return [];
        return Object.keys(gradeNode);
    };

    // Handler when student picks a subject
    const handleSelectSubject = (subject: string) => {
        const selected = subject as 'Mathematics' | 'English';
        setSelectedSubject(selected);
        setStep('topics');
    };

    // Handler to launch the quiz for a selected topic
    const handleStartTopicQuiz = (topicName: string) => {
        setSelectedTopic(topicName);
        const gradeStr = selectedGrade.toString();
        const topicNode = itemBank[selectedSubject]?.[gradeStr]?.[topicName];

        if (!topicNode) {
            alert('No questions available for this topic.');
            return;
        }

        // Collect all questions across difficulties and categories for this topic node
        const allQuestions: QuestionItem[] = [];
        Object.keys(topicNode).forEach((difficulty) => {
            const categories = topicNode[difficulty];
            Object.keys(categories).forEach((category) => {
                const qList = categories[category];
                if (Array.isArray(qList)) {
                    qList.forEach((q) => {
                        allQuestions.push({
                            id: q.id,
                            questionText: q.questionText,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            feedback: q.feedback
                        });
                    });
                }
            });
        });

        if (allQuestions.length === 0) {
            alert('No questions staged in this topic structure.');
            return;
        }

        // Shuffle questions list
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        // Take at most 5 questions for a fast, mobile-friendly quiz experience
        const quizSlice = shuffled.slice(0, 5);

        setQuestions(quizSlice);
        setCurrentQuestionIndex(0);
        setScore(0);
        setStep('quiz');
    };

    // Handler when an answer is submitted and the student clicks next
    const handleQuestionNext = async (isCorrect: boolean) => {
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);

        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            // Quiz completed! Save & Sync progress report
            setLessonsCompleted((prev) => prev + 1);
            setTotalScoreSum((prev) => prev + newScore);
            setTotalQuestionsAnswered((prev) => prev + questions.length);

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
            currentQueue.push({ studentId, event: newEvent });
            localStorage.setItem('guro_sync_queue', JSON.stringify(currentQueue));

            // Attempt immediate telemetry upload
            flushSyncQueue();

            setStep('results');
        }
    };

    // Calculate dynamic stats
    const averageScorePercent = totalQuestionsAnswered > 0
        ? Math.round((totalScoreSum / totalQuestionsAnswered) * 100)
        : 0;

    const mathTopicsList = getTopicsForCurrentSelection('Mathematics');
    const englishTopicsList = getTopicsForCurrentSelection('English');

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        localStorage.removeItem('guro_user_session');
        onExit();
        toast.success('Logged out successfully.');
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            {step === 'name' && (
                <NameInputStep
                    onBack={onExit}
                    onStartLearning={(name) => {
                        setUserName(name);
                        setStep('grade');
                    }}
                />
            )}

            {step === 'grade' && (
                <GradeSelectionStep
                    userName={userName}
                    onBack={() => setStep('name')}
                    onLogout={handleLogout}
                    isLoggedIn={!!currentUser}
                    onSelectGrade={(grade) => {
                        setSelectedGrade(grade);
                        setStep('dashboard');
                    }}
                />
            )}

            {step === 'dashboard' && (
                <DashboardStep
                    userName={userName}
                    selectedGrade={selectedGrade}
                    onBack={() => setStep('grade')}
                    onLogout={handleLogout}
                    isLoggedIn={!!currentUser}
                    onSelectSubject={handleSelectSubject}
                    mathTopics={mathTopicsList.length > 0 ? mathTopicsList : ['Fractions']}
                    englishTopics={englishTopicsList.length > 0 ? englishTopicsList : ['Short Stories']}
                    mathProgress={selectedGrade === 4 ? 65 : selectedGrade === 5 ? 40 : 15}
                    englishProgress={selectedGrade === 4 ? 75 : selectedGrade === 5 ? 55 : 30}
                    stats={{
                        lessonsCompleted: lessonsCompleted,
                        averageScore: averageScorePercent || 80,
                        streak: lessonsCompleted > 0 ? 1 : 0
                    }}
                    parentAccessCode={getParentAccessCode(userName.replace(/\s+/g, '-').toUpperCase() || 'STUDENT-WEB-USER')}
                />
            )}

            {step === 'topics' && (
                <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12 bg-zinc-50 relative overflow-hidden select-none">
                    {/* Background blurs */}
                    <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 size-96 bg-purple-100 rounded-full blur-[160px]" />
                    <div className="absolute -bottom-48 left-1/4 -translate-x-1/2 size-96 bg-blue-100 rounded-full blur-[160px]" />

                    {/* Navigation Row */}
                    <div className="absolute top-6 left-6 right-6 md:top-10 md:left-10 md:right-10 flex items-center justify-between z-20">
                        <button
                            onClick={() => setStep('dashboard')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 hover:bg-zinc-50 transition-all hover:scale-[1.02] active:scale-[0.98] font-semibold text-sm cursor-pointer"
                        >
                            <ArrowLeft className="size-4 text-zinc-600" strokeWidth={2.5} />
                            Dashboard
                        </button>
                        <div className="px-5 py-2.5 bg-white border border-zinc-200/60 rounded-full shadow-md text-zinc-700 font-bold text-sm">
                            Grade {selectedGrade} • {selectedSubject}
                        </div>
                    </div>

                    <div className="flex w-full max-w-4xl flex-col items-center gap-10 mt-20 relative z-10">
                        <div className="flex flex-col items-center text-center">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 flex items-center justify-center gap-2 tracking-tight">
                                {selectedSubject === 'Mathematics' ? '🧮 Math' : '📚 English'} Practice Topics
                            </h1>
                            <p className="text-lg font-medium text-zinc-600 mt-2">Select a topic below to start your diagnostic quest!</p>
                            <p className="text-sm font-medium text-zinc-400">Pumili ng paksa sa ibaba para magsimula ng iyong pagsasanay!</p>
                        </div>

                        {/* Topics grid list */}
                        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-6 px-4">
                            {getTopicsForCurrentSelection(selectedSubject).length === 0 ? (
                                <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-dashed border-zinc-300">
                                    <span className="text-4xl">📭</span>
                                    <h3 className="text-lg font-bold text-zinc-700 mt-4">No topics found in the local repository</h3>
                                    <p className="text-zinc-500 text-sm mt-1">Staged lessons will appear here once loaded by the teacher workspace.</p>
                                </div>
                            ) : (
                                getTopicsForCurrentSelection(selectedSubject).map((topicName) => (
                                    <button
                                        key={topicName}
                                        onClick={() => handleStartTopicQuiz(topicName)}
                                        className="group bg-white border border-zinc-100 rounded-3xl p-6 text-left shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-5 cursor-pointer"
                                    >
                                        <div className={`p-4 rounded-2xl text-white ${selectedSubject === 'Mathematics' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                                            {selectedSubject === 'Mathematics' ? <Calculator className="size-6" /> : <BookOpen className="size-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black text-zinc-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                                {topicName}
                                            </h3>
                                            <p className="text-xs text-zinc-400 font-semibold mt-0.5">Click to start practice modules</p>
                                        </div>
                                        <Award className="size-5 text-zinc-300 group-hover:text-amber-500 transition-colors" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
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
                    explanationFil={questions[currentQuestionIndex].feedback.fil}
                    onBack={() => setStep('topics')}
                    onNextOrFinish={handleQuestionNext}
                />
            )}

            {step === 'results' && (
                <QuizResultsStep
                    correctAnswersCount={score}
                    totalQuestionsCount={questions.length}
                    onBackToSubjects={() => setStep('dashboard')}
                    onTryAgain={() => {
                        // Reset quiz loop parameters
                        setCurrentQuestionIndex(0);
                        setScore(0);
                        setStep('quiz');
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
