import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Shield,
  Menu,
  Clock,
  Zap,
  Users,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  X,
  Sliders,
  Layers,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import {
  adminService,
  RateLimitConfig,
  RoleUsage,
} from '../../services/adminService';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { toast } from '../../components';

const ROLE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  teacher: {
    bg: 'rgba(17,66,142,0.1)',
    text: Colors.accentPrimary,
    label: 'Teacher',
  },
  'lesson-builder': {
    bg: 'rgba(124,58,237,0.1)',
    text: '#7C3AED',
    label: 'Lesson Builder',
  },
  developer: {
    bg: 'rgba(160,19,34,0.1)',
    text: Colors.accentSecondary,
    label: 'Developer / Root',
  },
};

function formatWindow(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function AdminRateLimitsScreen({ navigation }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [usage, setUsage] = useState<RoleUsage[]>([]);
  const [editingConfig, setEditingConfig] = useState<RateLimitConfig | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMax, setEditMax] = useState('');
  const [editWindow, setEditWindow] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const [cfgRes, usageRes] = await Promise.all([
      adminService.getRateLimits(),
      adminService.getRateLimitsUsage(),
    ]);

    if (cfgRes.success && cfgRes.configs) {
      setConfigs(cfgRes.configs);
    }
    if (usageRes.success && usageRes.usage) {
      setUsage(usageRes.usage);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEditModal = (cfg: RateLimitConfig) => {
    setEditingConfig(cfg);
    setEditMax(String(cfg.max_requests));
    setEditWindow(String(cfg.window_minutes));
    setEditModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    const max = parseInt(editMax, 10);
    const win = parseInt(editWindow, 10);

    if (isNaN(max) || max < 1) {
      toast.error('Max requests must be at least 1.');
      return;
    }
    if (isNaN(win) || win < 1) {
      toast.error('Window minutes must be at least 1.');
      return;
    }

    setSubmitting(true);
    const res = await adminService.updateRateLimit(editingConfig.role, {
      max_requests: max,
      window_minutes: win,
    });
    setSubmitting(false);

    if (res.success) {
      toast.success(res.message || 'Rate limit updated.');
      setEditModalVisible(false);
      loadData(true);
    } else {
      toast.error(res.error || 'Failed to update rate limit.');
    }
  };

  const handleToggleEnabled = async (cfg: RateLimitConfig) => {
    const updated = !cfg.is_enabled;
    const res = await adminService.updateRateLimit(cfg.role, {
      is_enabled: updated,
    });
    if (res.success) {
      toast.success(`Rate limit for ${cfg.role} ${updated ? 'enabled' : 'disabled'}.`);
      loadData(true);
    } else {
      toast.error(res.error || 'Failed to toggle rate limit.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => setSidebarOpen(true)}
            style={styles.menuBtn}
            activeOpacity={0.7}
            accessibilityLabel="Open navigation menu"
          >
            <Menu size={20} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Shield size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>AI &amp; Rate Limits</Text>
            <Text style={styles.subtitle}>API quotas, rate throttling, and AI governance</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading rate limit policies…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={Colors.accentSecondary}
            />
          }
        >
          {/* Policy Configurations */}
          <Text style={styles.sectionHeader}>ROLE RATE LIMIT POLICIES</Text>

          {configs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Sliders size={28} color={Colors.textDark} />
              <Text style={styles.emptyText}>No explicit rate limits configured.</Text>
            </View>
          ) : (
            configs.map((cfg) => {
              const meta = ROLE_COLORS[cfg.role] || {
                bg: 'rgba(91,97,112,0.1)',
                text: Colors.textMuted,
                label: cfg.role,
              };

              return (
                <View key={cfg.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={[styles.roleBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.roleBadgeText, { color: meta.text }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.roleSubtext}>
                        {cfg.is_enabled ? 'Active policy' : 'Policy disabled'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.statusToggle,
                        cfg.is_enabled ? styles.statusToggleOn : styles.statusToggleOff,
                      ]}
                      onPress={() => handleToggleEnabled(cfg)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.statusToggleText,
                          { color: cfg.is_enabled ? Colors.success : Colors.textMuted },
                        ]}
                      >
                        {cfg.is_enabled ? 'ENABLED' : 'PAUSED'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.quotaRow}>
                    <View style={styles.quotaBox}>
                      <Zap size={14} color={Colors.accentPrimary} />
                      <Text style={styles.quotaValue}>{cfg.max_requests}</Text>
                      <Text style={styles.quotaLabel}>Req / window</Text>
                    </View>
                    <View style={styles.quotaBox}>
                      <Clock size={14} color={Colors.accentSecondary} />
                      <Text style={styles.quotaValue}>{formatWindow(cfg.window_minutes)}</Text>
                      <Text style={styles.quotaLabel}>Window</Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(cfg)}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={13} color={Colors.accentPrimary} />
                      <Text style={styles.editBtnText}>Configure Limits</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Live Usage Telemetry */}
          <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
            LIVE CONSUMER USAGE
          </Text>

          {usage.length === 0 ? (
            <View style={styles.emptyCard}>
              <Users size={28} color={Colors.textDark} />
              <Text style={styles.emptyText}>No active consumption in current window.</Text>
            </View>
          ) : (
            usage.map((u) => (
              <View key={u.role} style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <Text style={styles.usageRoleTitle}>{u.role.toUpperCase()}</Text>
                  <Text style={styles.usageLimitSub}>
                    Max: {u.max_requests} req / {formatWindow(u.window_minutes)}
                  </Text>
                </View>

                {u.users.length === 0 ? (
                  <Text style={styles.noConsumersText}>No active consumers</Text>
                ) : (
                  u.users.map((user) => (
                    <View key={user.user_id} style={styles.userUsageRow}>
                      <View style={styles.userUsageInfo}>
                        <Text style={styles.userUsageName}>{user.name}</Text>
                        <Text style={styles.userUsageEmail}>{user.email}</Text>
                      </View>

                      <View style={styles.userUsageStat}>
                        <Text
                          style={[
                            styles.userUsageCount,
                            user.over_limit && { color: Colors.danger },
                          ]}
                        >
                          {user.count} / {u.max_requests}
                        </Text>
                        {user.over_limit && (
                          <View style={styles.overLimitBadge}>
                            <AlertTriangle size={10} color={Colors.danger} />
                            <Text style={styles.overLimitText}>OVER LIMIT</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Edit Limits Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalIconBox}>
                  <Sliders size={18} color={Colors.accentPrimary} />
                </View>
                <View style={styles.modalTitleTextContainer}>
                  <Text style={styles.modalTitle}>Configure Limits</Text>
                  <Text style={styles.modalSubtitle} numberOfLines={1}>
                    {editingConfig?.role}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={18} color={Colors.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Max Requests:</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editMax}
                onChangeText={setEditMax}
                placeholder="e.g. 10"
                placeholderTextColor={Colors.textDark}
              />

              <Text style={styles.modalLabel}>Window Minutes:</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={editWindow}
                onChangeText={setEditWindow}
                placeholder="e.g. 60"
                placeholderTextColor={Colors.textDark}
              />

              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setEditModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.modalDismissText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleSaveConfig}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save Policy</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentRoute="RateLimits"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(160,19,34,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing['4xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  sectionHeader: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.textDark,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    gap: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '700',
  },
  roleSubtext: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusToggleOn: {
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderColor: 'rgba(22,163,74,0.3)',
  },
  statusToggleOff: {
    backgroundColor: 'rgba(91,97,112,0.1)',
    borderColor: Colors.border,
  },
  statusToggleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    fontWeight: '800',
  },
  quotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quotaBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  quotaValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  quotaLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  editBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '600',
  },
  usageCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.xs,
    marginBottom: 4,
  },
  usageRoleTitle: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '700',
  },
  usageLimitSub: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  noConsumersText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    paddingVertical: 4,
  },
  userUsageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  userUsageInfo: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  userUsageName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
  },
  userUsageEmail: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  userUsageStat: {
    alignItems: 'flex-end',
    gap: 2,
  },
  userUsageCount: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '700',
  },
  overLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(160,19,34,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  overLimitText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 8,
    color: Colors.danger,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 9, 19, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(17,66,142,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgInput,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalBody: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  modalLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    height: 40,
  },
  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  modalDismissBtn: {
    backgroundColor: Colors.bgInput,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalDismissText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
  },
  modalSaveBtn: {
    backgroundColor: Colors.accentPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
