/**
 * StudentDashboard — Home tab.
 * Shows a greeting, XP/level card, quick stats, today's recommended lesson,
 * and a quick-action grid. Topic browsing lives in the Lessons tab.
 */

import React, { useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import {
  Hand,
  BookOpen,
  Hourglass,
  Flame,
  Rocket,
  Inbox,
  Play,
  ChevronRight,
} from 'lucide-react-native';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { Badges } from '../theme/styles';
import { GlassCard } from '../components/ui/GlassCard';
import { SyncBadge } from '../components/shared/SyncBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { styles } from '../styles/StudentDashboard.styles';

const OUTFIT_EMOJIS: Record<string, string> = {
  default: '',
  detective_hat: '🕵️‍♂️',
  space_visor: '👨‍🚀',
  wizard_cape: '🧙‍♂️',
  crown: '👑',
};

export function StudentDashboard() {
  const navigation = useNavigation<any>();

  const itemBank = useAppStore((s) => s.itemBank);
  const parentalControls = useAppStore((s) => s.parentalControls);
  const studentProgress = useAppStore((s) => s.studentProgress);
  const dailyMinutesUsed = useAppStore((s) => s.dailyMinutesUsed);
  const currentUser = useAppStore((s) => s.currentUser);
  const guestName = useAppStore((s) => s.guestName);
  const streakCount = useAppStore((s) => s.streakCount || 0);
  const avatarEmoji = useAppStore((s) => s.avatarEmoji);
  const xpPoints = useAppStore((s) => s.xpPoints || 0);
  const virtualStars = useAppStore((s) => s.virtualStars || 0);
  const mascotOutfit = useAppStore((s) => s.mascotOutfit || 'default');
  const preferredGrade = useAppStore((s) => s.preferredGrade || 4);

  const outfitEmoji = OUTFIT_EMOJIS[mascotOutfit] || '';
  const level = Math.floor(xpPoints / 100) + 1;
  const xpInLevel = xpPoints % 100;
  const studentName = guestName ?? currentUser?.name ?? 'Explorer';

  const isTimeLimitExceeded =
    parentalControls.dailyTimeLimit > 0 &&
    dailyMinutesUsed >= parentalControls.dailyTimeLimit;

  // Screen time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().trackActiveMinutes(0.25);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Intercept Android hardware back (prevent escaping to Login)
  useEffect(() => {
    const onBack = () => true;
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []);

  // Smart recommended: needs-improvement (40–79%) first, then unattempted.
  // Grade order: student's preferredGrade first. Subject order: weaker subject first.
  const recommended = (() => {
    if (!itemBank) return null;

    const getBestRatio = (subject: string, grade: number, topic: string): number | null => {
      const logs = studentProgress.filter(
        (p) => p.subject === subject && p.gradeLevel === grade && p.topic === topic,
      );
      if (logs.length === 0) return null;
      return Math.max(...logs.map((p) => p.score / p.totalQuestions));
    };

    const getSubjectAvg = (subject: string): number => {
      const logs = studentProgress.filter((p) => p.subject === subject);
      if (logs.length === 0) return -1;
      return logs.reduce((acc, p) => acc + p.score / p.totalQuestions, 0) / logs.length;
    };

    const gradeOrder = [preferredGrade, ...[4, 5, 6].filter((g) => g !== preferredGrade)];
    const mathAvg = getSubjectAvg('Mathematics');
    const engAvg = getSubjectAvg('English');
    const subjectOrder = mathAvg <= engAvg ? ['Mathematics', 'English'] : ['English', 'Mathematics'];

    let improvable: { subject: string; gradeLevel: number; topic: string } | null = null;
    let unattempted: { subject: string; gradeLevel: number; topic: string } | null = null;

    for (const grade of gradeOrder) {
      for (const subject of subjectOrder) {
        const gradeData = itemBank[subject]?.[grade.toString()];
        if (!gradeData) continue;
        for (const topic of Object.keys(gradeData)) {
          if (topic === 'studyContent') continue;
          const best = getBestRatio(subject, grade, topic);
          if (best === null) {
            if (!unattempted) unattempted = { subject, gradeLevel: grade, topic };
          } else if (best >= 0.4 && best < 0.8) {
            if (!improvable) improvable = { subject, gradeLevel: grade, topic };
          }
        }
      }
    }

    return improvable ?? unattempted;
  })();

  // Most recent quiz attempt for "Continue Learning" card
  const lastActivity = studentProgress.length > 0
    ? studentProgress.reduce((a, b) =>
        new Date(a.timestamp) > new Date(b.timestamp) ? a : b,
      )
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Text style={styles.welcomeText}>Hello, {studentName}!</Text>
            <Hand size={18} color={Colors.accentPrimary} />
          </View>
          <Text style={styles.subWelcomeText}>What will you learn today?</Text>
        </View>
        <SyncBadge />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Time-limit banner */}
        {isTimeLimitExceeded && (
          <GlassCard style={styles.timeBanner} padding={Spacing.md}>
            <View style={[Badges.base, Badges.danger, { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }]}>
              <Hourglass size={12} color={Colors.dangerText} />
              <Text style={[Badges.text, Badges.dangerText]}>Time Limit Reached</Text>
            </View>
            <Text style={styles.timeBannerText}>
              You've used {Math.round(dailyMinutesUsed)} / {parentalControls.dailyTimeLimit} min today.
              Rest up and come back tomorrow!
            </Text>
          </GlassCard>
        )}

        {/* Avatar + XP card */}
        <GlassCard padding={Spacing.lg} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={{ position: 'relative', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 50 }}>{avatarEmoji}</Text>
            {outfitEmoji ? (
              <Text style={{ fontSize: 22, position: 'absolute', top: -4, right: -4 }}>
                {outfitEmoji}
              </Text>
            ) : null}
          </View>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
              Level {level} Explorer
            </Text>
            <ProgressBar progress={xpInLevel} height={7} />
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              {xpInLevel} / 100 XP to next level
            </Text>
          </View>
        </GlassCard>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <GlassCard padding={Spacing.md} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Flame size={22} color="#F59E0B" />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {streakCount}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Day Streak
            </Text>
          </GlassCard>
          <GlassCard padding={Spacing.md} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 22 }}>⭐</Text>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {virtualStars}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Stars
            </Text>
          </GlassCard>
          <GlassCard padding={Spacing.md} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <BookOpen size={22} color={Colors.accentSecondary} />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {studentProgress.length}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Lessons
            </Text>
          </GlassCard>
        </View>

        {/* Today's Pick */}
        {recommended ? (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm }}>
            <Text style={{
              fontFamily: Fonts.bodySemiBold,
              fontSize: FontSizes.xs,
              color: Colors.accentPrimary,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              Today's Pick
            </Text>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
              {recommended.topic}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
              {recommended.subject} · Grade {recommended.gradeLevel}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isTimeLimitExceeded) {
                  Alert.alert("Time's Up!", "You've reached your daily screen time limit.");
                  return;
                }
                navigation.navigate('Study', {
                  subject: recommended.subject,
                  gradeLevel: recommended.gradeLevel,
                  topic: recommended.topic,
                });
              }}
              activeOpacity={0.8}
              accessibilityLabel="Start Today's Lesson"
              style={{
                marginTop: Spacing.xs,
                backgroundColor: Colors.accentPrimary,
                borderRadius: Radius.md,
                paddingVertical: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.sm,
              }}
            >
              <Rocket size={16} color={Colors.white} />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.white }}>
                Start Lesson
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : itemBank && studentProgress.length > 0 ? (
          <GlassCard padding={Spacing.lg} style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Text style={{ fontSize: 32 }}>🏆</Text>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
              All caught up!
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' }}>
              You've tried all available topics. Keep practising to improve your scores!
            </Text>
          </GlassCard>
        ) : (
          <GlassCard padding={Spacing.lg} style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Inbox size={36} color={Colors.textMuted} />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
              No topics yet
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' }}>
              Link a classroom from your Profile tab to load activities.
            </Text>
          </GlassCard>
        )}

        {/* Continue Learning */}
        {lastActivity ? (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionLabel}>Continue Learning</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.textMain }}>
              {lastActivity.topic}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted }}>
              {lastActivity.subject} · Grade {lastActivity.gradeLevel} ·{' '}
              Last score: {Math.round((lastActivity.score / lastActivity.totalQuestions) * 100)}%
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
              <TouchableOpacity
                onPress={() => {
                  if (isTimeLimitExceeded) {
                    Alert.alert("Time's Up!", "You've reached your daily screen time limit.");
                    return;
                  }
                  navigation.navigate('Study', {
                    subject: lastActivity.subject,
                    gradeLevel: lastActivity.gradeLevel,
                    topic: lastActivity.topic,
                  });
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: Colors.accentPrimary,
                  borderRadius: Radius.md,
                  paddingVertical: Spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Play size={14} color={Colors.white} fill={Colors.white} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.white }}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Lessons')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: Radius.md,
                  paddingVertical: Spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <BookOpen size={14} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.accentPrimary }}>
                  Next Topic
                </Text>
                <ChevronRight size={14} color={Colors.accentPrimary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionLabel}>Ready to Start?</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.textMain }}>
              Pick your first lesson!
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textMuted }}>
              Head to the Lessons tab and choose a topic to begin your learning journey.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Lessons')}
              activeOpacity={0.8}
              style={{
                marginTop: Spacing.xs,
                backgroundColor: Colors.accentPrimary,
                borderRadius: Radius.md,
                paddingVertical: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Rocket size={16} color={Colors.white} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: Colors.white }}>
                Browse Lessons
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
