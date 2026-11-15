/**
 * GURO — AppUpdateModal
 * Global In-App Update Modal displayed when a new EAS Over-The-Air (OTA)
 * bundle is detected. Displays release highlights and triggers zero-downtime hot reloading.
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Sparkles, Download, RefreshCw, X } from 'lucide-react-native';
import { useAppUpdate } from '../../context/AppUpdateContext';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

export function AppUpdateModal() {
  const {
    showUpdateModal,
    setShowUpdateModal,
    isDownloading,
    applyUpdateNow,
    activePatchNotes,
    currentVersion,
  } = useAppUpdate();

  if (!showUpdateModal) return null;

  const versionText = activePatchNotes?.version || currentVersion;

  return (
    <Modal
      visible={showUpdateModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDownloading) setShowUpdateModal(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button for non-downloading state */}
          {!isDownloading && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowUpdateModal(false)}
              accessibilityLabel="Dismiss update modal"
              accessibilityRole="button"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Header Icon */}
          <View style={styles.iconCircle}>
            {isDownloading ? (
              <ActivityIndicator size="large" color={Colors.accentPrimary} />
            ) : (
              <Sparkles size={28} color="#F59E0B" />
            )}
          </View>

          {/* Title & Badge */}
          <View style={styles.titleRow}>
            <Text style={styles.modalTitle}>
              {isDownloading ? 'Updating GURO...' : 'New Update Available!'}
            </Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionBadgeText}>{`v${versionText}`}</Text>
            </View>
          </View>

          <Text style={styles.modalSubtitle}>
            {isDownloading
              ? 'Downloading latest updates. The app will reload automatically.'
              : activePatchNotes?.title || 'A new update is ready for installation.'}
          </Text>

          {/* Highlights Preview */}
          {!isDownloading && activePatchNotes?.highlights && activePatchNotes.highlights.length > 0 && (
            <View style={styles.highlightsBox}>
              <Text style={styles.highlightsHeader}>WHAT'S NEW IN THIS RELEASE:</Text>
              <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={false}>
                {activePatchNotes.highlights.map((item, index) => (
                  <View key={index} style={styles.highlightItem}>
                    <Text style={styles.highlightBullet}>•</Text>
                    <Text style={styles.highlightText}>{item}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionWrap}>
            {isDownloading ? (
              <View style={styles.downloadingStatusBox}>
                <RefreshCw size={16} color={Colors.accentPrimary} />
                <Text style={styles.downloadingStatusText}>
                  Installing update package (0s downtime)...
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.primaryUpdateBtn}
                  onPress={applyUpdateNow}
                  activeOpacity={0.85}
                  accessibilityLabel="Update now and reload application"
                  accessibilityRole="button"
                >
                  <Download size={18} color="#FFFFFF" />
                  <Text style={styles.primaryUpdateBtnText}>UPDATE NOW & RELOAD</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={() => setShowUpdateModal(false)}
                  activeOpacity={0.7}
                  accessibilityLabel="Remind me on next launch"
                  accessibilityRole="button"
                >
                  <Text style={styles.laterBtnText}>Later / Remind Me Next Launch</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AppUpdateModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.bgSidebar,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSubtle,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  versionBadgeText: {
    color: '#FFFFFF',
    fontFamily: Fonts.code,
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  highlightsBox: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  highlightsHeader: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  highlightBullet: {
    color: '#F59E0B',
    fontSize: 14,
    lineHeight: 18,
  },
  highlightText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    lineHeight: 18,
    flex: 1,
  },
  actionWrap: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryUpdateBtn: {
    backgroundColor: Colors.accentPrimary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    minHeight: 48,
  },
  primaryUpdateBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.button,
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
  },
  laterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 44,
  },
  laterBtnText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },
  downloadingStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    minHeight: 48,
  },
  downloadingStatusText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.accentPrimary,
    fontSize: FontSizes.sm,
  },
});
