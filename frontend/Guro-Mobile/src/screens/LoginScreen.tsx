import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes, LetterSpacing } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Role = 'student' | 'teacher' | 'parent';

const ROLES: { id: Role; title: string; emoji: string }[] = [
  { id: 'teacher', title: 'Teacher', emoji: '🏫' },
  { id: 'parent', title: 'Parent', emoji: '👪' },
  { id: 'student', title: 'Student', emoji: '🎓' },
];

export function LoginScreen({ navigation }: Props) {
  const { loginToCloud, currentUser, appMode, guestName, setAppMode, setGuestName, setStudentId } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [offlineName, setOfflineName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [offlineNameError, setOfflineNameError] = useState('');

  // Fade-in animation on mount (mirrors web's @keyframes fadeIn)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // If already logged in from a previous session, auto-route
  useEffect(() => {
    if (currentUser) {
      routeByRole(currentUser.role);
    } else if (appMode === 'offline' && guestName) {
      navigation.replace('StudentDashboard');
    }
  }, []);

  const routeByRole = (role: string) => {
    if (role === 'student') navigation.replace('StudentDashboard');
    else if (role === 'teacher') navigation.replace('TeacherDashboard');
    else if (role === 'parent') navigation.replace('ParentDashboard');
    else navigation.replace('StudentDashboard');
  };

  const handleCloudLogin = async () => {
    let valid = true;
    if (!selectedRole) {
      Alert.alert('Role Required', 'Please select a role before signing in.');
      valid = false;
    }
    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    if (!password.trim()) { setPasswordError('Password is required'); valid = false; }
    if (!valid) return;

    setLoading(true);
    const result = await loginToCloud(email.trim(), password);
    setLoading(false);

    if (result.success) {
      const user = useAppStore.getState().currentUser;
      if (user) {
        if (user.role !== selectedRole) {
          useAppStore.getState().logoutFromCloud();
          Alert.alert('Role Mismatch', `This account is registered as a ${user.role}, not a ${selectedRole}.`);
        } else {
           setAppMode('online');
           routeByRole(user.role);
        }
      }
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  const handleStartOffline = () => {
    if (!offlineName.trim() || offlineName.trim().length < 3) {
      setOfflineNameError('Please enter a name (min 3 chars).');
      return;
    }
    
    setAppMode('offline');
    setGuestName(offlineName.trim());
    setStudentId(offlineName.trim().replace(/\s+/g, '-').toUpperCase() + '-GUEST');
    navigation.replace('StudentDashboard');
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Logo ── */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>GURO</Text>
            </View>
            <Text style={styles.logoTagline}>
              Offline-first learning platform
            </Text>
          </View>

          {/* ── Section A: Sign In ── */}
          <GlassCard padding={Spacing['2xl']} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>☁️ Sign In with Account</Text>
            
            <View style={styles.rolesRow}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => setSelectedRole(role.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.rolePill,
                      isSelected && styles.rolePillSelected
                    ]}
                  >
                     <Text style={styles.rolePillEmoji}>{role.emoji}</Text>
                     <Text style={[styles.rolePillText, isSelected && styles.rolePillTextSelected]}>{role.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.formGroup}>
              <ThemedTextInput
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChangeText={(t) => { setEmail(t); setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
              />
            </View>

            <View style={[styles.formGroup, { marginTop: Spacing.md }]}>
              <ThemedTextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                secureTextEntry
                error={passwordError}
              />
            </View>

            <PrimaryButton
              label="Sign In →"
              onPress={handleCloudLogin}
              loading={loading}
              style={{ marginTop: Spacing.xl }}
            />
          </GlassCard>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Section B: Start Offline ── */}
          <GlassCard padding={Spacing['2xl']} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📴 Start Offline</Text>
            <Text style={styles.sectionSubtitle}>No account needed</Text>

            <View style={styles.formGroup}>
               <ThemedTextInput
                  label="Your name"
                  placeholder="e.g. Juan"
                  value={offlineName}
                  onChangeText={(t) => { setOfflineName(t); setOfflineNameError(''); }}
                  error={offlineNameError}
               />
            </View>

            <SecondaryButton
              label="Continue Offline →"
              onPress={handleStartOffline}
              style={{ marginTop: Spacing.xl }}
            />
            
            <Text style={styles.offlineHint}>
               Teacher & Parent access via PIN hand-over
            </Text>
          </GlassCard>

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            GURO v1.0 · Offline-first · SQLite powered
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
  },
  inner: {
    flex: 1,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoBadge: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  logoText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes['3xl'],
    color: Colors.white,
    letterSpacing: LetterSpacing.wide,
  },
  logoTagline: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Cards
  sectionCard: {
     marginBottom: 0,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.xs,
  },

  // Roles Pill
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rolePillSelected: {
    backgroundColor: Colors.accentPrimaryDeep,
    borderColor: Colors.accentPrimary,
  },
  rolePillEmoji: {
     fontSize: 20,
     marginBottom: Spacing.xs,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
  },
  rolePillTextSelected: {
     color: Colors.accentPrimary,
  },

  formGroup: {},

  offlineHint: {
     fontFamily: Fonts.body,
     fontSize: FontSizes.xs,
     color: Colors.textMuted,
     textAlign: 'center',
     marginTop: Spacing.md,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textDark,
  },

  // Footer
  footer: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },
});
