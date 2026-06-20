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
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { getParentAccessCode } from '../utils/security';
import {
  Hand,
  Settings,
  School,
  Link,
  Users,
  Rocket,
  Hourglass,
  Trophy,
  Flame,
  Footprints,
  Award,
  Calculator,
  BookOpen,
  Globe,
  Lock,
  Inbox,
  LogOut,
  Menu,
  X,
} from 'lucide-react-native';

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

const SUBJECTS = [
  { key: 'Mathematics', icon: Calculator },
  { key: 'English', icon: BookOpen },
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
  const avatarEmoji = useAppStore((state) => state.avatarEmoji);
  const setAvatarEmoji = useAppStore((state) => state.setAvatarEmoji);
  const soundEffectsEnabled = useAppStore((state) => state.soundEffectsEnabled);
  const setSoundEffectsEnabled = useAppStore((state) => state.setSoundEffectsEnabled);
  const speechRate = useAppStore((state) => state.speechRate);
  const setSpeechRate = useAppStore((state) => state.setSpeechRate);
  const colorTheme = useAppStore((state) => state.colorTheme);
  const setColorTheme = useAppStore((state) => state.setColorTheme);
  const logs = useAppStore((state) => state.logs);

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



  // ── Drawer state & animation ────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slideAnim] = useState(() => new Animated.Value(-280));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? 0 : -280,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen, slideAnim]);

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

  const getBadgeInfo = (key: string): { label: string; icon: React.ReactNode } => {
    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      first_step: { label: 'First Step', icon: <Footprints size={16} color={Colors.accentPrimary} /> },
      perfect_score: { label: 'Perfect 100%', icon: <Award size={16} color={Colors.accentSecondary} /> },
      math_wizard: { label: 'Math Wizard', icon: <Calculator size={16} color={Colors.accentPrimary} /> },
      english_champion: { label: 'English Champ', icon: <BookOpen size={16} color={Colors.accentPrimary} /> },
      streak_starter: { label: 'Streak Starter', icon: <Flame size={16} color={Colors.accentSecondary} /> },
      streak_master: { label: 'Streak Master', icon: <Flame size={16} color={Colors.accentPrimary} /> },
    };
    return map[key] || { label: 'Achievement', icon: <Trophy size={16} color={Colors.accentSecondary} /> };
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
        Alert.alert('Linked!', `Classroom "${code}" connected successfully.`);
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
        "Time's Up!",
        "You've reached your daily screen time limit. Come back tomorrow!",
      );
      return;
    }
    if (isEnglishLocked) {
      Alert.alert(
        'Keep Practising Maths!',
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
      title: 'Teacher Access',
      subtitle: 'Enter the teacher PIN to continue.',
    },
    parent: {
      title: 'Parent Portal',
      subtitle: 'Enter your parent PIN to continue.',
    },
    'parent-setup': {
      title: 'Create Parent PIN',
      subtitle: 'Set a 4-digit PIN to protect the parent portal.',
    },
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Menu Drawer Overlay ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
          <View style={styles.drawerOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* ── Menu Drawer Panel ────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerBrandText}>GURO Kid Zone</Text>
          <TouchableOpacity
            onPress={() => setDrawerOpen(false)}
            style={styles.drawerCloseBtn}
            accessibilityLabel="Close Menu"
          >
            <X size={24} color={Colors.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.drawerContent} bounces={false}>
          {/* Student Profile Info */}
          <View style={styles.drawerProfileCard}>
            <Text style={styles.drawerProfileTitle}>Student Explorer</Text>
            <Text style={styles.drawerProfileName}>{avatarEmoji} {guestName ?? currentUser?.name ?? 'Explorer'}</Text>
            
            <View style={styles.drawerStatsContainer}>
              <View style={styles.drawerStatBadge}>
                <Trophy size={14} color={Colors.accentSecondary} />
                <Text style={styles.drawerStatText}>{studentProgress.length} Lessons</Text>
              </View>
              {(streakCount || 0) > 0 && (
                <View style={styles.drawerStatBadge}>
                  <Flame size={14} color={Colors.accentSecondary} />
                  <Text style={styles.drawerStatText}>{streakCount}d Streak</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.drawerMenuDivider} />

          {/* Classroom Connection Option */}
          <TouchableOpacity
            style={styles.drawerMenuItem}
            onPress={() => {
              setDrawerOpen(false);
              if (classroomId) {
                handleUnlinkClassroom();
              } else {
                setClassModalVisible(true);
              }
            }}
            activeOpacity={0.7}
          >
            {classroomId ? (
              <School size={20} color={Colors.accentPrimary} />
            ) : (
              <Link size={20} color={Colors.textMain} />
            )}
            <Text style={styles.drawerMenuItemText}>
              {classroomId ? `Classroom: ${classroomId}` : 'Link Classroom'}
            </Text>
          </TouchableOpacity>

          <View style={styles.drawerMenuDivider} />

          {/* Adult Portals Section */}
          <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs }}>
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: Colors.textDark, textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Adult Portals
            </Text>
          </View>

          <TouchableOpacity
            style={styles.drawerMenuItem}
            onPress={() => {
              setDrawerOpen(false);
              openParentPin();
            }}
            activeOpacity={0.7}
          >
            <Users size={20} color={Colors.textMain} />
            <Text style={styles.drawerMenuItemText}>Parent Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.drawerMenuItem}
            onLongPress={() => {
              setDrawerOpen(false);
              openTeacherPin();
            }}
            delayLongPress={600}
            activeOpacity={0.7}
          >
            <Rocket size={20} color={Colors.accentPrimary} />
            <Text style={styles.drawerMenuItemText}>Teacher Console (Hold)</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Drawer Bottom Footer - Pinned Settings (top) and Logout (below) if online */}
        <View style={styles.drawerFooter}>
          <TouchableOpacity
            style={styles.drawerFooterItem}
            onPress={() => {
              setDrawerOpen(false);
              navigation.navigate('Settings');
            }}
            activeOpacity={0.7}
          >
            <Settings size={18} color={Colors.textMuted} />
            <Text style={styles.drawerFooterItemText}>Settings & Profile</Text>
          </TouchableOpacity>

          {appMode !== 'offline' && (
            <>
              <View style={styles.drawerFooterDivider} />

              <TouchableOpacity
                style={styles.drawerFooterItem}
                onPress={() => {
                  setDrawerOpen(false);
                  Alert.alert(
                    'Confirm Logout',
                    'Are you sure you want to log out? You will need to sign in again to access your session.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: () => {
                          logoutFromCloud();
                          navigation.replace('Login');
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <LogOut size={18} color={Colors.dangerText} />
                <Text style={[styles.drawerFooterItemText, { color: Colors.dangerText }]}>Log Out</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={styles.menuBtn}
          activeOpacity={0.75}
          accessibilityLabel="Open menu drawer"
        >
          <Menu size={24} color={Colors.textMain} />
        </TouchableOpacity>

        <View style={Layout.flex1}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' }}>
            <Text style={styles.welcomeText}>
              Hello, {guestName ?? currentUser?.name ?? 'Explorer'}!
            </Text>
            <Hand size={18} color={Colors.accentPrimary} />
          </View>
          <Text style={styles.subWelcomeText}>Pick an activity below to start learning.</Text>
        </View>

        <View style={styles.headerRight}>
          <SyncBadge />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Time-limit banner ─────────────────────────────────────────────── */}
        {isTimeLimitExceeded && (
          <GlassCard style={styles.timeBanner} padding={Spacing.md}>
            <View style={[Badges.base, Badges.danger, styles.bannerBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Hourglass size={12} color={Colors.dangerText} />
              <Text style={[Badges.text, Badges.dangerText]}>Time Limit Reached</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Trophy size={18} color={Colors.accentSecondary} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
                My Achievements
              </Text>
            </View>
            {(streakCount || 0) > 0 && (
              <View style={[Badges.base, Badges.indigo, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Flame size={12} color={Colors.indigoText} />
                <Text style={[Badges.text, Badges.indigoText]}>{streakCount} Day Streak</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs }}>
            {(!unlockedBadges || unlockedBadges.length === 0) ? (
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, fontStyle: 'italic' }}>
                No badges unlocked yet. Finish quizzes with perfect scores to earn them!
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
                    {badgeInfo.icon}
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
            {SUBJECTS.map(({ key, icon: IconComponent }) => {
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
                    <IconComponent size={28} color={active ? Colors.accentPrimary : Colors.textMuted} />
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
            <View style={[Badges.base, Badges.warning, styles.bannerBadge, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Lock size={12} color={Colors.warningText} />
              <Text style={[Badges.text, Badges.warningText]}>Locked</Text>
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
              <Inbox size={40} color={Colors.textMuted} />
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
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <School size={20} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Link Classroom</Text>
                  </View>
                }
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

