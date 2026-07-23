/**
 * ProfileScreen — Me tab.
 * Avatar display, outfit shop, sound toggle, classroom link/unlink,
 * and PIN-protected access to Parent Portal and Teacher Console.
 */

import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import * as Network from 'expo-network';
import { getTeacherDerivedPin } from '../utils/security';
import {
  Settings,
  Users,
  Rocket,
  LogOut,
  Link,
  School,
  Volume2,
  ChevronRight,
  Star,
} from 'lucide-react-native';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { SectionHeader } from '../components/ui/SectionHeader';
import { PinPad } from '../components/shared/PinPad';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { styles } from '../styles/ProfileScreen.styles';
import { toast } from '../components';

type PinTarget = 'teacher' | 'parent' | 'parent-setup';

const OUTFIT_OPTIONS = [
  { key: 'default', label: 'Classic', emoji: '🦉', cost: 0 },
  { key: 'graduation_cap', label: 'Scholar Cap', emoji: '🎓', cost: 20 },
  { key: 'detective_hat', label: 'Detective', emoji: '🕵️‍♂️', cost: 35 },
  { key: 'space_visor', label: 'Astronaut', emoji: '🧑‍🚀', cost: 50 },
  { key: 'wizard_cape', label: 'Wizard', emoji: '🧙‍♂️', cost: 65 },
  { key: 'crown', label: 'Royalty', emoji: '👑', cost: 80 },
  { key: 'superhero_cape', label: 'Super Hero', emoji: '🦸', cost: 100 },
  { key: 'party_hat', label: 'Party Hat', emoji: '🥳', cost: 120 },
  { key: 'artist_beret', label: 'Artist', emoji: '🎨', cost: 150 },
  { key: 'scientist_goggles', label: 'Lab Goggles', emoji: '🔬', cost: 180 },
];

export function ProfileScreen() {
  const navigation = useNavigation<any>();

  const currentUser         = useAppStore((s) => s.currentUser);
  const guestName           = useAppStore((s) => s.guestName);
  const avatarEmoji         = useAppStore((s) => s.avatarEmoji);
  const mascotOutfit        = useAppStore((s) => s.mascotOutfit || 'default');
  const ownedOutfits        = useAppStore((s) => s.ownedOutfits || ['default']);
  const virtualStars        = useAppStore((s) => s.virtualStars || 0);
  const soundEffectsEnabled = useAppStore((s) => s.soundEffectsEnabled);
  const setSoundEffectsEnabled = useAppStore((s) => s.setSoundEffectsEnabled);
  const appMode             = useAppStore((s) => s.appMode);
  const classroomId         = useAppStore((s) => s.classroomId);
  const setClassroomId      = useAppStore((s) => s.setClassroomId);
  const fetchItemBankFromServer = useAppStore((s) => s.fetchItemBankFromServer);
  const parentPin           = useAppStore((s) => s.parentPin);
  const setParentPin        = useAppStore((s) => s.setParentPin);
  const studentId           = useAppStore((s) => s.studentId);
  const logoutFromCloud     = useAppStore((s) => s.logoutFromCloud);
  const setMascotOutfit     = useAppStore((s) => s.setMascotOutfit);
  const purchaseOutfit      = useAppStore((s) => s.purchaseOutfit);
  const serverUrlFromStore  = useAppStore((s) => s.serverUrl);

  const [pinVisible,  setPinVisible]  = useState(false);
  const [pinTarget,   setPinTarget]   = useState<PinTarget>('teacher');
  const [classModal,  setClassModal]  = useState(false);
  const [classCode,   setClassCode]   = useState('');
  const [isLinking,   setIsLinking]   = useState(false);

  const studentName = guestName ?? currentUser?.name ?? 'Explorer';

  // ── PIN ─────────────────────────────────────────────────────────────────────
  const openTeacherPin = () => { setPinTarget('teacher');               setPinVisible(true); };
  const openParentPin  = () => { setPinTarget(parentPin ? 'parent' : 'parent-setup'); setPinVisible(true); };

  const handlePinSubmit = async (pin: string): Promise<boolean> => {
    if (pinTarget === 'teacher') {
      const derived = getTeacherDerivedPin(classroomId, studentId);
      if (pin !== derived) return false;
      setPinVisible(false);
      navigation.navigate('TeacherDashboard');
      return true;
    }
    if (pinTarget === 'parent') {
      if (pin !== parentPin) return false;
      setPinVisible(false);
      navigation.navigate('ParentDashboard');
      return true;
    }
    // parent-setup: save new PIN
    setParentPin(pin);
    setPinVisible(false);
    navigation.navigate('ParentDashboard');
    return true;
  };

  const handleForgotPin = () => {
    if (pinTarget === 'teacher') {
      Alert.alert(
        'Teacher Security Challenge',
        'Solve to verify you are a teacher:\n\nWhat is 14 × 13?',
        [
          { text: '172', onPress: () => toast.error('Wrong Answer. Please try again!') },
          { text: '194', onPress: () => toast.error('Wrong Answer. Please try again!') },
          {
            text: '182',
            onPress: () => {
              const pin = getTeacherDerivedPin(classroomId, studentId);
              toast.success(`Access Granted 🔑 Your Teacher PIN is: ${pin}`, 5000);
            },
          },
        ],
        { cancelable: true },
      );
    } else if (pinTarget === 'parent') {
      Alert.alert(
        'Parent PIN Reset',
        'Solve to reset your PIN:\n\nWhat is 15 × 16?',
        [
          { text: '230', onPress: () => toast.error('Wrong Answer. Please try again!') },
          { text: '250', onPress: () => toast.error('Wrong Answer. Please try again!') },
          {
            text: '240',
            onPress: () => {
              setParentPin(null);
              setPinVisible(false);
              toast.success('PIN Reset! Tap Parent Portal again to set a new one.');
            },
          },
        ],
        { cancelable: true },
      );
    }
  };

  const pinConfig: Record<PinTarget, { title: string; subtitle: string }> = {
    teacher:       { title: 'Teacher Access',   subtitle: 'Enter the teacher PIN to continue.' },
    parent:        { title: 'Parent Portal',     subtitle: 'Enter your parent PIN to continue.' },
    'parent-setup':{ title: 'Create Parent PIN', subtitle: 'Set a 4-digit PIN to protect the parent portal.' },
  };

  // ── Classroom ────────────────────────────────────────────────────────────────
  const handleLinkClassroom = async () => {
    const trimmed = classCode.trim();
    if (!trimmed) { toast.error('Please type a classroom invite code first.'); return; }

    // O10: Pre-check connectivity before attempting server fetch
    try {
      const netState = await Network.getNetworkStateAsync();
      const isOnline = netState.isConnected && netState.isInternetReachable !== false;
      if (!isOnline) {
        toast.error("You're offline. Connect to the internet to link a classroom.");
        return;
      }
    } catch {
      // Proceed and let fetch handle it
    }

    setIsLinking(true);
    try {
      let code = trimmed;
      let serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      
      const firstAtIndex = trimmed.indexOf('@');
      if (firstAtIndex !== -1) {
        code = trimmed.substring(0, firstAtIndex);
        serverUrl = trimmed.substring(firstAtIndex + 1);
      }

      const codeRegex = /^[A-Z]{3,4}-G[4-6]-[A-Z0-9]{3}$/i;
      if (!codeRegex.test(code)) {
        throw new Error('Invalid classroom code format. Use format like ENG-G6-ZE3');
      }
      const ok = await fetchItemBankFromServer(serverUrl, code);
      if (ok) {
        setClassroomId(code);
        setClassModal(false);
        setClassCode('');
        toast.success(`Classroom "${code}" connected successfully.`);
      } else {
        toast.error('Could not connect. Check the code and your internet connection.');
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Something went wrong.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkClassroom = () => {
    Alert.alert('Unlink Classroom?', 'This will remove your classroom connection.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: () => { setClassroomId(null); toast.success('Classroom unlinked.'); } },
    ]);
  };

  // ── Outfit ───────────────────────────────────────────────────────────────────
  const handleOutfitPress = (key: string, cost: number) => {
    const owned = ownedOutfits.includes(key);
    if (owned) { setMascotOutfit(key); return; }
    if (virtualStars < cost) {
      toast.error(`You need ${cost} stars to unlock this.`);
      return;
    }
    Alert.alert(`Buy outfit?`, `Cost: ${cost} stars`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy', onPress: () => { if (!purchaseOutfit(key, cost)) toast.error('Not enough stars!'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Customize your experience.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <GlassCard padding={Spacing.lg} style={{ alignItems: 'center', gap: Spacing.md }}>
          <View style={{ position: 'relative', width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 64 }}>{avatarEmoji}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
              {studentName}
            </Text>
            {currentUser?.email && (
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                {currentUser.email}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: '#F59E0B' }}>
                {virtualStars} Stars
              </Text>
            </View>
            {classroomId && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: Colors.accentPrimaryDeep,
                paddingHorizontal: Spacing.sm, paddingVertical: 3,
                borderRadius: Radius.full,
              }}>
                <School size={12} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                  {classroomId.split('@')[0]}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Outfit shop */}
        <SectionHeader title="My Outfit" subtitle="Spend stars to unlock new looks." />
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
          {OUTFIT_OPTIONS.map(({ key, label, emoji, cost }) => {
            const owned  = ownedOutfits.includes(key);
            const active = mascotOutfit === key;
            const canAfford = virtualStars >= cost;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleOutfitPress(key, cost)}
                activeOpacity={0.75}
                style={[
                  styles.outfitCard,
                  active && styles.outfitCardActive,
                  !owned && !canAfford && { opacity: 0.45 },
                ]}
              >
                <Text style={{ fontSize: 30 }}>{emoji}</Text>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMain, textAlign: 'center' }}>
                  {label}
                </Text>
                {!owned && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                      {cost}
                    </Text>
                    <Star size={10} color={Colors.textMuted} fill={Colors.textMuted} />
                  </View>
                )}
                {owned && active && (
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.success }}>
                    Equipped
                  </Text>
                )}
                {owned && !active && (
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    Wear
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick settings */}
        <SectionHeader title="Settings" subtitle="Quick preferences." />
        <GlassCard padding={Spacing.lg} style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Volume2 size={18} color={Colors.textMuted} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                Sound Effects
              </Text>
            </View>
            <Switch
              value={soundEffectsEnabled}
              onValueChange={setSoundEffectsEnabled}
              trackColor={{ false: Colors.border, true: Colors.accentPrimary }}
              thumbColor={Colors.white}
            />
          </View>
          <View style={{ height: 1, backgroundColor: Colors.border }} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.75}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Settings size={18} color={Colors.textMuted} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                Full Settings
              </Text>
            </View>
            <ChevronRight size={16} color={Colors.textDark} />
          </TouchableOpacity>
        </GlassCard>

        {/* Classroom */}
        <SectionHeader title="Classroom" subtitle="Link to your teacher's classroom." />
        <GlassCard padding={Spacing.lg}>
          {classroomId ? (
            <View style={{ gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <School size={18} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, flex: 1 }}>
                  {classroomId}
                </Text>
              </View>
              <TouchableOpacity onPress={handleUnlinkClassroom} activeOpacity={0.75} style={{ alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.dangerText }}>
                  Unlink Classroom
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setClassModal(true)}
              activeOpacity={0.75}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
            >
              <Link size={18} color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.accentPrimary }}>
                Link a Classroom
              </Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Adult portals */}
        <SectionHeader title="Adult Portals" subtitle="Access requires a PIN." />
        <View style={{ gap: Spacing.sm }}>
          <TouchableOpacity onPress={openParentPin} activeOpacity={0.75}>
            <GlassCard padding={Spacing.lg} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Users size={22} color={Colors.accentPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.md, color: Colors.textMain }}>
                  Parent Portal
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                  Manage parental controls
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textDark} />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity onPress={openTeacherPin} activeOpacity={0.75}>
            <GlassCard padding={Spacing.lg} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Rocket size={22} color={Colors.accentSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.md, color: Colors.textMain }}>
                  Teacher Console
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                  View classroom tools
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textDark} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Logout — U6: Specific confirmation copy + always navigate to Login */}
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Log out from GURO?',
              'Your progress is saved on this device and will sync when you reconnect.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: () => { logoutFromCloud(); navigation.replace('Login'); },
                },
              ]
            )
          }
          activeOpacity={0.75}
        >
          <GlassCard
            padding={Spacing.lg}
            style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderColor: Colors.dangerBorder }}
          >
            <LogOut size={22} color={Colors.dangerText} />
            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.dangerText }}>
              Log Out
            </Text>
          </GlassCard>
        </TouchableOpacity>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* PIN modal */}
      <PinPad
        visible={pinVisible}
        title={pinConfig[pinTarget].title}
        subtitle={pinConfig[pinTarget].subtitle}
        onSubmit={handlePinSubmit}
        onCancel={() => setPinVisible(false)}
        onForgotPin={pinTarget !== 'parent-setup' ? handleForgotPin : undefined}
      />

      {/* Classroom linking modal */}
      {classModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapper}>
            <GlassCard padding={Spacing['2xl']} style={{ gap: Spacing.md }}>
              <SectionHeader
                title="Link Classroom"
                subtitle="Enter the invite code your teacher shared."
              />
              <ThemedTextInput
                label="Classroom Code"
                value={classCode}
                onChangeText={setClassCode}
                placeholder="e.g. ENG-G6-ZE3"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <PrimaryButton label="Link Classroom" onPress={handleLinkClassroom} loading={isLinking} />
              <SecondaryButton
                label="Cancel"
                onPress={() => { setClassModal(false); setClassCode(''); }}
              />
            </GlassCard>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
