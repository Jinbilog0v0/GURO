/**
 * StudentDashboard — Kid Zone main screen.
 * Fully themed with the GURO design system.
 * All original logic preserved: grade/subject selection, topic list,
 * PIN navigation (teacher / parent / parent-setup), classroom linking modal,
 * time-limit guard, English lock guard, and screen-time tracking interval.
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { getParentAccessCode } from '../utils/security';

// ── Design System ──────────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius, Shadow } from '../theme/spacing';
import { Layout, Text as TextStyles, Badges } from '../theme/styles';
import { styles } from '../styles/StudentDashboard.styles';

// ── Shared / UI Components ─────────────────────────────────────────────────────
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { PinPad } from '../components/shared/PinPad';
import { SyncBadge } from '../components/shared/SyncBadge';

// ─────────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'StudentDashboard'>;

const GRADES = [4, 5, 6] as const;
type Grade = (typeof GRADES)[number];

const SUBJECTS: { key: string; emoji: string }[] = [
  { key: 'Mathematics', emoji: '📐' },
  { key: 'English', emoji: '📖' },
  { key: 'Science', emoji: '🔬' },
  { key: 'Filipino', emoji: '🏝️' },
];

type PinTarget = 'teacher' | 'parent' | 'parent-setup';

// ─────────────────────────────────────────────────────────────────────────────

export function StudentDashboard({ navigation }: Props) {
  const itemBank = useAppStore((state) => state.itemBank);
  const addLog = useAppStore((state) => state.addLog);
  const parentPin = useAppStore((state) => state.parentPin);
  const setParentPin = useAppStore((state) => state.setParentPin);
  const classroomId = useAppStore((state) => state.classroomId);
  const setClassroomId = useAppStore((state) => state.setClassroomId);
  const fetchItemBankFromServer = useAppStore((state) => state.fetchItemBankFromServer);
  const parentalControls = useAppStore((state) => state.parentalControls);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const dailyMinutesUsed = useAppStore((state) => state.dailyMinutesUsed);
  const currentUser = useAppStore((state) => state.currentUser);
  const guestName = useAppStore((state) => state.guestName);
  const streakCount = useAppStore((state) => state.streakCount);
  const unlockedBadges = useAppStore((state) => state.unlockedBadges);
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);
  const appMode = useAppStore((state) => state.appMode);
  const studentId = useAppStore((state) => state.studentId);

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState<Grade>(4);
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  // ── Classroom invite state ───────────────────────────────────────────────
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [classCodeInput, setClassCodeInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // ── PIN-pad state ────────────────────────────────────────────────────────
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinTarget, setPinTarget] = useState<PinTarget>('teacher');

  // ── Settings modal state ──────────────────────────────────────────────────
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // ── Active Screen Time Tracking ──────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      useAppStore.getState().trackActiveMinutes(0.25);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Intercept Android hardware back button ────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      return true; // Intercept and do nothing (prevents escaping back to Login)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => backHandler.remove();
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getMathAverageScore = (grade: number): number => {
    const mathLogs = studentProgress.filter(
      (log) => log.subject === 'Mathematics' && log.gradeLevel === grade,
    );
    if (mathLogs.length === 0) return 0;
    const sum = mathLogs.reduce((acc, log) => acc + (log.score / log.totalQuestions) * 100, 0);
    return Math.round(sum / mathLogs.length);
  };

  const isTimeLimitExceeded =
    parentalControls.dailyTimeLimit > 0 && dailyMinutesUsed >= parentalControls.dailyTimeLimit;

  const mathScore = getMathAverageScore(selectedGrade);
  const isEnglishLocked =
    selectedSubject === 'English' && parentalControls.mathBeforeEnglish && mathScore < 80;

  const getTopicsList = (): string[] => {
    if (!itemBank) return [];
    const subjectData = itemBank[selectedSubject];
    if (!subjectData) return [];
    const gradeData = subjectData[selectedGrade.toString()];
    if (!gradeData) return [];
    return Object.keys(gradeData);
  };

  const topics = getTopicsList();

  const getBadgeInfo = (key: string): { label: string; icon: string } => {
    const map: Record<string, { label: string; icon: string }> = {
      first_step: { label: 'First Step', icon: '👣' },
      perfect_score: { label: 'Perfect 100%', icon: '💯' },
      math_wizard: { label: 'Math Wizard', icon: '📐' },
      english_champion: { label: 'English Champ', icon: '📖' },
      streak_starter: { label: 'Streak Starter', icon: '🥉' },
      streak_master: { label: 'Streak Master', icon: '🥇' },
    };
    return map[key] || { label: 'Achievement', icon: '🏆' };
  };

  // ─── PIN handlers ──────────────────────────────────────────────────────────

  const openTeacherPin = () => {
    setPinTarget('teacher');
    setPinModalVisible(true);
  };

  const openParentPin = () => {
    if (!parentPin) {
      setPinTarget('parent-setup');
    } else {
      setPinTarget('parent');
    }
    setPinModalVisible(true);
  };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (pinTarget === 'teacher') {
      if (pin === '1234') {
        setPinModalVisible(false);
        navigation.navigate('TeacherDashboard');
        return true;
      }
      return false;
    }

    if (pinTarget === 'parent') {
      if (pin === parentPin) {
        setPinModalVisible(false);
        navigation.navigate('ParentDashboard');
        return true;
      }
      return false;
    }

    // pinTarget === 'parent-setup' — always succeeds; saves the entered PIN
    setParentPin(pin);
    setPinModalVisible(false);
    navigation.navigate('ParentDashboard');
    return true;
  };

  // ─── Classroom linking ─────────────────────────────────────────────────────

  const handleLinkClassroom = async () => {
    const trimmed = classCodeInput.trim();
    if (!trimmed) {
      Alert.alert('Enter a code', 'Please type a classroom invite code first.');
      return;
    }
    setIsLinking(true);
    try {
      const parts = trimmed.split('@');
      if (parts.length !== 2) throw new Error('Invalid format. Use CODE@server-url');
      const [code, serverUrl] = parts;
      const success = await fetchItemBankFromServer(serverUrl, code);
      if (success) {
        setClassroomId(code);
        setClassModalVisible(false);
        setClassCodeInput('');
        Alert.alert('Linked! 🎉', `Classroom "${code}" connected successfully.`);
      } else {
        Alert.alert('Failed', 'Could not connect. Check the code and try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkClassroom = () => {
    Alert.alert('Unlink Classroom?', 'This will remove your classroom connection.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: () => {
          setClassroomId(null);
          Alert.alert('Unlinked', 'Classroom removed.');
        },
      },
    ]);
  };

  // ─── Topic press ───────────────────────────────────────────────────────────

  const handleTopicPress = (topic: string) => {
    if (isTimeLimitExceeded) {
      Alert.alert(
        "Time's Up! ⏰",
        "You've reached your daily screen time limit. Come back tomorrow!",
      );
      return;
    }
    if (isEnglishLocked) {
      Alert.alert(
        'Keep Practising Maths! 📐',
        `Score at least 80% in Grade ${selectedGrade} Mathematics to unlock English. Current score: ${mathScore}%`,
      );
      return;
    }
    navigation.navigate('Study', {
      subject: selectedSubject,
      gradeLevel: selectedGrade,
      topic,
    });
  };

  // ─── PIN modal config ──────────────────────────────────────────────────────

  const pinConfig: Record<PinTarget, { title: string; subtitle: string }> = {
    teacher: {
      title: '👩‍🏫 Teacher Access',
      subtitle: 'Enter the teacher PIN to continue.',
    },
    parent: {
      title: '👨‍👩‍👧 Parent Portal',
      subtitle: 'Enter your parent PIN to continue.',
    },
    'parent-setup': {
      title: '🔐 Create Parent PIN',
      subtitle: 'Set a 4-digit PIN to protect the parent portal.',
    },
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={Layout.flex1}>
          <Text style={styles.welcomeText}>
            Hello, {guestName ?? currentUser?.name ?? 'Explorer'}! 👋
          </Text>
          <Text style={styles.subWelcomeText}>Pick an activity below to start learning.</Text>
        </View>

        <View style={styles.headerRight}>
          <SyncBadge />

          {/* Settings & Profile */}
          <TouchableOpacity
            onPress={() => setSettingsModalVisible(true)}
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            accessibilityLabel="Settings and Profile"
          >
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>

          {/* Classroom link / unlink */}
          <TouchableOpacity
            onPress={() => (classroomId ? handleUnlinkClassroom() : setClassModalVisible(true))}
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            accessibilityLabel="Classroom"
          >
            <Text style={styles.headerIcon}>{classroomId ? '🏫' : '🔗'}</Text>
          </TouchableOpacity>

          {/* Parent portal */}
          <TouchableOpacity
            onPress={openParentPin}
            style={styles.headerIconBtn}
            activeOpacity={0.75}
            accessibilityLabel="Parent portal"
          >
            <Text style={styles.headerIcon}>👨‍👩‍👧</Text>
          </TouchableOpacity>

          {/* Rocket avatar — long-press opens teacher PIN */}
          <TouchableOpacity
            onLongPress={openTeacherPin}
            delayLongPress={600}
            style={styles.avatarBtn}
            activeOpacity={0.8}
            accessibilityLabel="Teacher portal (long press)"
          >
            <Text style={styles.avatarEmoji}>🚀</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Time-limit banner ─────────────────────────────────────────────── */}
        {isTimeLimitExceeded && (
          <GlassCard style={styles.timeBanner} padding={Spacing.md}>
            <View style={[Badges.base, Badges.danger, styles.bannerBadge]}>
              <Text style={[Badges.text, Badges.dangerText]}>⏰ Time Limit Reached</Text>
            </View>
            <Text style={styles.timeBannerText}>
              You've used {Math.round(dailyMinutesUsed)} / {parentalControls.dailyTimeLimit} min
              today. Rest up and come back tomorrow!
            </Text>
          </GlassCard>
        )}

        {/* ── Badges & Streak Panel ─────────────────────────────────────────── */}
        <GlassCard padding={Spacing.md} style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
              🏆 My Achievements
            </Text>
            {(streakCount || 0) > 0 && (
              <View style={[Badges.base, Badges.indigo]}>
                <Text style={[Badges.text, Badges.indigoText]}>🔥 {streakCount} Day Streak</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs }}>
            {(!unlockedBadges || unlockedBadges.length === 0) ? (
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, fontStyle: 'italic' }}>
                No badges unlocked yet. Finish quizzes with perfect scores to earn them! 🌟
              </Text>
            ) : (
              unlockedBadges.map((badgeKey) => {
                const badgeInfo = getBadgeInfo(badgeKey);
                return (
                  <View
                    key={badgeKey}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderColor: Colors.border,
                      borderWidth: 1,
                      borderRadius: Radius.md,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: Spacing.xs,
                      gap: Spacing.xs,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{badgeInfo.icon}</Text>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMain }}>
                      {badgeInfo.label}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </GlassCard>

        {/* ── Grade Selection ───────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Grade Level" subtitle="Select your grade to filter activities." />
          <View style={styles.pillRow}>
            {GRADES.map((g) => {
              const active = g === selectedGrade;
              return (
                <TouchableOpacity
                  key={g}
                  onPress={() => setSelectedGrade(g)}
                  activeOpacity={0.75}
                  style={[styles.pill, active && styles.pillActive]}
                  accessibilityLabel={`Grade ${g}`}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>
                    Grade {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Subject Selection ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Subject" subtitle="Pick what you'd like to practise today." />
          <View style={styles.subjectGrid}>
            {SUBJECTS.map(({ key, emoji }) => {
              const active = key === selectedSubject;
              return (
                <GlassCard
                  key={key}
                  variant={active ? 'accent' : 'default'}
                  padding={Spacing.md}
                  style={[styles.subjectCard, active && styles.subjectCardActive]}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedSubject(key)}
                    activeOpacity={0.8}
                    style={styles.subjectCardInner}
                    accessibilityLabel={key}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={styles.subjectEmoji}>{emoji}</Text>
                    <Text style={[styles.subjectLabel, active && styles.subjectLabelActive]}>
                      {key}
                    </Text>
                  </TouchableOpacity>
                </GlassCard>
              );
            })}
          </View>
        </View>

        {/* ── English-locked warning ────────────────────────────────────────── */}
        {isEnglishLocked && (
          <GlassCard style={styles.lockBanner} padding={Spacing.md}>
            <View style={[Badges.base, Badges.warning, styles.bannerBadge]}>
              <Text style={[Badges.text, Badges.warningText]}>🔒 Locked</Text>
            </View>
            <Text style={styles.lockBannerText}>
              Score 80%+ in Grade {selectedGrade} Mathematics to unlock English.{'\n'}
              Your current Maths score: {mathScore}%
            </Text>
          </GlassCard>
        )}

        {/* ── Topic List ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title={`${selectedSubject} Topics`}
            subtitle={`Grade ${selectedGrade} · ${topics.length} available`}
          />

          {topics.length === 0 ? (
            <GlassCard variant="subtle" padding={Spacing.xl} style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No Topics Yet</Text>
              <Text style={styles.emptySubtitle}>
                {classroomId
                  ? "Your teacher hasn't uploaded activities for this combination."
                  : 'Link a classroom code to load activities.'}
              </Text>
            </GlassCard>
          ) : (
            topics.map((topic, idx) => (
              <GlassCard
                key={topic}
                variant="default"
                padding={Spacing.lg}
                style={styles.topicCard}
              >
                <TouchableOpacity
                  onPress={() => handleTopicPress(topic)}
                  activeOpacity={0.8}
                  style={styles.topicRow}
                  accessibilityLabel={`Start ${topic}`}
                >
                  <View style={styles.topicNumber}>
                    <Text style={styles.topicNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={Layout.flex1}>
                    <Text style={styles.topicTitle}>{topic}</Text>
                    <Text style={styles.topicSubtitle}>
                      {selectedSubject} · Grade {selectedGrade}
                    </Text>
                  </View>
                  <Text style={styles.topicArrow}>›</Text>
                </TouchableOpacity>
              </GlassCard>
            ))
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* ── Settings & Profile Modal ───────────────────────────────────────────── */}
      {settingsModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <GlassCard padding={Spacing['2xl']} style={styles.classModal}>
              <SectionHeader
                title="⚙️ Settings & Profile"
                subtitle="View your profile and app settings"
              />

              <View style={styles.profileBox}>
                <Text style={styles.profileLabel}>STUDENT EXPLORER</Text>
                <Text style={styles.profileName}>{guestName ?? currentUser?.name ?? 'Explorer'}</Text>
                {currentUser && <Text style={styles.profileEmail}>{currentUser.email}</Text>}
              </View>

              <View style={styles.statsBox}>
                <Text style={styles.statsLabel}>🎯 Telemetry Stats:</Text>
                <Text style={styles.statsText}>Lessons Completed: {studentProgress.length}</Text>
                <Text style={styles.statsText}>Current Streak: {streakCount ?? 0} days</Text>
                <Text style={styles.statsText}>App Mode: {appMode === 'online' ? '🌐 Connected' : '🔌 Offline (Local)'}</Text>
                <Text style={styles.statsText}>🔑 Parent Access Code: {getParentAccessCode(studentId)}</Text>
              </View>

              <PrimaryButton
                label="Close Settings"
                onPress={() => setSettingsModalVisible(false)}
                style={styles.classBtn}
              />

              <DangerButton
                label="🚪 Log Out / Exit Portal"
                onPress={() => {
                  Alert.alert(
                    'Confirm Logout',
                    'Are you sure you want to log out? You will need to sign in again to access your session.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: () => {
                          setSettingsModalVisible(false);
                          logoutFromCloud();
                          navigation.replace('Login');
                        },
                      },
                    ]
                  );
                }}
                style={styles.classBtn}
              />
            </GlassCard>
          </View>
        </View>
      )}

      {/* ── PIN Modal ─────────────────────────────────────────────────────────── */}
      <PinPad
        visible={pinModalVisible}
        title={pinConfig[pinTarget].title}
        subtitle={pinConfig[pinTarget].subtitle}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinModalVisible(false)}
      />

      {/* ── Classroom Linking Modal ───────────────────────────────────────────── */}
      {classModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <GlassCard padding={Spacing['2xl']} style={styles.classModal}>
              <SectionHeader
                title="🏫 Link Classroom"
                subtitle="Enter the invite code your teacher shared."
              />

              <ThemedTextInput
                label="Classroom Code"
                value={classCodeInput}
                onChangeText={setClassCodeInput}
                placeholder="e.g. ABC123@school.guro.app"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.classInput}
              />

              <PrimaryButton
                label="Link Classroom"
                onPress={handleLinkClassroom}
                loading={isLinking}
                style={styles.classBtn}
              />
              <SecondaryButton
                label="Cancel"
                onPress={() => {
                  setClassModalVisible(false);
                  setClassCodeInput('');
                }}
                style={styles.classBtn}
              />

              {classroomId && (
                <DangerButton
                  label="Unlink Current Classroom"
                  onPress={handleUnlinkClassroom}
                  style={styles.classBtn}
                />
              )}

              {classroomId && (
                <View style={styles.currentClassRow}>
                  <View style={[Badges.base, Badges.indigo]}>
                    <Text style={[Badges.text, Badges.indigoText]}>Linked</Text>
                  </View>
                  <Text style={styles.currentClassText}>{classroomId}</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

