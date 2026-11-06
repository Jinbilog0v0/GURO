import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { getAppVersionFooter } from '../constants/appVersion';
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
  Clock,
  Send,
  Plus,
  Link as LinkIcon,
  X,
  MoreVertical,
  Edit2,
  History,
  Ban,
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
  const token = useAppStore((state) => state.token);
  const myChildren = useAppStore((state) => state.myChildren);
  const activeChildId = useAppStore((state) => state.activeChildId);
  const setActiveChildId = useAppStore((state) => state.setActiveChildId);
  const fetchMyChildren = useAppStore((state) => state.fetchMyChildren);
  const claimChild = useAppStore((state) => state.claimChild);

  const isPinMode = appMode === 'offline' || currentUser?.role === 'student';

  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    insets = useSafeAreaInsets();
  } catch {
    // Fallback if rendered outside SafeAreaProvider
  }
  const bottomInset = Math.max(insets.bottom || 0, 24);
  const [activeTab, setActiveTab] = useState<'progress' | 'chat' | 'settings'>('progress');

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
  const [serverUrl, setServerUrl] = useState(serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app');
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

  const [showManualSearch, setShowManualSearch] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStudentId, setClaimStudentId] = useState('');
  const [claimAccessCode, setClaimAccessCode] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const selectedChild = (myChildren || []).find((c) => c.studentId === activeChildId) || myChildren?.[0] || null;

  const handleRefresh = async () => {
    if (selectedChild) {
      setRefreshing(true);
      await loadChildProgress(selectedChild.studentId, selectedChild.accessCode);
      setRefreshing(false);
      return;
    }
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
  const chatScrollRef = useRef<ScrollView>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender_name: string;
    sender_role: string;
    message_body: string;
    created_at: string;
    is_unsent?: boolean;
    unsent_at?: string | null;
    original_message_body?: string | null;
    edited_at?: string | null;
    edit_history?: Array<{ previous_body: string; edited_at: string }> | null;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [activeTeacherName, setActiveTeacherName] = useState<string | null>(null);
  const [activeConsultationHours, setActiveConsultationHours] = useState<string | null>(null);

  // Chat message forgiveness state
  const [selectedActionMessage, setSelectedActionMessage] = useState<any | null>(null);
  const [editingChatModalMessage, setEditingChatModalMessage] = useState<any | null>(null);
  const [editingChatText, setEditingChatText] = useState('');
  const [isSavingChatEdit, setIsSavingChatEdit] = useState(false);
  const [viewHistoryMessage, setViewHistoryMessage] = useState<any | null>(null);
  const [unsendConfirmMessage, setUnsendConfirmMessage] = useState<any | null>(null);

  const handleOpenMessageOptions = (msg: any) => {
    setSelectedActionMessage(msg);
  };

  const handleStartEditFromOptions = (msg: any) => {
    const isWithin30Mins = Date.now() - new Date(msg.created_at).getTime() <= 30 * 60 * 1000;
    if (!isWithin30Mins) {
      toast.error('Messages can only be edited within 30 minutes of sending.');
      setSelectedActionMessage(null);
      return;
    }
    setEditingChatModalMessage(msg);
    setEditingChatText(msg.message_body);
    setSelectedActionMessage(null);
  };

  const handleSaveMobileEdit = async () => {
    if (!editingChatModalMessage || !editingChatText.trim()) return;
    setIsSavingChatEdit(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: editingChatModalMessage.id,
          messageBody: editingChatText.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === editingChatModalMessage.id ? { ...m, ...data.message } : m))
        );
        setEditingChatModalMessage(null);
        setEditingChatText('');
        toast.success('Message updated.');
      } else {
        toast.error(data.error || 'Failed to edit message.');
      }
    } catch {
      toast.error('Network error updating message.');
    } finally {
      setIsSavingChatEdit(false);
    }
  };

  const handleUnsendMobile = async (msg: any) => {
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/unsend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_unsent: true, ...data.message } : m))
        );
        setSelectedActionMessage(null);
        setUnsendConfirmMessage(null);
        toast.success('Message unsent.');
      } else {
        toast.error(data.error || 'Failed to unsend message.');
      }
    } catch {
      toast.error('Network error unsending message.');
    }
  };
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
  const loadChildProgress = async (cId: string, code?: string) => {
    if (!cId) return;
    setSearchStudentId(cId);
    if (code) setSearchAccessCode(code);
    setLoadingSearch(true);
    setSearched(true);
    setSearchError(null);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const codeParam = code ? `&accessCode=${encodeURIComponent(code)}` : (searchAccessCode ? `&accessCode=${encodeURIComponent(searchAccessCode)}` : '');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = `${resolvedUrl}/api/progress?studentId=${encodeURIComponent(cId)}${codeParam}`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setSearchedLogs(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        setSearchError(errData.error || 'Failed to retrieve logs for this student.');
        setSearchedLogs([]);
      }
    } catch {
      setSearchError('A network error occurred. Please try again.');
      setSearchedLogs([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectChild = (child: any) => {
    setActiveChildId(child.studentId);
    loadChildProgress(child.studentId, child.accessCode);
    if (child.classroomId) {
      fetchChatMessages(child.classroomId, child.studentId);
    }
  };

  const handleClaimChild = async () => {
    if (!claimStudentId.trim() || !claimAccessCode.trim()) {
      setClaimError('Please enter both Student ID and Access Code.');
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      const res = await claimChild(claimStudentId.trim(), claimAccessCode.trim(), serverUrl);
      if (res.success) {
        toast.success(res.message);
        setShowClaimModal(false);
        setClaimStudentId('');
        setClaimAccessCode('');
        loadChildProgress(claimStudentId.trim(), claimAccessCode.trim());
      } else {
        setClaimError(res.message);
      }
    } catch {
      setClaimError('Failed to link child. Check network connection.');
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'parent') {
      fetchMyChildren();
    }
  }, [currentUser]);

  useEffect(() => {
    if (myChildren && myChildren.length > 0 && !searched && !searchStudentId) {
      const child = myChildren.find((c) => c.studentId === activeChildId) || myChildren[0];
      if (child) {
        handleSelectChild(child);
      }
    }
  }, [myChildren]);

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
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
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

  const fetchChatMessages = async (classroomIdToUse?: string, studentIdToUse?: string) => {
    const cId = classroomIdToUse || selectedChild?.classroomId || searchedLogs[0]?.classroomId || useAppStore.getState().classroomId;
    const sId = studentIdToUse || selectedChild?.studentId || searchStudentId.trim() || studentId;
    if (!cId || !sId) return;
    setLoadingChat(true);
    setChatError(null);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/messages?classroomId=${encodeURIComponent(cId)}&studentId=${encodeURIComponent(sId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) setChatMessages(data.messages);
        if (data.teacherName) setActiveTeacherName(data.teacherName);
        if (data.consultationHours) setActiveConsultationHours(data.consultationHours);
        setChatError(null);
      } else {
        setChatError('Server returned an error. Please try again.');
      }
    } catch (e: any) {
      console.warn('[ParentChat] fetch error:', e);
      setChatError('Failed to connect to school server. Please verify your internet connection.');
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendChat = async () => {
    const body = chatInput.trim();
    if (!body) return;
    const cId = selectedChild?.classroomId || searchedLogs[0]?.classroomId || useAppStore.getState().classroomId;
    const sId = selectedChild?.studentId || searchStudentId.trim() || studentId;
    if (!cId) {
      toast.error('No classroom associated with this student profile.');
      return;
    }
    setIsSendingChat(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: cId,
          studentId: sId,
          messageBody: body,
          senderRole: 'parent',
          senderName: currentUser?.name || 'Parent/Guardian',
        }),
      });
      if (res.ok) {
        setChatInput('');
        await fetchChatMessages(cId, sId);
        toast.success('Message sent to teacher.');
      } else {
        toast.error('Failed to send message.');
      }
    } catch {
      toast.error('Network error. Could not send message.');
    } finally {
      setIsSendingChat(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatMessages();
    }
  }, [activeTab]);

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

    const strongTopics = sortedTopics.filter((t) => t.average >= 75);
    const progressingTopics = sortedTopics.filter((t) => t.average >= 50 && t.average < 75);
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
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* ── Sticky Full-Width Header Bar (Edge-to-Edge) — Main Screen / Child Progress Only ── */}
      {activeTab === 'progress' && (
        <View style={styles.header}>
          <View style={styles.headerAccentLine} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.headerTitle}>GURO Parent Explorer</Text>
              </View>
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
                alignSelf: 'flex-start',
                marginTop: 4,
                marginBottom: 2,
              }}>
                <Calendar size={11} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                  S.Y. {activeSchoolYear} • {activeTerm}
                </Text>
              </View>
              <Text style={styles.headerSub}>
                Child Progress & Parental Controls
              </Text>
            </View>

            <View style={styles.headerRight}>
              <Badge label="Parent" variant="indigo" style={styles.roleBadge} />
              <SyncBadge />
            </View>
          </View>
        </View>
      )}

      {/* ── Tab 1: Child Progress & Learning ── */}
      <View style={activeTab === 'progress' ? { flex: 1 } : { display: 'none', height: 0, flex: 0 }}>
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
          {/* ── Direct Bound Children Selector (Cloud Parent Mode) ── */}
        {myChildren && myChildren.length > 0 && (
          <GlassCard style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Users size={18} color={Colors.accentSecondary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>My Registered Children</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowClaimModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(236,72,153,0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
                accessibilityLabel="Link Existing Child"
              >
                <Plus size={12} color="#ec4899" />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: '#ec4899' }}>Link Child</Text>
              </TouchableOpacity>
            </View>

            {/* Child Chips ScrollView */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {myChildren.map((child) => {
                const isSelected = selectedChild?.studentId === child.studentId;
                return (
                  <TouchableOpacity
                    key={child.studentId}
                    onPress={() => handleSelectChild(child)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 14,
                      backgroundColor: isSelected ? Colors.accentPrimary : 'rgba(0,0,0,0.03)',
                      borderWidth: 1,
                      borderColor: isSelected ? Colors.accentPrimary : 'rgba(0,0,0,0.08)',
                    }}
                    accessibilityLabel={`Select child ${child.name}`}
                  >
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(17,66,142,0.1)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.display, fontSize: 11, color: isSelected ? Colors.white : Colors.accentPrimary }}>
                        {(child.name || 'C').charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: isSelected ? Colors.white : Colors.textMain }}>
                        {child.name}
                      </Text>
                      {child.section && (
                        <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.8)' : Colors.textMuted }}>
                          {child.section}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedChild && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                  Active: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{selectedChild.name}</Text> ({selectedChild.studentId})
                </Text>
                <TouchableOpacity onPress={() => setShowManualSearch(!showManualSearch)}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary }}>
                    {showManualSearch ? 'Hide Search' : 'Manual Code Search'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        )}

        {/* Empty Children State for Authenticated Parent */}
        {currentUser?.role === 'parent' && (!myChildren || myChildren.length === 0) && (
          <GlassCard style={[styles.section, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <Users size={36} color={Colors.accentSecondary} style={{ marginBottom: 6, opacity: 0.7 }} />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain, textAlign: 'center' }}>
              No Children Linked Yet
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginVertical: Spacing.xs, paddingHorizontal: Spacing.md }}>
              Link your child's student account to view their quiz accuracy, topic mastery, and message their classroom teacher directly.
            </Text>
            <PrimaryButton
              label="Link Child Account"
              icon={<LinkIcon size={14} color={Colors.white} style={{ marginRight: 6 }} />}
              onPress={() => setShowClaimModal(true)}
              style={{ marginTop: Spacing.sm }}
            />
          </GlassCard>
        )}

        {/* ── Parent Progress Explorer (Search Form) ── */}
        {(showManualSearch || (!myChildren || myChildren.length === 0) || currentUser?.role !== 'parent') && (
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
              label="Child's Name (Last Name, First Name) or Student ID"
              placeholder="e.g. Cruz, Juan or Student ID"
              value={searchStudentId}
              onChangeText={setSearchStudentId}
              autoCapitalize="words"
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
        )}

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
                  No reports registered for "{searchStudentId}"
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
                  valueColor={avgScore >= 75 ? Colors.success : avgScore >= 50 ? Colors.warning : Colors.danger}
                  icon={Target}
                />
                <StatCard
                  label="Status"
                  value={avgScore >= 75 ? 'Advanced' : avgScore >= 50 ? 'Progressing' : 'Remedial'}
                  valueColor={avgScore >= 75 ? Colors.success : avgScore >= 50 ? Colors.warning : Colors.danger}
                  icon={BarChart2}
                />
              </View>

              {/* Segmented Sub-Tabs */}
              <View style={styles.subTabsContainer}>
                {(
                  [
                    { key: 'overview', label: 'Overview', icon: Calendar },
                    { key: 'report', label: 'Report', icon: Sparkles },
                    { key: 'milestones', label: 'Badges', icon: Award },
                  ] as const
                ).map((tabItem) => {
                  const active = parentSubTab === tabItem.key;
                  const IconComp = tabItem.icon;
                  return (
                    <TouchableOpacity
                      key={tabItem.key}
                      onPress={() => setParentSubTab(tabItem.key)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={tabItem.label}
                      style={[
                        styles.subTabButton,
                        active && styles.subTabButtonActive,
                      ]}
                    >
                      <IconComp
                        size={14}
                        color={active ? Colors.accentPrimary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.subTabLabel,
                          active && styles.subTabLabelActive,
                        ]}
                      >
                        {tabItem.label}
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

                    {(() => {
                      const pastDays = getPast28Days();
                      const weeks = [
                        pastDays.slice(0, 7),
                        pastDays.slice(7, 14),
                        pastDays.slice(14, 21),
                        pastDays.slice(21, 28),
                      ];
                      return (
                        <View style={styles.heatmapContainer}>
                          <View style={styles.heatmapHeaderRow}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                              <Text key={idx} style={styles.heatmapHeaderDay}>{day}</Text>
                            ))}
                          </View>
                          {weeks.map((week, wIdx) => (
                            <View key={wIdx} style={styles.heatmapWeekRow}>
                              {week.map((date, dIdx) => {
                                const count = getEventCountForDate(date);
                                return (
                                  <View
                                    key={dIdx}
                                    style={[
                                      styles.heatmapDayBox,
                                      { backgroundColor: getHeatmapColor(count) },
                                    ]}
                                  />
                                );
                              })}
                            </View>
                          ))}
                        </View>
                      );
                    })()}

                    <View style={styles.heatmapLegend}>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textDark }}>Less</Text>
                      <View style={[styles.heatmapDayBox, { width: 14, height: 14, backgroundColor: getHeatmapColor(0) }]} />
                      <View style={[styles.heatmapDayBox, { width: 14, height: 14, backgroundColor: getHeatmapColor(1) }]} />
                      <View style={[styles.heatmapDayBox, { width: 14, height: 14, backgroundColor: getHeatmapColor(2) }]} />
                      <View style={[styles.heatmapDayBox, { width: 14, height: 14, backgroundColor: getHeatmapColor(3) }]} />
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
                              variant={percentage >= 75 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}
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
                          const color = pct >= 75 ? Colors.success : pct >= 50 ? Colors.warning : Colors.danger;
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
                            <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, fontStyle: 'italic' }}>Reach 75%+ to unlock</Text>
                          ) : (
                            report.strongTopics.slice(0, 8).map((t) => (
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
                            [...report.weakTopics, ...report.progressingTopics].slice(0, 8).map((t) => (
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
                    subtitle="Badges unlock at 75%+ mastery"
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

        {/* Bottom spacing for Tab 1 */}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>

      {/* ── Tab 2: Teacher Consultation Chat ── */}
      <View style={activeTab === 'chat' ? { flex: 1 } : { display: 'none', height: 0, flex: 0 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Teacher Consultation Header Card */}
          <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}>
            <GlassCard padding={Spacing.md} style={styles.chatTeacherCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={styles.teacherAvatarCircle}>
                    <MessageCircle size={20} color={Colors.accentPrimary} />
                  </View>
                  <View>
                    <Text style={styles.chatTeacherName}>
                      {activeTeacherName || 'Classroom Teacher'}
                    </Text>
                    <Text style={styles.chatTeacherSubtitle}>
                      Direct Consultation Line
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => fetchChatMessages()}
                  style={styles.chatRefreshBtn}
                  disabled={loadingChat}
                  accessibilityRole="button"
                  accessibilityLabel="Refresh messages"
                >
                  <RefreshCw size={14} color={loadingChat ? Colors.textMuted : Colors.accentPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.consultationHoursBadge}>
                <Clock size={13} color={Colors.accentPrimary} />
                <Text style={styles.consultationHoursText}>
                  {activeConsultationHours || 'Monday – Friday: 3:00 PM – 5:00 PM (DepEd Consultation Window)'}
                </Text>
              </View>
            </GlassCard>

            {chatError && chatMessages.length > 0 && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs,
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
                marginBottom: Spacing.xs,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <AlertCircle size={14} color={Colors.dangerText} />
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.dangerText }}>
                    Connection error. Messages may be outdated.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => fetchChatMessages()} disabled={loadingChat}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={chatScrollRef}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {loadingChat && chatMessages.length === 0 ? (
              <View style={styles.chatEmptyContainer}>
                <ActivityIndicator size="small" color={Colors.accentPrimary} />
                <Text style={styles.chatEmptySub}>Loading consultation messages...</Text>
              </View>
            ) : chatError && chatMessages.length === 0 ? (
              <View style={styles.chatEmptyContainer}>
                <View style={[styles.chatEmptyIconWrap, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                  <AlertCircle size={32} color={Colors.dangerText} />
                </View>
                <Text style={styles.chatEmptyTitle}>Connection Problem</Text>
                <Text style={styles.chatEmptySub}>{chatError}</Text>
                <TouchableOpacity
                  onPress={() => fetchChatMessages()}
                  style={{
                    marginTop: Spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: Radius.md,
                    backgroundColor: Colors.accentPrimary,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Retry Connection"
                >
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: '#FFFFFF' }}>
                    Retry Connection
                  </Text>
                </TouchableOpacity>
              </View>
            ) : chatMessages.length === 0 ? (
              <View style={styles.chatEmptyContainer}>
                <View style={styles.chatEmptyIconWrap}>
                  <MessageCircle size={32} color={Colors.accentPrimary} />
                </View>
                <Text style={styles.chatEmptyTitle}>No Consultation Messages</Text>
                <Text style={styles.chatEmptySub}>
                  Have questions about your child's lessons, homework, or progress? Send a direct message to their teacher below.
                </Text>
              </View>
            ) : (
              chatMessages.map((msg) => {
                const isParent = msg.sender_role === 'parent';
                const isUnsent = msg.is_unsent;
                const isEdited = Boolean(msg.edited_at);
                const parentRegisteredName = currentUser?.name || (msg.sender_name && msg.sender_name !== 'Parent/Guardian' && msg.sender_name !== 'Parent' ? msg.sender_name : null);
                const parentLabel = parentRegisteredName ? `${parentRegisteredName} (Parent)` : 'Parent';

                if (isUnsent) {
                  return (
                    <View
                      key={msg.id}
                      style={{
                        alignSelf: isParent ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        marginVertical: 4,
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        borderRadius: Radius.md,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.1)',
                        borderStyle: 'dashed',
                        backgroundColor: 'rgba(0,0,0,0.03)',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ban size={12} color={Colors.textMuted} />
                      <Text style={{ fontFamily: Fonts.body, fontSize: 12, fontStyle: 'italic', color: Colors.textMuted }}>
                        {isParent ? 'You unsent a message' : 'This message was unsent'}
                      </Text>
                    </View>
                  );
                }

                return (
                  <View
                    key={msg.id}
                    style={isParent ? styles.chatBubbleParent : styles.chatBubbleTeacher}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 }}>
                      <Text style={isParent ? styles.chatSenderParent : styles.chatSenderTeacher}>
                        {isParent ? parentLabel : `${msg.sender_name || 'Teacher'}`}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={isParent ? styles.chatTimestampParent : styles.chatTimestampTeacher}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isEdited && (
                          <TouchableOpacity
                            onPress={() => setViewHistoryMessage(msg)}
                            accessibilityLabel="View edit history"
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={{
                              fontFamily: Fonts.bodyBold,
                              fontSize: 10,
                              color: isParent ? 'rgba(255,255,255,0.85)' : Colors.accentPrimary,
                              textDecorationLine: 'underline',
                            }}>
                              (edited)
                            </Text>
                          </TouchableOpacity>
                        )}
                        {isParent && (
                          <TouchableOpacity
                            onPress={() => handleOpenMessageOptions(msg)}
                            accessibilityLabel={`Options for message ${msg.id}`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ paddingLeft: 2 }}
                          >
                            <MoreVertical size={13} color="rgba(255,255,255,0.8)" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={isParent ? styles.chatTextParent : styles.chatTextTeacher}>
                      {msg.message_body}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Sticky Input Bar at Bottom */}
          <View style={styles.chatInputContainer}>
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                placeholder="Type your question or message to teacher..."
                value={chatInput}
                onChangeText={setChatInput}
              />
            </View>
            <TouchableOpacity
              onPress={handleSendChat}
              disabled={isSendingChat || !chatInput.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={[
                styles.chatSendBtn,
                {
                  backgroundColor: chatInput.trim() ? Colors.accentPrimary : Colors.border,
                },
              ]}
            >
              {isSendingChat ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* ── Tab 3: Local Device & Portal Settings ── */}
      <View style={activeTab === 'settings' ? { flex: 1 } : { display: 'none', height: 0, flex: 0 }}>
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

          {/* Header for Settings Section */}
        <SectionHeader
          title={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Settings size={18} color={Colors.textMain} />
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Local Device Settings</Text>
            </View>
          }
          subtitle="Configure sync, account & PIN for this device"
        />

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
            placeholder="https://neoguro.app"
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

        <View style={{ alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xs }}>
          <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
            {getAppVersionFooter()}
          </Text>
        </View>

        {/* Bottom padding */}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>

      {/* ── Bottom Navigation Bar ── */}
      <View
        style={[
          styles.bottomTabBar,
          {
            height: 60 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('progress')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'progress' }}
          accessibilityLabel="Child Progress"
        >
          <BarChart2
            size={22}
            color={activeTab === 'progress' ? Colors.accentPrimary : Colors.textDark}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'progress' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Child Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'chat' }}
          accessibilityLabel="Teacher Chat"
        >
          <MessageCircle
            size={22}
            color={activeTab === 'chat' ? Colors.accentPrimary : Colors.textDark}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'chat' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Teacher Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'settings' }}
          accessibilityLabel="Device Settings"
        >
          <Settings
            size={22}
            color={activeTab === 'settings' ? Colors.accentPrimary : Colors.textDark}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'settings' ? styles.tabLabelActive : styles.tabLabelInactive,
            ]}
          >
            Device Settings
          </Text>
        </TouchableOpacity>
      </View>

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
      {/* ── Link Existing Child Modal ── */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <GlassCard style={{ width: '100%', maxWidth: 400, padding: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <LinkIcon size={18} color="#ec4899" />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>Link Existing Child</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClaimModal(false)} style={{ padding: 4 }}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.md }}>
              Enter your child's Student ID and 6-digit access code once to bind them permanently to your parent account.
            </Text>

            <ThemedTextInput
              label="Student ID"
              placeholder="e.g. STU-2026-001"
              value={claimStudentId}
              onChangeText={setClaimStudentId}
              autoCapitalize="characters"
              containerStyle={{ marginBottom: Spacing.sm }}
            />

            <ThemedTextInput
              label="6-Digit Access Code"
              placeholder="e.g. 123456"
              value={claimAccessCode}
              onChangeText={setClaimAccessCode}
              maxLength={6}
              keyboardType="numeric"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            {claimError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md }}>
                <AlertCircle size={16} color={Colors.danger} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.danger, flex: 1 }}>{claimError}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <SecondaryButton
                label="Cancel"
                onPress={() => setShowClaimModal(false)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={isClaiming ? "Linking..." : "Link Child"}
                onPress={handleClaimChild}
                loading={isClaiming}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ── Message Options Modal ── */}
      <Modal
        visible={!!selectedActionMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedActionMessage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedActionMessage(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: 360 }}>
            <GlassCard style={{ padding: Spacing.lg, gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>Message Actions</Text>
                <TouchableOpacity onPress={() => setSelectedActionMessage(null)} style={{ padding: 4 }}>
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => selectedActionMessage && handleStartEditFromOptions(selectedActionMessage)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: 'rgba(17,66,142,0.06)',
                  }}
                  accessibilityLabel="Edit message"
                >
                  <Edit2 size={16} color={Colors.accentPrimary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.textMain }}>Edit Message</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>Within 30 minutes of sending</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const target = selectedActionMessage;
                    setSelectedActionMessage(null);
                    setUnsendConfirmMessage(target);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: 'rgba(239,68,68,0.06)',
                  }}
                  accessibilityLabel="Unsend message"
                >
                  <Trash2 size={16} color={Colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.danger }}>Unsend Message</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>Remove for everyone in chat</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Message Modal ── */}
      <Modal
        visible={!!editingChatModalMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingChatModalMessage(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <GlassCard style={{ width: '100%', maxWidth: 400, padding: Spacing.lg, gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Edit2 size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>Edit Message</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingChatModalMessage(null)} style={{ padding: 4 }}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
              Messages can be edited within 30 minutes. Original text is preserved in edit history.
            </Text>

            <ThemedTextInput
              value={editingChatText}
              onChangeText={setEditingChatText}
              multiline
              numberOfLines={3}
              placeholder="Edit your message..."
              containerStyle={{ minHeight: 80 }}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <SecondaryButton
                label="Cancel"
                onPress={() => setEditingChatModalMessage(null)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label={isSavingChatEdit ? "Saving..." : "Save Changes"}
                onPress={handleSaveMobileEdit}
                loading={isSavingChatEdit}
                disabled={!editingChatText.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── View Edit History Modal (Messenger style) ── */}
      <Modal
        visible={!!viewHistoryMessage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewHistoryMessage(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <GlassCard style={{ width: '100%', maxWidth: 380, padding: Spacing.lg, gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)', paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <History size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>Edit History</Text>
              </View>
              <TouchableOpacity onPress={() => setViewHistoryMessage(null)} style={{ padding: 4 }}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {viewHistoryMessage && (
              <View style={{ gap: 10 }}>
                {/* Original */}
                <View style={{ padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>Original Message</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted }}>
                      {viewHistoryMessage.created_at ? new Date(viewHistoryMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textMain }}>
                    {viewHistoryMessage.original_message_body || viewHistoryMessage.message_body}
                  </Text>
                </View>

                {/* Edited */}
                <View style={{ padding: Spacing.sm, borderRadius: Radius.md, backgroundColor: 'rgba(17,66,142,0.06)', borderWidth: 1, borderColor: 'rgba(17,66,142,0.15)' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary, textTransform: 'uppercase' }}>Edited Version</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.accentPrimary }}>
                      {viewHistoryMessage.edited_at ? new Date(viewHistoryMessage.edited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textMain }}>
                    {viewHistoryMessage.message_body}
                  </Text>
                </View>
              </View>
            )}

            <PrimaryButton
              label="Close"
              onPress={() => setViewHistoryMessage(null)}
              style={{ marginTop: Spacing.xs }}
            />
          </GlassCard>
        </View>
      </Modal>

      {/* ── Unsend Confirm Dialog ── */}
      <ConfirmDialog
        visible={!!unsendConfirmMessage}
        title="Unsend Message?"
        message="This message will be removed for everyone in the consultation chat."
        confirmText="Unsend"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
        onConfirm={() => unsendConfirmMessage && handleUnsendMobile(unsendConfirmMessage)}
        onCancel={() => setUnsendConfirmMessage(null)}
      />
    </SafeAreaView>
  );
}