import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { getParentAccessCode } from '../utils/security';

// ── Icons ───────────────────────────────────────────────────────────────────
import {
  User,
  Image,
  Volume2,
  Palette,
  Clock,
  Lock,
  Database,
  LogOut,
  ChevronLeft,
} from 'lucide-react-native';

// ── Design System & UI ────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { PrimaryButton, DangerButton } from '../components/ui/Buttons';
import { styles } from '../styles/SettingsScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type Category = 'profile' | 'audio' | 'theme' | 'time' | 'rules' | 'database';

export function SettingsScreen({ navigation }: Props) {
  // ── Zustand Store Hooks ──────────────────────────────────────────────────
  const guestName = useAppStore((state) => state.guestName);
  const setGuestName = useAppStore((state) => state.setGuestName);
  const currentUser = useAppStore((state) => state.currentUser);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const streakCount = useAppStore((state) => state.streakCount);
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
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);
  const parentalControls = useAppStore((state) => state.parentalControls);
  const dailyMinutesUsed = useAppStore((state) => state.dailyMinutesUsed);

  // ── Local Screen State ────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<Category>('profile');

  // Account promotion (Go Online) form states
  const [promoteName, setPromoteName] = useState(guestName ?? '');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promotePassword, setPromotePassword] = useState('');
  const [promoteConfirmPassword, setPromoteConfirmPassword] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  // Prefill name if guestName changes
  useEffect(() => {
    setPromoteName(guestName ?? '');
  }, [guestName]);

  // ── Intercept Back Press ──────────────────────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      navigation.navigate('StudentDashboard');
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => backHandler.remove();
  }, [navigation]);

  // ── Submit Account promotion ──────────────────────────────────────────────
  const handlePromoteAccount = async () => {
    const name = promoteName.trim();
    const email = promoteEmail.trim();
    const password = promotePassword;
    const confirm = promoteConfirmPassword;

    if (!name || !email || !password || !confirm) {
      Alert.alert('Missing Fields', 'Please fill in all fields to register.');
      return;
    }

    if (password !== confirm) {
      Alert.alert('Passwords Mismatch', 'Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setIsPromoting(true);
    try {
      const registerAndPromoteAction = useAppStore.getState().registerAndPromote;
      const setAppModeAction = useAppStore.getState().setAppMode;
      const result = await registerAndPromoteAction(email, password, name);
      if (result.success) {
        setAppModeAction('online');
        Alert.alert('Success!', 'Your account has been created and synced online!');
        setPromoteEmail('');
        setPromotePassword('');
        setPromoteConfirmPassword('');
      } else {
        Alert.alert('Failed', result.message ?? 'An error occurred during registration.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to connect to server.');
    } finally {
      setIsPromoting(false);
    }
  };

  // ── Settings categories navigation tabs definitions ───────────────────────
  const categories: Array<{ id: Category; label: string; icon: any }> = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'audio', label: 'Sound & Speech', icon: Volume2 },
    { id: 'theme', label: 'Themes Skin', icon: Palette },
    { id: 'time', label: 'Screen Time', icon: Clock },
    { id: 'rules', label: 'Parent Rules', icon: Lock },
    { id: 'database', label: 'Local Database', icon: Database },
  ];

  // ── Dynamic GitHub Settings Box Content Render ───────────────────────────
  const renderSettingsBox = () => {
    switch (activeCategory) {
      case 'profile':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>User Profile Account</Text>
              <Text style={styles.githubBoxSubtitle}>Configure profile details and online cloud sync status.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={{ backgroundColor: Colors.bgInput, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1.2, marginBottom: 4 }}>
                  STUDENT TYPE
                </Text>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                  {avatarEmoji} {guestName ?? currentUser?.name ?? 'Explorer'}
                </Text>
                {currentUser && (
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 4 }}>
                    Email: {currentUser.email}
                  </Text>
                )}
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 4 }}>
                  Device Access Code: <Text style={{ fontFamily: Fonts.bodyBold }}>{getParentAccessCode(studentId)}</Text>
                </Text>
              </View>

              {appMode === 'offline' && (
                <View style={{ gap: Spacing.xs, marginTop: Spacing.sm, padding: Spacing.md, borderWidth: 1, borderColor: '#d0d7de', borderRadius: Radius.md, backgroundColor: '#f6f8fa' }}>
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.accentSecondary }}>
                    Go Online 🌐
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: Spacing.xs }}>
                    Register a cloud account to sync lessons progress across all your devices.
                  </Text>

                  <ThemedTextInput
                    label="Full Name"
                    value={promoteName}
                    onChangeText={setPromoteName}
                    placeholder="e.g. Neal"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />

                  <ThemedTextInput
                    label="Email Address"
                    value={promoteEmail}
                    onChangeText={setPromoteEmail}
                    placeholder="student@school.guro.app"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />

                  <PrivatePasswordInput
                    label="Password"
                    value={promotePassword}
                    onChangeText={setPromotePassword}
                    placeholder="Minimum 6 characters"
                  />

                  <PrivatePasswordInput
                    label="Confirm Password"
                    value={promoteConfirmPassword}
                    onChangeText={setPromoteConfirmPassword}
                    placeholder="Repeat password"
                  />

                  <PrimaryButton
                    label="Create Online Account"
                    onPress={handlePromoteAccount}
                    loading={isPromoting}
                    style={styles.formBtn}
                  />
                </View>
              )}
            </View>
          </View>
        );

      case 'audio':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Audio & Voice Options</Text>
              <Text style={styles.githubBoxSubtitle}>Tweak narration speech parameters and dynamic alert audio effects.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              {/* Ding SFX toggle */}
              <TouchableOpacity
                onPress={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                style={styles.switchRow}
                activeOpacity={0.7}
              >
                <Text style={styles.switchLabel}>🔊 Correct / Wrong Ding SFX</Text>
                <View style={[styles.switchTrack, { backgroundColor: soundEffectsEnabled ? Colors.success : Colors.textDark }]}>
                  <View style={[styles.switchThumb, { alignSelf: soundEffectsEnabled ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>

              {/* Speech rate control */}
              <View style={{ marginTop: Spacing.xs }}>
                <Text style={styles.formLabel}>Narrator Speech Speed (TTS):</Text>
                <View style={styles.segmentRow}>
                  {[
                    { label: '🐢 Slow', rate: 0.75 },
                    { label: '🚶 Normal', rate: 1.0 },
                    { label: '⚡ Fast', rate: 1.25 }
                  ].map((item) => {
                    const active = speechRate === item.rate;
                    return (
                      <TouchableOpacity
                        key={item.rate}
                        onPress={() => setSpeechRate(item.rate)}
                        style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        );

      case 'theme':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Themes & Mascot Customization</Text>
              <Text style={styles.githubBoxSubtitle}>Select dashboard color skins and customize profile icons.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              {/* Mascot selection grid */}
              <View>
                <Text style={styles.formLabel}>Choose Mascot Emoji:</Text>
                <View style={styles.avatarGrid}>
                  {['🚀', '🤖', '🦉', '⭐', '🦖', '🦄', '🍎', '⚽'].map((emoji) => {
                    const active = emoji === avatarEmoji;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => setAvatarEmoji(emoji)}
                        style={[styles.avatarItem, active && styles.avatarItemActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.avatarEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Color Skins selector */}
              <View style={{ marginTop: Spacing.sm }}>
                <Text style={styles.formLabel}>Active Color Theme Skin:</Text>
                <View style={styles.themeRow}>
                  {[
                    { key: 'blue', label: 'Default Blue', color: Colors.accentPrimary },
                    { key: 'teal', label: 'Ocean Teal', color: '#0F766E' },
                    { key: 'yellow', label: 'Sunny Yellow', color: '#D97706' },
                    { key: 'purple', label: 'Purple Space', color: '#6D28D9' }
                  ].map((theme) => {
                    const active = colorTheme === theme.key;
                    return (
                      <TouchableOpacity
                        key={theme.key}
                        onPress={() => {
                          setColorTheme(theme.key);
                          Alert.alert('Theme Changed', `Applied ${theme.label} successfully!`);
                        }}
                        style={[styles.themeBtn, active && [styles.themeBtnActive, { borderColor: theme.color }]]}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.themeDot, { backgroundColor: theme.color }]} />
                        <Text style={styles.themeText}>{theme.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        );

      case 'time':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Screen Time Tracker</Text>
              <Text style={styles.githubBoxSubtitle}>Track studied minutes and check active daily rules.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>
                  Time limits are set by parent controls to encourage balance:
                </Text>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain, marginTop: 4 }}>
                  Time used today: {Math.round(dailyMinutesUsed)} min {parentalControls.dailyTimeLimit > 0 ? ` / ${parentalControls.dailyTimeLimit} min maximum` : ''}
                </Text>
                
                {parentalControls.dailyTimeLimit > 0 ? (
                  <View style={styles.timeProgressContainer}>
                    <View style={[styles.timeProgressBar, {
                      width: `${Math.min(100, (dailyMinutesUsed / parentalControls.dailyTimeLimit) * 100)}%`,
                      backgroundColor: dailyMinutesUsed >= parentalControls.dailyTimeLimit ? Colors.danger : Colors.success,
                    }]} />
                  </View>
                ) : (
                  <Text style={styles.timeInfoItalic}>
                    No maximum study limits configured for today. Keep exploring!
                  </Text>
                )}
              </View>
            </View>
          </View>
        );

      case 'rules':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Active Parental Rules</Text>
              <Text style={styles.githubBoxSubtitle}>Review constraints configured to protect study pathways.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={styles.statsBox}>
                <Text style={styles.statsText}>
                  • Math Before English Gate: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.mathBeforeEnglish ? '🔒 Required' : '🔓 Unlocked'}</Text>
                </Text>
                <Text style={styles.statsText}>
                  • Forced Bilingual Mode: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.forcedBilingual ? '🌐 Active' : '🔓 Disabled'}</Text>
                </Text>
                {parentalControls.priorityTopic && (
                  <Text style={styles.statsText}>
                    • Focused Priority Topic: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.priorityTopic}</Text>
                  </Text>
                )}
              </View>
            </View>
          </View>
        );

      case 'database':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Local SQLite Database Sync</Text>
              <Text style={styles.githubBoxSubtitle}>Review pending transactions, completed exercises, and events logs.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={styles.statsBox}>
                <Text style={styles.statsText}>
                  • Total SQLite entries completed: {studentProgress.length}
                </Text>
                <Text style={styles.statsText}>
                  • Synced entries: {studentProgress.filter((e) => e.synced).length}
                </Text>
                <Text style={styles.statsText}>
                  • Unsynced (pending sync): {studentProgress.filter((e) => !e.synced).length}
                </Text>
                
                <Text style={styles.logsHeading}>Recent Database Transactions (Last 3):</Text>
                {logs.slice(0, 3).map((log, index) => (
                  <Text key={index} numberOfLines={1} style={styles.logLine}>
                    {log}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudentDashboard')}
          style={styles.backBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.backBtnText}>← Return</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>System Settings</Text>

        <View style={styles.headerSubtitleBadge}>
          <Text style={styles.headerSubtitleText}>
            {appMode === 'online' ? 'Connected' : 'Offline Mode'}
          </Text>
        </View>
      </View>

      {/* ── Scrollable top menu categories selectors (GitHub tab row) ───────── */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
        >
          {categories.map((cat) => {
            const active = cat.id === activeCategory;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[styles.tabItem, active && styles.tabItemActive]}
                activeOpacity={0.75}
              >
                <IconComp size={14} color={active ? Colors.accentPrimary : Colors.textMuted} />
                <Text style={[styles.tabItemText, active && styles.tabItemTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Settings content detailing panels (Rendered at the bottom scroll) ──── */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderSettingsBox()}
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      {appMode !== 'offline' && (
        <View style={styles.footerContainer}>
          <DangerButton
            label="Sign Out of Cloud Session"
            icon={<LogOut size={16} color={Colors.dangerText} style={{ marginRight: 6 }} />}
            onPress={() => {
              Alert.alert(
                'Confirm Logout',
                'Are you sure you want to sign out? Your credentials will be cleared, returning you to the offline guest state.',
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
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Private Helper Component to display secure text input ──────────────────
interface PrivateInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}

function PrivatePasswordInput({ label, value, onChangeText, placeholder }: PrivateInputProps) {
  return (
    <ThemedTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      secureTextEntry
    />
  );
}
