/**
 * LessonsScreen — Browse topics by subject and grade.
 * Shows per-topic progress. Tapping a topic goes to Study → Assessment.
 */

import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { Inbox, Lock } from 'lucide-react-native';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { LessonCard } from '../components/ui/LessonCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { styles } from '../styles/LessonsScreen.styles';
import { toast } from '../components';

const GRADES = [4, 5, 6] as const;
type Grade = (typeof GRADES)[number];

const SUBJECTS = ['Mathematics', 'English'] as const;
type Subject = (typeof SUBJECTS)[number];

export function LessonsScreen() {
  const navigation = useNavigation<any>();

  const itemBank = useAppStore((s) => s.itemBank);
  const studentProgress = useAppStore((s) => s.studentProgress);
  const parentalControls = useAppStore((s) => s.parentalControls);
  const dailyMinutesUsed = useAppStore((s) => s.dailyMinutesUsed);
  const preferredGrade = useAppStore((s) => s.preferredGrade || 4);
  const setPreferredGrade = useAppStore((s) => s.setPreferredGrade);

  const [selectedGrade, setSelectedGrade] = useState<Grade>(
    GRADES.includes(preferredGrade as Grade) ? (preferredGrade as Grade) : 4,
  );
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');

  const isTimeLimitExceeded =
    parentalControls.dailyTimeLimit > 0 && dailyMinutesUsed >= parentalControls.dailyTimeLimit;

  const getMathAverageScore = (grade: number): number => {
    const logs = studentProgress.filter(
      (p) => p.subject === 'Mathematics' && p.gradeLevel === grade,
    );
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, p) => acc + (p.score / p.totalQuestions) * 100, 0);
    return Math.round(sum / logs.length);
  };

  const mathScore = getMathAverageScore(selectedGrade);
  const isEnglishLocked =
    selectedSubject === 'English' && parentalControls.mathBeforeEnglish && mathScore < 80;

  const getTopics = (): string[] => {
    const gradeData = itemBank?.[selectedSubject]?.[selectedGrade.toString()];
    if (!gradeData) return [];
    return Object.keys(gradeData);
  };

  const getTopicStats = (topic: string): { completionPercent: number; bestScore: number | null } => {
    const logs = studentProgress.filter(
      (p) => p.subject === selectedSubject && p.gradeLevel === selectedGrade && p.topic === topic,
    );
    if (logs.length === 0) return { completionPercent: 0, bestScore: null };
    const scores = logs.map((l) => (l.score / l.totalQuestions) * 100);
    const best = Math.round(Math.max(...scores));
    return { completionPercent: best, bestScore: best };
  };

  const getQuestionCount = (topic: string): number => {
    const topicData = itemBank?.[selectedSubject]?.[selectedGrade.toString()]?.[topic];
    if (!topicData) return 0;
    let count = 0;
    for (const key of Object.keys(topicData)) {
      if (key === 'studyContent') continue;
      const diffData = topicData[key] as Record<string, unknown[]>;
      for (const cat of Object.values(diffData)) {
        if (Array.isArray(cat)) count += cat.length;
      }
    }
    return count;
  };

  const handleTopicPress = (topic: string) => {
    if (isTimeLimitExceeded) {
      toast.warning("Time's Up! You've reached your daily screen time limit. Come back tomorrow!");
      return;
    }
    if (isEnglishLocked) {
      toast.warning(
        `Keep Practising Maths! Score at least 80% in Grade ${selectedGrade} Mathematics to unlock English. Current score: ${mathScore}%`,
      );
      return;
    }
    navigation.navigate('Study', { subject: selectedSubject, gradeLevel: selectedGrade, topic });
  };

  const topics = getTopics();

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Lessons</Text>
        <Text style={styles.headerSubtitle}>Select a topic to begin learning.</Text>
      </View>

      {/* Subject tabs */}
      <View style={styles.subjectTabRow}>
        {SUBJECTS.map((subj) => {
          const active = subj === selectedSubject;
          return (
            <TouchableOpacity
              key={subj}
              onPress={() => setSelectedSubject(subj)}
              activeOpacity={0.75}
              style={[styles.subjectTab, active && styles.subjectTabActive]}
              accessibilityLabel={subj}
            >
              <Text style={[styles.subjectTabText, active && styles.subjectTabTextActive]}>
                {subj}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grade pills */}
      <View style={styles.gradePillRow}>
        {GRADES.map((g) => {
          const active = g === selectedGrade;
          return (
            <TouchableOpacity
              key={g}
              onPress={() => { setSelectedGrade(g); setPreferredGrade(g); }}
              activeOpacity={0.75}
              style={[styles.gradePill, active && styles.gradePillActive]}
            >
              <Text style={[styles.gradePillText, active && styles.gradePillTextActive]}>
                Grade {g}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* English lock notice */}
        {isEnglishLocked && (
          <GlassCard padding={Spacing.md} style={{ borderColor: Colors.warningBorder, gap: Spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Lock size={16} color={Colors.warning} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.warning }}>
                English is locked
              </Text>
            </View>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
              Score 80%+ in Grade {selectedGrade} Mathematics to unlock.
              Your Maths score: {mathScore}%
            </Text>
          </GlassCard>
        )}

        <SectionHeader
          title={`${selectedSubject} Topics`}
          subtitle={`Grade ${selectedGrade} · ${topics.length} available`}
        />

        {topics.length === 0 ? (
          <GlassCard variant="subtle" padding={Spacing.xl} style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Inbox size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Topics Yet</Text>
            <Text style={styles.emptySubtitle}>
              Link a classroom from your Profile tab to load activities from your teacher.
            </Text>
          </GlassCard>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {topics.map((topic) => {
              const { completionPercent, bestScore } = getTopicStats(topic);
              const questionCount = getQuestionCount(topic);
              return (
                <LessonCard
                  key={topic}
                  topic={topic}
                  subject={selectedSubject}
                  gradeLevel={selectedGrade}
                  completionPercent={completionPercent}
                  bestScore={bestScore}
                  questionCount={questionCount}
                  isLocked={isEnglishLocked}
                  lockReason={isEnglishLocked ? `Reach 80% in Math first (${mathScore}% now)` : undefined}
                  onPress={() => handleTopicPress(topic)}
                  accessibilityLabel={`Start ${topic}`}
                />
              );
            })}
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
