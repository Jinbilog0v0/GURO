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
import { styles } from '../styles/ParentDashboard.styles';
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
} from 'lucide-react-native';
import { toast } from '../components';

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
    Alert.alert(
      'Clear Student Progress',
      'Are you sure? This cannot be undone locally.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearProgress();
            toast.success('Practice logs cleared.');
          },
        },
      ]
    );
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
    if (count === 0) return 'rgba(255, 255, 255, 0.03)';
    if (count === 1) return 'rgba(139, 92, 246, 0.2)';
    if (count === 2) return 'rgba(139, 92, 246, 0.5)';
    return 'rgba(139, 92, 246, 0.9)';
  };

  const getTutorReportData = () => {
    if (searchedLogs.length === 0) return null;

    const topicAverages: Record<string, { sum: number; count: number; subject: string }> = {};
    searchedLogs.forEach((log) => {
      const pct = (log.score / log.totalQuestions) * 100;
      if (!topicAverages[log.topic]) {
        topicAverages[log.topic] = { sum: 0, count: 0, subject: log.subject };
      }
      topicAverages[log.topic].sum += pct;
      topicAverages[log.topic].count += 1;
    });

    const sortedTopics = Object.keys(topicAverages).map((top) => ({
      name: top,
      subject: topicAverages[top].subject,
      average: Math.round(topicAverages[top].sum / topicAverages[top].count),
    })).sort((a, b) => b.average - a.average);

    const strongestTopic = sortedTopics[0] || { name: 'N/A', average: 0, subject: '' };
    const weakestTopic = sortedTopics[sortedTopics.length - 1] || { name: 'N/A', average: 0, subject: '' };

    const getParentTips = (topicName: string, avg: number): string => {
      if (topicName === 'N/A') return 'No sessions completed yet.';
      if (avg >= 85) {
        return `Exceptional work! Your child is mastering all topics, including ${topicName}. Ask them to explain this topic to you at dinner to lock in their learning.`;
      }
      if (topicName.toLowerCase().includes('fraction')) {
        return 'Help your child visualize fractions by cutting pizza, fruit, or bread into equal parts and naming them (e.g. "this slice is 1/4 of the whole pizza").';
      }
      if (topicName.toLowerCase().includes('simile') || topicName.toLowerCase().includes('figurative') || topicName.toLowerCase().includes('metaphor')) {
        return 'Read books together and point out comparisons. Ask them to complete prompts like: "as swift as an arrow" or "as bright as...".';
      }
      return `Review the practice explanation notes with your child for "${topicName}" and attempt the quiz again together to boost their comprehension.`;
    };

    return {
      strongestTopic,
      weakestTopic,
      tips: getParentTips(weakestTopic.name, weakestTopic.average),
    };
  };

  const handleShareReport = async () => {
    const report = getTutorReportData();
    const studentName = searchStudentId || 'Student';
    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    let text = `GURO Learning Progress Report\n`;
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

    text += `\nPowered by GURO — DepEd-Aligned Learning`;

    try {
      await Share.share({ message: text, title: `GURO Progress Report — ${studentName}` });
    } catch (e: any) {
      toast.error('Failed to open share sheet.');
    }
  };

  const badgeDefinitions = [
    {
      id: 'fraction-cadet',
      name: 'Fraction Cadet',
      topicName: 'Fractions',
      subject: 'Mathematics',
      icon: Pizza,
      color: '#3B82F6',
      description: 'Achieve 80%+ accuracy on Grade 4 Fractions.',
    },
    {
      id: 'decimal-scout',
      name: 'Decimal Scout',
      topicName: 'Decimals',
      subject: 'Mathematics',
      icon: Coins,
      color: '#0EA5E9',
      description: 'Achieve 80%+ accuracy on Grade 5 Decimals.',
    },
    {
      id: 'simile-pioneer',
      name: 'Simile Pioneer',
      topicName: 'Figurative Language',
      subject: 'English',
      icon: Award,
      color: '#8B5CF6',
      description: 'Achieve 80%+ accuracy on Grade 4 Figurative Language.',
    },
    {
      id: 'equation-master',
      name: 'Algebra Algebrator',
      topicName: 'Algebraic Equations',
      subject: 'Mathematics',
      icon: Target,
      color: '#F59E0B',
      description: 'Achieve 80%+ accuracy on Grade 6 Algebraic Equations.',
    },
  ];

  const isBadgeUnlocked = (topicName: string) => {
    const topicLogs = searchedLogs.filter((log) => log.topic.toLowerCase().includes(topicName.toLowerCase()));
    if (topicLogs.length === 0) return false;
    const avg = topicLogs.reduce((sum, log) => sum + (log.score / log.totalQuestions) * 100, 0) / topicLogs.length;
    return avg >= 80;
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View>
            <Text style={styles.headerTitle}>Parent Portal</Text>
            <Text style={styles.headerSub}>Monitor, control &amp; sync</Text>
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
                <StatCard label="Completed Quests" value={searchedLogs.length} icon={ClipboardList} />
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
              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                {(['overview', 'report', 'milestones'] as const).map((tab) => {
                  const active = parentSubTab === tab;
                  let label = 'Overview';
                  if (tab === 'report') label = 'Tutor Report';
                  if (tab === 'milestones') label = 'Milestones';
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

              {parentSubTab === 'overview' && (
                <>
                  {/* Heatmap Card */}
                  <GlassCard style={styles.section}>
                    <SectionHeader
                      title={
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Calendar size={18} color="#8B5CF6" />
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Practice Consistency Tracker</Text>
                        </View>
                      }
                      subtitle="Daily activity calendar (past 4 weeks)"
                    />

                    <View style={{ alignItems: 'center', marginVertical: Spacing.md }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 224, gap: 8 }}>
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
                                borderColor: 'rgba(255,255,255,0.05)',
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
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>AI Study Feedback</Text>
                        </View>
                      }
                      subtitle="Narrative performance review and tips"
                    />

                    <View style={{ gap: Spacing.md }}>
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMain, lineHeight: 20 }}>
                        Your child is demonstrating great work! Their strongest subject performance is on{' '}
                        <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.success }}>
                          {report.strongestTopic.name} ({report.strongestTopic.average}%)
                        </Text>
                        . We recommend allocating more practice focus on{' '}
                        <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.danger }}>
                          {report.weakestTopic.name} ({report.weakestTopic.average}%)
                        </Text>
                        .
                      </Text>

                      <View style={{ flexDirection: 'row', gap: Spacing.sm, backgroundColor: 'rgba(236,72,153,0.05)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.15)', borderRadius: Radius.md, padding: Spacing.md }}>
                        <MessageCircle size={16} color="#EC4899" style={{ marginTop: 2 }} />
                        <Text style={{ fontFamily: Fonts.bodyMedium, fontSize: FontSizes.xs, color: '#EC4899', flex: 1, lineHeight: 18 }}>
                          {report.tips}
                        </Text>
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
                        <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Milestone Badge Case</Text>
                      </View>
                    }
                    subtitle="Badges unlock at 80%+ mastery"
                  />

                  <View style={{ gap: Spacing.sm }}>
                    {badgeDefinitions.map((badge) => {
                      const unlocked = isBadgeUnlocked(badge.topicName);
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
                            backgroundColor: unlocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                            opacity: unlocked ? 1 : 0.6,
                          }}
                        >
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: Radius.full,
                              backgroundColor: unlocked ? badge.color : 'rgba(255,255,255,0.05)',
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
                onPress={() => {
                  Alert.alert(
                    'Confirm Logout',
                    'Are you sure you want to log out? You will need to sign in again to access your account.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Logout',
                        style: 'destructive',
                        onPress: () => {
                          logoutFromCloud();
                          navigation.replace((appMode as string) === 'offline' ? 'StudentDashboard' : 'Login');
                        },
                      },
                    ]
                  );
                }}
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
          onPress={() => {
            Alert.alert(
              isPinMode ? 'Exit Parent Portal' : 'Exit and Logout',
              isPinMode
                ? 'Return to the student home screen?'
                : 'Are you sure you want to exit the Parent Portal and log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: isPinMode ? 'Exit' : 'Logout',
                  style: 'destructive',
                  onPress: () => {
                    if (!isPinMode) logoutFromCloud();
                    navigation.replace((isPinMode || (appMode as string) === 'offline') ? 'StudentDashboard' : 'Login');
                  },
                },
              ]
            );
          }}
          style={{ marginTop: Spacing.md }}
        />

        {/* Bottom padding */}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
