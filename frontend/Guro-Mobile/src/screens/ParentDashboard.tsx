import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Switch,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore, ProgressEvent } from '../store/useAppStore';
import { getParentAccessCode } from '../utils/security';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { styles } from '../styles/ParentDashboard.styles';


type Props = NativeStackScreenProps<RootStackParamList, 'ParentDashboard'>;

export function ParentDashboard({ navigation }: Props) {
  const studentProgress = useAppStore((state) => state.studentProgress);
  const parentPin = useAppStore((state) => state.parentPin);
  const setParentPin = useAppStore((state) => state.setParentPin);
  const clearProgress = useAppStore((state) => state.clearProgress);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);
  const addLog = useAppStore((state) => state.addLog);
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

  const [studentIdInput, setStudentIdInput] = useState(studentId);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // PIN change states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalCompleted = studentProgress.length;
  const unsyncedCount = studentProgress.filter((e) => !e.synced).length;
  const syncedCount = totalCompleted - unsyncedCount;
  const averageScore =
    totalCompleted === 0
      ? 0
      : Math.round(
          studentProgress.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) /
            totalCompleted
        );

  const timeLimitExceeded =
    parentalControls.dailyTimeLimit > 0 && dailyMinutesUsed >= parentalControls.dailyTimeLimit;

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  const handlePinChangeSubmit = () => {
    if (!newPinInput || newPinInput.length !== 4 || isNaN(Number(newPinInput))) {
      Alert.alert('Validation Error', 'New PIN must be exactly 4 digits.');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      Alert.alert('Validation Error', 'New PIN and confirmation do not match.');
      return;
    }
    if (parentPin && currentPinInput !== parentPin) {
      Alert.alert('Authentication Error', 'Current PIN code is incorrect.');
      return;
    }
    setParentPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setIsChangingPin(false);
    Alert.alert('PIN Updated', 'Parent dashboard PIN changed successfully.');
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
            Alert.alert('Success', 'Practice logs cleared.');
          },
        },
      ]
    );
  };

  const scoreColor =
    averageScore >= 80 ? Colors.success : averageScore >= 60 ? Colors.warning : Colors.danger;

  const renderHeader = () => (
    <View style={{ gap: Spacing.lg }}>
      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <StatCard label="Quizzes Done" value={totalCompleted} icon="📋" />
        <StatCard
          label="Avg Accuracy"
          value={`${averageScore}%`}
          valueColor={scoreColor}
          icon="🎯"
        />
        <StatCard
          label="Unsynced"
          value={unsyncedCount}
          valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textDark}
          icon="☁️"
        />
      </View>

      {/* ── Parental Controls ── */}
      <GlassCard style={styles.section}>
        <SectionHeader title="🛡️ Parental Controls" subtitle="Screen time, gates & language" />

        {/* Screen time limit */}
        <Text style={styles.controlLabel}>
          ⏳ Daily Screen Time Limit:{' '}
          <Text style={{ color: Colors.textMain }}>
            {parentalControls.dailyTimeLimit === 0
              ? 'Unlimited'
              : `${parentalControls.dailyTimeLimit} min`}
          </Text>
        </Text>

        {/* Today's usage */}
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
                Alert.alert('Reset', "Today's screen time reset to 0.");
              }}
            >
              <Text style={styles.resetTodayText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Time limit pills */}
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

        {/* Math Gate toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🔒 Math Progression Gate</Text>
            <Text style={styles.toggleSub}>Lock English until Math scores ≥ 80%</Text>
          </View>
          <Switch
            value={parentalControls.mathBeforeEnglish}
            onValueChange={(v) => updateParentalControls({ mathBeforeEnglish: v })}
            trackColor={{ false: Colors.textDark, true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Bilingual toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🇵🇭 Force Bilingual Feedback</Text>
            <Text style={styles.toggleSub}>Show EN + Filipino explanations in quests</Text>
          </View>
          <Switch
            value={parentalControls.forcedBilingual}
            onValueChange={(v) => updateParentalControls({ forcedBilingual: v })}
            trackColor={{ false: Colors.textDark, true: Colors.accentPrimary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Priority topic */}
        <ThemedTextInput
          label="🎯 Priority Target Topic"
          placeholder="e.g. Fractions (leave blank for none)"
          value={parentalControls.priorityTopic || ''}
          onChangeText={(text) => updateParentalControls({ priorityTopic: text || null })}
          containerStyle={{ marginTop: Spacing.md }}
        />
      </GlassCard>

      {/* ── Cloud Sync ── */}
      <GlassCard style={styles.section}>
        <SectionHeader title="🌐 Cloud Sync" subtitle="Upload progress to teacher's server" />
        <ThemedTextInput
          label="Server URL"
          placeholder="http://10.0.2.2:3000"
          value={serverUrl}
          onChangeText={setServerUrl}
          editable={!isSyncing}
          keyboardType="url"
          autoCapitalize="none"
        />
        <PrimaryButton
          label={`🚀 Sync Now (${unsyncedCount} staged)`}
          onPress={handleSync}
          loading={isSyncing}
          style={{ marginTop: Spacing.md }}
        />
      </GlassCard>

      {!isPinMode && (
        <GlassCard style={styles.section}>
          <SectionHeader
            title="🔑 Device Profile ID"
            subtitle="Matches teacher/parent web dashboards"
          />
          <ThemedTextInput
            label="Student ID"
            placeholder="GURO-STUDENT-LOCAL"
            value={studentIdInput}
            onChangeText={setStudentIdInput}
            autoCapitalize="characters"
          />
          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: Spacing.sm }}>
            🔑 Parent Access Code: {getParentAccessCode(studentId)}
          </Text>
          <PrimaryButton
            label="Save Device ID"
            onPress={() => {
              if (!studentIdInput.trim()) {
                Alert.alert('Error', 'Student ID cannot be empty.');
                return;
              }
              setStudentId(studentIdInput.trim());
              Alert.alert('Saved', `ID set to: ${studentIdInput.trim().toUpperCase()}`);
            }}
            style={{ marginTop: Spacing.md }}
          />
        </GlassCard>
      )}

      {/* ── Practice Log ── */}
      <SectionHeader title="📋 Practice Log" subtitle={`${totalCompleted} sessions recorded`} />
      {studentProgress.length === 0 && (
        <Text style={styles.emptyText}>No practice logs yet.</Text>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={{ gap: Spacing.lg, marginTop: Spacing.md }}>
      {/* ── Cloud Account ── */}
      {!isPinMode && (
        currentUser ? (
          <GlassCard style={styles.section}>
            <SectionHeader title="👤 Cloud Account" />
            <GlassCard variant="subtle" padding={Spacing.md} style={{ marginBottom: Spacing.md }}>
              <Badge label="Linked" variant="success" style={{ marginBottom: Spacing.sm }} />
              <Text style={styles.accountName}>{currentUser.name}</Text>
              <Text style={styles.accountEmail}>{currentUser.email}</Text>
            </GlassCard>
            <DangerButton
              label="🚪 Log Out of Cloud Account"
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
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.section}>
            <SectionHeader
              title="👤 Cloud Profile"
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
                      Alert.alert('Error', 'Enter email and password.');
                      return;
                    }
                    setIsAuthSubmitting(true);
                    const res = await loginToCloud(authEmail.trim(), authPassword.trim());
                    setIsAuthSubmitting(false);
                    Alert.alert(res.success ? 'Success' : 'Error', res.message);
                    if (res.success) { setAuthEmail(''); setAuthPassword(''); }
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
                      Alert.alert('Error', 'Fill in all fields.');
                      return;
                    }
                    setIsAuthSubmitting(true);
                    const res = await registerAndPromote(authEmail.trim(), authPassword.trim(), authName.trim());
                    setIsAuthSubmitting(false);
                    Alert.alert(res.success ? 'Success' : 'Error', res.message);
                    if (res.success) { setAuthName(''); setAuthEmail(''); setAuthPassword(''); }
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
        <SectionHeader title="⚙️ Portal Settings" />

        {!isChangingPin ? (
          <SecondaryButton
            label="🔐 Change Dashboard PIN"
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
          label="🗑️ Clear Practice History"
          onPress={handleClearHistory}
          style={{ marginTop: Spacing.md }}
        />
      </GlassCard>

      {/* bottom padding */}
      <View style={{ height: Spacing['3xl'] }} />
    </View>
  );

  const renderItem = ({ item }: { item: ProgressEvent }) => {
    return (
      <GlassCard variant="subtle" padding={Spacing.md} style={styles.logItem}>
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
            label={item.synced ? 'Synced' : 'Local'}
            variant={item.synced ? 'success' : 'warning'}
          />
        </View>
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Parent Portal</Text>
          <Text style={styles.headerSub}>Monitor, control &amp; sync</Text>
        </View>
        <View style={styles.headerRight}>
          <SyncBadge />
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.navigate('StudentDashboard')}
          >
            <Text style={styles.exitBtnText}>← Kid Zone</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={studentProgress.slice(0, 50)}
        renderItem={renderItem}
        keyExtractor={(item) => item.eventId}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </SafeAreaView>
  );
}


