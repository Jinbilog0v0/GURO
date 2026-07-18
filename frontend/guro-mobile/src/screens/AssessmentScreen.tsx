/**
 * AssessmentScreen.tsx
 * GURO Design System — fully themed assessment / quiz screen.
 * All logic (question loading, shuffling, handleOptionSelect, handleSubmit,
 * handleNext, score tracking, recordProgress, bilingual feedback,
 * forcedBilingual toggle) is preserved unchanged.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  PanResponder,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, Question } from '../store/useAppStore';
import { shuffle, MASTERY_THRESHOLD } from '../utils/engine';
import { Trophy, Square, Volume2, Check, X, Inbox, ChevronDown, ChevronUp, WifiOff, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

// ── Design System ──────────────────────────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { Badge } from '../components/ui/Badge';
import { styles } from '../styles/AssessmentScreen.styles';


// ─────────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Assessment'>;

const getSlicePath = (index: number, total: number) => {
  const radius = 95;
  const center = 100;
  const startAngle = (index * 360) / total - 90;
  const endAngle = ((index + 1) * 360) / total - 90;
  
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = center + radius * Math.cos(rad(startAngle));
  const y1 = center + radius * Math.sin(rad(startAngle));
  const x2 = center + radius * Math.cos(rad(endAngle));
  const y2 = center + radius * Math.sin(rad(endAngle));
  
  const largeArc = 0;
  return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const matchColors = [
  { bg: 'rgba(6, 182, 212, 0.08)', border: '#06B6D4', text: '#0891B2', badgeBg: 'rgba(6, 182, 212, 0.15)' },
  { bg: 'rgba(217, 70, 239, 0.08)', border: '#D946EF', text: '#C026D3', badgeBg: 'rgba(217, 70, 239, 0.15)' },
  { bg: 'rgba(245, 158, 11, 0.08)', border: '#F59E0B', text: '#D97706', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  { bg: 'rgba(244, 63, 94, 0.08)', border: '#F43F5E', text: '#E11D48', badgeBg: 'rgba(244, 63, 94, 0.15)' },
  { bg: 'rgba(16, 185, 129, 0.08)', border: '#10B981', text: '#059669', badgeBg: 'rgba(16, 185, 129, 0.15)' },
];

export function AssessmentScreen({ route, navigation }: Props) {
  const { subject, gradeLevel, topic } = route.params;

  // ── Store ──────────────────────────────────────────────────────────────────
  const itemBank = useAppStore((state) => state.itemBank);
  const addLog = useAppStore((state) => state.addLog);
  const recordProgress = useAppStore((state) => state.recordProgress);

  // ── Active-minutes tracker ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().trackActiveMinutes(0.25);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Question loading ───────────────────────────────────────────────────────
  const getQuestions = (): Question[] => {
    if (!itemBank) return [];
    const subjectData = itemBank[subject];
    if (!subjectData) return [];
    const gradeData = subjectData[gradeLevel.toString()];
    if (!gradeData) return [];
    const topicData = gradeData[topic];
    if (!topicData) return [];
    const list: Question[] = [];
    Object.keys(topicData).forEach((diff) => {
      if (diff === 'studyContent') return;
      const diffData = topicData[diff] as Record<string, Question[]> | undefined;
      if (!diffData || typeof diffData !== 'object') return;
      Object.keys(diffData).forEach((cat) => {
        list.push(...diffData[cat]);
      });
    });
    return list;
  };

  const [questions] = useState<Question[]>(() => {
    const rawQuestions = getQuestions();
    return shuffle(rawQuestions).map((q) => ({
      ...q,
      options: shuffle(q.options),
    }));
  });

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showAnswerReview, setShowAnswerReview] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [shadedSlices, setShadedSlices] = useState<number[]>([]);

  interface AnswerLogEntry {
    questionText: string;
    selectedOption: string;
    correctAnswer: string;
    explanation: string;
    isCorrect: boolean;
  }
  const [answerLog, setAnswerLog] = useState<AnswerLogEntry[]>([]);

  const currentQuestion = (questions[currentIndex] || null) as any;

  // ── Matching challenge states ────────────────────────────────────────────────
  const [currentMatches, setCurrentMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [rightOptionsShuffled, setRightOptionsShuffled] = useState<string[]>([]);
  const [leftOptionsShuffled, setLeftOptionsShuffled] = useState<string[]>([]);

  // ── Swipe Card pan states ──────────────────────────────────────────────────
  const pan = useRef(new Animated.ValueXY()).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        const isSwipeType = questions[currentIndex]?.type === 'swipe-card';
        return !isAnswered && !selectedOption && isSwipeType;
      },
      onMoveShouldSetPanResponder: () => {
        const isSwipeType = questions[currentIndex]?.type === 'swipe-card';
        return !isAnswered && !selectedOption && isSwipeType;
      },
      onPanResponderMove: (e, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (e, gestureState) => {
        const threshold = 100;
        const currentQ = questions[currentIndex];
        if (gestureState.dx > threshold) {
          const rightOpt = currentQ?.options?.[1];
          if (rightOpt) {
            handleOptionSelect(rightOpt);
            Animated.timing(pan, {
              toValue: { x: 320, y: gestureState.dy },
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        } else if (gestureState.dx < -threshold) {
          const leftOpt = currentQ?.options?.[0];
          if (leftOpt) {
            handleOptionSelect(leftOpt);
            Animated.timing(pan, {
              toValue: { x: -320, y: gestureState.dy },
              duration: 200,
              useNativeDriver: false,
            }).start();
          } else {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          }
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const handleMobileButtonSelect = (option: string, isRight: boolean) => {
    handleOptionSelect(option);
    Animated.timing(pan, {
      toValue: { x: isRight ? 320 : -320, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    setSelectedLeft(null);
    setCurrentMatches({});
    setShadedSlices([]);
    pan.setValue({ x: 0, y: 0 });
    if (currentQuestion && currentQuestion.type === 'drag-drop-matching' && currentQuestion.matchingPairs) {
      const left = Object.keys(currentQuestion.matchingPairs);
      const right = Object.values(currentQuestion.matchingPairs);
      setLeftOptionsShuffled([...left].sort(() => Math.random() - 0.5));
      setRightOptionsShuffled([...right].sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, currentQuestion]);

  const handleLeftSelect = (item: string) => {
    if (isAnswered) return;
    
    // Tap a matched item to undo/remove it
    if (currentMatches[item]) {
      const nextMatches = { ...currentMatches };
      delete nextMatches[item];
      setCurrentMatches(nextMatches);
      setSelectedOption(null);
      return;
    }

    // Tap selected left item again to deselect
    if (selectedLeft === item) {
      setSelectedLeft(null);
      return;
    }

    setSelectedLeft(item);
  };

  const checkAllMatched = (newMatches: Record<string, string>) => {
    if (currentQuestion && currentQuestion.matchingPairs && Object.keys(newMatches).length === Object.keys(currentQuestion.matchingPairs).length) {
      const isAllCorrect = Object.keys(currentQuestion.matchingPairs).every(
        (key) => newMatches[key] === currentQuestion.matchingPairs?.[key]
      );
      if (isAllCorrect) {
        setSelectedOption(currentQuestion.correctAnswer);
      } else {
        setSelectedOption('Incorrect Matching');
      }
    } else {
      setSelectedOption(null);
    }
  };

  const handleRightSelect = (item: string) => {
    if (isAnswered) return;

    const matchedLeftKey = Object.keys(currentMatches).find(key => currentMatches[key] === item);

    if (!selectedLeft) {
      // Tap matched item to undo/remove it
      if (matchedLeftKey) {
        const nextMatches = { ...currentMatches };
        delete nextMatches[matchedLeftKey];
        setCurrentMatches(nextMatches);
        setSelectedOption(null);
      }
      return;
    }

    // If this right item is already matched to another left item, remove that old match first
    const nextMatches = { ...currentMatches };
    if (matchedLeftKey) {
      delete nextMatches[matchedLeftKey];
    }

    nextMatches[selectedLeft] = item;
    setCurrentMatches(nextMatches);
    setSelectedLeft(null);
    checkAllMatched(nextMatches);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    } catch (e) {
      console.warn(e);
    }
    setSelectedOption(option);
  };

  // ── Speech State (must be declared before any early-return to satisfy Rules of Hooks) ──
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, [currentIndex]);

  // ── Error state: no questions ──────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredContainer}>
          <GlassCard style={styles.errorCard}>
            <Inbox size={32} color="#94A3B8" style={{ marginBottom: 12, alignSelf: 'center' }} />
            <Text style={styles.errorTitle}>No Questions Found</Text>
            <Text style={styles.errorBody}>
              There are no questions available for{' '}
              <Text style={styles.errorHighlight}>{topic}</Text> in Grade{' '}
              {gradeLevel} {subject}.
            </Text>
            <SecondaryButton
              label="Go Back"
              onPress={() => navigation.goBack()}
              style={styles.errorBtn}
            />
          </GlassCard>
        </View>
      </SafeAreaView>
    );
  }


  const progress = (currentIndex + (isAnswered ? 1 : 0)) / questions.length;
  const isLastQuestion = currentIndex + 1 === questions.length;
  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  // ── Speech Handlers ────────────────────────────────────────────────────────
  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const optionsText = currentQuestion.options
        .map((opt, idx) => `Option ${String.fromCharCode(65 + idx)}: ${opt}`)
        .join('. ');
      const cleanQuestionText = currentQuestion.questionText
        .replace(/\[\[blank\]\]/g, ' blank ')
        .replace(/_+/g, ' blank ');
      const textToSpeak = `${cleanQuestionText}. ${optionsText}`;
      const rate = useAppStore.getState().speechRate || 1.0;
      const guide = useAppStore.getState().voiceGuideTheme || 'astronaut';
      let pitch = 1.0;
      if (guide === 'robot') pitch = 0.65;
      else if (guide === 'owl') pitch = 1.25;

      Speech.speak(textToSpeak, {
        rate,
        pitch,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
      });
    }
  };

  const handleSubmit = () => {
    if (!selectedOption || isAnswered) return;
    const correct = selectedOption === currentQuestion.correctAnswer;
    if (correct) setScore((prev) => prev + 1);
    Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    ).catch(() => {});
    setIsAnswered(true);
    setAnswerLog((prev) => [
      ...prev,
      {
        questionText: currentQuestion.questionText,
        selectedOption: selectedOption,
        correctAnswer: currentQuestion.correctAnswer,
        explanation:
          typeof currentQuestion.feedback === 'object' && currentQuestion.feedback !== null
            ? currentQuestion.feedback.en
            : String(currentQuestion.feedback || ''),
        isCorrect: correct,
      },
    ]);
    addLog(`Submitted answer for ${currentQuestion.id}. Correct: ${correct}`);

    // Dynamic voice feedback
    const soundEnabled = useAppStore.getState().soundEffectsEnabled;
    if (soundEnabled) {
      const guide = useAppStore.getState().voiceGuideTheme || 'astronaut';
      const rate = useAppStore.getState().speechRate || 1.0;
      let pitch = 1.0;
      let text = '';
      
      if (guide === 'robot') pitch = 0.65;
      else if (guide === 'owl') pitch = 1.25;
      
      if (correct) {
        const successes = ["Excellent!", "Correct!", "Nice job!", "You got it!"];
        text = successes[Math.floor(Math.random() * successes.length)];
      } else {
        const tries = ["Try again next time!", "Let's review this later!", "Keep going, you'll get it!", "Not quite, but good effort!"];
        text = tries[Math.floor(Math.random() * tries.length)];
      }
      
      Speech.stop();
      Speech.speak(text, { rate, pitch });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalScore = score;
      const isPerfect = finalScore === questions.length;
      const earnedXP = finalScore * 10 + (isPerfect ? 50 : 0);
      const oldXp = useAppStore.getState().xpPoints || 0;
      const newXp = oldXp + earnedXP;
      const oldLevel = Math.floor(oldXp / 100) + 1;
      const newLevel = Math.floor(newXp / 100) + 1;
      if (newLevel > oldLevel) {
        setLevelUpLevel(newLevel);
      }
      recordProgress({
        subject,
        gradeLevel,
        topic,
        score: finalScore,
        totalQuestions: questions.length,
      });
      setQuizFinished(true);
      addLog(
        `Completed quiz for topic "${topic}". Final Score: ${finalScore}/${questions.length}`,
      );
    }
  };

  // ── Quiz finished screen ───────────────────────────────────────────────────
  if (quizFinished) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passed = percentage >= MASTERY_THRESHOLD;
    // O2: Check for unsynced progress to show 'not yet sent to teacher' notice
    const unsyncedCount = (useAppStore.getState().studentProgress || []).filter((p) => !p.synced).length;

    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.finishedScroll}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.finishedCard}>
            {/* Celebration header */}
            {passed ? (
              <View style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Text style={{ fontSize: 48 }}>🎉</Text>
                <Badge label="Passed!" variant="success" style={styles.finishedBadge} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.success, textAlign: 'center' }}>
                  Amazing work! You passed this topic.
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Trophy size={48} color="#EAB308" style={{ marginBottom: 4 }} />
                <Badge label="Keep Practicing" variant="warning" style={styles.finishedBadge} />
              </View>
            )}

            {/* O2: Unsynced score notice — shown when result hasn't reached teacher yet */}
            {unsyncedCount > 0 && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(245,158,11,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.2)',
                borderRadius: Radius.md,
                padding: Spacing.sm,
                marginBottom: Spacing.sm,
              }}>
                <WifiOff size={14} color={Colors.warning} />
                <Text style={{ flex: 1, fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.warning, lineHeight: 16 }}>
                  📡 Score saved on your device. It will be sent to your teacher once you're back online.
                </Text>
              </View>
            )}

            <Text style={styles.finishedTopic}>{topic}</Text>
            <Text style={styles.finishedSubLabel}>
              {subject} · Grade {gradeLevel}
            </Text>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreDisplay}>
                {finalScore}
                <Text style={styles.scoreDivider}>/{questions.length}</Text>
              </Text>
            </View>

            <Text
              style={[
                styles.percentageText,
                { color: passed ? Colors.success : Colors.warning },
              ]}
            >
              {percentage}%
            </Text>

            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${percentage}%` as `${number}%`,
                    backgroundColor: passed ? Colors.success : Colors.warning,
                  },
                ]}
              />
            </View>

            <PrimaryButton
              label="Back to Topics"
              onPress={() => navigation.goBack()}
              style={styles.finishedBtn}
            />

            {/* Answer Review Toggle */}
            {answerLog.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowAnswerReview((v) => !v)}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                  {showAnswerReview ? 'Hide' : 'Review My Answers'}
                </Text>
                {showAnswerReview
                  ? <ChevronUp size={16} color={Colors.accentPrimary} />
                  : <ChevronDown size={16} color={Colors.accentPrimary} />
                }
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Level-up celebration modal — C2: replaced hardcoded colors/fonts with design tokens */}
          {levelUpLevel !== null && (
            <Modal
              visible={true}
              transparent
              animationType="fade"
              onRequestClose={() => setLevelUpLevel(null)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
                <View style={{
                  width: '100%',
                  maxWidth: 360,
                  borderRadius: Radius.xl,
                  overflow: 'hidden',
                  backgroundColor: Colors.accentPrimary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 24,
                  elevation: 16,
                }}>
                  <View style={{ backgroundColor: '#EAB308', paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={{ fontSize: 48 }}>🎖️</Text>
                  </View>
                  <View style={{ padding: Spacing.xl, alignItems: 'center', gap: Spacing.md }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: '#EAB308', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                      Level Up!
                    </Text>
                    <Text style={{ fontFamily: Fonts.display, fontSize: 42, color: Colors.white, lineHeight: 48 }}>
                      Level {levelUpLevel}
                    </Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.80)', textAlign: 'center', lineHeight: 20 }}>
                      Incredible! You've reached a new level. Keep learning and keep growing!
                    </Text>
                    <TouchableOpacity
                      onPress={() => setLevelUpLevel(null)}
                      activeOpacity={0.85}
                      accessibilityLabel="Continue"
                      accessibilityRole="button"
                      style={{
                        marginTop: Spacing.sm,
                        backgroundColor: '#EAB308',
                        paddingVertical: Spacing.md,
                        paddingHorizontal: 40,
                        borderRadius: Radius.md,
                        alignSelf: 'stretch',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.accentPrimary }}>
                        Awesome! 🚀
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

          {/* Answer review list */}
          {showAnswerReview && answerLog.map((entry, idx) => (
            <GlassCard key={idx} padding={14} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                {entry.isCorrect
                  ? <Check size={16} color={Colors.success} strokeWidth={3} style={{ marginTop: 2 }} />
                  : <X size={16} color={Colors.danger} strokeWidth={3} style={{ marginTop: 2 }} />
                }
                <Text style={{ flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMain, lineHeight: 18 }}>
                  {entry.questionText}
                </Text>
              </View>
              {!entry.isCorrect && (
                <View style={{ marginLeft: 24, gap: 2 }}>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.danger }}>
                    Your answer: <Text style={{ fontFamily: Fonts.bodyBold }}>{entry.selectedOption}</Text>
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.success }}>
                    Correct: <Text style={{ fontFamily: Fonts.bodyBold }}>{entry.correctAnswer}</Text>
                  </Text>
                </View>
              )}
              {entry.explanation ? (
                <Text style={{ marginLeft: 24, fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, lineHeight: 16, fontStyle: 'italic' }}>
                  {entry.explanation}
                </Text>
              ) : null}
            </GlassCard>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Option style helper ────────────────────────────────────────────────────
  const getOptionStyle = (option: string) => {
    if (!isAnswered) {
      const isSelected = selectedOption === option;
      return {
        container: [
          styles.optionBase,
          isSelected ? styles.optionSelected : styles.optionDefault,
        ],
        text: [styles.optionText, isSelected && styles.optionTextSelected],
      };
    }
    if (option === currentQuestion.correctAnswer) {
      return {
        container: [styles.optionBase, styles.optionCorrect],
        text: [styles.optionText, styles.optionTextCorrect],
      };
    }
    if (option === selectedOption) {
      return {
        container: [styles.optionBase, styles.optionWrong],
        text: [styles.optionText, styles.optionTextWrong],
      };
    }
    return {
      container: [styles.optionBase, styles.optionDefault],
      text: [styles.optionText],
    };
  };

  // ── Feedback text ──────────────────────────────────────────────────────────
  const feedbackText =
    typeof currentQuestion?.feedback === 'object' && currentQuestion?.feedback !== null
      ? currentQuestion.feedback.en
      : currentQuestion?.feedback || '';

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerMeta}>
            <Badge label={subject} variant="indigo" />
            <Badge
              label={`Grade ${gradeLevel}`}
              variant="indigo"
              style={styles.headerBadgeGap}
            />
          </View>
          <Text style={styles.headerTopic}>{topic}</Text>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(progress * 100)}%` as `${number}%`,
                  backgroundColor: Colors.success,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>

        {/* ── Question card ── */}
        <GlassCard style={styles.questionCard}>
          <View style={styles.questionCardHeader}>
            <Text style={[styles.questionLabel, styles.questionLabelNoMargin]}>QUESTION</Text>
            <TouchableOpacity
              onPress={toggleSpeech}
              style={[
                styles.listenButton,
                {
                  backgroundColor: isSpeaking ? Colors.accentPrimaryDeep : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isSpeaking ? Colors.accentPrimary : Colors.border,
                }
              ]}
              accessibilityLabel="Listen to question"
            >
              {isSpeaking ? (
                <Square size={14} color={Colors.accentPrimary} fill={Colors.accentPrimary} />
              ) : (
                <Volume2 size={14} color={Colors.textMuted} />
              )}
              <Text style={[
                styles.listenButtonText,
                { color: isSpeaking ? Colors.accentPrimary : Colors.textMuted, marginLeft: 4 }
              ]}>
                {isSpeaking ? 'Stop' : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>
          {currentQuestion.type === 'fill-in-the-blank' && (currentQuestion.questionText.includes('[[blank]]') || currentQuestion.questionText.includes('______') || currentQuestion.questionText.includes('____')) ? (
            (() => {
              const delimiter = currentQuestion.questionText.includes('[[blank]]')
                ? '[[blank]]'
                : (currentQuestion.questionText.includes('______') ? '______' : '____');
              const parts = currentQuestion.questionText.split(delimiter);
              return (
                <Text style={styles.questionText}>
                  {parts[0]}
                  <Text style={{ textDecorationLine: 'underline', color: Colors.accentPrimary, fontFamily: Fonts.display }}>
                    {selectedOption ? ` ${selectedOption} ` : ' ______ '}
                  </Text>
                  {parts[1]}
                </Text>
              );
            })()
          ) : (
            <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
          )}
        </GlassCard>

        {/* ── Options ── */}
        <View style={styles.optionsContainer}>
          {currentQuestion.type === 'drag-drop-matching' ? (
            <View style={{ marginVertical: 10, width: '100%' }}>
              <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: 12 }}>
                Tap a word on the left, then tap its match on the right! (Tap a matched word to undo)
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
                {/* Left Column (Terms) */}
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.sm, color: Colors.accentPrimary, textAlign: 'center', marginBottom: 4 }}>Term</Text>
                  {leftOptionsShuffled
                    .filter((item) => !currentMatches[item])
                    .map((item, idx) => {
                      const isSelected = selectedLeft === item;
                      return (
                        <TouchableOpacity
                          key={`left-${idx}`}
                          disabled={isAnswered}
                          onPress={() => handleLeftSelect(item)}
                          style={{
                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : Colors.bgCard,
                            borderWidth: 2,
                            borderBottomWidth: 5,
                            borderColor: isSelected ? Colors.accentPrimary : Colors.border,
                            borderRadius: Radius.md || 12,
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 1,
                          }}
                        >
                          <Text style={{ textAlign: 'center', fontFamily: Fonts.bodyBold, fontSize: FontSizes.base, color: isSelected ? Colors.accentPrimary : Colors.textMain }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Right Column (Matches) */}
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.sm, color: Colors.accentSecondary, textAlign: 'center', marginBottom: 4 }}>Match</Text>
                  {rightOptionsShuffled
                    .filter((item) => !Object.values(currentMatches).includes(item))
                    .map((item, idx) => {
                      let btnColor = Colors.bgCard;
                      let borderColor = Colors.border;
                      let textColor = Colors.textMain;

                      if (!selectedLeft) {
                        btnColor = Colors.bgCard;
                        borderColor = Colors.border;
                        textColor = Colors.textMuted;
                      } else {
                        btnColor = Colors.bgCard;
                        borderColor = Colors.border;
                        textColor = Colors.textMain;
                      }

                      return (
                        <TouchableOpacity
                          key={`right-${idx}`}
                          disabled={isAnswered}
                          onPress={() => handleRightSelect(item)}
                          style={{
                            backgroundColor: btnColor,
                            borderWidth: 2,
                            borderBottomWidth: 5,
                            borderColor: borderColor,
                            borderRadius: Radius.md || 12,
                            paddingVertical: 12,
                            paddingHorizontal: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: !selectedLeft ? 0.6 : 1,
                          }}
                        >
                          <Text style={{ textAlign: 'center', fontFamily: Fonts.bodyBold, fontSize: FontSizes.base, color: textColor }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>

              {/* Display current matches */}
              {Object.keys(currentMatches).length > 0 && (
                <View style={{ marginTop: 24, backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: Radius.md || 12, borderWidth: 1, borderColor: Colors.border }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Your Matches
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {Object.keys(currentMatches).map((key, idx) => {
                      const config = matchColors[idx % matchColors.length];
                      return (
                        <View 
                          key={idx} 
                          style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            backgroundColor: config.bg, 
                            borderWidth: 2, 
                            borderBottomWidth: 4,
                            borderColor: config.border, 
                            borderRadius: Radius.md || 12, 
                            paddingHorizontal: 10, 
                            paddingVertical: 6,
                            gap: 6
                          }}
                        >
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: config.text }}>
                            {key} ↔ {currentMatches[key]}
                          </Text>
                          {!isAnswered && (
                            <TouchableOpacity
                              onPress={() => {
                                const nextMatches = { ...currentMatches };
                                delete nextMatches[key];
                                setCurrentMatches(nextMatches);
                                setSelectedOption(null);
                              }}
                              style={{ marginLeft: 4 }}
                            >
                              <X size={14} color={Colors.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          ) : currentQuestion.type === 'true-false' ? (
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginVertical: 10 }}>
              {['True', 'False'].map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                const isWrong = isSelected && selectedOption !== currentQuestion.correctAnswer;

                let btnColor = Colors.bgCard;
                let borderColor = Colors.border;
                let textColor = Colors.textMain;

                if (isAnswered) {
                  if (isCorrect) {
                    btnColor = 'rgba(16, 185, 129, 0.08)';
                    borderColor = Colors.success;
                    textColor = Colors.success;
                  } else if (isWrong) {
                    btnColor = 'rgba(239, 68, 68, 0.08)';
                    borderColor = Colors.danger;
                    textColor = Colors.danger;
                  } else {
                    btnColor = Colors.bgCard;
                    borderColor = Colors.border;
                    textColor = Colors.textMuted;
                  }
                } else if (isSelected) {
                  if (option === 'True') {
                    btnColor = 'rgba(16, 185, 129, 0.12)';
                    borderColor = '#10B981';
                    textColor = '#10B981';
                  } else {
                    btnColor = 'rgba(244, 63, 94, 0.12)';
                    borderColor = '#F43F5E';
                    textColor = '#F43F5E';
                  }
                }

                return (
                  <TouchableOpacity
                    key={option}
                    disabled={isAnswered}
                    onPress={() => handleOptionSelect(option)}
                    activeOpacity={isAnswered ? 1 : 0.75}
                    style={{
                      flex: 1,
                      backgroundColor: btnColor,
                      borderWidth: 2,
                      borderBottomWidth: 5,
                      borderColor: borderColor,
                      borderRadius: Radius.md || 12,
                      paddingVertical: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <View style={{ height: 28, justifyContent: 'center', alignItems: 'center' }}>
                      {option === 'True' ? (
                        <ThumbsUp size={28} color={textColor} />
                      ) : (
                        <ThumbsDown size={28} color={textColor} />
                      )}
                    </View>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.base, color: textColor }}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : currentQuestion.type === 'swipe-card' ? (
            <View style={{ alignItems: 'center', width: '100%', marginVertical: 10 }}>
              {/* Category Indicators */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 }}>
                <View style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: Colors.border,
                  backgroundColor: Colors.bgCard,
                  alignItems: 'center',
                  minWidth: 110,
                }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>◀ Swipe Left</Text>
                  <Text style={{ fontFamily: Fonts.heading, fontSize: FontSizes.base, color: Colors.danger, marginTop: 4 }}>
                    {currentQuestion.options[0]}
                  </Text>
                </View>
                
                <View style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: Colors.border,
                  backgroundColor: Colors.bgCard,
                  alignItems: 'center',
                  minWidth: 110,
                }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>Swipe Right ▶</Text>
                  <Text style={{ fontFamily: Fonts.heading, fontSize: FontSizes.base, color: Colors.success, marginTop: 4 }}>
                    {currentQuestion.options[1]}
                  </Text>
                </View>
              </View>

              {/* Swipe Deck Card */}
              <View style={{ height: 230, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View
                  {...panResponder.panHandlers}
                  style={{
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      {
                        rotate: pan.x.interpolate({
                          inputRange: [-200, 0, 200],
                          outputRange: ['-12deg', '0deg', '12deg'],
                        })
                      }
                    ],
                    width: 220,
                    height: 220,
                    borderRadius: 24,
                    borderWidth: 4,
                    borderColor: isAnswered 
                      ? selectedOption === currentQuestion.correctAnswer 
                        ? Colors.success 
                        : Colors.danger
                      : Colors.border,
                    backgroundColor: Colors.bgCard,
                    padding: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                  }}
                >
                  <Sparkles size={32} color={Colors.accentPrimary} style={{ marginBottom: 12, alignSelf: 'center' }} />
                  <Text style={{
                    fontFamily: Fonts.bodyBold,
                    fontSize: FontSizes.base,
                    color: Colors.textMain,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}>
                    {currentQuestion.questionText}
                  </Text>
                </Animated.View>
              </View>

              {/* Manual Selection Action Buttons */}
              {!isAnswered && (
                <View style={{ flexDirection: 'row', gap: 40, marginTop: 25 }}>
                  <TouchableOpacity
                    onPress={() => handleMobileButtonSelect(currentQuestion.options[0], false)}
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: '#FDA4AF',
                      backgroundColor: '#FFE4E6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 2,
                    }}
                  >
                    <X size={20} color={Colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMobileButtonSelect(currentQuestion.options[1], true)}
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: 28,
                      borderWidth: 2,
                      borderColor: '#A7F3D0',
                      backgroundColor: '#D1FAE5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 2,
                    }}
                  >
                    <Check size={20} color={Colors.success} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : currentQuestion.type === 'fraction-builder' ? (
            <View style={{ alignItems: 'center', width: '100%', marginVertical: 15, gap: 20 }}>
              <GlassCard style={{ padding: 20, alignItems: 'center', justifyContent: 'center', width: 240, height: 240, borderRadius: 32, borderWidth: 1, borderColor: Colors.border }}>
                <Svg width="200" height="200" viewBox="0 0 200 200">
                  {Array.from({ length: parseInt(currentQuestion.options[1] || '4') }).map((_, idx) => {
                    const denominator = parseInt(currentQuestion.options[1] || '4');
                    const isShaded = shadedSlices.includes(idx);
                    const path = getSlicePath(idx, denominator);
                    
                    let fillColor = '#FFFFFF';
                    let strokeColor = '#E2E8F0';
                    
                    if (isAnswered) {
                      const correctNum = parseInt(currentQuestion.options[0] || '0');
                      const selectedNum = shadedSlices.length;
                      if (selectedNum === correctNum) {
                        fillColor = isShaded ? '#10B981' : 'rgba(16, 185, 129, 0.08)';
                        strokeColor = '#10B981';
                      } else {
                        fillColor = isShaded ? '#EF4444' : 'rgba(239, 68, 68, 0.08)';
                        strokeColor = '#EF4444';
                      }
                    } else if (isShaded) {
                      fillColor = '#F59E0B';
                      strokeColor = '#D97706';
                    }

                    return (
                      <Path
                        key={idx}
                        d={path}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2.5"
                        onPress={() => {
                          if (isAnswered) return;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          
                          const nextShaded = isShaded 
                            ? shadedSlices.filter(i => i !== idx)
                            : [...shadedSlices, idx];
                          
                          try {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                          } catch (e) {}
                          setShadedSlices(nextShaded);
                          setSelectedOption(nextShaded.length.toString());
                        }}
                      />
                    );
                  })}
                  <Circle cx="100" cy="100" r="30" fill={Colors.bgCard} stroke={Colors.border} strokeWidth="2" />
                </Svg>
              </GlassCard>

              {/* Numerical label */}
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Shaded Fraction
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: Fonts.display, fontSize: 28, color: shadedSlices.length > 0 ? '#F59E0B' : Colors.textMain }}>
                    {shadedSlices.length}
                  </Text>
                  <Text style={{ fontFamily: Fonts.display, fontSize: 28, color: Colors.textMuted }}>
                    /
                  </Text>
                  <Text style={{ fontFamily: Fonts.display, fontSize: 28, color: Colors.textMain }}>
                    {currentQuestion.options[1] || '4'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            currentQuestion.options.map((option, idx) => {
              const optionStyle = getOptionStyle(option);
              return (
                <TouchableOpacity
                  key={`${currentQuestion.id}-opt-${idx}`}
                  onPress={() => handleOptionSelect(option)}
                  activeOpacity={isAnswered ? 1 : 0.75}
                  style={optionStyle.container}
                  accessibilityRole="radio"
                  accessibilityLabel={`Option ${idx + 1}: ${option}`}
                  accessibilityState={{ selected: selectedOption === option }}
                >
                  <View style={styles.optionLetterBadge}>
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={optionStyle.text}>{option}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Feedback card (shown after submit) ── */}
        {isAnswered && (
          <GlassCard style={styles.feedbackCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              {isCorrect ? (
                <Check size={18} color={Colors.success} strokeWidth={3} />
              ) : (
                <X size={18} color={Colors.danger} strokeWidth={3} />
              )}
              <Text style={[styles.feedbackResultTitle, { marginBottom: 0 }]}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </Text>
            </View>
            <Text style={styles.feedbackText}>{feedbackText}</Text>
          </GlassCard>
        )}

        {/* ── Action buttons ── */}
        <View style={styles.actionsRow}>
          {!isAnswered ? (
            <>
              <PrimaryButton
                label="Submit Answer"
                onPress={handleSubmit}
                disabled={!selectedOption}
                style={styles.actionBtn}
              />
              {/* U2: Helper text shown when no answer is selected so children understand what to do */}
              {!selectedOption && (
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 6 }}>
                  Pick an answer above to continue ↑
                </Text>
              )}
            </>
          ) : (
            <PrimaryButton
              label={isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              onPress={handleNext}
              style={styles.actionBtn}
            />
          )}
        </View>

        {/* Spacer for bottom safe-area */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

