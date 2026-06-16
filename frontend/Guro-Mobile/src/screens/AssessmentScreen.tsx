/**
 * AssessmentScreen.tsx
 * GURO Design System — fully themed assessment / quiz screen.
 * All logic (question loading, shuffling, handleOptionSelect, handleSubmit,
 * handleNext, score tracking, recordProgress, bilingual feedback,
 * forcedBilingual toggle) is preserved unchanged.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, Question } from '../store/useAppStore';
import { shuffle } from '../utils/engine';
import * as Speech from 'expo-speech';

// ── Design System ──────────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { Badge } from '../components/ui/Badge';

// ─────────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'Assessment'>;

export function AssessmentScreen({ route, navigation }: Props) {
  const { subject, gradeLevel, topic } = route.params;

  // ── Store ──────────────────────────────────────────────────────────────────
  const itemBank = useAppStore((state) => state.itemBank);
  const addLog = useAppStore((state) => state.addLog);
  const recordProgress = useAppStore((state) => state.recordProgress);
  const forcedBilingual = useAppStore(
    (state) => state.parentalControls.forcedBilingual,
  );

  // ── Feedback language state ────────────────────────────────────────────────
  const [feedbackLang, setFeedbackLang] = useState<'en' | 'fil'>(
    forcedBilingual ? 'fil' : 'en',
  );

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
      Object.keys(topicData[diff]).forEach((cat) => {
        list.push(...topicData[diff][cat]);
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

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  // handleSubmit / handleNext require currentQuestion, so we declare them after
  // the early-return guards below.

  // ── Error state: no questions ──────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredContainer}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorEmoji}>📭</Text>
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

  // ── Speech State & Handlers ────────────────────────────────────────────────
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

  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const optionsText = currentQuestion.options
        .map((opt, idx) => `Option ${String.fromCharCode(65 + idx)}: ${opt}`)
        .join('. ');
      const textToSpeak = `${currentQuestion.questionText}. ${optionsText}`;
      Speech.speak(textToSpeak, {
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
    setIsAnswered(true);
    addLog(`Submitted answer for ${currentQuestion.id}. Correct: ${correct}`);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      const finalScore = score;
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
    const passed = percentage >= 75;

    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.finishedScroll}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.finishedCard}>
            <Text style={styles.trophyEmoji}>🏆</Text>

            <Badge
              label={passed ? 'Passed' : 'Keep Practicing'}
              variant={passed ? 'success' : 'warning'}
              style={styles.finishedBadge}
            />

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
          </GlassCard>
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
    feedbackLang === 'fil'
      ? currentQuestion.feedback.fil
      : currentQuestion.feedback.en;

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={[styles.questionLabel, { marginBottom: 0 }]}>QUESTION</Text>
            <TouchableOpacity
              onPress={toggleSpeech}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isSpeaking ? Colors.accentPrimaryDeep : 'rgba(255, 255, 255, 0.05)',
                borderColor: isSpeaking ? Colors.accentPrimary : Colors.border,
                borderWidth: 1,
                paddingHorizontal: Spacing.md,
                minHeight: 36,
                borderRadius: Radius.full,
              }}
              accessibilityLabel="Listen to question"
            >
              <Text style={{ fontSize: 13, color: isSpeaking ? Colors.accentPrimary : Colors.textMuted, fontFamily: Fonts.bodyBold }}>
                {isSpeaking ? '🛑 Stop' : '🔊 Listen'}
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
            {/* Language toggle — hidden when forcedBilingual */}
            {!forcedBilingual && (
              <View style={styles.langToggleRow}>
                <TouchableOpacity
                  onPress={() => setFeedbackLang('en')}
                  style={[
                    styles.langPill,
                    feedbackLang === 'en' && styles.langPillActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to English feedback"
                >
                  <Text
                    style={[
                      styles.langPillText,
                      feedbackLang === 'en' && styles.langPillTextActive,
                    ]}
                  >
                    EN
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFeedbackLang('fil')}
                  style={[
                    styles.langPill,
                    feedbackLang === 'fil' && styles.langPillActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Switch to Filipino feedback"
                >
                  <Text
                    style={[
                      styles.langPillText,
                      feedbackLang === 'fil' && styles.langPillTextActive,
                    ]}
                  >
                    FIL
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Bilingual: forced shows both */}
            {forcedBilingual ? (
              <>
                <Text style={styles.feedbackResultTitle}>
                  {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </Text>
                <Text style={styles.feedbackSectionLabel}>English</Text>
                <Text style={styles.feedbackText}>
                  {currentQuestion.feedback.en}
                </Text>
                <Text
                  style={[
                    styles.feedbackSectionLabel,
                    styles.feedbackSectionGap,
                  ]}
                >
                  Filipino
                </Text>
                <Text style={styles.feedbackText}>
                  {currentQuestion.feedback.fil}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.feedbackResultTitle}>
                  {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </Text>
                <Text style={styles.feedbackText}>{feedbackText}</Text>
              </>
            )}
          </GlassCard>
        )}

        {/* ── Action buttons ── */}
        <View style={styles.actionsRow}>
          {!isAnswered ? (
            <PrimaryButton
              label="Submit Answer"
              onPress={handleSubmit}
              disabled={!selectedOption}
              style={styles.actionBtn}
            />
          ) : (
            <PrimaryButton
              label={isLastQuestion ? 'Finish Quiz 🎉' : 'Next Question →'}
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles — all colors, fonts and spacing use design system tokens only
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Screen ────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // ── Centered utility (error / finished) ───────────────────────────────────
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // ── Header / progress ─────────────────────────────────────────────────────
  header: {
    marginBottom: Spacing.lg,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerBadgeGap: {
    marginLeft: Spacing.xs,
  },
  headerTopic: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  // ── Question card ─────────────────────────────────────────────────────────
  questionCard: {
    marginBottom: Spacing.lg,
  },
  questionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xl,
    color: Colors.textMain,
    lineHeight: FontSizes.xl * 1.45,
    letterSpacing: -0.3,
  },

  // ── Options ───────────────────────────────────────────────────────────────
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
    ...Shadow.card,
  },
  // Default state
  optionDefault: {
    backgroundColor: Colors.bgCard,
    borderColor: Colors.border,
  },
  // Selected (not yet submitted)
  optionSelected: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  // Correct answer revealed
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.success,
  },
  // Wrong selected answer revealed
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.danger,
  },
  // Letter badge
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetter: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  // Option text
  optionText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    flex: 1,
    lineHeight: FontSizes.md * 1.5,
  },
  optionTextSelected: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodyMedium,
  },
  optionTextCorrect: {
    color: Colors.success,
    fontFamily: Fonts.bodyMedium,
  },
  optionTextWrong: {
    color: Colors.danger,
    fontFamily: Fonts.bodyMedium,
  },

  // ── Feedback card ─────────────────────────────────────────────────────────
  feedbackCard: {
    marginBottom: Spacing.lg,
    borderColor: Colors.accentSecondary,
    borderWidth: 1,
  },
  langToggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  langPill: {
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: Colors.accentPrimaryGlow,
  },
  langPillActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  langPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: 0.8,
  },
  langPillTextActive: {
    color: Colors.white,
  },
  feedbackResultTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.accentSecondary,
    marginBottom: Spacing.sm,
  },
  feedbackSectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xxs,
  },
  feedbackSectionGap: {
    marginTop: Spacing.md,
  },
  feedbackText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: FontSizes.base * 1.7,
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  actionsRow: {
    marginBottom: Spacing.md,
  },
  actionBtn: {
    width: '100%',
  },

  // ── Error screen ──────────────────────────────────────────────────────────
  errorCard: {
    alignItems: 'center',
    width: '100%',
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorBody: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSizes.md * 1.6,
    marginBottom: Spacing['2xl'],
  },
  errorHighlight: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodySemiBold,
  },
  errorBtn: {
    width: '100%',
  },

  // ── Finished / results screen ─────────────────────────────────────────────
  finishedScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  finishedCard: {
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  finishedBadge: {
    marginBottom: Spacing.lg,
  },
  finishedTopic: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  finishedSubLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing['2xl'],
  },
  scoreRow: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreDisplay: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['4xl'],
    color: Colors.textMain,
    letterSpacing: -1,
  },
  scoreDivider: {
    fontSize: FontSizes['2xl'],
    color: Colors.textMuted,
  },
  percentageText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  finishedBtn: {
    width: '100%',
    marginTop: Spacing['2xl'],
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
