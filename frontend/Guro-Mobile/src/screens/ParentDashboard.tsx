import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  Switch,
  BackHandler,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, ProgressEvent, resolveServerUrl } from '../store/useAppStore';
import { getParentAccessCode } from '../utils/security';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { styles } from '../styles/ParentDashboard.styles';
import { toast } from '../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ClipboardList,
  Target,
  Cloud,
  Shield,
  Hourglass,
  Lock,
  Globe,
  RefreshCw,
  Folder,
  Users,
  Settings,
  LogOut,
  Trash2,
  User,
  BarChart2,
  Key,
  Search,
  AlertCircle,
  Award,
  Sparkles,
  MessageCircle,
  Calendar,
  Pizza,
  Coins,
  Share2,
  CheckCircle2,
  Calculator,
  BookOpen,
  Flame,
  Zap,
  TrendingUp,
  CheckCircle,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ParentDashboard'>;

export function ParentDashboard({ navigation }: Props) {
  const parentPin = useAppStore((state) => state.parentPin);
  const setParentPin = useAppStore((state) => state.setParentPin);
  const clearProgress = useAppStore((state) => state.clearProgress);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);
  const studentId = useAppStore((state) => state.studentId);
  const setStudentId = useAppStore((state) => state.setStudentId);
  const parentalControls = useAppStore((state) => state.parentalControls);
  const updateParentalControls = useAppStore((state) => state.updateParentalControls);
  const currentUser = useAppStore((state) => state.currentUser);
  const registerAndPromote = useAppStore((state) => state.registerAndPromote);
  const loginToCloud = useAppStore((state) => state.loginToCloud);
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);
  const dailyMinutesUsed = useAppStore((state) => state.dailyMinutesUsed);
  const resetDailyMinutes = useAppStore((state) => state.resetDailyMinutes);
  const appMode = useAppStore((state) => state.appMode);
  const activeSchoolYear = useAppStore((state) => state.activeSchoolYear || '2026-2027');
  const activeTerm = useAppStore((state) => state.activeTerm || 'Quarter 1');

  const isPinMode = appMode === 'offline' || currentUser?.role === 'student';

  // ── Intercept Android hardware back button ────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      if (!isPinMode) {
        return true; // Intercept and prevent escaping back to Login
      }
      return false; // Allow default back press (e.g. popping to StudentDashboard if in Pin Mode)
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => backHandler.remove();
  }, [isPinMode]);

  // Server configurations
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const [serverUrl, setServerUrl] = useState(serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000');
  const [isSyncing, setIsSyncing] = useState(false);

  // Search/Explorer states
  const [searchStudentId, setSearchStudentId] = useState('');
  const [searchAccessCode, setSearchAccessCode] = useState('');
  const [searchedLogs, setSearchedLogs] = useState<ProgressEvent[]>([]);
  const [searched, setSearched] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!searchStudentId.trim() || !searchAccessCode.trim()) return;
    setRefreshing(true);
    await handleSearchOnMount(searchStudentId.trim(), searchAccessCode.trim());
    setRefreshing(false);
  };

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // PIN change states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [parentSubTab, setParentSubTab] = useState<'overview' | 'report' | 'milestones'>('overview');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Custom Modal states
  const [showClearProgressConfirm, setShowClearProgressConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showExitPortalConfirm, setShowExitPortalConfirm] = useState(false);

  // Device Student ID Input (editing local student ID on the device)
  const [studentIdInput, setStudentIdInput] = useState(studentId || '');

  // ── Local configuration stats ──────────────────────────────────────────────
  const unsyncedCount = useAppStore((state) => state.studentProgress.filter((e) => !e.synced).length);
  const timeLimitExceeded =
    parentalControls.dailyTimeLimit > 0 && dailyMinutesUsed >= parentalControls.dailyTimeLimit;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSync = async () => {
    const trimmed = serverUrl.trim();
    if (!trimmed) {
      toast.error('Please enter a valid server endpoint.');
      return;
    }
    useAppStore.getState().setServerUrl(trimmed);
    setIsSyncing(true);
    try {
      const res = await syncProgressNow(trimmed);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Network error or invalid server URL.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePinChangeSubmit = () => {
    if (!newPinInput || newPinInput.length !== 4 || isNaN(Number(newPinInput))) {
      toast.error('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      toast.error('New PIN and confirmation do not match.');
      return;
    }
    if (parentPin && currentPinInput !== parentPin) {
      toast.error('Current PIN code is incorrect.');
      return;
    }
    setParentPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setIsChangingPin(false);
    toast.success('Parent dashboard PIN changed successfully.');
  };

  const handleClearHistory = () => {
    setShowClearProgressConfirm(true);
  };

  // ── Search Explorer Handlers ───────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchStudentId.trim() || !searchAccessCode.trim()) {
      setSearchError('Please enter both Student ID and Access Code.');
      return;
    }
    setLoadingSearch(true);
    setSearched(true);
    setSearchError(null);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const url = `${resolvedUrl}/api/progress?studentId=${encodeURIComponent(searchStudentId.trim())}&accessCode=${encodeURIComponent(searchAccessCode.trim())}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSearchedLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSearchError(errData.error || 'Failed to retrieve logs. Please verify credentials.');
        setSearchedLogs([]);
      }
    } catch (err) {
      setSearchError('A network error occurred. Please try again.');
      setSearchedLogs([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleClearSearch = async () => {
    setSearchStudentId('');
    setSearchAccessCode('');
    setSearchedLogs([]);
    setSearched(false);
    setSearchError(null);
    try {
      await AsyncStorage.removeItem('guro_parent_student_id');
      await AsyncStorage.removeItem('guro_parent_access_code');
      await AsyncStorage.removeItem('guro_parent_searched');
    } catch (e) {
      console.warn('[Storage] Failed to clear search credentials:', e);
    }
  };

  // Run initial search automatically on mount if ID and Access Code are available in AsyncStorage
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedId = await AsyncStorage.getItem('guro_parent_student_id') || '';
        const savedCode = await AsyncStorage.getItem('guro_parent_access_code') || '';
        const savedSearched = (await AsyncStorage.getItem('guro_parent_searched')) === 'true';

        if (savedId) setSearchStudentId(savedId);
        if (savedCode) setSearchAccessCode(savedCode);
        if (savedSearched) setSearched(savedSearched);

        setIsStorageLoaded(true);

        if (savedId.trim() && savedCode.trim() && savedSearched) {
          await handleSearchOnMount(savedId.trim(), savedCode.trim());
        }
      } catch (e) {
        console.warn('[Storage] Failed to load saved credentials:', e);
        setIsStorageLoaded(true);
      }
    };
    loadSavedCredentials();
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
      AsyncStorage.setItem('guro_parent_student_id', searchStudentId);
    }
  }, [searchStudentId, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      AsyncStorage.setItem('guro_parent_access_code', searchAccessCode);
    }
  }, [searchAccessCode, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      AsyncStorage.setItem('guro_parent_searched', String(searched));
    }
  }, [searched, isStorageLoaded]);

  const handleSearchOnMount = async (sId: string, aCode: string) => {
    setLoadingSearch(true);
    setSearched(true);
    setSearchError(null);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const url = `${resolvedUrl}/api/progress?studentId=${encodeURIComponent(sId)}&accessCode=${encodeURIComponent(aCode)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSearchedLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSearchError(errData.error || 'Failed to retrieve logs.');
        setSearchedLogs([]);
      }
    } catch (err) {
      setSearchError('A network error occurred.');
      setSearchedLogs([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── Stats calculations for searched logs ───────────────────────────────────
  const totalQuizzes = searchedLogs.length;
  const getAverageScore = () => {
    if (totalQuizzes === 0) return 0;
    const sum = searchedLogs.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
    return Math.round(sum / totalQuizzes);
  };
  const avgScore = getAverageScore();

  const getPast28Days = () => {
    const dates = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const getEventCountForDate = (date: Date) => {
    return searchedLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return (
        logDate.getDate() === date.getDate() &&
        logDate.getMonth() === date.getMonth() &&
        logDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return Colors.bgInput;
    if (count === 1) return 'rgba(17, 66, 142, 0.2)';
    if (count === 2) return 'rgba(17, 66, 142, 0.5)';
    return Colors.accentPrimary;
  };

  const getTutorReportData = () => {
    if (searchedLogs.length === 0) return null;

    // 1. Subject stats
    const subjectStats: Record<string, { score: number; total: number; count: number }> = {};
    searchedLogs.forEach((log) => {
      const subj = log.subject === 'Math' ? 'Mathematics' : log.subject;
      if (!subjectStats[subj]) {
        subjectStats[subj] = { score: 0, total: 0, count: 0 };
      }
      subjectStats[subj].score += log.score;
      subjectStats[subj].total += log.totalQuestions;
      subjectStats[subj].count += 1;
    });

    // 2. Topic performance breakdown
    const topicAverages: Record<string, { sum: number; totalQ: number; totalScore: number; count: number; subject: string }> = {};
    searchedLogs.forEach((log) => {
      const pct = log.totalQuestions > 0 ? (log.score / log.totalQuestions) * 100 : 0;
      if (!topicAverages[log.topic]) {
        topicAverages[log.topic] = { sum: 0, totalQ: 0, totalScore: 0, count: 0, subject: log.subject };
      }
      topicAverages[log.topic].sum += pct;
      topicAverages[log.topic].totalScore += log.score;
      topicAverages[log.topic].totalQ += log.totalQuestions;
      topicAverages[log.topic].count += 1;
    });

    const sortedTopics = Object.keys(topicAverages).map((top) => ({
      name: top,
      subject: topicAverages[top].subject,
      average: Math.round(topicAverages[top].sum / Math.max(1, topicAverages[top].count)),
      count: topicAverages[top].count,
    })).sort((a, b) => b.average - a.average);

    const strongTopics = sortedTopics.filter((t) => t.average >= 80);
    const progressingTopics = sortedTopics.filter((t) => t.average >= 50 && t.average < 80);
    const weakTopics = sortedTopics.filter((t) => t.average < 50);

    const strongestTopic = strongTopics[0] || sortedTopics[0] || { name: 'N/A', average: 0, subject: '' };
    const weakestTopic = weakTopics[0] || progressingTopics[progressingTopics.length - 1] || sortedTopics[sortedTopics.length - 1] || { name: 'N/A', average: 0, subject: '' };

    // 3. Pre vs Post Growth & Normalized Gain (g)
    let totalPrePct = 0;
    let preCount = 0;
    let totalPostPct = 0;
    let postCount = 0;

    searchedLogs.forEach((log) => {
      const pct = log.totalQuestions > 0 ? Math.round((log.score / log.totalQuestions) * 100) : 0;
      if (log.assessmentType === 'pre-test') {
        totalPrePct += pct;
        preCount += 1;
      } else if (log.assessmentType === 'post-test') {
        totalPostPct += pct;
        postCount += 1;
      }
    });

    const avgPre = preCount > 0 ? Math.round(totalPrePct / preCount) : null;
    const avgPost = postCount > 0 ? Math.round(totalPostPct / postCount) : null;
    let normalizedGain: number | null = null;
    let absoluteGain: number | null = null;

    if (avgPre !== null && avgPost !== null) {
      absoluteGain = avgPost - avgPre;
      if (avgPre < 100) {
        normalizedGain = Math.round(((avgPost - avgPre) / (100 - avgPre)) * 100);
      } else {
        normalizedGain = absoluteGain;
      }
    }

    // 4. Cognitive Difficulty Accuracy
    const diffStats: Record<string, { score: number; total: number }> = {
      Easy: { score: 0, total: 0 },
      Average: { score: 0, total: 0 },
      Difficult: { score: 0, total: 0 },
    };

    searchedLogs.forEach((log) => {
      const diff = log.difficulty || 'Average';
      if (diffStats[diff]) {
        diffStats[diff].score += log.score;
        diffStats[diff].total += log.totalQuestions;
      }
    });

    const getParentTips = (topicName: string, avg: number): string => {
      if (topicName === 'N/A') return 'No sessions completed yet.';
      if (avg >= 85) {
        return `Exceptional work! Your child is mastering all topics, including ${topicName}. Ask them to explain this topic to you at dinner to lock in their learning.`;
      }
      if (topicName.toLowerCase().includes('fraction')) {
        return 'Help your child visualize fractions by cutting pizza, fruit, or bread into equal parts and naming them (e.g. "this slice is 1/4 of the whole pizza").';
      }
      if (topicName.toLowerCase().includes('decimal')) {
        return 'Practice decimals with grocery items or coins (e.g., 50 centavos = 0.50 pesos). Compare values to reinforce greater than and less than.';
      }
      if (topicName.toLowerCase().includes('simile') || topicName.toLowerCase().includes('figurative') || topicName.toLowerCase().includes('metaphor')) {
        return 'Read books together and point out comparisons. Ask them to complete prompts like: "as swift as an arrow" or "as bright as...".';
      }
      if (topicName.toLowerCase().includes('verb') || topicName.toLowerCase().includes('grammar')) {
        return 'Play a sentence game: say a subject (e.g., "The teacher...") and let your child complete it with the matching verb form.';
      }
      return `Review the practice explanation notes with your child for "${topicName}" and attempt the quiz again together to boost their comprehension.`;
    };

    return {
      subjectStats,
      strongTopics,
      progressingTopics,
      weakTopics,
      strongestTopic,
      weakestTopic,
      avgPre,
      avgPost,
      absoluteGain,
      normalizedGain,
      diffStats,
      tips: getParentTips(weakestTopic.name, weakestTopic.average),
    };
  };

  const handleShareReport = async () => {
    const report = getTutorReportData();
    const studentName = searchStudentId || 'Student';
    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    let text = `GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Learning Progress Report\n`;
    text += `Student ID: ${studentName}\n`;
    text += `Generated: ${dateStr}\n`;
    text += `\n--- Summary ---\n`;
    text += `Total Quizzes Completed: ${totalQuizzes}\n`;
    text += `Average Accuracy: ${avgScore}%\n`;

    if (report) {
      text += `\n--- Topic Performance ---\n`;
      text += `Strongest Topic: ${report.strongestTopic.name} (${report.strongestTopic.average}%)\n`;
      text += `Needs Improvement: ${report.weakestTopic.name} (${report.weakestTopic.average}%)\n`;
      text += `\n--- Parent Tip ---\n${report.tips}\n`;
    }

    text += `\nPowered by GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION — DepEd-Aligned Learning`;

    try {
      await Share.share({ message: text, title: `GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Progress Report — ${studentName}` });
    } catch (e: any) {
      toast.error('Failed to open share sheet.');
    }
  };

  const badgeDefinitions = [
    {
      id: 'first_step',
      name: 'First Step',
      icon: Award,
      color: '#3B82F6',
      description: 'Completed your first lesson.',
    },
    {
      id: 'perfect_score',
      name: 'Perfect 100%',
      icon: CheckCircle2,
      color: '#10B981',
      description: 'Got 100% on any quiz.',
    },
    {
      id: 'math_wizard',
      name: 'Math Wizard',
      icon: Calculator,
      color: '#F59E0B',
      description: 'Perfect score in Mathematics.',
    },
    {
      id: 'english_champion',
      name: 'English Champ',
      icon: BookOpen,
      color: '#8B5CF6',
      description: 'Perfect score in English.',
    },
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      icon: Flame,
      color: '#EF4444',
      description: 'Achieved a 3-day study streak.',
    },
    {
      id: 'streak_master',
      name: 'Streak Master',
      icon: Zap,
      color: '#EAB308',
      description: 'Achieved a 5-day study streak.',
    },
  ];

  const calculateMaxStreak = (logs: ProgressEvent[]): number => {
    if (logs.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(logs.map(log => new Date(log.timestamp).toISOString().split('T')[0]))
    ).sort();
    
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    for (const dateStr of uniqueDates) {
      const currentDate = new Date(dateStr);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      prevDate = currentDate;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    }
    return maxStreak;
  };

  const isBadgeUnlocked = (badgeId: string) => {
    if (searchedLogs.length === 0) return false;
    if (badgeId === 'first_step') return true;
    if (badgeId === 'perfect_score') {
      return searchedLogs.some((log) => log.score === log.totalQuestions);
    }
    if (badgeId === 'math_wizard') {
      return searchedLogs.some((log) => log.score === log.totalQuestions && log.subject.toLowerCase() === 'mathematics');
    }
    if (badgeId === 'english_champion') {
      return searchedLogs.some((log) => log.score === log.totalQuestions && log.subject.toLowerCase() === 'english');
    }
    if (badgeId === 'streak_starter' || badgeId === 'streak_master') {
      const streak = calculateMaxStreak(searchedLogs);
      return badgeId === 'streak_starter' ? streak >= 3 : streak >= 5;
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.headerTitle}>Parent Progress Explorer</Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(17,66,142,0.08)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(17,66,142,0.15)',
              }}>
                <Calendar size={11} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                  S.Y. {activeSchoolYear} • {activeTerm}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Guardian Oversight &amp; Growth Terminal</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <SyncBadge />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
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
        {/* ── Parent Progress Explorer ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <User size={18} color={Colors.accentSecondary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Parent Progress Explorer</Text>
              </View>
            }
            subtitle="Query child performance history from server"
          />

          <ThemedTextInput
            label="Child's Device or Student ID"
            placeholder="e.g. GURO-STUDENT-LOCAL"
            value={searchStudentId}
            onChangeText={setSearchStudentId}
            autoCapitalize="characters"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <ThemedTextInput
            label="6-Digit Parent Access Code"
            placeholder="e.g. 123456"
            value={searchAccessCode}
            onChangeText={setSearchAccessCode}
            maxLength={6}
            keyboardType="numeric"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <PrimaryButton
              label={loadingSearch ? "Searching..." : "Search Reports"}
              icon={<Search size={16} color={Colors.white} style={{ marginRight: 6 }} />}
              onPress={handleSearch}
              loading={loadingSearch}
              style={{ flex: 1 }}
            />
            {(searchStudentId || searchAccessCode) && (
              <DangerButton
                label=""
                icon={<Trash2 size={16} color={Colors.dangerText} />}
                onPress={handleClearSearch}
                style={{ width: 48, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center' }}
              />
            )}
          </View>

          {searchError && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md }}>
              <AlertCircle size={16} color={Colors.danger} />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.danger, flex: 1 }}>{searchError}</Text>
            </View>
          )}
        </GlassCard>

        {/* ── Explorer Results or Prompt ── */}
        {loadingSearch ? (
          <GlassCard style={styles.section}>
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
              <ActivityIndicator size="large" color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.accentPrimary, textAlign: 'center', marginTop: Spacing.xs }}>
                Retrieving learning curves...
              </Text>
            </View>
          </GlassCard>
        ) : searched ? (
          searchedLogs.length === 0 ? (
            <GlassCard style={styles.section}>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
                <ClipboardList size={36} color={Colors.textDark} style={{ opacity: 0.5 }} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain, textAlign: 'center' }}>
                  No reports registered for device ID "{searchStudentId}"
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.md }}>
                  Ensure your child has submitted quiz results in their mobile app and that you have clicked "Sync Progress Now" in the mobile Parent Space.
                </Text>
              </View>
            </GlassCard>
          ) : (
            <View style={{ gap: Spacing.lg }}>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <StatCard label="Lessons Completed" value={searchedLogs.length} icon={ClipboardList} />
                <StatCard
                  label="Average Accuracy"
                  value={`${avgScore}%`}
                  valueColor={avgScore >= 80 ? Colors.success : avgScore >= 60 ? Colors.warning : Colors.danger}
                  icon={Target}
                />
                <StatCard
                  label="Status"
                  value={avgScore >= 80 ? 'Advanced' : avgScore >= 50 ? 'Progressing' : 'Remedial'}
                  valueColor={avgScore >= 80 ? Colors.success : avgScore >= 50 ? Colors.warning : Colors.danger}
                  icon={BarChart2}
                />
              </View>

              {/* Segmented Sub-Tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: Colors.bgInput, padding: 4, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                {(['overview', 'report', 'milestones'] as const).map((tab) => {
                  const active = parentSubTab === tab;
                  let label = 'Activity Heatmap';
                  if (tab === 'report') label = 'Tutor Report';
                  if (tab === 'milestones') label = 'Badge Case';
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setParentSubTab(tab)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.sm,
                        borderRadius: Radius.sm,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? 'rgba(17,66,142,0.08)' : 'transparent',
                        borderWidth: active ? 1 : 0,
                        borderColor: Colors.accentPrimary
                      }}
                    >
                      <Text style={{ fontFamily: active ? Fonts.bodyBold : Fonts.body, fontSize: FontSizes.xs, color: active ? Colors.accentPrimary : Colors.textMuted }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Sub-Tab Contents ── */}
              {parentSubTab === 'overview' && (
                <>
                  {/* Heatmap Section */}
                  <GlassCard style={styles.section}>
                    <SectionHeader
                      title={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Calendar size={18} color={Colors.accentPrimary} />
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Activity Heatmap</Text>
                        </View>
                      }
                      subtitle="Daily assessment completion intensity (Past 28 Days)"
                    />

                    <View style={{ alignItems: 'center', marginVertical: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 224, gap: 8, justifyContent: 'center' }}>
                        {getPast28Days().map((date, idx) => {
                          const count = getEventCountForDate(date);
                          return (
                            <View
                              key={idx}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: Radius.sm,
                                backgroundColor: getHeatmapColor(count),
                                borderWidth: 1,
                                borderColor: Colors.border,
                              }}
                            />
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textDark }}>Less</Text>
                      <View style={{ width: 12, height: 12, borderRadius: Radius.sm, backgroundColor: getHeatmapColor(0) }} />
                      <View style={{ width: 12, height: 12, borderRadius: Radius.sm, backgroundColor: getHeatmapColor(1) }} />
                      <View style={{ width: 12, height: 12, borderRadius: Radius.sm, backgroundColor: getHeatmapColor(2) }} />
                      <View style={{ width: 12, height: 12, borderRadius: Radius.sm, backgroundColor: getHeatmapColor(3) }} />
                      <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textDark }}>More</Text>
                    </View>
                  </GlassCard>

                  {/* Practice timeline logs */}
                  <GlassCard style={styles.section}>
                    <SectionHeader
                      title={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ClipboardList size={18} color={Colors.accentPrimary} />
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Practice Timeline History</Text>
                        </View>
                      }
                      subtitle={`${searchedLogs.length} sessions recorded`}
                    />
                    {searchedLogs.map((item) => {
                      const percentage = Math.round((item.score / item.totalQuestions) * 100);
                      return (
                        <GlassCard key={item.eventId} variant="subtle" padding={Spacing.md} style={styles.logItem}>
                          <View style={styles.logLeft}>
                            <Text style={styles.logTopic}>{item.topic}</Text>
                            <Text style={styles.logDetail}>
                              Grade {item.gradeLevel} {item.subject} ·{' '}
                              {new Date(item.timestamp).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.logRight}>
                            <Text style={styles.logScore}>
                              {item.score}/{item.totalQuestions}
                            </Text>
                            <Badge
                              label={`${percentage}%`}
                              variant={percentage >= 80 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
                            />
                          </View>
                        </GlassCard>
                      );
                    })}
                  </GlassCard>
                </>
              )}

              {parentSubTab === 'report' && (() => {
                const report = getTutorReportData();
                if (!report) return null;
                return (
                  <GlassCard style={styles.section}>
                    <SectionHeader
                      title={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={18} color="#EC4899" />
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Tutor Report</Text>
                        </View>
                      }
                      subtitle="Subject mastery, strengths, and home action plan"
                    />

                    <View style={{ gap: Spacing.md }}>
                      {/* Growth Chip */}
                      {report.normalizedGain !== null && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: Radius.sm }}>
                          <TrendingUp size={16} color={Colors.success} />
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.success }}>
                            Learning Growth Gain: +{report.absoluteGain}% (Normalized g = {report.normalizedGain > 0 ? (report.normalizedGain / 100).toFixed(2) : 0})
                          </Text>
                        </View>
                      )}

                      {/* Subject Mastery Progress Bars */}
                      <View style={{ backgroundColor: Colors.bgInput, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Subject Mastery Breakdown
                        </Text>
                        {(['Mathematics', 'English'] as const).map((subj) => {
                          const data = report.subjectStats[subj] || { score: 0, total: 0, count: 0 };
                          const pct = data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
                          const isMath = subj === 'Mathematics';
                          const IconComp = isMath ? Calculator : BookOpen;
                          const color = pct >= 80 ? Colors.success : pct >= 50 ? Colors.warning : Colors.danger;
                          return (
                            <View key={subj} style={{ gap: 4 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <IconComp size={13} color={isMath ? Colors.accentPrimary : Colors.success} />
                                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.textMain }}>{subj}</Text>
                                </View>
                                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color }}>
                                  {pct}% ({data.count} {data.count === 1 ? 'quiz' : 'quizzes'})
                                </Text>
                              </View>
                              <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
                                <View style={{ height: '100%', width: `${Math.min(100, Math.max(5, pct))}%`, backgroundColor: color, borderRadius: 3 }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Strengths & Weaknesses Tally */}
                      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(16,185,129,0.05)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: Radius.sm, padding: Spacing.sm, gap: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={13} color={Colors.success} />
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.success }}>Top Strengths ({report.strongTopics.length})</Text>
                          </View>
                          {report.strongTopics.length === 0 ? (
                            <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' }}>Reach 80%+ to unlock</Text>
                          ) : (
                            report.strongTopics.slice(0, 2).map((t) => (
                              <Text key={t.name} style={{ fontFamily: Fonts.body, fontSize: 10.5, color: Colors.textMain }} numberOfLines={1}>
                                • {t.name} ({t.average}%)
                              </Text>
                            ))
                          )}
                        </View>

                        <View style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: Radius.sm, padding: Spacing.sm, gap: 4 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={13} color={Colors.danger} />
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.danger }}>Needs Focus ({report.weakTopics.length + report.progressingTopics.length})</Text>
                          </View>
                          {(report.weakTopics.length === 0 && report.progressingTopics.length === 0) ? (
                            <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.success }}>No weak topics!</Text>
                          ) : (
                            [...report.weakTopics, ...report.progressingTopics].slice(0, 2).map((t) => (
                              <Text key={t.name} style={{ fontFamily: Fonts.body, fontSize: 10.5, color: Colors.textMain }} numberOfLines={1}>
                                • {t.name} ({t.average}%)
                              </Text>
                            ))
                          )}
                        </View>
                      </View>

                      {/* Narrative Review */}
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMain, lineHeight: 20 }}>
                        Your child is demonstrating great work! Their strongest performance is on{' '}
                        <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.success }}>
                          {report.strongestTopic.name} ({report.strongestTopic.average}%)
                        </Text>
                        . We recommend allocating practice time on{' '}
                        <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.danger }}>
                          {report.weakestTopic.name} ({report.weakestTopic.average}%)
                        </Text>
                        .
                      </Text>

                      {/* Home Action Plan */}
                      <View style={{ flexDirection: 'row', gap: Spacing.sm, backgroundColor: 'rgba(236,72,153,0.05)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.15)', borderRadius: Radius.md, padding: Spacing.md }}>
                        <MessageCircle size={16} color="#EC4899" style={{ marginTop: 2 }} />
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: '#EC4899', textTransform: 'uppercase' }}>Home Study Plan for Parents</Text>
                          <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.xs, color: '#EC4899', lineHeight: 18 }}>
                            {report.tips}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={handleShareReport}
                        activeOpacity={0.8}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: Spacing.sm,
                          paddingVertical: Spacing.md,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: Colors.accentPrimary,
                          backgroundColor: 'rgba(17,66,142,0.05)',
                          marginTop: Spacing.xs,
                        }}
                      >
                        <Share2 size={16} color={Colors.accentPrimary} />
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                          Share Progress Report
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })()}

              {parentSubTab === 'milestones' && (
                <GlassCard style={styles.section}>
                  <SectionHeader
                    title={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Award size={18} color="#F59E0B" />
                        <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Badge Case</Text>
                      </View>
                    }
                    subtitle="Badges unlock at 80%+ mastery"
                  />

                  <View style={{ gap: Spacing.sm }}>
                    {badgeDefinitions.map((badge) => {
                      const unlocked = isBadgeUnlocked(badge.id);
                      const IconComponent = badge.icon;
                      return (
                        <View
                          key={badge.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: Spacing.md,
                            padding: Spacing.md,
                            borderRadius: Radius.md,
                            borderColor: unlocked ? `${badge.color}30` : Colors.border,
                            borderWidth: 1,
                            backgroundColor: unlocked ? Colors.bgInput : Colors.bgMain,
                            opacity: unlocked ? 1 : 0.6,
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: Radius.full,
                              backgroundColor: unlocked ? badge.color : Colors.border,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconComponent size={20} color={unlocked ? Colors.white : '#94A3B8'} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                              {badge.name}
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                              {badge.description}
                            </Text>
                          </View>
                          {unlocked && (
                            <Badge label="Unlocked" variant="success" />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              )}
            </View>
          )
        ) : (
          <GlassCard style={styles.section}>
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm }}>
              <BarChart2 size={36} color={Colors.accentPrimary} style={{ opacity: 0.6 }} />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain, textAlign: 'center' }}>
                Enter a Student ID and Access Code to query performance history
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.md }}>
                You can find the Student ID and the 6-Digit Parent Access Code on the home dashboard settings modal of the child's mobile app.
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Separator line */}
        <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }} />

        {/* Header for Settings Section */}
        <SectionHeader
          title={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Settings size={18} color={Colors.textMain} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Local Device Settings</Text>
            </View>
          }
          subtitle="Configure controls & PIN for this device"
        />

        {/* ── Parental Controls ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Shield size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Parental Controls</Text>
              </View>
            }
            subtitle="Screen time, gates & language"
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs }}>
            <Hourglass size={14} color="#94A3B8" />
            <Text style={[styles.controlLabel, { marginBottom: 0 }]}>
              Daily Screen Time Limit:{' '}
              <Text style={{ color: Colors.textMain }}>
                {parentalControls.dailyTimeLimit === 0
                  ? 'Unlimited'
                  : `${parentalControls.dailyTimeLimit} min`}
              </Text>
            </Text>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageText}>
              Used today:{' '}
              <Text style={{ color: timeLimitExceeded ? Colors.danger : Colors.success, fontFamily: Fonts.bodyBold }}>
                {Math.round(dailyMinutesUsed)}
              </Text>
              {' '}/ {parentalControls.dailyTimeLimit === 0 ? '∞' : parentalControls.dailyTimeLimit} min
            </Text>
            {dailyMinutesUsed > 0 && (
              <TouchableOpacity
                style={styles.resetTodayBtn}
                onPress={() => {
                  resetDailyMinutes();
                  toast.success("Today's screen time reset to 0.");
                }}
              >
                <Text style={styles.resetTodayText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.pillRow}>
            {[0, 15, 30, 45, 60].map((mins) => {
              const isActive = parentalControls.dailyTimeLimit === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => updateParentalControls({ dailyTimeLimit: mins })}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {mins === 0 ? 'Off' : `${mins}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Lock size={14} color="#94A3B8" />
                <Text style={styles.toggleTitle}>Math Progression Gate</Text>
              </View>
              <Text style={styles.toggleSub}>Lock English until Math scores ≥ 80%</Text>
            </View>
            <Switch
              value={parentalControls.mathBeforeEnglish}
              onValueChange={(v) => updateParentalControls({ mathBeforeEnglish: v })}
              trackColor={{ false: Colors.textDark, true: Colors.success }}
              thumbColor={Colors.white}
            />
          </View>

          <ThemedTextInput
            label="Priority Target Topic"
            placeholder="e.g. Fractions (leave blank for none)"
            value={parentalControls.priorityTopic || ''}
            onChangeText={(text) => updateParentalControls({ priorityTopic: text || null })}
            containerStyle={{ marginTop: Spacing.md }}
          />
        </GlassCard>

        {/* ── Cloud Sync ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Globe size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Cloud Sync</Text>
              </View>
            }
            subtitle="Upload progress to teacher's server"
          />
          <ThemedTextInput
            label="Server URL"
            placeholder="http://localhost:8000"
            value={serverUrl}
            onChangeText={(t) => {
              setServerUrl(t);
              useAppStore.getState().setServerUrl(t.trim());
            }}
            editable={!isSyncing}
            keyboardType="url"
            autoCapitalize="none"
          />
          <PrimaryButton
            label={`Sync Now (${unsyncedCount} staged)`}
            onPress={handleSync}
            loading={isSyncing}
            style={{ marginTop: Spacing.md }}
          />
        </GlassCard>

        {/* ── Device Profile ID ── */}
        {!isPinMode && (
          <GlassCard style={styles.section}>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Key size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Device Profile ID</Text>
                </View>
              }
              subtitle="Matches teacher/parent web dashboards"
            />
            <ThemedTextInput
              label="Student ID"
              placeholder="GURO-STUDENT-LOCAL"
              value={studentIdInput}
              onChangeText={setStudentIdInput}
              autoCapitalize="characters"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm }}>
              <Key size={14} color="#94A3B8" />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                Parent Access Code: {getParentAccessCode(studentId)}
              </Text>
            </View>
            <PrimaryButton
              label="Save Device ID"
              onPress={() => {
                if (!studentIdInput.trim()) {
                  toast.error('Student ID cannot be empty.');
                  return;
                }
                setStudentId(studentIdInput.trim());
                toast.success(`ID set to: ${studentIdInput.trim().toUpperCase()}`);
              }}
              style={{ marginTop: Spacing.md }}
            />
          </GlassCard>
        )}

        {/* ── Cloud Account ── */}
        {!isPinMode && (
          currentUser ? (
            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Users size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Cloud Account</Text>
                  </View>
                }
              />
              <GlassCard variant="subtle" padding={Spacing.md} style={{ marginBottom: Spacing.md }}>
                <Badge label="Linked" variant="success" style={{ marginBottom: Spacing.sm }} />
                <Text style={styles.accountName}>{currentUser.name}</Text>
                <Text style={styles.accountEmail}>{currentUser.email}</Text>
              </GlassCard>
              <DangerButton
                label="Log Out of Cloud Account"
                onPress={() => setShowLogoutConfirm(true)}
              />
            </GlassCard>
          ) : (
            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <User size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Cloud Profile</Text>
                  </View>
                }
                subtitle="Link local data to a cloud account"
              />
              {authMode === 'login' ? (
                <View style={styles.authForm}>
                  <ThemedTextInput
                    label="Email"
                    placeholder="your@email.com"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <ThemedTextInput
                    label="Password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry
                    containerStyle={{ marginTop: Spacing.md }}
                  />
                  <PrimaryButton
                    label={isAuthSubmitting ? 'Signing in…' : 'Sign In & Link Progress'}
                    onPress={async () => {
                      if (!authEmail.trim() || !authPassword.trim()) {
                        toast.error('Enter email and password.');
                        return;
                      }
                      setIsAuthSubmitting(true);
                      const res = await loginToCloud(authEmail.trim(), authPassword.trim());
                      setIsAuthSubmitting(false);
                      if (res.success) {
                        toast.success(res.message);
                        setAuthEmail('');
                        setAuthPassword('');
                      } else {
                        toast.error(res.message);
                      }
                    }}
                    loading={isAuthSubmitting}
                    style={{ marginTop: Spacing.lg }}
                  />
                  <TouchableOpacity onPress={() => setAuthMode('register')} style={styles.authSwitch}>
                    <Text style={styles.authSwitchText}>Need an account? Register here →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.authForm}>
                  <ThemedTextInput
                    label="Full Name"
                    placeholder="Student Juan"
                    value={authName}
                    onChangeText={setAuthName}
                  />
                  <ThemedTextInput
                    label="Email"
                    placeholder="your@email.com"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    containerStyle={{ marginTop: Spacing.md }}
                  />
                  <ThemedTextInput
                    label="Password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry
                    containerStyle={{ marginTop: Spacing.md }}
                  />
                  <PrimaryButton
                    label={isAuthSubmitting ? 'Registering…' : 'Register & Merge Local Data'}
                    onPress={async () => {
                      if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
                        toast.error('Fill in all fields.');
                        return;
                      }
                      setIsAuthSubmitting(true);
                      const res = await registerAndPromote(authEmail.trim(), authPassword.trim(), authName.trim());
                      setIsAuthSubmitting(false);
                      if (res.success) {
                        toast.success(res.message);
                        setAuthName('');
                        setAuthEmail('');
                        setAuthPassword('');
                      } else {
                        toast.error(res.message);
                      }
                    }}
                    loading={isAuthSubmitting}
                    style={{ marginTop: Spacing.lg }}
                  />
                  <TouchableOpacity onPress={() => setAuthMode('login')} style={styles.authSwitch}>
                    <Text style={styles.authSwitchText}>Have an account? Sign in here →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          )
        )}

        {/* ── Settings: PIN + Clear ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Settings size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Portal Settings</Text>
              </View>
            }
          />

          {!isChangingPin ? (
            <SecondaryButton
              label="Change Dashboard PIN"
              icon={<Lock size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />}
              onPress={() => setIsChangingPin(true)}
            />
          ) : (
            <GlassCard variant="subtle" padding={Spacing.md} style={{ marginBottom: Spacing.md }}>
              <Text style={styles.pinFormTitle}>Update Parent PIN</Text>
              {parentPin && (
                <ThemedTextInput
                  label="Current PIN"
                  placeholder="••••"
                  secureTextEntry
                  maxLength={4}
                  keyboardType="numeric"
                  value={currentPinInput}
                  onChangeText={setCurrentPinInput}
                  containerStyle={{ marginBottom: Spacing.md }}
                />
              )}
              <ThemedTextInput
                label="New PIN"
                placeholder="••••"
                secureTextEntry
                maxLength={4}
                keyboardType="numeric"
                value={newPinInput}
                onChangeText={setNewPinInput}
                containerStyle={{ marginBottom: Spacing.md }}
              />
              <ThemedTextInput
                label="Confirm PIN"
                placeholder="••••"
                secureTextEntry
                maxLength={4}
                keyboardType="numeric"
                value={confirmPinInput}
                onChangeText={setConfirmPinInput}
                containerStyle={{ marginBottom: Spacing.md }}
              />
              <View style={styles.pinActions}>
                <SecondaryButton
                  label="Cancel"
                  onPress={() => {
                    setIsChangingPin(false);
                    setCurrentPinInput('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                  }}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label="Change PIN"
                  onPress={handlePinChangeSubmit}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          )}

          <DangerButton
            label="Clear Practice History"
            icon={<Trash2 size={16} color={Colors.dangerText} style={{ marginRight: 6 }} />}
            onPress={handleClearHistory}
            style={{ marginTop: Spacing.md }}
          />
        </GlassCard>

        {/* Exit Parent Portal button */}
        <SecondaryButton
          label="Exit Parent Portal"
          icon={<LogOut size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />}
          onPress={() => setShowExitPortalConfirm(true)}
          style={{ marginTop: Spacing.md }}
        />

        {/* Bottom padding */}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Clear Practice History Dialog */}
      <ConfirmDialog
        visible={showClearProgressConfirm}
        title="Clear Student Progress?"
        message="Are you sure you want to clear student progress? This will remove all local practice logs from this device."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
        onConfirm={() => {
          clearProgress();
          setShowClearProgressConfirm(false);
          toast.success('Practice logs cleared.');
        }}
        onCancel={() => setShowClearProgressConfirm(false)}
      />

      {/* Cloud Logout Dialog */}
      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Confirm Cloud Logout"
        message="Are you sure you want to log out? You will need to sign in again to access your cloud account."
        confirmText="Log Out"
        cancelText="Cancel"
        variant="danger"
        icon={LogOut}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logoutFromCloud();
          navigation.replace((appMode as string) === 'offline' ? 'StudentDashboard' : 'Login');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Exit Parent Portal Dialog */}
      <ConfirmDialog
        visible={showExitPortalConfirm}
        title={isPinMode ? 'Exit Parent Portal' : 'Exit and Logout'}
        message={
          isPinMode
            ? 'Return to the student home screen?'
            : 'Are you sure you want to exit the Parent Portal and log out?'
        }
        confirmText={isPinMode ? 'Exit Portal' : 'Log Out'}
        cancelText="Stay Here"
        variant={isPinMode ? 'primary' : 'danger'}
        icon={LogOut}
        onConfirm={() => {
          setShowExitPortalConfirm(false);
          if (!isPinMode) logoutFromCloud();
          navigation.replace((isPinMode || (appMode as string) === 'offline') ? 'StudentDashboard' : 'Login');
        }}
        onCancel={() => setShowExitPortalConfirm(false)}
      />
    </SafeAreaView>
  );
}
