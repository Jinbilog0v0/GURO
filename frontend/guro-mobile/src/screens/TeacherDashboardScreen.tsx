import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, resolveServerUrl, Question } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { styles } from '../styles/TeacherDashboard.styles';
import {
  ClipboardList,
  Target,
  Cloud,
  BookOpen,
  HelpCircle,
  Tag,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Activity,
  Trash2,
} from 'lucide-react-native';

export function TeacherDashboardScreen() {
  const navigation = useNavigation<any>();
  const itemBank = useAppStore((state) => state.itemBank);
  const appMode = useAppStore((state) => state.appMode);
  const currentUser = useAppStore((state) => state.currentUser);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const studentId = useAppStore((state) => state.studentId);
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const [classroomTelemetry, setClassroomTelemetry] = useState<any[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetrySearchInput, setTelemetrySearchInput] = useState('');
  const [telemetryFilterText, setTelemetryFilterText] = useState('');
  const [telemetrySelectedSubject, setTelemetrySelectedSubject] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const isPinMode = currentUser?.role === 'student';

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!isPinMode) {
      await fetchClassroomTelemetry();
    }
    setRefreshing(false);
  };

  const formatStudentName = (id: string) => {
    if (!id) return '';
    if (id === 'GURO-STUDENT-LOCAL') return 'Local Student';
    const cleanId = id.endsWith('-GUEST') ? id.slice(0, -6) : id;
    return cleanId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const fetchClassroomTelemetry = async () => {
    const classCode = currentUser?.classroomId;
    if (!classCode) return;
    setLoadingTelemetry(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/progress?classroomId=${encodeURIComponent(classCode)}`);
      if (res.ok) {
        const data = await res.json();
        setClassroomTelemetry(data);
      }
    } catch (err) {
      console.warn('[Telemetry] Failed to fetch student telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    if (!isPinMode) {
      fetchClassroomTelemetry();
    }
  }, [isPinMode]);

  const getDiagnosticAlerts = () => {
    const studentTopicStats: Record<string, Record<string, { totalScore: number, totalQuestions: number, attempts: number, subject: string }>> = {};

    classroomTelemetry.forEach((evt) => {
      const sId = evt.studentId;
      const topic = evt.topic;
      if (!studentTopicStats[sId]) {
        studentTopicStats[sId] = {};
      }
      if (!studentTopicStats[sId][topic]) {
        studentTopicStats[sId][topic] = { totalScore: 0, totalQuestions: 0, attempts: 0, subject: evt.subject };
      }
      studentTopicStats[sId][topic].totalScore += evt.score;
      studentTopicStats[sId][topic].totalQuestions += evt.totalQuestions;
      studentTopicStats[sId][topic].attempts += 1;
    });

    const alerts: { studentId: string, name: string, topic: string, subject: string, avgPct: number, attempts: number }[] = [];

    Object.keys(studentTopicStats).forEach((sId) => {
      Object.keys(studentTopicStats[sId]).forEach((topic) => {
        const stats = studentTopicStats[sId][topic];
        const avgPct = Math.round((stats.totalScore / stats.totalQuestions) * 100);
        if (avgPct < 60) {
          alerts.push({
            studentId: sId,
            name: formatStudentName(sId),
            topic,
            subject: stats.subject,
            avgPct,
            attempts: stats.attempts
          });
        }
      });
    });

    return alerts.sort((a, b) => a.avgPct - b.avgPct);
  };

  const handleIngestExtension = (topic: string, subject: string) => {
    navigation.navigate('Ingestion', {
      prefillTopic: `${topic} Extension`,
      prefillSubject: subject
    });
  };

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
              const diffData = itemBank[subject][grade][topic][diff] as Record<string, Question[]> | undefined;
              if (!diffData || typeof diffData !== 'object') return;
              Object.keys(diffData).forEach((cat) => {
                totalQuestions += diffData[cat].length;
              });
            });
          });
        });
      });
    }
    return { subjectCount, totalQuestions, topicCount: topicsList.length };
  };

  const stats = getStats();

  const totalCompleted = studentProgress.length;
  const unsyncedCount = studentProgress.filter((e) => !e.synced).length;
  const averageScore =
    totalCompleted === 0
      ? 0
      : Math.round(
          studentProgress.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) /
            totalCompleted
        );

  const filteredTelemetry = classroomTelemetry.filter((evt) => {
    if (telemetrySelectedSubject !== 'All' && evt.subject !== telemetrySelectedSubject) {
      return false;
    }
    if (telemetryFilterText.trim()) {
      const query = telemetryFilterText.trim().toLowerCase();
      const matchId = evt.studentId.toLowerCase().includes(query);
      const matchName = formatStudentName(evt.studentId).toLowerCase().includes(query);
      const matchTopic = evt.topic.toLowerCase().includes(query);
      if (!matchId && !matchName && !matchTopic) {
        return false;
      }
    }
    return true;
  });

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
            {isPinMode && (
              <TouchableOpacity
                onPress={() => navigation.replace('StudentDashboard')}
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.xs,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: Radius.sm,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                accessibilityLabel="Return to student dashboard"
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>← Return</Text>
              </TouchableOpacity>
            )}
            <View style={styles.headerLeft}>
              <Text style={styles.screenTitle} numberOfLines={1}>{isPinMode ? 'Teacher Evaluation' : 'Teacher Dashboard'}</Text>
              <Text style={styles.screenSubtitle}>{isPinMode ? `Reviewing: ${formatStudentName(studentId)}` : 'GURO Diagnostics & Reports'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
            <SyncBadge />
          </View>
        </View>

        {isPinMode ? (
          <>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BarChart2 size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>This Student's Performance</Text>
                </View>
              }
              subtitle="Local device statistics"
            />
            <View style={styles.statsRow}>
              <StatCard icon={ClipboardList} label="Sessions" value={totalCompleted} />
              <StatCard icon={Target} label="Avg Score" value={`${averageScore}%`} valueColor={averageScore >= 80 ? Colors.success : averageScore >= 60 ? Colors.warning : Colors.danger} />
              <StatCard icon={Cloud} label="Unsynced" value={unsyncedCount} valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textDark} />
            </View>

            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ClipboardList size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Recent Results</Text>
                  </View>
                }
                subtitle="Last 5 activities"
              />
              {studentProgress.length === 0 ? (
                <Text style={styles.emptyText}>No practice logs yet.</Text>
              ) : (
                studentProgress.slice(0, 5).map((evt) => {
                  const pct = Math.round((evt.score / evt.totalQuestions) * 100);
                  const isSuccess = pct >= 80;
                  return (
                    <GlassCard key={evt.eventId} variant="subtle" padding={Spacing.md} style={styles.fileRow}>
                      <View style={styles.fileInfo}>
                        {isSuccess ? (
                          <CheckCircle size={18} color={Colors.success} style={{ marginRight: 8 }} />
                        ) : (
                          <AlertTriangle size={18} color={Colors.warning} style={{ marginRight: 8 }} />
                        )}
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
                icon={BookOpen}
                label="Subjects"
                value={stats.subjectCount}
                valueColor={Colors.accentPrimary}
              />
              <StatCard
                icon={HelpCircle}
                label="Questions"
                value={stats.totalQuestions}
                valueColor={Colors.accentSecondary}
              />
              <StatCard
                icon={Tag}
                label="Topics"
                value={stats.topicCount}
                valueColor={Colors.success}
              />
            </View>

            {/* ── Diagnostic Alerts ── */}
            <GlassCard style={[styles.section, { marginBottom: Spacing.md }]}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={18} color={Colors.warning} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Diagnostic Alerts</Text>
                  </View>
                }
                subtitle="Students scoring below target threshold (60%)"
              />

              {getDiagnosticAlerts().length === 0 ? (
                <Text style={styles.emptyText}>All students are performing above target threshold (≥ 60%).</Text>
              ) : (
                getDiagnosticAlerts().slice(0, 5).map((alert, idx) => (
                  <GlassCard key={idx} variant="subtle" padding={Spacing.md} style={{ marginBottom: Spacing.xs, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.15)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: Spacing.md }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                          {alert.name}
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                          Struggling on: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{alert.topic}</Text> ({alert.subject})
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textDark, marginTop: 2 }}>
                          Average: <Text style={{ color: Colors.danger, fontFamily: Fonts.bodyBold }}>{alert.avgPct}%</Text> across {alert.attempts} attempt{alert.attempts !== 1 ? 's' : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleIngestExtension(alert.topic, alert.subject)}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: 'rgba(17,66,142,0.08)',
                          borderWidth: 1,
                          borderColor: Colors.accentPrimary,
                          borderRadius: Radius.sm,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: Spacing.xs,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary }}>
                          Ingest Help
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                ))
              )}
            </GlassCard>

            {/* ── Student Telemetry ── */}
            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Activity size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Student Telemetry</Text>
                  </View>
                }
                subtitle={`Active classroom: ${currentUser?.classroomId || 'None'}`}
                right={
                  <SecondaryButton
                    label="Refresh"
                    onPress={fetchClassroomTelemetry}
                    loading={loadingTelemetry}
                    style={styles.clearBtn}
                  />
                }
              />

              {/* Search Input Row */}
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <ThemedTextInput
                    placeholder="Search student or topic..."
                    value={telemetrySearchInput}
                    onChangeText={(t) => {
                      setTelemetrySearchInput(t);
                      if (t === '') setTelemetryFilterText('');
                    }}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <PrimaryButton
                  label="Search"
                  onPress={() => setTelemetryFilterText(telemetrySearchInput)}
                  style={{ paddingHorizontal: Spacing.md, height: 48, justifyContent: 'center' }}
                />
                {(telemetrySearchInput !== '' || telemetryFilterText !== '') && (
                  <DangerButton
                    label=""
                    icon={<Trash2 size={16} color={Colors.dangerText} />}
                    onPress={() => {
                      setTelemetrySearchInput('');
                      setTelemetryFilterText('');
                    }}
                    style={{ width: 48, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', height: 48 }}
                  />
                )}
              </View>

              {/* Subject Filter Pills */}
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
                {(['All', 'Mathematics', 'English'] as const).map((subject) => {
                  const active = telemetrySelectedSubject === subject;
                  return (
                    <TouchableOpacity
                      key={subject}
                      onPress={() => setTelemetrySelectedSubject(subject)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: Spacing.xs,
                        borderRadius: Radius.full,
                        backgroundColor: active ? 'rgba(17,66,142,0.1)' : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: active ? Colors.accentPrimary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? Fonts.bodyBold : Fonts.body,
                          fontSize: FontSizes.xs,
                          color: active ? Colors.accentPrimary : Colors.textMuted,
                        }}
                      >
                        {subject === 'All' ? 'All Subjects' : subject}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {loadingTelemetry ? (
                <ActivityIndicator size="small" color={Colors.accentPrimary} style={{ marginVertical: Spacing.md }} />
              ) : filteredTelemetry.length === 0 ? (
                <Text style={styles.emptyText}>No matching telemetry logs.</Text>
              ) : (
                filteredTelemetry.slice(0, 10).map((evt) => {
                  const pct = Math.round((evt.score / evt.totalQuestions) * 100);
                  const isSuccess = pct >= 80;
                  const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <GlassCard key={evt.eventId} variant="subtle" padding={Spacing.md} style={[styles.fileRow, { marginBottom: Spacing.xs }]}>
                      <View style={styles.fileInfo}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                            {formatStudentName(evt.studentId)}
                          </Text>
                          <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                            {evt.topic} · G{evt.gradeLevel} {evt.subject}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: isSuccess ? Colors.success : Colors.warning }}>
                            {evt.score}/{evt.totalQuestions}
                          </Text>
                          <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textDark }}>
                            {timeStr}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
