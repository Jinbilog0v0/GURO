import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore, resolveServerUrl } from '../store/useAppStore';
import { FileService } from '../services/fileService';
import { toast } from '../components';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { styles } from '../styles/TeacherDashboard.styles';
import {
  RefreshCw,
  Users,
  Lock,
  Unlock,
  LogOut,
  FileText,
  Save,
  Folder,
  Cloud,
  History,
  CheckCircle2,
  Calendar,
  Mail,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';

export function TeacherSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const logs = useAppStore((state) => state.logs);
  const addLog = useAppStore((state) => state.addLog);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const clearLogs = useAppStore((state) => state.clearLogs);

  const [fullHistoryVisible, setFullHistoryVisible] = useState(false);

  // Email verification modal states
  const [showEmailVerifyModal, setShowEmailVerifyModal] = useState(false);
  const [verifyOtpDigits, setVerifyOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingVerifyCode, setIsSendingVerifyCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const verifyInputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (verifyCooldown <= 0) return;
    const timer = setInterval(() => {
      setVerifyCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [verifyCooldown]);

  const handleOpenEmailVerifyModal = async () => {
    if (!currentUser?.email) {
      toast.error('No email address associated with this account.');
      return;
    }
    setIsSendingVerifyCode(true);
    try {
      const rawUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const resolvedUrl = resolveServerUrl(rawUrl);
      const res = await fetch(`${resolvedUrl}/api/auth/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyCooldown(60);
        setVerifyOtpDigits(['', '', '', '', '', '']);
        setShowEmailVerifyModal(true);
        toast.success(`Verification code sent to ${currentUser.email}`);
      } else {
        toast.error(data.error || data.message || 'Failed to send verification code.');
      }
    } catch {
      toast.error('Unable to send code. Please check your network connection.');
    } finally {
      setIsSendingVerifyCode(false);
    }
  };

  const handleResendEmailVerifyCode = async () => {
    if (verifyCooldown > 0 || isSendingVerifyCode) return;
    setIsSendingVerifyCode(true);
    try {
      const rawUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const resolvedUrl = resolveServerUrl(rawUrl);
      const res = await fetch(`${resolvedUrl}/api/auth/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser?.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyCooldown(60);
        toast.success(`New code sent to ${currentUser?.email}`);
      } else {
        toast.error(data.error || data.message || 'Failed to resend code.');
      }
    } catch {
      toast.error('Unable to resend verification code.');
    } finally {
      setIsSendingVerifyCode(false);
    }
  };

  const handleVerifyOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const next = [...verifyOtpDigits];
      next[index] = '';
      setVerifyOtpDigits(next);
      return;
    }
    if (cleaned.length > 1) {
      const next = [...verifyOtpDigits];
      const digits = cleaned.slice(0, 6).split('');
      digits.forEach((d, i) => {
        if (index + i < 6) next[index + i] = d;
      });
      setVerifyOtpDigits(next);
      const nextFocus = Math.min(index + digits.length, 5);
      verifyInputRefs.current[nextFocus]?.focus();
      return;
    }
    const next = [...verifyOtpDigits];
    next[index] = cleaned;
    setVerifyOtpDigits(next);
    if (index < 5) verifyInputRefs.current[index + 1]?.focus();
  };

  const handleVerifyOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !verifyOtpDigits[index] && index > 0) {
      const next = [...verifyOtpDigits];
      next[index - 1] = '';
      setVerifyOtpDigits(next);
      verifyInputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirmEmailVerification = async () => {
    const code = verifyOtpDigits.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }
    setIsVerifyingCode(true);
    try {
      const token = useAppStore.getState().token;
      const rawUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const resolvedUrl = resolveServerUrl(rawUrl);
      const res = await fetch(`${resolvedUrl}/api/auth/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          email: currentUser?.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (currentUser) {
          useAppStore.setState({
            currentUser: {
              ...currentUser,
              emailVerifiedAt: data.emailVerifiedAt || new Date().toISOString(),
            },
          });
        }
        setShowEmailVerifyModal(false);
        toast.success('Email verified successfully!');
      } else {
        toast.error(data.error || 'Invalid or expired verification code.');
      }
    } catch {
      toast.error('Connection error. Could not reach server.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const parseLogItem = (log: string) => {
    if (log.includes('report:') || log.includes('diagnostic')) {
      const cleanDesc = log
        .replace('Generated local diagnostic report:', 'Created PDF report for')
        .replace('Deleted local diagnostic report:', 'Deleted PDF report')
        .replace('Opened diagnostic report:', 'Opened PDF report for');
      return {
        title: 'Diagnostic Report',
        desc: cleanDesc,
        Icon: FileText,
        color: Colors.accentPrimary,
        bg: 'rgba(17,66,142,0.1)',
        friendlyHelp: 'This action relates to classroom reports. You created, deleted, or opened a local PDF diagnostic report summarizing student metrics.'
      };
    }
    if (log.includes('server') || log.includes('Sync') || log.includes('synced')) {
      return {
        title: 'Server Sync',
        desc: log,
        Icon: Cloud,
        color: Colors.success,
        bg: 'rgba(22,163,74,0.1)',
        friendlyHelp: 'This action relates to server updates. The app synced classrooms, diagnostic scores, or configurations between your device and the cloud.'
      };
    }
    if (log.includes('Classroom') || log.includes('classroom')) {
      return {
        title: 'Classroom Setup',
        desc: log,
        Icon: Users,
        color: Colors.accentBlue,
        bg: 'rgba(28,91,192,0.1)',
        friendlyHelp: 'This action relates to your classroom configurations. You registered a new classroom, locked invite codes, or edited parameters.'
      };
    }
    return {
      title: 'Action Event',
      desc: log,
      Icon: Save,
      color: Colors.textMuted,
      bg: 'rgba(91,97,112,0.1)',
      friendlyHelp: 'This action is a general event triggered by settings updates or diagnostic computations saved to your local storage.'
    };
  };

  const showLogDetailsAlert = (log: string) => {
    const info = parseLogItem(log);
    toast.info(`${info.title} — ${info.desc}`);
  };
  const appMode = useAppStore((state) => state.appMode);
  const currentUser = useAppStore((state) => state.currentUser);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);

  const [files, setFiles] = useState<string[]>([]);
  const [newReportName, setNewReportName] = useState('');
  const [newReportContent, setNewReportContent] = useState('');
  const [serverUrl, setServerUrl] = useState(serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app');
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFiles();
    if (!isPinMode) {
      await checkClassroomStatus();
    }
    setRefreshing(false);
  };

  // Classroom status states
  const [classroomStatus, setClassroomStatus] = useState<'active' | 'locked' | 'none'>('none');
  const [studentCount, setStudentCount] = useState(0);
  const [createSubject, setCreateSubject] = useState<'Mathematics' | 'English'>('Mathematics');
  const [createGrade, setCreateGrade] = useState<number>(4);
  const [createSchoolYear, setCreateSchoolYear] = useState<string>('2026-2027');
  const [createTerm, setCreateTerm] = useState<string>('Quarter 1');
  const [activeSchoolYear, setActiveSchoolYear] = useState<string>('2026-2027');
  const [activeTerm, setActiveTerm] = useState<string>('Quarter 1');
  const [createSection, setCreateSection] = useState('');
  const [createDuration, setCreateDuration] = useState('');
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [lockingClassroom, setLockingClassroom] = useState(false);

  interface ClassroomRecord {
    id: string;
    subject: string;
    gradeLevel: number;
    sectionName?: string;
    schoolYear?: string;
    term?: string;
    createdAt: string;
  }
  const [classroomHistory, setClassroomHistory] = useState<ClassroomRecord[]>([]);
  const [switchingClassroom, setSwitchingClassroom] = useState(false);

  const isPinMode = appMode === 'offline' || currentUser?.role === 'student';
  const unsyncedCount = studentProgress.filter((e) => !e.synced).length;

  useEffect(() => {
    loadFiles();
    if (!isPinMode) {
      checkClassroomStatus();
      loadClassroomHistory();
    }
  }, [currentUser?.classroomId, currentUser?.userId]);

  const loadClassroomHistory = async () => {
    try {
      const token = useAppStore.getState().token;
      const resolvedUrl = resolveServerUrl(useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000');
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');

      if (token) {
        const res = await fetch(`${cleanUrl}/api/classroom/my-classrooms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const serverClassrooms: ClassroomRecord[] = (data.classrooms || []).map((c: any) => ({
            id: c.classroomId,
            subject: c.subject,
            gradeLevel: c.gradeLevel,
            sectionName: c.sectionName,
            schoolYear: c.schoolYear || c.school_year || '2026-2027',
            term: c.term || 'Quarter 1',
            createdAt: c.createdAt || new Date().toISOString(),
          }));
          setClassroomHistory(serverClassrooms);
          if (currentUser?.userId) {
            await AsyncStorage.setItem(`guro_teacher_classroom_history_${currentUser.userId}`, JSON.stringify(serverClassrooms));
          }
          return;
        }
      }

      const storageKey = currentUser?.userId ? `guro_teacher_classroom_history_${currentUser.userId}` : 'guro_teacher_classroom_history';
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) setClassroomHistory(JSON.parse(raw));
      else setClassroomHistory([]);
    } catch (e) {
      console.warn('[ClassroomHistory] Failed to load:', e);
    }
  };

  const saveClassroomToHistory = async (record: ClassroomRecord) => {
    try {
      const storageKey = currentUser?.userId ? `guro_teacher_classroom_history_${currentUser.userId}` : 'guro_teacher_classroom_history';
      const raw = await AsyncStorage.getItem(storageKey);
      const existing: ClassroomRecord[] = raw ? JSON.parse(raw) : [];
      if (!existing.find((r) => r.id === record.id)) {
        const updated = [record, ...existing].slice(0, 10);
        await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
        setClassroomHistory(updated);
      }
    } catch (e) {
      console.warn('[ClassroomHistory] Failed to save:', e);
    }
  };

  const handleSwitchClassroom = async (record: ClassroomRecord) => {
    if (switchingClassroom) return;
    setSwitchingClassroom(true);
    try {
      const resolvedUrl = resolveServerUrl(useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000');
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/verify?code=${encodeURIComponent(record.id)}`);
      if (!res.ok) {
        toast.warning(`Classroom ${record.id} could not be reached. It may be locked or unavailable.`);
        return;
      }
      const data = await res.json();
      const isLocked = data.expiresAt && new Date(data.expiresAt).getTime() < Date.now();
      if (isLocked) {
        toast.warning(`Classroom ${record.id} is locked. Students cannot pair with it.`);
        return;
      }
      const updatedUser = { ...currentUser, classroomId: record.id };
      useAppStore.setState({ currentUser: updatedUser as any });
      if (data.schoolYear || record.schoolYear) {
        setActiveSchoolYear(data.schoolYear || record.schoolYear || '2026-2027');
      }
      if (data.term || record.term) {
        setActiveTerm(data.term || record.term || 'Quarter 1');
      }
      setClassroomStatus('active');
      toast.success(`Switched to classroom ${record.id}`);
    } catch (e) {
      toast.error('Could not verify classroom. Check your connection and try again.');
    } finally {
      setSwitchingClassroom(false);
    }
  };

  const checkClassroomStatus = async () => {
    const code = currentUser?.classroomId;
    if (!code) {
      setClassroomStatus('none');
      return;
    }

    try {
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const cleanUrl = resolveServerUrl(resolvedUrl).replace(/\/+$/, '');
      const token = useAppStore.getState().token;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${cleanUrl}/api/classroom/verify?code=${encodeURIComponent(code)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.expiresAt) {
          const expired = new Date(data.expiresAt).getTime() < Date.now();
          setClassroomStatus(expired ? 'locked' : 'active');
        } else {
          setClassroomStatus('active');
        }

        if (data.schoolYear) {
          setActiveSchoolYear(data.schoolYear);
        }
        if (data.term) {
          setActiveTerm(data.term);
        }

        // Count unique studentIds from telemetry
        const telRes = await fetch(`${cleanUrl}/api/progress?classroomId=${encodeURIComponent(code)}`, { headers });
        if (telRes.ok) {
          const telemetryData = await telRes.json();
          if (Array.isArray(telemetryData)) {
            const uniqueStudents = new Set(telemetryData.map((e: any) => e.studentId));
            setStudentCount(uniqueStudents.size);
          }
        }
      } else {
        setClassroomStatus('none');
      }
    } catch (err) {
      console.warn('[Classroom] Failed to check classroom status:', err);
    }
  };

  const handleCreateClassroom = async () => {
    if (creatingClassroom) return;
    setCreatingClassroom(true);
    try {
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const cleanUrl = resolveServerUrl(resolvedUrl).replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          teacherName: currentUser?.name || 'Teacher',
          sectionName: createSection.trim(),
          subject: createSubject,
          gradeLevel: createGrade,
          schoolYear: createSchoolYear,
          term: createTerm,
          duration: createDuration ? parseInt(createDuration, 10) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...currentUser, classroomId: data.classroomId };
        useAppStore.setState({ currentUser: updatedUser as any });
        setActiveSchoolYear(data.schoolYear || createSchoolYear);
        setActiveTerm(data.term || createTerm);
        toast.success(`Classroom ${data.classroomId} is active! Share this code with students.`);
        setClassroomStatus('active');
        setCreateSection('');
        await saveClassroomToHistory({
          id: data.classroomId,
          subject: createSubject,
          gradeLevel: createGrade,
          sectionName: data.sectionName || createSection.trim() || undefined,
          schoolYear: data.schoolYear || createSchoolYear,
          term: data.term || createTerm,
          createdAt: new Date().toISOString(),
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create classroom.');
      }
    } catch (e: any) {
      toast.error('Failed to reach the classroom setup service.');
    } finally {
      setCreatingClassroom(false);
    }
  };

  const handleLockClassroom = async () => {
    if (lockingClassroom) return;
    const code = currentUser?.classroomId;
    if (!code) return;

    setLockingClassroom(true);
    try {
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';
      const cleanUrl = resolveServerUrl(resolvedUrl).replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          classroomId: code,
        }),
      });

      if (res.ok) {
        toast.success('Classroom locked. No new students can connect.');
        setClassroomStatus('locked');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to lock classroom.');
      }
    } catch (e: any) {
      toast.error('Failed to reach the classroom lock service.');
    } finally {
      setLockingClassroom(false);
    }
  };

  const loadFiles = async () => {
    const fileList = await FileService.listFiles();
    setFiles(fileList);
  };

  const handleCreateReport = async () => {
    if (!newReportName.trim() || !newReportContent.trim()) {
      toast.error('Please enter a report title and content.');
      return;
    }
    const sanitizedName = newReportName.endsWith('.txt')
      ? newReportName
      : `${newReportName}.txt`;
    try {
      await FileService.saveFile(sanitizedName, newReportContent);
      addLog(`Generated local diagnostic report: ${sanitizedName}`);
      setNewReportName('');
      setNewReportContent('');
      loadFiles();
      toast.success('Student diagnostic saved to local file system.');
    } catch (e) {
      toast.error('Failed to write diagnostic file locally.');
    }
  };

  const handleDeleteReport = async (fileName: string) => {
    try {
      await FileService.deleteFile(fileName);
      addLog(`Deleted local diagnostic report: ${fileName}`);
      loadFiles();
    } catch (e) {
      // swallowed
    }
  };

  const handleReadReport = async (fileName: string) => {
    const content = await FileService.readFile(fileName);
    if (content !== null) {
      addLog(`Opened diagnostic report: ${fileName}`);
      navigation.navigate('Details', { fileName, content });
    } else {
      toast.error('Could not read report content.');
    }
  };

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Header (Sticky, Full-Width Edge-to-Edge) ── */}
      <View style={styles.header}>
        <View style={styles.headerAccentLine} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm }}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Settings & Diagnostics</Text>
            <Text style={styles.screenSubtitle}>Configure endpoints and file reports</Text>
          </View>
          <View style={styles.headerRight}>
            <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
            <SyncBadge />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
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

        {/* ── Create Report ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <FileText size={20} color={Colors.textMain} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                  {isPinMode ? "Quick Evaluation Note" : "New Diagnostic Report"}
                </Text>
              </View>
            }
            subtitle="Save a student diagnostic to the local file system"
          />
          <ThemedTextInput
            label="Report Title"
            placeholder="e.g. Grade5_Math_Session1"
            value={newReportName}
            onChangeText={setNewReportName}
            containerStyle={styles.inputSpacing}
          />
          <ThemedTextInput
            label="Report Content"
            placeholder="Enter diagnostic notes, results, or observations…"
            value={newReportContent}
            onChangeText={setNewReportContent}
            multiline
            numberOfLines={4}
            containerStyle={styles.inputSpacing}
            style={styles.textArea}
          />
          <PrimaryButton
            label="Save to Device"
            icon={<Save size={16} color={Colors.white} style={{ marginRight: 6 }} />}
            onPress={handleCreateReport}
            style={styles.actionBtn}
          />
        </GlassCard>

        {/* ── Saved Reports ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Folder size={20} color={Colors.textMain} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Saved Reports</Text>
              </View>
            }
            subtitle={`${files.length} file${files.length !== 1 ? 's' : ''} on device`}
          />
          {files.length === 0 ? (
            <Text style={styles.emptyText}>No reports saved yet.</Text>
          ) : (
            files.map((fileName) => (
              <GlassCard
                key={fileName}
                variant="subtle"
                padding={Spacing.md}
                style={styles.fileRow}
              >
                <View style={styles.fileInfo}>
                  <FileText size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>
                <View style={styles.fileActions}>
                  <SecondaryButton
                    label="View"
                    onPress={() => handleReadReport(fileName)}
                    style={styles.fileBtn}
                  />
                  <DangerButton
                    label="Delete"
                    onPress={() => handleDeleteReport(fileName)}
                    style={styles.fileBtn}
                  />
                </View>
              </GlassCard>
            ))
          )}
        </GlassCard>

        {/* ── Classroom Setup (Online mode only) ── */}
        {!isPinMode && (
          <GlassCard style={styles.section}>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Users size={20} color={Colors.textMain} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                    Classroom Pairing & Setup
                  </Text>
                </View>
              }
              subtitle="Generate codes to link student devices to your dashboard"
            />

            {classroomStatus === 'none' ? (
              <View>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.md }}>
                  You don't have an active classroom code. Create one below to allow students to connect.
                </Text>

                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                  Select Subject
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  {(['Mathematics', 'English'] as const).map((sub) => {
                    const isSel = createSubject === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        onPress={() => setCreateSubject(sub)}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: Spacing.sm,
                            borderRadius: Radius.md,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: Colors.bgInput,
                          },
                          isSel && { backgroundColor: 'rgba(17,66,142,0.08)', borderColor: Colors.accentPrimary },
                        ]}
                      >
                        <Text style={[{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }, isSel && { color: Colors.accentPrimary, fontFamily: Fonts.bodyBold }]}>
                          {sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                  Select Grade Level
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  {([4, 5, 6] as const).map((gr) => {
                    const isSel = createGrade === gr;
                    return (
                      <TouchableOpacity
                        key={gr}
                        onPress={() => setCreateGrade(gr)}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: Spacing.sm,
                            borderRadius: Radius.md,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: Colors.bgInput,
                          },
                          isSel && { backgroundColor: 'rgba(17,66,142,0.08)', borderColor: Colors.accentPrimary },
                        ]}
                      >
                        <Text style={[{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }, isSel && { color: Colors.accentPrimary, fontFamily: Fonts.bodyBold }]}>
                          Grade {gr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                  School Year (SY)
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  {(['2026-2027', '2027-2028', '2025-2026'] as const).map((sy) => {
                    const isSel = createSchoolYear === sy;
                    return (
                      <TouchableOpacity
                        key={sy}
                        onPress={() => setCreateSchoolYear(sy)}
                        style={[
                          {
                            flex: 1,
                            paddingVertical: Spacing.sm,
                            borderRadius: Radius.md,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: Colors.bgInput,
                          },
                          isSel && { backgroundColor: 'rgba(17,66,142,0.08)', borderColor: Colors.accentPrimary },
                        ]}
                      >
                        <Text style={[{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }, isSel && { color: Colors.accentPrimary, fontFamily: Fonts.bodyBold }]}>
                          {sy}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                  Academic Term / Quarter
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
                  {(['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'] as const).map((q) => {
                    const isSel = createTerm === q;
                    return (
                      <TouchableOpacity
                        key={q}
                        onPress={() => setCreateTerm(q)}
                        style={[
                          {
                            flexBasis: '48%',
                            flexGrow: 1,
                            paddingVertical: Spacing.sm,
                            borderRadius: Radius.md,
                            borderWidth: 1,
                            borderColor: Colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: Colors.bgInput,
                          },
                          isSel && { backgroundColor: 'rgba(17,66,142,0.08)', borderColor: Colors.accentPrimary },
                        ]}
                      >
                        <Text style={[{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }, isSel && { color: Colors.accentPrimary, fontFamily: Fonts.bodyBold }]}>
                          {q}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <ThemedTextInput
                  label="Section Name (Optional)"
                  placeholder="e.g. Rizal, Emerald, Section A"
                  value={createSection}
                  onChangeText={setCreateSection}
                  containerStyle={styles.inputSpacing}
                />

                <ThemedTextInput
                  label="Session Duration (Minutes, optional)"
                  placeholder="e.g. 60 (leave empty for permanent)"
                  value={createDuration}
                  onChangeText={setCreateDuration}
                  keyboardType="number-pad"
                  containerStyle={styles.inputSpacing}
                />

                <PrimaryButton
                  label="Create Classroom"
                  onPress={handleCreateClassroom}
                  loading={creatingClassroom}
                  style={styles.actionBtn}
                />
              </View>
            ) : (
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgInput, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                  <View>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>INVITE CODE</Text>
                    <Text style={{ fontFamily: Fonts.display, fontSize: 24, color: Colors.textMain, letterSpacing: 2 }}>{currentUser?.classroomId}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>STATUS</Text>
                    <Badge
                      label={classroomStatus === 'active' ? 'Active' : 'Locked'}
                      variant={classroomStatus === 'active' ? 'success' : 'danger'}
                      style={{ marginTop: 2 }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ flex: 1, backgroundColor: Colors.bgInput, padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.lg, color: Colors.accentPrimary }}>{studentCount}</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>Students Paired</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Colors.bgInput, padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>{createSubject}</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>Subject</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgInput, padding: Spacing.sm, borderRadius: Radius.sm }}>
                  <Calendar size={14} color={Colors.textMuted} />
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    Academic Period: S.Y. {activeSchoolYear} • {activeTerm}
                  </Text>
                </View>

                {classroomStatus === 'active' ? (
                  <DangerButton
                    label="Lock Classroom"
                    icon={<Lock size={16} color={Colors.dangerText} style={{ marginRight: 6 }} />}
                    onPress={handleLockClassroom}
                    loading={lockingClassroom}
                  />
                ) : (
                  <PrimaryButton
                    label="Create New Session"
                    icon={<RefreshCw size={16} color={Colors.white} style={{ marginRight: 6 }} />}
                    onPress={() => setClassroomStatus('none')}
                  />
                )}
              </View>
            )}
          </GlassCard>
        )}

        {/* ── Classroom History ── */}
        {!isPinMode && classroomHistory.length > 0 && (
          <GlassCard style={styles.section}>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <History size={20} color={Colors.textMain} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                    Classroom History
                  </Text>
                </View>
              }
              subtitle="Switch to a previously created classroom code"
            />
            <View style={{ gap: Spacing.sm }}>
              {classroomHistory.map((record) => {
                const isActive = currentUser?.classroomId === record.id;
                return (
                  <View
                    key={record.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.md,
                      padding: Spacing.md,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: isActive ? Colors.accentPrimary : Colors.border,
                      backgroundColor: isActive ? 'rgba(17,66,142,0.04)' : Colors.bgInput,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain, letterSpacing: 1 }}>
                        {record.id}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 }}>
                        {record.subject} · Grade {record.gradeLevel}{record.sectionName ? ` · Sec: ${record.sectionName}` : ''} · S.Y. {record.schoolYear || '2026-2027'} ({record.term || 'Quarter 1'}) · {new Date(record.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {isActive ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={14} color={Colors.success} />
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.success }}>Active</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleSwitchClassroom(record)}
                        disabled={switchingClassroom}
                        activeOpacity={0.75}
                        style={{
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: Spacing.xs,
                          backgroundColor: 'rgba(17,66,142,0.06)',
                          borderWidth: 1,
                          borderColor: Colors.accentPrimary,
                          borderRadius: Radius.sm,
                        }}
                      >
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                          Switch
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* ── Connection Configuration / Sync ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Cloud size={20} color={Colors.textMain} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Classroom Server URL</Text>
              </View>
            }
            subtitle="Sync endpoint configurations"
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
            containerStyle={styles.inputSpacing}
          />
          {isPinMode && (
            <PrimaryButton
              label={`Sync Now (${unsyncedCount} pending)`}
              icon={<RefreshCw size={16} color={Colors.white} style={{ marginRight: 6 }} />}
              onPress={handleSync}
              loading={isSyncing}
              style={{ marginBottom: Spacing.md }}
            />
          )}
        </GlassCard>

        {/* ── Activity History ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title="Activity History"
            subtitle="Record of classroom updates and actions"
            right={
              <SecondaryButton
                label="Clear"
                onPress={clearLogs}
                style={styles.clearBtn}
              />
            }
          />

          <View style={{ gap: Spacing.sm, marginTop: Spacing.xs }}>
            {logs.length === 0 ? (
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.md }}>
                No recent actions recorded.
              </Text>
            ) : (
              <>
                {/* Show last 3 logs */}
                {logs.slice(-3).reverse().map((log, idx) => {
                  const info = parseLogItem(log);
                  const Icon = info.Icon;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.7}
                      onPress={() => showLogDetailsAlert(log)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.sm,
                        backgroundColor: Colors.bgInput,
                        padding: Spacing.sm,
                        borderRadius: Radius.md,
                        borderWidth: 1,
                        borderColor: Colors.border,
                      }}
                    >
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: info.bg,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={16} color={info.color} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                          {info.title}
                        </Text>
                        <Text numberOfLines={1} style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                          {info.desc}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.accentPrimary }}>
                        Details
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {logs.length > 3 && (
                  <TouchableOpacity
                    onPress={() => setFullHistoryVisible(true)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: Spacing.xs,
                      paddingVertical: Spacing.sm,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: Colors.accentPrimary,
                      borderRadius: Radius.md,
                    }}
                  >
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                      View Full History ({logs.length} items)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </GlassCard>

        {/* ── Full Activity History Modal ── */}
        <Modal
          visible={fullHistoryVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setFullHistoryVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(6, 9, 19, 0.72)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: Colors.white,
              borderTopLeftRadius: Radius['2xl'],
              borderTopRightRadius: Radius['2xl'],
              padding: Spacing.lg,
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
              maxHeight: '80%',
              gap: Spacing.md
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                  Full Activity History
                </Text>
                <TouchableOpacity
                  onPress={() => setFullHistoryVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.accentPrimary, fontSize: FontSizes.sm }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator style={{ marginVertical: Spacing.xs }}>
                <View style={{ gap: Spacing.sm }}>
                  {[...logs].reverse().map((log, idx) => {
                    const info = parseLogItem(log);
                    const Icon = info.Icon;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.7}
                        onPress={() => showLogDetailsAlert(log)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: Spacing.sm,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          padding: Spacing.md,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: Colors.border,
                        }}
                      >
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: info.bg,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={16} color={info.color} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                            {info.title}
                          </Text>
                          <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                            {info.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ── Teacher Account & Email Verification Card ── */}
        {currentUser && (
          <GlassCard style={{ padding: Spacing.lg, borderRadius: Radius.lg, gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(17,66,142,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color={Colors.accentPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.sm, color: Colors.textMain }}>
                  {currentUser.name}
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                  {currentUser.email}
                </Text>
              </View>
              {currentUser.emailVerifiedAt ? (
                <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={{ color: '#10B981', fontSize: 11, fontFamily: Fonts.bodyBold }}>Verified</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={12} color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontSize: 11, fontFamily: Fonts.bodyBold }}>Unverified</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleOpenEmailVerifyModal}
                    disabled={isSendingVerifyCode}
                    style={{ paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.accentPrimary, borderRadius: 8 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: Fonts.bodyBold }}>
                      {isSendingVerifyCode ? 'Sending...' : 'Verify Now'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </GlassCard>
        )}

        {/* ── 6-Square Email Verification Modal ── */}
        <Modal
          visible={showEmailVerifyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmailVerifyModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: Spacing.md }}>
            <GlassCard style={{ width: '100%', maxWidth: 420, padding: Spacing.lg, borderRadius: Radius.xl }}>
              <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(17, 66, 142, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs }}>
                  <Mail size={24} color={Colors.accentPrimary} />
                </View>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain, textAlign: 'center' }}>
                  Verify Institutional Email
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 4 }}>
                  Enter the 6-digit verification code sent to {currentUser?.email} to complete teacher email verification.
                </Text>
              </View>

              <View style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                  <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMain }}>
                    6-Digit Verification Code
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted }}>
                    Valid for 10 mins
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginVertical: Spacing.xs }}>
                  {verifyOtpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { verifyInputRefs.current[index] = ref; }}
                      value={digit}
                      onChangeText={(text) => handleVerifyOtpChange(index, text)}
                      onKeyPress={({ nativeEvent }) => handleVerifyOtpKeyPress(index, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={{
                        flex: 1,
                        height: 52,
                        borderRadius: 14,
                        borderWidth: 1.5,
                        borderColor: digit ? Colors.accentPrimary : '#E2E8F0',
                        backgroundColor: '#F8FAFC',
                        textAlign: 'center',
                        fontFamily: Fonts.bodyBold,
                        fontSize: 22,
                        color: Colors.textMain,
                      }}
                      accessibilityLabel={`Verification digit ${index + 1}`}
                    />
                  ))}
                </View>

                {/* Live Resend Countdown */}
                <View style={{ alignItems: 'center', marginTop: Spacing.xs }}>
                  {verifyCooldown > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={Colors.textMuted} />
                      <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                        Resend code in{' '}
                        <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>
                          0:{verifyCooldown < 10 ? `0${verifyCooldown}` : verifyCooldown}
                        </Text>
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendEmailVerifyCode}
                      disabled={isSendingVerifyCode}
                    >
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary }}>
                        Didn't receive the code? Resend now
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={{ gap: Spacing.sm }}>
                <PrimaryButton
                  label="Verify & Confirm"
                  onPress={handleConfirmEmailVerification}
                  loading={isVerifyingCode}
                />
                <SecondaryButton
                  label="Cancel"
                  onPress={() => setShowEmailVerifyModal(false)}
                />
              </View>
            </GlassCard>
          </View>
        </Modal>

        {/* ── Log Out ── */}
        {!isPinMode && (
          <DangerButton
            label="Log Out of Teacher Account"
            icon={<LogOut size={16} color={Colors.dangerText} style={{ marginRight: 6 }} />}
            onPress={() => setShowLogoutConfirm(true)}
          />
        )}

        {/* Teacher Logout Confirmation */}
        <ConfirmDialog
          visible={showLogoutConfirm}
          variant="danger"
          title="Confirm Logout"
          description="Are you sure you want to log out? You will need to sign in again to access your account."
          confirmLabel="Logout"
          cancelLabel="Cancel"
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logoutFromCloud();
            navigation.replace((appMode as string) === 'offline' ? 'StudentDashboard' : 'Login');
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
