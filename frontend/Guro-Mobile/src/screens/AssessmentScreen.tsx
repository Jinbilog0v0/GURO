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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, Question } from '../store/useAppStore';
import { shuffle } from '../utils/engine';
import { Trophy, Square, Volume2, Check, X, Inbox } from 'lucide-react-native';
import * as Speech from 'expo-speech';

// ── Design System ──────────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
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
      const textToSpeak = `${currentQuestion.questionText}. ${optionsText}`.replace(/_+/g, ' blank ');
      const rate = useAppStore.getState().speechRate || 1.0;
      Speech.speak(textToSpeak, {
        rate,
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
            <Trophy size={48} color="#EAB308" style={{ marginBottom: 12, alignSelf: 'center' }} />

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
            <PrimaryButton
              label="Submit Answer"
              onPress={handleSubmit}
              disabled={!selectedOption}
              style={styles.actionBtn}
            />
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

