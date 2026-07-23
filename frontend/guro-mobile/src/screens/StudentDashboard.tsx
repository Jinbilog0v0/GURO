/**
 * StudentDashboard — Home tab.
 * Shows a greeting, XP/level card, quick stats, today's recommended lesson,
 * and a quick-action grid. Topic browsing lives in the Lessons tab.
 *
 * UX Audit fixes applied:
 * - C1: Replaced hardcoded 'Inter_700Bold' etc. strings with Fonts.* tokens
 * - V1: Collapsed dual empty-state into one when no classroom is linked
 * - O5: Added connectivity pre-check before classroom verify API call
 * - M4: Wrapped classroom code TextInput in KeyboardAvoidingView
 * - U7: Added personalization subtitle to Today's Pick card
 */

import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Network from 'expo-network';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, resolveServerUrl } from '../store/useAppStore';
import {
  Hand,
  BookOpen,
  Hourglass,
  Flame,
  Rocket,
  Inbox,
  Play,
  ChevronRight,
  Star,
  Trophy,
  Users,
  CheckCircle2,
} from 'lucide-react-native';
import { toast } from '../components';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { Badges } from '../theme/styles';
import { GlassCard } from '../components/ui/GlassCard';
import { SyncBadge } from '../components/shared/SyncBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { styles } from '../styles/StudentDashboard.styles';
import { isLessonLocked, LESSON_SEQUENCE } from '../utils/engine';

const OUTFIT_EMOJIS: Record<string, string> = {
  default: '',
  graduation_cap: '🎓',
  detective_hat: '🕵️‍♂️',
  space_visor: '🧑‍🚀',
  wizard_cape: '🧙‍♂️',
  crown: '👑',
  superhero_cape: '🦸',
  party_hat: '🥳',
  astronaut_helmet: '🧑‍🚀',
  artist_beret: '🎨',
  scientist_goggles: '🔬',
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
  const classroomId = useAppStore((s) => s.classroomId);
  const setClassroomId = useAppStore((s) => s.setClassroomId);

  const [joinModalVisible, setJoinModalVisible] = React.useState(false);
  const [typedCode, setTypedCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [verifiedClassroom, setVerifiedClassroom] = React.useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const appMode = useAppStore.getState().appMode;
    const serverUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (appMode === 'online') {
        await useAppStore.getState().syncProgressNow(serverUrl);
        if (classroomId) {
          await useAppStore.getState().fetchItemBankFromServer(serverUrl, classroomId);
        }
      }
    } catch (err) {
      console.warn('[Refresh] Failed to refresh student dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = typedCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a classroom code.');
      return;
    }
    const codeRegex = /^[A-Z]{3,4}-G[4-6]-[A-Z0-9]{3}$/i;
    if (!codeRegex.test(code)) {
      toast.error('Code format must look like MTH-G4-XYZ');
      return;
    }

    // O5: Pre-check connectivity before attempting server call
    try {
      const netState = await Network.getNetworkStateAsync();
      const isOnline = netState.isConnected && netState.isInternetReachable !== false;
      if (!isOnline) {
        toast.error('You need internet access to join a classroom. Please connect and try again.');
        return;
      }
    } catch {
      // If network check itself fails, proceed and let fetch handle the error
    }

    setVerifying(true);
    try {
      const serverUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/classroom/verify?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setVerifiedClassroom(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Invalid classroom code. Check the code and try again.');
      }
    } catch (err) {
      toast.error('Could not reach server. Please check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!verifiedClassroom) return;
    const code = verifiedClassroom.classroomId;
    const serverUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

    setVerifying(true);
    try {
      const ok = await useAppStore.getState().fetchItemBankFromServer(serverUrl, code);
      if (ok) {
        setClassroomId(code);
        setJoinModalVisible(false);
        setTypedCode('');
        setVerifiedClassroom(null);
        toast.success(`Joined classroom "${code}" successfully!`);
      } else {
        toast.error('Joined classroom, but failed to download assignment bank.');
      }
    } catch (err) {
      toast.error('Failed to complete classroom joining.');
    } finally {
      setVerifying(false);
    }
  };

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

  // Auto-sync offline progress to server when entering Student Dashboard
  useEffect(() => {
    const appMode = useAppStore.getState().appMode;
    const serverUrl = useAppStore.getState().serverUrl;
    if (appMode === 'online') {
      useAppStore.getState().syncProgressNow(serverUrl).catch((err) => {
        console.warn('[Sync] Background auto-sync failed on mount:', err);
      });
    }
  }, []);

  const getMathAverageScore = (grade: number): number => {
    const logs = studentProgress.filter(
      (p) => p.subject === 'Mathematics' && p.gradeLevel === grade,
    );
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, p) => acc + (p.score / p.totalQuestions) * 100, 0);
    return Math.round(sum / logs.length);
  };

  const isEnglishLocked = (gradeLevel: number): boolean => {
    if (classroomId || !parentalControls.mathBeforeEnglish) return false;
    const mathLogs = studentProgress.filter(
      (p) => p.subject === 'Mathematics' && p.gradeLevel === gradeLevel,
    );
    if (mathLogs.length === 0) return false;
    const mathScore = getMathAverageScore(gradeLevel);
    return mathScore < 80;
  };

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

          // Skip if locked by 1:1 progression or English-after-Math lock rules
          const isProgLocked = isLessonLocked(subject, grade, topic, studentProgress, preferredGrade);
          const isEngLocked = subject === 'English' && isEnglishLocked(grade);
          if (isProgLocked || isEngLocked) continue;

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
          {classroomId ? (
            <Text style={[styles.subWelcomeText, { color: Colors.accentPrimary, fontFamily: Fonts.bodyBold }]}>
              🏫 Paired: {classroomId}
            </Text>
          ) : (
            <Text style={styles.subWelcomeText}>What will you learn today?</Text>
          )}
        </View>
        <SyncBadge />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.accentPrimary]}
            tintColor={Colors.accentPrimary}
          />
        }
      >
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

        {/* Onboarding / Join classroom card */}
        {!classroomId && (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm, borderColor: 'rgba(17,66,142,0.15)', borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Users size={20} color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                Connect to Classroom
              </Text>
            </View>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
              Enter the invite code from your teacher to unlock assignments, lessons, and sync your achievements.
            </Text>
            <TouchableOpacity
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(17,66,142,0.06)',
                borderWidth: 1,
                borderColor: Colors.accentPrimary,
                borderRadius: Radius.md,
                paddingVertical: Spacing.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                Enter Invite Code
              </Text>
            </TouchableOpacity>
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
            <Star size={22} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {virtualStars}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Stars
            </Text>
          </GlassCard>
          <GlassCard padding={Spacing.md} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Trophy size={22} color="#F59E0B" />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {studentProgress.length}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Lessons
            </Text>
          </GlassCard>
        </View>

        {/* Today's Pick — U7: added personalization subtitle */}
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
            {/* U7: Personalization hint so students know this is tailored for them */}
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textDark, fontStyle: 'italic' }}>
              Recommended based on your progress ✨
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isTimeLimitExceeded) {
                  toast.warning("You've reached your daily screen time limit.");
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
          // V1: Suppress duplicate empty state when no-classroom card is already shown above
          !classroomId ? null : (
            <GlassCard padding={Spacing.lg} style={{ alignItems: 'center', gap: Spacing.sm }}>
              <Inbox size={36} color={Colors.textMuted} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                No topics yet
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' }}>
                Link a classroom from your Profile tab to load activities.
              </Text>
            </GlassCard>
          )
        )}

        {/* Continue Learning — C1: All hardcoded font strings replaced with Fonts.* tokens */}
        {lastActivity ? (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionLabel}>Continue Learning</Text>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain }}>
              {lastActivity.topic}
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
              {lastActivity.subject} · Grade {lastActivity.gradeLevel} ·{' '}
              Last score: {Math.round((lastActivity.score / lastActivity.totalQuestions) * 100)}%
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
              <TouchableOpacity
                onPress={() => {
                  if (isTimeLimitExceeded) {
                    toast.warning("You've reached your daily screen time limit.");
                    return;
                  }
                  const isProgLocked = isLessonLocked(lastActivity.subject, lastActivity.gradeLevel, lastActivity.topic, studentProgress, preferredGrade);
                  const isEngLocked = lastActivity.subject === 'English' && isEnglishLocked(lastActivity.gradeLevel);
                  if (isProgLocked || isEngLocked) {
                    toast.info("This lesson is currently locked based on progression and grade rules.");
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
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.white }}>Resume</Text>
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
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                  Next Topic
                </Text>
                <ChevronRight size={14} color={Colors.accentPrimary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : (
          <GlassCard padding={Spacing.lg} style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionLabel}>Ready to Start?</Text>
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain }}>
              Pick your first lesson!
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
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
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.white }}>
                Browse Lessons
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Join Classroom Modal ── */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setJoinModalVisible(false);
          setTypedCode('');
          setVerifiedClassroom(null);
        }}
      >
        {/* M4: KeyboardAvoidingView prevents keyboard from covering the TextInput */}
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <GlassCard style={{ padding: Spacing.lg, gap: Spacing.md, backgroundColor: Colors.white }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={20} color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                Join Classroom
              </Text>
            </View>

            {!verifiedClassroom ? (
              <>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                  Type the invite code provided by your teacher (e.g. MTH-G4-XYZ):
                </Text>

                <TextInput
                  placeholder="Invite Code"
                  value={typedCode}
                  onChangeText={setTypedCode}
                  autoCapitalize="characters"
                  maxLength={12}
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderRadius: Radius.md,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    fontFamily: Fonts.bodyBold,
                    fontSize: FontSizes.md,
                    color: Colors.textMain,
                    backgroundColor: Colors.bgInput,
                    textAlign: 'center',
                    letterSpacing: 2
                  }}
                />

                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                  <TouchableOpacity
                    onPress={() => {
                      setJoinModalVisible(false);
                      setTypedCode('');
                    }}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: Radius.md,
                      paddingVertical: Spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMuted }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleVerifyCode}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.accentPrimary,
                      borderRadius: Radius.md,
                      paddingVertical: Spacing.md,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.white }}>Verify Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Classroom Details Confirmation Screen */}
                <View style={{ backgroundColor: 'rgba(16,185,129,0.05)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={16} color={Colors.success} />
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.success }}>
                      Classroom Verified!
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    Teacher: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{verifiedClassroom.teacherName}</Text>
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    Subject: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{verifiedClassroom.subject}</Text>
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    Grade Level: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>Grade {verifiedClassroom.gradeLevel}</Text>
                  </Text>
                </View>

                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                  Would you like to connect and download this teacher's custom assignments?
                </Text>

                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                  <TouchableOpacity
                    onPress={() => setVerifiedClassroom(null)}
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      borderRadius: Radius.md,
                      paddingVertical: Spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMuted }}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirmJoin}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.success,
                      borderRadius: Radius.md,
                      paddingVertical: Spacing.md,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {verifying ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.white }}>Confirm &amp; Join</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
