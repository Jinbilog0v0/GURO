/**
 * GURO — PatchNotesScreen
 * Dedicated What's New & Updates screen presenting installed build metadata,
 * manual EAS OTA check button, and complete release changelog history.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw, Layers, CheckCircle2, Sparkles } from 'lucide-react-native';
import { useAppUpdate } from '../context/AppUpdateContext';
import { APP_BUILD_NUMBER, getAppVersionMetadata } from '../constants/appVersion';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';

export function PatchNotesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    currentVersion,
    patchHistory,
    isChecking,
    checkForAppUpdate,
    markPatchNotesAsSeen,
  } = useAppUpdate();

  const metadata = getAppVersionMetadata();

  useEffect(() => {
    markPatchNotesAsSeen();
  }, [markPatchNotesAsSeen]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color={Colors.textMain} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>What's New & Updates</Text>
          <Text style={styles.headerSub}>Release Notes & OTA Patches</Text>
        </View>

        {/* Manual Check Button */}
        <TouchableOpacity
          style={[styles.checkUpdateBtn, isChecking && { opacity: 0.6 }]}
          onPress={() => checkForAppUpdate(true)}
          disabled={isChecking}
          activeOpacity={0.8}
          accessibilityLabel="Check for updates"
          accessibilityRole="button"
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={Colors.accentPrimary} />
          ) : (
            <>
              <RefreshCw size={14} color={Colors.accentPrimary} />
              <Text style={styles.checkUpdateBtnText}>Check</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Active Build Card */}
        <View style={styles.currentBuildCard}>
          <View style={styles.buildInfoRow}>
            <View style={styles.buildIconCircle}>
              <Layers size={22} color={Colors.accentPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.buildTagRow}>
                <Text style={styles.buildLabel}>INSTALLED VERSION</Text>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>CURRENT</Text>
                </View>
              </View>
              <Text style={styles.buildVersionText}>
                {`v${currentVersion} (Build ${APP_BUILD_NUMBER})`}
              </Text>
              <Text style={styles.buildChannelText}>
                Channel: {metadata.channel || 'production'} • Runtime: {metadata.runtimeVersion}
              </Text>
            </View>
          </View>
        </View>

        {/* Changelog History */}
        <Text style={styles.sectionTitle}>RELEASE HISTORY & CHANGELOG</Text>
        {patchHistory.map((item) => (
          <View key={item.version} style={styles.patchCard}>
            <View style={styles.cardHeader}>
              <View style={styles.versionBadgeWrap}>
                <Text style={styles.versionNumber}>{`v${item.version}`}</Text>
                {item.badge && (
                  <View
                    style={[
                      styles.statusBadge,
                      item.badgeVariant === 'success' && styles.statusBadgeSuccess,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.badgeVariant === 'success' && styles.statusBadgeTextSuccess,
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>

            <Text style={styles.patchTitle}>{item.title}</Text>

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              {item.highlights.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{h}</Text>
                </View>
              ))}
            </View>

            {/* Fixes */}
            {item.fixes && item.fixes.length > 0 && (
              <View style={styles.fixesContainer}>
                {item.fixes.map((f, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <CheckCircle2 size={13} color="#10B981" style={{ marginTop: 2 }} />
                    <Text style={styles.fixText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default PatchNotesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.bgSidebar,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSubtle,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 56, 168, 0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 56, 168, 0.2)',
    minHeight: 36,
  },
  checkUpdateBtnText: {
    color: Colors.accentPrimary,
    fontFamily: Fonts.button,
    fontSize: FontSizes.xs,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  currentBuildCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buildInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  buildIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 56, 168, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  buildLabel: {
    fontSize: 10,
    fontFamily: Fonts.display,
    color: Colors.accentPrimary,
    letterSpacing: 0.5,
  },
  activeTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  activeTagText: {
    color: '#10B981',
    fontFamily: Fonts.code,
    fontSize: 9,
    fontWeight: '800',
  },
  buildVersionText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.display,
    color: Colors.textMain,
  },
  buildChannelText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.display,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  patchCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  versionBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionNumber: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.display,
    color: Colors.textMain,
  },
  statusBadge: {
    backgroundColor: Colors.bgSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.code,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  statusBadgeTextSuccess: {
    color: '#10B981',
  },
  dateText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
  },
  patchTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bodyBold,
    color: Colors.textMain,
    marginBottom: Spacing.sm,
  },
  highlightsContainer: {
    marginBottom: Spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 5,
  },
  bulletDot: {
    color: Colors.accentPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: Colors.textMain,
    lineHeight: 18,
    flex: 1,
  },
  fixesContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.xs,
    marginTop: 4,
  },
  fixText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    lineHeight: 18,
    flex: 1,
  },
});
