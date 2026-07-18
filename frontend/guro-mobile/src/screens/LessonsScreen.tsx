/**
 * LessonsScreen — Browse topics by subject and grade.
 * Shows per-topic progress. Tapping a topic goes to Study → Assessment.
 */

import React, { useState, useEffect } from 'react';
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
import { Inbox, Lock, WifiOff } from 'lucide-react-native';
import { isLessonLocked, LESSON_SEQUENCE } from '../utils/engine';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { LessonCard } from '../components/ui/LessonCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SyncBadge } from '../components/shared/SyncBadge';
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
  const classroomId = useAppStore((s) => s.classroomId);
  const appMode = useAppStore((s) => s.appMode);

  const activeSubjects = useAppStore((s) => s.activeSubjects || ['Mathematics', 'English']);

  const [selectedSubject, setSelectedSubject] = useState<Subject>('Mathematics');

  useEffect(() => {
    if (activeSubjects.length > 0 && !activeSubjects.includes(selectedSubject)) {
      setSelectedSubject(activeSubjects[0] as any);
    }
  }, [activeSubjects, selectedSubject]);

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

  const isEnglishLocked = (gradeLevel: number): boolean => {
    if (selectedSubject !== 'English' || !parentalControls.mathBeforeEnglish) return false;
    const mathScore = getMathAverageScore(gradeLevel);
    return mathScore < 80;
  };

  const getTopics = (): { gradeLevel: number; topic: string }[] => {
    if (!itemBank || !itemBank[selectedSubject]) return [];
    const result: { gradeLevel: number; topic: string }[] = [];
    const grades = ['4', '5', '6'];
    for (const g of grades) {
      const gradeData = itemBank[selectedSubject][g];
      if (gradeData) {
        for (const topic of Object.keys(gradeData)) {
          if (topic === 'studyContent') continue;
          result.push({ gradeLevel: parseInt(g, 10), topic });
        }
      }
    }
    return result;
  };

  const getTopicStats = (gradeLevel: number, topic: string): { completionPercent: number; bestScore: number | null } => {
    const logs = studentProgress.filter(
      (p) => p.subject === selectedSubject && p.gradeLevel === gradeLevel && p.topic === topic,
    );
    if (logs.length === 0) return { completionPercent: 0, bestScore: null };
    const scores = logs.map((l) => (l.score / l.totalQuestions) * 100);
    const best = Math.round(Math.max(...scores));
    return { completionPercent: best, bestScore: best };
  };

  const getQuestionCount = (gradeLevel: number, topic: string): number => {
    const topicData = itemBank?.[selectedSubject]?.[gradeLevel.toString()]?.[topic];
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

  const handleTopicPress = (gradeLevel: number, topic: string) => {
    if (isTimeLimitExceeded) {
      toast.warning("Time's Up! You've reached your daily screen time limit. Come back tomorrow!");
      return;
    }
    if (isEnglishLocked(gradeLevel)) {
      const mathScore = getMathAverageScore(gradeLevel);
      toast.warning(
        `Keep Practising Maths! Score at least 80% in Grade ${gradeLevel} Mathematics to unlock English. Current score: ${mathScore}%`,
      );
      return;
    }
    if (isLessonLocked(selectedSubject, gradeLevel, topic, studentProgress, preferredGrade)) {
      const seq = LESSON_SEQUENCE[selectedSubject];
      const index = seq.findIndex((item) => item.grade === gradeLevel && item.topic === topic);
      if (index > 0) {
        const prevLesson = seq[index - 1];
        toast.warning(`Score 80%+ in Grade ${prevLesson.grade} ${prevLesson.topic} first!`);
      } else {
        toast.warning("This lesson is locked.");
      }
      return;
    }
    navigation.navigate('Study', { subject: selectedSubject, gradeLevel, topic });
  };

  const topics = getTopics();

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header — O1: SyncBadge added */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Lessons</Text>
          <Text style={styles.headerSubtitle}>Select a topic to begin learning.</Text>
        </View>
        <SyncBadge />
      </View>

      {/* Subject tabs */}
      {activeSubjects.length > 0 ? (
        <View style={styles.subjectTabRow}>
          {SUBJECTS.filter((subj) => activeSubjects.includes(subj)).map((subj) => {
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
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* English lock notice */}
        {isEnglishLocked(preferredGrade) && (
          <GlassCard padding={Spacing.md} style={{ borderColor: Colors.warningBorder, gap: Spacing.xs, marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Lock size={16} color={Colors.warning} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.warning }}>
                English is locked
              </Text>
            </View>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
              Score 80%+ in Grade {preferredGrade} Mathematics to unlock.
              Your Maths score: {getMathAverageScore(preferredGrade)}%
            </Text>
          </GlassCard>
        )}

        <SectionHeader
          title={`${selectedSubject} Topics`}
          subtitle={`${topics.length} available`}
        />

        {topics.length === 0 ? (
          // O3: Differentiated empty states by context
          !classroomId ? (
            <GlassCard variant="subtle" padding={Spacing.xl} style={{ alignItems: 'center', gap: Spacing.sm }}>
              <Inbox size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Classroom Linked</Text>
              <Text style={styles.emptySubtitle}>
                Ask your teacher for an invite code and enter it on the Home tab to load your lessons.
              </Text>
            </GlassCard>
          ) : appMode === 'offline' ? (
            <GlassCard variant="subtle" padding={Spacing.xl} style={{ alignItems: 'center', gap: Spacing.sm }}>
              <WifiOff size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Lessons Available Offline</Text>
              <Text style={styles.emptySubtitle}>
                Connect to the internet to download your lessons from your teacher.
              </Text>
            </GlassCard>
          ) : (
            <GlassCard variant="subtle" padding={Spacing.xl} style={{ alignItems: 'center', gap: Spacing.sm }}>
              <Inbox size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {activeSubjects.length === 0 ? 'No Active Subjects' : 'No Topics Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeSubjects.length === 0
                  ? 'Your teacher has not activated any subjects for your grade level yet.'
                  : "Pull down to refresh and load your teacher's activities."}
              </Text>
            </GlassCard>
          )
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {topics.map(({ gradeLevel, topic }) => {
              const { completionPercent, bestScore } = getTopicStats(gradeLevel, topic);
              const questionCount = getQuestionCount(gradeLevel, topic);
              const isProgLocked = isLessonLocked(selectedSubject, gradeLevel, topic, studentProgress, preferredGrade);
              const isEngLocked = isEnglishLocked(gradeLevel);
              const isLocked = isProgLocked || isEngLocked;

              let lockReason = undefined;
              if (isEngLocked) {
                const mathScore = getMathAverageScore(gradeLevel);
                lockReason = `Reach 80% in Math first (${mathScore}% now)`;
              } else if (isProgLocked) {
                const seq = LESSON_SEQUENCE[selectedSubject];
                const index = seq.findIndex((item) => item.grade === gradeLevel && item.topic === topic);
                if (index > 0) {
                  const prevLesson = seq[index - 1];
                  lockReason = `Score 80%+ in Grade ${prevLesson.grade} ${prevLesson.topic} first`;
                } else {
                  lockReason = 'Locked';
                }
              }

              return (
                <LessonCard
                  key={topic}
                  topic={topic}
                  subject={selectedSubject}
                  gradeLevel={gradeLevel}
                  completionPercent={completionPercent}
                  bestScore={bestScore}
                  questionCount={questionCount}
                  isLocked={isLocked}
                  lockReason={lockReason}
                  onPress={() => handleTopicPress(gradeLevel, topic)}
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
