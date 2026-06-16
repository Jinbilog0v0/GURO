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
import { useAppStore } from '../store/useAppStore';
import * as Speech from 'expo-speech';

// ── Design System ──────────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { Badge } from '../components/ui/Badge';

type Props = NativeStackScreenProps<RootStackParamList, 'Study'>;

export function StudyScreen({ route, navigation }: Props) {
  const { subject, gradeLevel, topic } = route.params;

  // ── Store ──────────────────────────────────────────────────────────────────
  const itemBank = useAppStore((state) => state.itemBank);

  // ── Slides State ───────────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0); // 0 = Intro, 1 = Definitions, 2 = Summary
  const [expandedDefinitions, setExpandedDefinitions] = useState<Record<number, boolean>>({ 0: true });
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Active-minutes tracker ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().trackActiveMinutes(0.25);
    }, 15000);
    return () => {
      clearInterval(interval);
      Speech.stop();
    };
  }, []);

  // Stop speech when sliding between steps
  useEffect(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, [currentSlide]);

  // ── Load study content ──────────────────────────────────────────────────────
  const subjectData = itemBank?.[subject];
  const gradeData = subjectData?.[gradeLevel.toString()];
  const topicData = gradeData?.[topic];
  const studyContent = topicData?.studyContent;

  const handleStartQuiz = () => {
    Speech.stop();
    navigation.navigate('Assessment', { subject, gradeLevel, topic });
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    if (!studyContent) return;

    let textToSpeak = '';
    if (currentSlide === 0) {
      textToSpeak = `${topic} Introduction. ${studyContent.introduction}`;
    } else if (currentSlide === 1) {
      textToSpeak = `Let's learn key terms. ` + studyContent.definitions.map((def, idx) => {
        const num = idx + 1;
        const examplesText = def.examples && def.examples.length > 0
          ? `Examples include: ${def.examples.join(', ')}.`
          : '';
        return `Term ${num}: ${def.term}. Definition: ${def.definition}. ${examplesText}`;
      }).join(' ');
    } else if (currentSlide === 2) {
      textToSpeak = `Here is a summary. ` + studyContent.summary.join('. ');
    }

    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  // Speak single term definition and examples
  const speakSingleTerm = (term: string, definition: string, examples: string[]) => {
    Speech.stop();
    setIsSpeaking(true);
    const examplesText = examples && examples.length > 0
      ? `For example: ${examples.join(', ')}.`
      : '';
    const text = `${term}. ${definition}. ${examplesText}`;
    Speech.speak(text, {
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const toggleExpandDefinition = (idx: number) => {
    setExpandedDefinitions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // ── Fallback if study content is empty ─────────────────────────────────────
  if (!studyContent) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Badge label={subject} variant="indigo" style={styles.badge} />
            <Text style={styles.title}>{topic}</Text>
            <Text style={styles.subtitle}>Grade {gradeLevel}</Text>
          </View>
          
          <GlassCard style={styles.fallbackCard}>
            <Text style={styles.fallbackEmoji}>🚀</Text>
            <Text style={styles.fallbackTitle}>Ready for the Quiz!</Text>
            <Text style={styles.fallbackText}>
              There is no reading material for this topic yet, but you are ready to jump straight into practice!
            </Text>
            <PrimaryButton
              label="Start Practice Quiz 🚀"
              onPress={handleStartQuiz}
              style={styles.fallbackButton}
            />
            <SecondaryButton
              label="Back to Dashboard"
              onPress={() => navigation.goBack()}
              style={styles.fallbackButton}
            />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render progress header ────────────────────────────────────────────────
  const progressPercent = ((currentSlide + 1) / 3) * 100;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Progress Bar & Indicators */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressText}>Step {currentSlide + 1} of 3</Text>
          <Text style={styles.stepTitleText}>
            {currentSlide === 0 ? '📖 Introduction' : currentSlide === 1 ? '💡 Key Terms' : '🚀 Recap Summary'}
          </Text>
        </View>
        <View style={styles.progressBackground}>
          <View style={[styles.progressIndicator, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Topic Info Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Badge label={subject} variant="indigo" style={styles.badge} />
            <TouchableOpacity onPress={toggleSpeech} style={styles.ttsIconBtn}>
              <Text style={styles.ttsIcon}>{isSpeaking ? '⏹️ Stop' : '🔊 Listen'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>{topic}</Text>
        </View>

        {/* ── SLIDE 1: INTRODUCTION ─────────────────────────────────────────── */}
        {currentSlide === 0 && (
          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>LET'S READ 📖</Text>
            <Text style={styles.introText}>{studyContent.introduction}</Text>
          </GlassCard>
        )}

        {/* ── SLIDE 2: DEFINITIONS & EXAMPLES ───────────────────────────────── */}
        {currentSlide === 1 && (
          <View style={styles.definitionsWrapper}>
            <Text style={styles.instructionText}>👇 Tap cards to show examples and explanations!</Text>
            {studyContent.definitions.map((def, idx) => {
              const isExpanded = !!expandedDefinitions[idx];
              return (
                <GlassCard key={idx} style={styles.defCard} padding={0}>
                  <TouchableOpacity
                    onPress={() => toggleExpandDefinition(idx)}
                    activeOpacity={0.8}
                    style={styles.defHeader}
                  >
                    <View style={styles.defTitleRow}>
                      <Text style={styles.defEmoji}>{isExpanded ? '📖' : '📘'}</Text>
                      <Text style={styles.defTerm}>{def.term}</Text>
                    </View>
                    <Text style={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.defBody}>
                      <Text style={styles.defText}>{def.definition}</Text>
                      
                      {def.examples && def.examples.length > 0 && (
                        <View style={styles.examplesContainer}>
                          <Text style={styles.examplesLabel}>🌟 Examples:</Text>
                          {def.examples.map((ex, exIdx) => (
                            <View key={exIdx} style={styles.exampleRow}>
                              <Text style={styles.exampleBullet}>✨</Text>
                              <Text style={styles.exampleText}>{ex}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <TouchableOpacity 
                        onPress={() => speakSingleTerm(def.term, def.definition, def.examples)} 
                        style={styles.speakerBtn}
                      >
                        <Text style={styles.speakerBtnText}>🔊 Read This Aloud</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ── SLIDE 3: SUMMARY & RECAP ─────────────────────────────────────── */}
        {currentSlide === 2 && (
          <GlassCard style={styles.card}>
            <Text style={styles.cardLabel}>QUICK SUMMARY 🚀</Text>
            <Text style={styles.summaryIntro}>Before taking the quiz, remember these key points:</Text>
            {studyContent.summary.map((point, idx) => (
              <View key={idx} style={styles.summaryRow}>
                <Text style={styles.summaryBullet}>✅</Text>
                <Text style={styles.summaryText}>{point}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── NAVIGATION BUTTONS BAR ────────────────────────────────────────── */}
      <View style={styles.navBar}>
        {currentSlide > 0 ? (
          <SecondaryButton
            label="← Back"
            onPress={() => setCurrentSlide(prev => prev - 1)}
            style={styles.navBtnHalf}
          />
        ) : (
          <SecondaryButton
            label="Close"
            onPress={() => navigation.goBack()}
            style={styles.navBtnHalf}
          />
        )}

        {currentSlide < 2 ? (
          <PrimaryButton
            label="Next →"
            onPress={() => setCurrentSlide(prev => prev + 1)}
            style={styles.navBtnHalf}
          />
        ) : (
          <PrimaryButton
            label="Start Quiz! 🚀"
            onPress={handleStartQuiz}
            style={styles.navBtnHalf}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.accentPrimary,
  },
  stepTitleText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.accentPrimary,
  },
  scrollContainer: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  ttsIconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ttsIcon: {
    color: Colors.accentSecondary,
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.sm,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.textMain,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  cardLabel: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  introText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    lineHeight: FontSizes.lg * 1.6,
  },
  definitionsWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  instructionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  defCard: {
    overflow: 'hidden',
  },
  defHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  defTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  defEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  defTerm: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    flex: 1,
  },
  expandChevron: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontFamily: Fonts.display,
  },
  defBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Spacing.md,
  },
  defText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    lineHeight: FontSizes.md * 1.5,
    marginBottom: Spacing.md,
  },
  examplesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: Spacing.md,
  },
  examplesLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.base,
    color: Colors.accentSecondary,
    marginBottom: Spacing.xs,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exampleBullet: {
    fontSize: 12,
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  exampleText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: FontSizes.base * 1.4,
  },
  speakerBtn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  speakerBtnText: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
  },
  summaryIntro: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  summaryBullet: {
    fontSize: 16,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  summaryText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    flex: 1,
    lineHeight: FontSizes.lg * 1.5,
  },
  fallbackCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  fallbackEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  fallbackTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['2xl'],
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  fallbackText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: FontSizes.md * 1.5,
  },
  fallbackButton: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    backgroundColor: Colors.bgSidebar,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  navBtnHalf: {
    flex: 1,
  },
  bottomSpacer: {
    height: Spacing['3xl'],
  },
});
