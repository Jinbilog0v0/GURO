import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import { FileService } from '../services/fileService';
import { toast } from '../components';
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
} from 'lucide-react-native';
import { resolveServerUrl } from '../store/useAppStore';

export function TeacherSettingsScreen() {
  const navigation = useNavigation<any>();
  const logs = useAppStore((state) => state.logs);
  const addLog = useAppStore((state) => state.addLog);
  const clearLogs = useAppStore((state) => state.clearLogs);

  const [fullHistoryVisible, setFullHistoryVisible] = useState(false);

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
  const [serverUrl, setServerUrl] = useState(serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000');
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
  const [createDuration, setCreateDuration] = useState('');
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [lockingClassroom, setLockingClassroom] = useState(false);

  interface ClassroomRecord {
    id: string;
    subject: string;
    gradeLevel: number;
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
  }, [currentUser?.classroomId]);

  const loadClassroomHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem('guro_teacher_classroom_history');
      if (raw) setClassroomHistory(JSON.parse(raw));
    } catch (e) {
      console.warn('[ClassroomHistory] Failed to load:', e);
    }
  };

  const saveClassroomToHistory = async (record: ClassroomRecord) => {
    try {
      const raw = await AsyncStorage.getItem('guro_teacher_classroom_history');
      const existing: ClassroomRecord[] = raw ? JSON.parse(raw) : [];
      if (!existing.find((r) => r.id === record.id)) {
        const updated = [record, ...existing].slice(0, 10);
        await AsyncStorage.setItem('guro_teacher_classroom_history', JSON.stringify(updated));
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
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanUrl = resolveServerUrl(resolvedUrl).replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/verify?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.expiresAt) {
          const expired = new Date(data.expiresAt).getTime() < Date.now();
          setClassroomStatus(expired ? 'locked' : 'active');
        } else {
          setClassroomStatus('active');
        }

        // Count unique studentIds from telemetry
        const telRes = await fetch(`${cleanUrl}/api/progress?classroomId=${encodeURIComponent(code)}`);
        if (telRes.ok) {
          const telemetryData = await telRes.json();
          const uniqueStudents = new Set(telemetryData.map((e: any) => e.studentId));
          setStudentCount(uniqueStudents.size);
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
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanUrl = resolveServerUrl(resolvedUrl).replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          teacherName: currentUser?.name || 'Teacher',
          subject: createSubject,
          gradeLevel: createGrade,
          duration: createDuration ? parseInt(createDuration, 10) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...currentUser, classroomId: data.classroomId };
        useAppStore.setState({ currentUser: updatedUser as any });
        toast.success(`Classroom ${data.classroomId} is active! Share this code with students.`);
        setClassroomStatus('active');
        await saveClassroomToHistory({
          id: data.classroomId,
          subject: createSubject,
          gradeLevel: createGrade,
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
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
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
    <SafeAreaView style={styles.safe}>
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>Settings & Diagnostics</Text>
            <Text style={styles.screenSubtitle}>Configure endpoints and file reports</Text>
          </View>
          <View style={styles.headerRight}>
            <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
            <SyncBadge />
          </View>
        </View>

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
                            backgroundColor: 'rgba(255,255,255,0.02)',
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
                            backgroundColor: 'rgba(255,255,255,0.02)',
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
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
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.lg, color: Colors.accentPrimary }}>{studentCount}</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>Students Paired</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: Spacing.sm, borderRadius: Radius.sm, alignItems: 'center' }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>{createSubject}</Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>Subject</Text>
                  </View>
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
                      backgroundColor: isActive ? 'rgba(17,66,142,0.04)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.textMain, letterSpacing: 1 }}>
                        {record.id}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 }}>
                        {record.subject} · Grade {record.gradeLevel} · {new Date(record.createdAt).toLocaleDateString()}
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
            placeholder="http://localhost:8000"
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
                        backgroundColor: 'rgba(255,255,255,0.02)',
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: Colors.white,
              borderTopLeftRadius: Radius.lg,
              borderTopRightRadius: Radius.lg,
              padding: Spacing.lg,
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

        {/* ── Log Out ── */}
        {!isPinMode && (
          <DangerButton
            label="Log Out of Teacher Account"
            icon={<LogOut size={16} color={Colors.dangerText} style={{ marginRight: 6 }} />}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
