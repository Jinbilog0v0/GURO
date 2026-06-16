/**
 * TeacherDashboard — Full design-system rewrite.
 * All logic (loadFiles, handleCreateReport, handleDeleteReport,
 * handleReadReport, stats computation) is preserved exactly.
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { FileService } from '../services/fileService';

// ── Design system ──────────────────────────────────────────────────────────
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

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherDashboard'>;

export function TeacherDashboard({ navigation }: Props) {
  const logs = useAppStore((state) => state.logs);
  const itemBank = useAppStore((state) => state.itemBank);
  const addLog = useAppStore((state) => state.addLog);
  const clearLogs = useAppStore((state) => state.clearLogs);
  const appMode = useAppStore((state) => state.appMode);
  const currentUser = useAppStore((state) => state.currentUser);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const studentId = useAppStore((state) => state.studentId);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);
  const [files, setFiles] = useState<string[]>([]);
  const [newReportName, setNewReportName] = useState('');
  const [newReportContent, setNewReportContent] = useState('');
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [isSyncing, setIsSyncing] = useState(false);

  const isPinMode = appMode === 'offline' || currentUser?.role === 'student';

  useEffect(() => {
    loadFiles();
  }, []);

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

  // ── File helpers ──────────────────────────────────────────────────────────

  const loadFiles = async () => {
    const fileList = await FileService.listFiles();
    setFiles(fileList);
  };

  // ── Stats computation ─────────────────────────────────────────────────────

  const getStats = () => {
    let subjectCount = 0;
    let totalQuestions = 0;
    const topicsList: string[] = [];
    if (itemBank) {
      subjectCount = Object.keys(itemBank).length;
      Object.keys(itemBank).forEach((subject) => {
        Object.keys(itemBank[subject]).forEach((grade) => {
          Object.keys(itemBank[subject][grade]).forEach((topic) => {
            if (!topicsList.includes(topic)) topicsList.push(topic);
            Object.keys(itemBank[subject][grade][topic]).forEach((diff) => {
              if (diff === 'studyContent') return;
              Object.keys(itemBank[subject][grade][topic][diff]).forEach((cat) => {
                totalQuestions += itemBank[subject][grade][topic][diff][cat].length;
              });
            });
          });
        });
      });
    }
    return { subjectCount, totalQuestions, topicCount: topicsList.length };
  };

  const stats = getStats();

  // ── Report CRUD ───────────────────────────────────────────────────────────

  const handleCreateReport = async () => {
    if (!newReportName.trim() || !newReportContent.trim()) {
      Alert.alert('Validation Error', 'Please enter a report title and content.');
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
      Alert.alert('Report Saved', 'Student diagnostic saved to local file system.');
    } catch (e) {
      Alert.alert('Error', 'Failed to write diagnostic file locally.');
    }
  };

  const handleDeleteReport = async (fileName: string) => {
    try {
      await FileService.deleteFile(fileName);
      addLog(`Deleted local diagnostic report: ${fileName}`);
      loadFiles();
    } catch (e) {
      // swallowed intentionally
    }
  };

  const handleReadReport = async (fileName: string) => {
    const content = await FileService.readFile(fileName);
    if (content !== null) {
      addLog(`Opened diagnostic report: ${fileName}`);
      navigation.navigate('Details', { fileName, content });
    } else {
      Alert.alert('Error', 'Could not read report content.');
    }
  };

  // ── PIN Mode Stats & Sync ──────────────────────────────────────────────────
  const totalCompleted = studentProgress.length;
  const unsyncedCount = studentProgress.filter((e) => !e.synced).length;
  const averageScore =
    totalCompleted === 0
      ? 0
      : Math.round(
          studentProgress.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) /
            totalCompleted
        );

  const handleSync = async () => {
    if (!serverUrl.trim()) {
      Alert.alert('Configuration Error', 'Please enter a valid server endpoint.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await syncProgressNow(serverUrl.trim());
      Alert.alert(res.success ? 'Sync Successful' : 'Sync Failed', res.message);
    } catch {
      Alert.alert('Sync Error', 'Network error or invalid server URL.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>{isPinMode ? 'Teacher Evaluation' : 'Teacher Dashboard'}</Text>
            <Text style={styles.screenSubtitle}>{isPinMode ? `Reviewing: ${studentId}` : 'GURO Diagnostics & Reports'}</Text>
          </View>
          <View style={styles.headerRight}>
            <SyncBadge />
            <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
          </View>
        </View>

        {isPinMode ? (
          <SecondaryButton
            label="← Return to Student — Kid Zone"
            onPress={() => navigation.replace('StudentDashboard')}
            style={styles.backBtn}
          />
        ) : (
          <DangerButton
            label="🚪 Log Out of Teacher Account"
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
                      navigation.replace('Login');
                    },
                  },
                ]
              );
            }}
            style={styles.backBtn}
          />
        )}

        {isPinMode ? (
          <>
            <SectionHeader title="📊 This Student's Performance" subtitle="Local device statistics" />
            <View style={styles.statsRow}>
              <StatCard icon="📋" label="Sessions" value={totalCompleted} />
              <StatCard icon="🎯" label="Avg Score" value={`${averageScore}%`} valueColor={averageScore >= 80 ? Colors.success : averageScore >= 60 ? Colors.warning : Colors.danger} />
              <StatCard icon="☁️" label="Unsynced" value={unsyncedCount} valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textDark} />
            </View>

            <GlassCard style={styles.section}>
              <SectionHeader title="📋 Recent Results" subtitle="Last 5 activities" />
              {studentProgress.length === 0 ? (
                <Text style={styles.emptyText}>No practice logs yet.</Text>
              ) : (
                studentProgress.slice(0, 5).map((evt) => {
                  const pct = Math.round((evt.score / evt.totalQuestions) * 100);
                  const isSuccess = pct >= 80;
                  return (
                    <GlassCard key={evt.eventId} variant="subtle" padding={Spacing.md} style={styles.fileRow}>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileIcon}>{isSuccess ? '✅' : '⚠️'}</Text>
                        <Text style={styles.fileName}>{evt.topic}</Text>
                        <Text style={[styles.fileName, {color: Colors.textMuted, flex: 0.5}]}>G{evt.gradeLevel} {evt.subject}</Text>
                        <Text style={[styles.fileName, {textAlign: 'right', flex: 0.5}]}>{evt.score}/{evt.totalQuestions}</Text>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </GlassCard>
          </>
        ) : (
          <>
            <SectionHeader
              title="Item Bank Overview"
              subtitle="Live count from local item bank"
            />
            <View style={styles.statsRow}>
              <StatCard
                icon="📚"
                label="Subjects"
                value={stats.subjectCount}
                valueColor={Colors.accentPrimary}
              />
              <StatCard
                icon="❓"
                label="Questions"
                value={stats.totalQuestions}
                valueColor={Colors.accentSecondary}
              />
              <StatCard
                icon="🏷️"
                label="Topics"
                value={stats.topicCount}
                valueColor={Colors.success}
              />
            </View>
          </>
        )}

        {/* ── Create Report ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={isPinMode ? "✍️ Quick Evaluation Note" : "New Diagnostic Report"}
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
            label="💾  Save to Device"
            onPress={handleCreateReport}
            style={styles.actionBtn}
          />
        </GlassCard>

        {/* ── Saved Reports ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title="📁 Saved Reports"
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
                  <Text style={styles.fileIcon}>📄</Text>
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

        {isPinMode && (
          <GlassCard style={styles.section}>
            <SectionHeader title="🚀 Push to Classroom Server" subtitle="Sync local progress to cloud" />
            <ThemedTextInput
              label="Server URL"
              placeholder="http://10.0.2.2:3000"
              value={serverUrl}
              onChangeText={setServerUrl}
              editable={!isSyncing}
              keyboardType="url"
              autoCapitalize="none"
              containerStyle={styles.inputSpacing}
            />
            <PrimaryButton
              label={`Sync Now (${unsyncedCount} pending)`}
              onPress={handleSync}
              loading={isSyncing}
            />
          </GlassCard>
        )}

        {/* ── System Telemetry Logs ── */}
        {!isPinMode && (
          <GlassCard style={styles.section}>
            <SectionHeader
              title="System Telemetry"
              subtitle="Local operation log"
              right={
                <SecondaryButton
                  label="Clear"
                  onPress={clearLogs}
                  style={styles.clearBtn}
                />
              }
            />
            <View style={styles.terminal}>
              {logs.length === 0 ? (
                <Text style={styles.logLine}>{'— no events recorded —'}</Text>
              ) : (
                logs.map((entry, idx) => (
                  <Text key={idx} style={styles.logLine}>
                    {'> '}{entry}
                  </Text>
                ))
              )}
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  screenTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.textMain,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  roleBadge: {
    marginTop: Spacing.xs,
  },

  // Back button
  backBtn: {
    alignSelf: 'flex-start',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  // Sections
  section: {
    // GlassCard provides its own styling
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actionBtn: {
    marginTop: Spacing.xs,
  },

  // Empty state
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    color: Colors.textDark,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  // File rows
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  fileIcon: {
    fontSize: 18,
  },
  fileName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    flex: 1,
  },
  fileActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fileBtn: {
    paddingHorizontal: Spacing.md,
  },

  // Terminal log
  terminal: {
    backgroundColor: Colors.bgMain,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
    gap: Spacing.xs,
  },
  logLine: {
    fontFamily: 'Courier',
    fontSize: FontSizes.sm,
    color: Colors.success,
    lineHeight: 20,
  },

  // Clear button
  clearBtn: {
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
});
