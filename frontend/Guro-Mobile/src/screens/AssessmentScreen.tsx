/**
 * AssessmentScreen.tsx
 * GURO Design System — fully themed assessment / quiz screen.
 * All logic (question loading, shuffling, handleOptionSelect, handleSubmit,
 * handleNext, score tracking, recordProgress, bilingual feedback,
 * forcedBilingual toggle) is preserved unchanged.
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, Question } from '../store/useAppStore';
import { shuffle, MASTERY_THRESHOLD } from '../utils/engine';
import { Trophy, Square, Volume2, Check, X, Inbox, ChevronDown, ChevronUp, WifiOff } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

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

  interface AnswerLogEntry {
    questionText: string;
    selectedOption: string;
    correctAnswer: string;
    explanation: string;
    isCorrect: boolean;
  }
  const [answerLog, setAnswerLog] = useState<AnswerLogEntry[]>([]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
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

  const currentQuestion = questions[currentIndex];
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
      const textToSpeak = `${currentQuestion.questionText}. ${optionsText}`.replace(/_+/g, ' blank ');
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
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </GlassCard>

        {/* ── Options ── */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, idx) => {
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
          })}
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

