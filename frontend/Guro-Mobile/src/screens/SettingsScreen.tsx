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
import * as Speech from 'expo-speech';

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
  Sparkles,
  Trophy,
  Award,
  Star,
  BarChart2,
} from 'lucide-react-native';

// ── Design System & UI ────────────────────────────────────────────────────────
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { PrimaryButton, DangerButton } from '../components/ui/Buttons';
import { toast } from '../components';
import { styles } from '../styles/SettingsScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

type Category = 'profile' | 'mascot' | 'audio' | 'theme' | 'time' | 'rules' | 'database';

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

  // Gamification properties from Store
  const xpPoints = useAppStore((state) => state.xpPoints);
  const virtualStars = useAppStore((state) => state.virtualStars);
  const mascotOutfit = useAppStore((state) => state.mascotOutfit);
  const ownedOutfits = useAppStore((state) => state.ownedOutfits);
  const voiceGuideTheme = useAppStore((state) => state.voiceGuideTheme);
  const correctSoundTheme = useAppStore((state) => state.correctSoundTheme);
  const purchaseOutfit = useAppStore((state) => state.purchaseOutfit);
  const setMascotOutfit = useAppStore((state) => state.setMascotOutfit);
  const setVoiceGuideTheme = useAppStore((state) => state.setVoiceGuideTheme);
  const setCorrectSoundTheme = useAppStore((state) => state.setCorrectSoundTheme);
  const syncProgressNow = useAppStore((state) => state.syncProgressNow);

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
      toast.error('Please fill in all fields to register.');
      return;
    }

    if (password !== confirm) {
      toast.error('Password and Confirm Password do not match.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setIsPromoting(true);
    try {
      const registerAndPromoteAction = useAppStore.getState().registerAndPromote;
      const setAppModeAction = useAppStore.getState().setAppMode;
      const result = await registerAndPromoteAction(email, password, name);
      if (result.success) {
        setAppModeAction('online');
        toast.success('Your account has been created and synced online!');
        setPromoteEmail('');
        setPromotePassword('');
        setPromoteConfirmPassword('');
      } else {
        toast.error(result.message ?? 'An error occurred during registration.');
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to connect to server.');
    } finally {
      setIsPromoting(false);
    }
  };

  // ── Settings categories navigation tabs definitions ───────────────────────
  const categories: Array<{ id: Category; label: string; icon: any }> = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'mascot', label: 'Mascot Closet', icon: Sparkles },
    { id: 'audio', label: 'Sound & Voice', icon: Volume2 },
    { id: 'theme', label: 'Themes Skin', icon: Palette },
    { id: 'time', label: 'Screen Time', icon: Clock },
    { id: 'rules', label: 'Parent Rules', icon: Lock },
    { id: 'database', label: 'Treasure Chest', icon: Database },
  ];

  // Helper to trigger guide speech pitch preview
  const playVoicePreview = (theme: string) => {
    Speech.stop();
    let text = "Hello! I am your astronaut learning buddy.";
    let rate = speechRate;
    let pitch = 1.0;
    if (theme === 'robot') {
      text = "Greetings human! I am your robot study partner. Beep boop!";
      pitch = 0.65;
    } else if (theme === 'owl') {
      text = "Welcome back! I am your wise owl coach. Hoot hoot!";
      pitch = 1.25;
    }
    Speech.speak(text, { rate, pitch });
  };

  const outfitList = [
    { id: 'default', label: 'Casual Mascot', emoji: '🦉', cost: 0 },
    { id: 'graduation_cap', label: 'Scholar Cap', emoji: '🎓', cost: 20 },
    { id: 'detective_hat', label: 'Detective Hat', emoji: '🕵️‍♂️', cost: 35 },
    { id: 'space_visor', label: 'Space Visor', emoji: '🧑‍🚀', cost: 50 },
    { id: 'wizard_cape', label: 'Wizard Cape', emoji: '🧙‍♂️', cost: 65 },
    { id: 'crown', label: 'Royal Crown', emoji: '👑', cost: 80 },
    { id: 'superhero_cape', label: 'Super Hero', emoji: '🦸', cost: 100 },
    { id: 'party_hat', label: 'Party Hat', emoji: '🥳', cost: 120 },
    { id: 'artist_beret', label: 'Artist Beret', emoji: '🎨', cost: 150 },
    { id: 'scientist_goggles', label: 'Lab Goggles', emoji: '🔬', cost: 180 },
  ];

  // ── Dynamic Settings Box Content Render ──────────────────────────────────
  const renderSettingsBox = () => {
    const studentLevel = Math.floor(xpPoints / 100) + 1;
    const progressToNextLevel = xpPoints % 100;
    const currentOutfitObj = outfitList.find(o => o.id === mascotOutfit);

    switch (activeCategory) {
      case 'profile':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>My Explorer Profile</Text>
              <Text style={styles.githubBoxSubtitle}>Track your learning level and sync progress.</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={{ backgroundColor: Colors.bgInput, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                
                {/* Visual Level indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                  <Text style={{ fontSize: 32 }}>{avatarEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                      Level {studentLevel} Study Explorer
                    </Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                      {xpPoints} XP Cumulative
                    </Text>
                  </View>
                </View>

                {/* Progress bar to Level Up */}
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary, letterSpacing: 0.8 }}>
                  LEVEL PROGRESS: {progressToNextLevel}/100 XP
                </Text>
                <View style={styles.xpBarContainer}>
                  <View style={[styles.xpBarFill, { width: `${progressToNextLevel}%` }]} />
                </View>

                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm }} />

                <Text style={{ fontFamily: Fonts.display, fontSize: 9, color: Colors.accentPrimary, letterSpacing: 1.2, marginBottom: 4 }}>
                  STUDENT ID & ACCESS
                </Text>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
                  {guestName ?? currentUser?.name ?? 'Explorer'}
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

      case 'mascot':
        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Mascot Dressing Closet</Text>
              <Text style={styles.githubBoxSubtitle}>Use your Study Stars to buy accessories and customize your buddy!</Text>
            </View>
            <View style={styles.githubBoxBody}>
              
              {/* Mascot Status */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bgInput, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                <View style={{ position: 'relative' }}>
                  <Text style={{ fontSize: 56 }}>{avatarEmoji}</Text>
                  {currentOutfitObj && currentOutfitObj.emoji ? (
                    <Text style={{ fontSize: 28, position: 'absolute', top: -14, right: -10 }}>{currentOutfitObj.emoji}</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
                    {guestName ?? currentUser?.name ?? 'Explorer'}'s Buddy
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Star size={12} color="#D97706" fill="#D97706" />
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: '#D97706' }}>
                      {virtualStars} Study Stars Available
                    </Text>
                  </View>
                </View>
              </View>

              {/* Closet Catalog */}
              <Text style={styles.formLabel}>Outfit Accessories Closet:</Text>
              <View style={styles.closetContainer}>
                {outfitList.map((item) => {
                  const isOwned = ownedOutfits.includes(item.id);
                  const isActive = mascotOutfit === item.id;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      style={[styles.closetItem, isActive && styles.closetItemActive]}
                      onPress={() => {
                        if (isOwned) {
                          setMascotOutfit(item.id);
                        } else {
                          // Try purchase
                          if (virtualStars >= item.cost) {
                            Alert.alert(
                              'Unlock Accessory',
                              `Unlock ${item.label} for ${item.cost} Stars?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Buy Now!',
                                  onPress: () => {
                                    const success = purchaseOutfit(item.id, item.cost);
                                    if (success) {
                                      toast.success(`You purchased the ${item.label}!`);
                                    }
                                  }
                                }
                              ]
                            );
                          } else {
                            toast.warning(`This accessory costs ${item.cost} Stars. Finish more quizzes to earn stars!`);
                          }
                        }
                      }}
                    >
                      <Text style={styles.closetItemEmoji}>{item.emoji || '👕'}</Text>
                      <Text style={styles.closetItemTitle}>{item.label}</Text>
                      {isOwned ? (
                        <Text style={styles.closetItemOwned}>{isActive ? '• Equipped •' : 'Owned'}</Text>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'center', marginTop: 4 }}>
                          <Star size={10} color="#D97706" fill="#D97706" />
                          <Text style={styles.closetItemPrice}>{item.cost} Stars</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
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
              
              {/* Correct / Wrong sound toggle */}
              <TouchableOpacity
                onPress={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
                style={styles.switchRow}
                activeOpacity={0.7}
              >
                <Text style={styles.switchLabel}>Correct / Wrong Ding SFX</Text>
                <View style={[styles.switchTrack, { backgroundColor: soundEffectsEnabled ? Colors.success : Colors.textDark }]}>
                  <View style={[styles.switchThumb, { alignSelf: soundEffectsEnabled ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>

              {/* TTS Guide voice theme selection */}
              <View style={{ marginTop: Spacing.xs }}>
                <Text style={styles.formLabel}>Narrator Guide Companion Voice:</Text>
                <View style={styles.segmentRow}>
                  {[
                    { key: 'astronaut', label: '👨‍🚀 Astronaut' },
                    { key: 'robot', label: '🤖 Robot' },
                    { key: 'owl', label: '🦉 Wise Owl' }
                  ].map((item) => {
                    const active = voiceGuideTheme === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => {
                          setVoiceGuideTheme(item.key);
                          playVoicePreview(item.key);
                        }}
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

              {/* Sound Theme Selection */}
              <View style={{ marginTop: Spacing.xs }}>
                <Text style={styles.formLabel}>Ding Victory Sounds Style:</Text>
                <View style={styles.segmentRow}>
                  {[
                    { key: 'ding', label: 'Classic' },
                    { key: 'arcade', label: 'Arcade' },
                    { key: 'laser', label: 'Laser' },
                  ].map((item) => {
                    const active = correctSoundTheme === item.key;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        onPress={() => setCorrectSoundTheme(item.key)}
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

              {/* Speech rate control */}
              <View style={{ marginTop: Spacing.xs }}>
                <Text style={styles.formLabel}>Narrator Speech Speed (TTS):</Text>
                <View style={styles.segmentRow}>
                  {[
                    { label: 'Slow', rate: 0.75 },
                    { label: 'Normal', rate: 1.0 },
                    { label: 'Fast', rate: 1.25 }
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
                <Text style={styles.formLabel}>Choose Mascot Emoji Base:</Text>
                <View style={styles.avatarGrid}>
                  {['🦉', '🦊', '🐼', '🦁', '🦄', '🚀', '🐬', '🐝', '🐯', '🐶', '🐱', '🤖', '👾', '🦖', '🐸', '🎓'].map((emoji) => {
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
                    { key: 'blue', label: 'Blue Galaxy', color: Colors.accentPrimary },
                    { key: 'teal', label: 'Ocean Teal', color: '#0F766E' },
                    { key: 'yellow', label: 'Sunny Desert', color: '#D97706' },
                    { key: 'purple', label: 'Space Nebula', color: '#6D28D9' }
                  ].map((theme) => {
                    const active = colorTheme === theme.key;
                    return (
                      <TouchableOpacity
                        key={theme.key}
                        onPress={() => {
                          setColorTheme(theme.key);
                          toast.success(`Applied ${theme.label} successfully!`);
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
                  • Math Before English Gate: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.mathBeforeEnglish ? 'Required' : 'Unlocked'}</Text>
                </Text>
                <Text style={styles.statsText}>
                  • Forced Bilingual Mode: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.forcedBilingual ? 'Active' : 'Disabled'}</Text>
                </Text>
                {parentalControls.priorityTopic && (
                  <Text style={styles.statsText}>
                    • Focused Priority Topic: <Text style={{ fontFamily: Fonts.bodyBold }}>{parentalControls.priorityTopic}</Text>
                  </Text>
                )}
              </View>

              <View style={{ marginTop: Spacing.md }}>
                <PrimaryButton
                  label="View Progress Report"
                  icon={<BarChart2 size={16} color={Colors.white} style={{ marginRight: 6 }} />}
                  onPress={() => navigation.navigate('StudentProgressReport')}
                />
              </View>
            </View>
          </View>
        );

      case 'database':
        const unsyncedCount = studentProgress.filter((e) => !e.synced).length;
        const syncedCount = studentProgress.filter((e) => e.synced).length;

        return (
          <View style={styles.githubBox}>
            <View style={styles.githubBoxHeader}>
              <Text style={styles.githubBoxTitle}>Data Storage</Text>
              <Text style={styles.githubBoxSubtitle}>Review exercises completed offline and upload them to your teacher's dashboard!</Text>
            </View>
            <View style={styles.githubBoxBody}>
              <View style={styles.statsBox}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.sm, color: Colors.accentPrimary, marginBottom: 4 }}>
                  My Local Safe Chest
                </Text>
                <Text style={styles.statsText}>
                  • Total Exercises Saved: <Text style={{ fontFamily: Fonts.bodyBold }}>{studentProgress.length}</Text>
                </Text>
                <Text style={styles.statsText}>
                  • Unsynced Data: <Text style={{ fontFamily: Fonts.bodyBold, color: unsyncedCount > 0 ? Colors.warning : Colors.textMuted }}>{unsyncedCount}</Text>
                </Text>
                <Text style={styles.statsText}>
                  • Synced Progress: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.success }}>{syncedCount}</Text>
                </Text>
                
                {unsyncedCount > 0 && appMode === 'online' ? (
                  <View style={{ marginTop: Spacing.sm }}>
                    <PrimaryButton
                      label="Launch Data Sync"
                      icon={<Database size={16} color={Colors.white} style={{ marginRight: 6 }} />}
                      onPress={async () => {
                        const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
                        const result = await syncProgressNow(serverUrl);
                        if (result.success) {
                          toast.success('Sync Successful!');
                        } else {
                          toast.error(`Sync Failed: ${result.message}`);
                        }
                      }}
                    />
                  </View>
                ) : unsyncedCount > 0 ? (
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.xs }}>
                    Connect to the internet and log in to launch your data jewels to the cloud rocket!
                  </Text>
                ) : (
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.success, fontStyle: 'italic', marginTop: Spacing.xs }}>
                    All your study jewels are safely synced to the sky! Amazing job!
                  </Text>
                )}

                <Text style={styles.logsHeading}>Offline Sync Telemetry Logs (Last 2):</Text>
                {logs.slice(0, 2).map((log, index) => (
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
                      navigation.replace((appMode as string) === 'offline' ? 'StudentDashboard' : 'Login');
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
