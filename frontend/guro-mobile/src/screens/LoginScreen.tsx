import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { toast } from '../components';
import { styles } from '../styles/LoginScreen.styles';
import { School, Users, GraduationCap, Cloud, WifiOff } from 'lucide-react-native';
import * as Network from 'expo-network';

const GuroLogoGraphic = () => (
  <View style={{
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#11428E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: '#11428E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  }}>
    <GraduationCap size={36} color="#FFFFFF" strokeWidth={2.2} />
    <Text style={{ position: 'absolute', top: -4, right: -4, fontSize: 13, color: '#F59E0B', fontWeight: 'bold' }}>✦</Text>
  </View>
);


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Role = 'student' | 'teacher' | 'parent';

const ROLES: { id: Role; title: string; icon: React.ComponentType<any> }[] = [
  { id: 'teacher', title: 'Teacher', icon: School },
  { id: 'student', title: 'Student', icon: GraduationCap },
  { id: 'parent', title: 'Parent', icon: Users },
];

export function LoginScreen({ navigation }: Props) {
  const { loginToCloud, currentUser, appMode, guestName, setAppMode, setGuestName, setStudentId, serverUrl, setServerUrl, setPreferredGrade } = useAppStore();

  const [selectedRole, setSelectedRole] = useState<Role | null>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [offlineName, setOfflineName] = useState('');
  const [offlineEmailOrId, setOfflineEmailOrId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number>(4);
  const [selectedOfflineGrade, setSelectedOfflineGrade] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [offlineNameError, setOfflineNameError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showServerUrlConfig, setShowServerUrlConfig] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotRole, setForgotRole] = useState<Role>('student');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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

  // Monitor network connectivity state dynamically
  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (active) {
          setIsOnline(!!(state.isConnected && state.isInternetReachable !== false));
        }
      } catch {
        if (active) {
          setIsOnline(false);
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const state = await Network.getNetworkStateAsync();
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(connected);
      if (connected) {
        toast.success('Connection active! You are online.');
      } else {
        toast.warning('Device is offline. Check your network connection.');
      }
    } catch {
      setIsOnline(false);
      toast.error('Could not check network status.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (logoTapCount > 0) {
      const timer = setTimeout(() => setLogoTapCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [logoTapCount]);

  const handleLogoPress = () => {
    setLogoTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setShowServerUrlConfig((show) => {
          const nextShow = !show;
          toast.info(nextShow ? 'Developer mode enabled: Server URL configuration revealed.' : 'Developer mode disabled: Server URL hidden.');
          return nextShow;
        });
        return 0;
      }
      return next;
    });
  };

  const handleSendCode = async () => {
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      toast.error('Email is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      toast.error('Invalid email format.');
      return;
    }

    setForgotLoading(true);
    try {
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/forgot-password/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          role: forgotRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Code sent to your email.');
        setForgotStep(2);
      } else {
        toast.error(data.error || 'Failed to send recovery code.');
      }
    } catch (e: any) {
      toast.error('Connection error: Cannot reach the recovery server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmedEmail = forgotEmail.trim();
    const trimmedCode = forgotCode.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setForgotLoading(true);
    try {
      const resolvedUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/forgot-password/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          role: forgotRole,
          code: trimmedCode,
          new_password: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Password successfully reset.');
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotCode('');
        setForgotNewPassword('');
      } else {
        toast.error(data.error || 'Verification failed.');
      }
    } catch (e: any) {
      toast.error('Connection error: Cannot reach the recovery server.');
    } finally {
      setForgotLoading(false);
    }
  };

  const routeByRole = (role: string) => {
    if (role === 'student') navigation.replace('StudentDashboard');
    else if (role === 'teacher') navigation.replace('TeacherDashboard');
    else if (role === 'parent') navigation.replace('ParentDashboard');
    else navigation.replace('StudentDashboard');
  };

  const handleCloudLogin = async () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!selectedRole) {
      toast.warning('Please select a role (Teacher, Student, or Parent) before signing in.');
      valid = false;
    }
    
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required');
      toast.error('Please enter your email address.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Invalid email format');
      toast.error('Please enter a valid email address.');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      toast.error('Please enter your password.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    const result = await loginToCloud(trimmedEmail, password);
    setLoading(false);

    if (result.success) {
      const user = useAppStore.getState().currentUser;
      if (user) {
        if (user.role !== selectedRole) {
          useAppStore.getState().logoutFromCloud();
          toast.error(`Role Mismatch: This account is registered as a ${user.role}, not a ${selectedRole}.`);
        } else {
           setAppMode('online');
           if (user.role === 'student') {
             setPreferredGrade(selectedGrade);
           }
           toast.success(`Welcome back, ${user.name}! Logged in as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}.`);
           routeByRole(user.role);
        }
      }
    } else {
      let displayMessage = result.message || 'Login Failed';
      // Enhance connection/network error readability
      if (
        displayMessage.toLowerCase().includes('failed to fetch') ||
        displayMessage.toLowerCase().includes('network request failed') ||
        displayMessage.toLowerCase().includes('connection error')
      ) {
        displayMessage = 'Connection error: Unable to reach the server. Please check your internet connection or Server URL.';
      }
      toast.error(displayMessage);
    }
  };

  const handleStartOffline = () => {
    setOfflineNameError('');
    const trimmedOfflineName = offlineName.trim();
    const trimmedOfflineEmail = offlineEmailOrId.trim();
    
    if (!trimmedOfflineName) {
      setOfflineNameError('Please enter a name.');
      toast.error('Name is required to start offline.');
      return;
    }
    
    if (trimmedOfflineName.length < 3) {
      setOfflineNameError('Please enter a name (min 3 chars).');
      toast.warning('Name must be at least 3 characters.');
      return;
    }
    
    const primaryId = trimmedOfflineEmail || trimmedOfflineName;
    setAppMode('offline');
    if (trimmedOfflineEmail) {
      setGuestName(trimmedOfflineName, trimmedOfflineEmail);
    } else {
      setGuestName(trimmedOfflineName);
    }
    setStudentId(primaryId.replace(/\s+/g, '-').toUpperCase() + '-GUEST');
    setPreferredGrade(selectedOfflineGrade);
    toast.success(`Welcome, ${trimmedOfflineName}! Started offline session.`);
    navigation.replace('StudentDashboard');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
        <Animated.View
          style={[
            styles.inner,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Header Row (Network Status Badge) ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%', marginBottom: Spacing.sm }}>
            <View style={styles.networkIndicatorRelative}>
              <View style={[styles.networkDot, { backgroundColor: isOnline ? Colors.success : '#94A3B8' }]} />
              <Text style={[styles.networkText, { color: isOnline ? Colors.success : '#64748B' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* ── Logo (Tapped 5x to toggle developer configurations) ── */}
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={1} style={styles.logoSection}>
            <GuroLogoGraphic />
            <Text style={styles.logoText}>GURO</Text>
            <Text style={styles.logoTagline}>Guided Unified Remote Online</Text>
            <Text style={styles.logoDescription}>
              Your Learning Companion for Math & English
            </Text>
          </TouchableOpacity>

          {/* ── Section A: Sign In ── */}
          <GlassCard padding={Spacing['2xl']} style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
              <Cloud size={20} color="#94A3B8" />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Sign In with Account</Text>
            </View>
            
            <View style={styles.rolesRow}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                const IconComponent = role.icon;
                
                let activeColor: string = Colors.accentPrimary;
                let activeBg: string = 'rgba(17,66,142,0.08)';
                if (role.id === 'teacher') {
                  activeColor = Colors.accentSecondary;
                  activeBg = 'rgba(160,19,34,0.08)';
                } else if (role.id === 'parent') {
                  activeColor = '#F59E0B';
                  activeBg = 'rgba(245,158,11,0.08)';
                }

                return (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => setSelectedRole(role.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.rolePill,
                      isSelected && {
                        backgroundColor: activeBg,
                        borderColor: activeColor,
                      },
                      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }
                    ]}
                  >
                     <IconComponent size={16} color={isSelected ? activeColor : '#94A3B8'} />
                     <Text style={[styles.rolePillText, isSelected && { color: activeColor, fontFamily: Fonts.bodySemiBold }]}>{role.title}</Text>
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

            <View style={styles.passwordFormGroup}>
              <ThemedTextInput
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                secureTextEntry
                error={passwordError}
              />
            </View>

            <TouchableOpacity 
              onPress={() => setShowForgotModal(true)} 
              style={{ alignSelf: 'flex-end', marginTop: -Spacing.xs, marginBottom: Spacing.sm }}
            >
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {showServerUrlConfig && (
              <View style={{ marginTop: Spacing.md }}>
                <ThemedTextInput
                  label="Server URL"
                  placeholder="http://localhost:8000"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {selectedRole === 'student' && (
              <View style={{ marginTop: Spacing.md }}>
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                  Select Grade Level
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {[4, 5, 6].map((grade) => {
                    const isSelected = selectedGrade === grade;
                    return (
                      <TouchableOpacity
                        key={grade}
                        onPress={() => setSelectedGrade(grade)}
                        activeOpacity={0.8}
                        style={[
                          styles.rolePill,
                          isSelected && {
                            backgroundColor: 'rgba(17,66,142,0.08)',
                            borderColor: '#11428E',
                          },
                          { flex: 1, alignItems: 'center', justifyContent: 'center' }
                        ]}
                      >
                        <Text style={[styles.rolePillText, isSelected && { color: '#11428E', fontFamily: Fonts.bodySemiBold }]}>
                          Grade {grade}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <PrimaryButton
              label="Sign in"
              onPress={handleCloudLogin}
              loading={loading}
              style={styles.cloudLoginButton}
            />
          </GlassCard>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Section B: Start Offline ── */}
          <GlassCard padding={Spacing['2xl']} style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md }}>
              <WifiOff size={20} color="#94A3B8" />
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Start Offline</Text>
            </View>
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

            <View style={styles.formGroup}>
               <ThemedTextInput
                  label="School Email or Learner ID (Optional)"
                  placeholder="e.g. juan@school.ph or LRN-123456"
                  value={offlineEmailOrId}
                  onChangeText={setOfflineEmailOrId}
                  keyboardType="email-address"
                  autoCapitalize="none"
               />
            </View>

            <View style={{ marginTop: Spacing.md }}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain, marginBottom: Spacing.xs }}>
                Select Grade Level
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {[4, 5, 6].map((grade) => {
                  const isSelected = selectedOfflineGrade === grade;
                  return (
                    <TouchableOpacity
                      key={grade}
                      onPress={() => setSelectedOfflineGrade(grade)}
                      activeOpacity={0.8}
                      style={[
                        styles.rolePill,
                        isSelected && {
                          backgroundColor: 'rgba(17,66,142,0.08)',
                          borderColor: '#11428E',
                        },
                        { flex: 1, alignItems: 'center', justifyContent: 'center' }
                      ]}
                    >
                      <Text style={[styles.rolePillText, isSelected && { color: '#11428E', fontFamily: Fonts.bodySemiBold }]}>
                        Grade {grade}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <SecondaryButton
              label="Continue Offline →"
              onPress={handleStartOffline}
              style={styles.offlineButton}
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

      <Modal
        visible={showForgotModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowForgotModal(false);
          setForgotStep(1);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <GlassCard padding={Spacing.xl} style={{ width: '100%', maxWidth: 400 }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain, marginBottom: Spacing.xs, textAlign: 'center' }}>
                Reset Password
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.md, textAlign: 'center' }}>
                {forgotStep === 1
                  ? 'Select your role and enter your email address to receive a recovery code.'
                  : 'Enter the 6-digit code sent to your email and choose a new password.'}
              </Text>

              {forgotStep === 1 ? (
                <>
                  {/* Role selector in recovery */}
                  <View style={[styles.rolesRow, { marginBottom: Spacing.md }]}>
                    {ROLES.map((role) => {
                      const isSelected = forgotRole === role.id;
                      const IconComponent = role.icon;
                      let activeColor: string = Colors.accentPrimary;
                      let activeBg: string = 'rgba(17,66,142,0.08)';
                      if (role.id === 'teacher') {
                        activeColor = Colors.accentSecondary;
                        activeBg = 'rgba(160,19,34,0.08)';
                      } else if (role.id === 'parent') {
                        activeColor = '#F59E0B';
                        activeBg = 'rgba(245,158,11,0.08)';
                      }

                      return (
                        <TouchableOpacity
                          key={role.id}
                          onPress={() => setForgotRole(role.id)}
                          activeOpacity={0.8}
                          style={[
                            styles.rolePill,
                            isSelected && {
                              backgroundColor: activeBg,
                              borderColor: activeColor,
                            },
                            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.xs }
                          ]}
                        >
                          <IconComponent size={14} color={isSelected ? activeColor : '#94A3B8'} />
                          <Text style={[styles.rolePillText, { fontSize: FontSizes.xs }, isSelected && { color: activeColor, fontFamily: Fonts.bodySemiBold }]}>
                            {role.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedTextInput
                      label="Email Address"
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>

                  <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
                    <PrimaryButton
                      label="Send Recovery Code"
                      onPress={handleSendCode}
                      loading={forgotLoading}
                    />
                    <SecondaryButton
                      label="Cancel"
                      onPress={() => {
                        setShowForgotModal(false);
                        setForgotStep(1);
                      }}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.formGroup, { opacity: 0.7 }]}>
                    <ThemedTextInput
                      label="Email Address"
                      value={forgotEmail}
                      editable={false}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <ThemedTextInput
                      label="Verification Code (6-digit)"
                      placeholder="e.g. 123456"
                      value={forgotCode}
                      onChangeText={setForgotCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={[styles.passwordFormGroup, { marginBottom: Spacing.lg }]}>
                    <ThemedTextInput
                      label="New Password"
                      placeholder="••••••••"
                      value={forgotNewPassword}
                      onChangeText={setForgotNewPassword}
                      secureTextEntry
                    />
                  </View>

                  <View style={{ gap: Spacing.sm }}>
                    <PrimaryButton
                      label="Reset Password"
                      onPress={handleVerifyCode}
                      loading={forgotLoading}
                    />
                    <SecondaryButton
                      label="← Go Back"
                      onPress={() => setForgotStep(1)}
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

