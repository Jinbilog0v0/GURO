import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

// ── Design System ──────────────────────────────────────────────────────────────
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { Colors } from '../theme/colors';
import { styles } from '../styles/StudyScreen.styles';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import {
  Rocket,
  BookOpen,
  Lightbulb,
  Square,
  Volume2,
  Sparkles,
  CheckCircle,
  WifiOff,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Study'>;

interface Slide {
  type: 'intro' | 'definition' | 'refresher' | 'summary' | 'completed';
  title: string;
  data: any;
  refresherIndex?: number;
}

export function StudyScreen({ route, navigation }: Props) {
  const { subject, gradeLevel, topic } = route.params;

  // ── Store ──────────────────────────────────────────────────────────────────
  const itemBank = useAppStore((state) => state.itemBank);

  // ── Slides State ───────────────────────────────────────────────────────────
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedRefresherOpt, setSelectedRefresherOpt] = useState<Record<number, string>>({});
  const [refresherChecked, setRefresherChecked] = useState<Record<number, boolean>>({});

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

  const slides = React.useMemo(() => {
    if (!studyContent) return [];
    const list: Slide[] = [];

    // 1. Introduction Slide
    if (studyContent.introduction) {
      list.push({
        type: 'intro',
        title: 'Introduction',
        data: studyContent.introduction,
      });
    }

    // 2. Interleave Definitions and Refresher Questions
    const definitions = studyContent.definitions || [];
    const refreshers = studyContent.refresherQuiz || [];
    const maxLen = Math.max(definitions.length, refreshers.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < definitions.length) {
        list.push({
          type: 'definition',
          title: `Concept: ${definitions[i].term}`,
          data: definitions[i],
        });
      }
      if (i < refreshers.length) {
        list.push({
          type: 'refresher',
          title: 'Quick Check!',
          data: refreshers[i],
          refresherIndex: i,
        });
      }
    }

    // 3. Summary Slide
    if (studyContent.summary && studyContent.summary.length > 0) {
      list.push({
        type: 'summary',
        title: 'Recap Summary',
        data: studyContent.summary,
      });
    }

    // 4. Completed Slide
    list.push({
      type: 'completed',
      title: 'Completed!',
      data: null,
    });

    return list;
  }, [studyContent]);

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

    const currentItem = slides[currentSlide];
    if (!currentItem) return;

    let textToSpeak = '';
    if (currentItem.type === 'intro') {
      textToSpeak = `${topic} Introduction. ${currentItem.data}`;
    } else if (currentItem.type === 'definition') {
      const examplesText = currentItem.data.examples && currentItem.data.examples.length > 0
        ? `Examples include: ${currentItem.data.examples.join(', ')}.`
        : '';
      textToSpeak = `${currentItem.data.term}. Definition: ${currentItem.data.definition}. ${examplesText}`;
    } else if (currentItem.type === 'refresher') {
      textToSpeak = `Quick Check. ${currentItem.data.questionText}`;
    } else if (currentItem.type === 'summary') {
      textToSpeak = `Recap Summary. ${currentItem.data.join('. ')}`;
    } else if (currentItem.type === 'completed') {
      textToSpeak = "Awesome job! You completed the interactive lesson. You are now ready to take the quiz.";
    }

    if (!textToSpeak) return;

    setIsSpeaking(true);
    const rate = useAppStore.getState().speechRate || 1.0;
    Speech.speak(textToSpeak.replace(/_+/g, ' blank '), {
      rate,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  // ── Fallback if study content is empty ─────────────────────────────────────
  if (!studyContent || slides.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Badge label={subject} variant="indigo" style={styles.badge} />
            <Text style={styles.title}>{topic}</Text>
            <Text style={styles.subtitle}>Grade {gradeLevel}</Text>
          </View>
          
          <GlassCard style={styles.fallbackCard}>
            <Rocket size={48} color={Colors.accentPrimary} style={{ marginBottom: 16 }} />
            <Text style={styles.fallbackTitle}>Ready for the Quiz!</Text>
            <Text style={styles.fallbackText}>
              There is no reading material for this topic yet, but you are ready to jump straight into practice!
            </Text>
            <PrimaryButton
              label="Start Practice Quiz"
              icon={<Rocket size={16} color={Colors.white} style={{ marginRight: 6 }} />}
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
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;
  const currentItem = slides[currentSlide];

  return (
    <SafeAreaView style={styles.screen}>
      {/* Progress Bar & Indicators */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabelRow}>
          {/* Wrapped in string template to ensure Jest serializes as a single string */}
          <Text style={styles.progressText}>{`Step ${currentSlide + 1} of ${slides.length}`}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {currentItem.type === 'intro' ? (
              <BookOpen size={16} color={Colors.accentPrimary} />
            ) : currentItem.type === 'definition' ? (
              <Lightbulb size={16} color={Colors.accentPrimary} />
            ) : currentItem.type === 'refresher' ? (
              <HelpCircle size={16} color={Colors.accentPrimary} />
            ) : currentItem.type === 'summary' ? (
              <Sparkles size={16} color={Colors.accentPrimary} />
            ) : (
              <CheckCircle size={16} color={Colors.accentPrimary} />
            )}
            <Text style={styles.stepTitleText}>
              {currentItem.type === 'intro'
                ? 'Introduction'
                : currentItem.type === 'definition'
                ? 'Concept Card'
                : currentItem.type === 'refresher'
                ? 'Quick Check'
                : currentItem.type === 'summary'
                ? 'Recap Summary'
                : 'Finished!'}
            </Text>
          </View>
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
            <SyncBadge />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                <WifiOff size={10} color={Colors.success} />
                <Text style={{ fontFamily: styles.ttsIcon.fontFamily, fontSize: 10, color: Colors.success }}>Offline ✓</Text>
              </View>
              <TouchableOpacity onPress={toggleSpeech} style={[styles.ttsIconBtn, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                {isSpeaking ? (
                  <Square size={14} color={subject === 'Mathematics' ? Colors.accentPrimary : Colors.accentSecondary} />
                ) : (
                  <Volume2 size={14} color={subject === 'Mathematics' ? Colors.accentPrimary : Colors.accentSecondary} />
                )}
                <Text style={[styles.ttsIcon, { color: subject === 'Mathematics' ? Colors.accentPrimary : Colors.accentSecondary }]}>
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.title}>{topic}</Text>
        </View>

        {/* ── SLIDE DISPLAY DISPATCHER ────────────────────────────────────── */}
        {currentItem.type === 'intro' && (
          <GlassCard style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <BookOpen size={14} color={Colors.accentPrimary} />
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>INTRODUCTION</Text>
            </View>
            <Text style={styles.introText}>{currentItem.data}</Text>
          </GlassCard>
        )}

        {currentItem.type === 'definition' && (
          <GlassCard style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Lightbulb size={14} color={Colors.accentPrimary} />
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>CONCEPT CARD</Text>
            </View>
            
            <View style={{ backgroundColor: 'rgba(6, 182, 212, 0.04)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.15)', marginBottom: 16 }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.accentPrimary, marginBottom: 8 }}>
                {currentItem.data.term}
              </Text>
              <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.base, color: Colors.textMain, lineHeight: 22 }}>
                {currentItem.data.definition}
              </Text>
            </View>

            {currentItem.data.examples && currentItem.data.examples.length > 0 && (
              <View style={styles.examplesContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <Sparkles size={14} color={Colors.warning} />
                  <Text style={[styles.examplesLabel, { marginBottom: 0 }]}>Examples:</Text>
                </View>
                {currentItem.data.examples.map((ex: string, exIdx: number) => (
                  <View key={exIdx} style={styles.exampleRow}>
                    <Sparkles size={12} color={Colors.warning} style={{ marginRight: 6, marginTop: 4 }} />
                    <Text style={styles.exampleText}>{ex}</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {currentItem.type === 'refresher' && (
          <GlassCard style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <HelpCircle size={14} color={Colors.warning} />
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>QUICK CHECK</Text>
            </View>
            
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain, marginBottom: 16 }}>
              {currentItem.data.questionText}
            </Text>
            
            <View style={{ gap: 10, marginBottom: 16 }}>
              {currentItem.data.options.map((opt: string) => {
                const rIdx = currentItem.refresherIndex ?? 0;
                const selected = selectedRefresherOpt[rIdx];
                const isOptSelected = selected === opt;
                const hasChecked = refresherChecked[rIdx];

                let btnBg: string = Colors.bgCard;
                let btnBorder: string = Colors.border;
                let txtColor: string = Colors.textMain;

                if (hasChecked) {
                  if (opt === currentItem.data.correctAnswer) {
                    btnBg = 'rgba(16, 185, 129, 0.08)';
                    btnBorder = Colors.success;
                    txtColor = Colors.success;
                  } else if (isOptSelected) {
                    btnBg = 'rgba(239, 68, 68, 0.08)';
                    btnBorder = Colors.danger;
                    txtColor = Colors.danger;
                  } else {
                    btnBg = Colors.bgCard;
                    btnBorder = Colors.border;
                    txtColor = Colors.textMuted;
                  }
                } else if (isOptSelected) {
                  btnBg = 'rgba(234, 179, 8, 0.08)';
                  btnBorder = '#EAB308';
                  txtColor = '#EAB308';
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    disabled={hasChecked}
                    onPress={() => setSelectedRefresherOpt(prev => ({ ...prev, [rIdx]: opt }))}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: Radius.lg,
                      borderWidth: 2,
                      borderColor: btnBorder,
                      backgroundColor: btnBg,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.base, color: txtColor, textAlign: 'left' }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {refresherChecked[currentItem.refresherIndex ?? 0] && (
              <View style={{
                padding: 14,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: selectedRefresherOpt[currentItem.refresherIndex ?? 0] === currentItem.data.correctAnswer ? Colors.success : Colors.danger,
                backgroundColor: selectedRefresherOpt[currentItem.refresherIndex ?? 0] === currentItem.data.correctAnswer ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                marginTop: 8,
              }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.sm, color: selectedRefresherOpt[currentItem.refresherIndex ?? 0] === currentItem.data.correctAnswer ? Colors.success : Colors.danger, marginBottom: 4 }}>
                  {selectedRefresherOpt[currentItem.refresherIndex ?? 0] === currentItem.data.correctAnswer ? '✨ Correct!' : '❌ Keep learning!'}
                </Text>
                <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                  {currentItem.data.explanation}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {currentItem.type === 'summary' && (
          <GlassCard style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Sparkles size={14} color={Colors.accentPrimary} />
              <Text style={[styles.cardLabel, { marginBottom: 0 }]}>KEY TAKEAWAYS</Text>
            </View>
            {currentItem.data.map((point: string, idx: number) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 6, backgroundColor: Colors.bgInput, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentPrimary, marginTop: 6 }} />
                <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.sm, color: Colors.textMain, flex: 1, lineHeight: 18 }}>
                  {point}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        {currentItem.type === 'completed' && (
          <GlassCard style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CheckCircle size={36} color={Colors.success} />
            </View>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain, textAlign: 'center', marginBottom: 8 }}>
              Lesson Completed! 🎉
            </Text>
            <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 }}>
              You completed all interactive checkpoints in the guide. Good luck on your Diagnostic challenge!
            </Text>
          </GlassCard>
        )}

        {/* ── Slide Navigation Buttons ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20, marginBottom: 40 }}>
          <SecondaryButton
            label={currentSlide > 0 ? '← Back' : '← Lessons'}
            icon={<ChevronLeft size={16} color={Colors.textMuted} />}
            onPress={() => {
              if (currentSlide > 0) {
                try {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                } catch (e) {}
                setCurrentSlide(currentSlide - 1);
              } else {
                navigation.goBack();
              }
            }}
            style={{ flex: 1 }}
          />

          {currentItem.type === 'completed' ? (
            <PrimaryButton
              label="Start Quiz!"
              icon={<ChevronRight size={16} color={Colors.white} />}
              onPress={handleStartQuiz}
              style={{ flex: 1.3 }}
            />
          ) : currentItem.type === 'refresher' ? (
            (() => {
              const rIdx = currentItem.refresherIndex ?? 0;
              const selected = selectedRefresherOpt[rIdx];
              const hasChecked = refresherChecked[rIdx];

              if (!hasChecked) {
                return (
                  <TouchableOpacity
                    disabled={!selected}
                    onPress={() => {
                      try {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                      } catch (e) {}
                      setRefresherChecked(prev => ({ ...prev, [rIdx]: true }));
                      Haptics.notificationAsync(
                        selected === currentItem.data.correctAnswer
                          ? Haptics.NotificationFeedbackType.Success
                          : Haptics.NotificationFeedbackType.Error
                      ).catch(() => {});
                    }}
                    style={{
                      flex: 1.3,
                      backgroundColor: selected ? Colors.warning : 'rgba(234,179,8,0.3)',
                      borderRadius: Radius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: Spacing.md,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.white }}>
                      Check Answer
                    </Text>
                  </TouchableOpacity>
                );
              } else {
                return (
                  <PrimaryButton
                    label="Next →"
                    icon={<ChevronRight size={16} color={Colors.white} />}
                    onPress={() => {
                      try {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      } catch (e) {}
                      setCurrentSlide(currentSlide + 1);
                    }}
                    style={{ flex: 1.3 }}
                  />
                );
              }
            })()
          ) : (
            <PrimaryButton
              label="Next →"
              icon={<ChevronRight size={16} color={Colors.white} />}
              onPress={() => {
                try {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                } catch (e) {}
                setCurrentSlide(currentSlide + 1);
              }}
              style={{ flex: 1.3 }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
