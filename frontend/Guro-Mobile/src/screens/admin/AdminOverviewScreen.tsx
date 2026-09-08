import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Shield,
  Users,
  School,
  Activity,
  Sparkles,
  RefreshCw,
  Server,
  Database,
  BookOpen,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { adminService, OverviewMetrics, SystemHealth, RecentSync } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

export function AdminOverviewScreen() {
  const navigation = useNavigation<any>();
  const currentUser = useAppStore((state) => state.currentUser);
  const logoutFromCloud = useAppStore((state) => state.logoutFromCloud);

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [recentSyncs, setRecentSyncs] = useState<RecentSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const result = await adminService.getOverview();
    if (result.success && result.data) {
      setMetrics(result.data.metrics);
      setHealth(result.data.health);
      setRecentSyncs(result.data.recentSyncs || []);
    } else {
      toast.error(result.error || 'Failed to load system metrics.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    const res = await adminService.purgeCache();
    setPurgingCache(false);
    if (res.success) {
      toast.success(res.message);
      loadData(true);
    } else {
      toast.error(res.message);
    }
  };

  const handleLogout = () => {
    logoutFromCloud();
    navigation.replace('Login');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading Admin Console…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accentSecondary} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <View style={styles.shieldIconContainer}>
                <Shield size={22} color={Colors.accentSecondary} />
              </View>
              <View>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.title}>Admin Console</Text>
                  <View style={styles.rootBadge}>
                    <Text style={styles.rootBadgeText}>ROOT</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>ADMIN · Division Governance Office</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
            <LogOut size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Pending Teacher Verifications Banner */}
        {(metrics?.pendingVerifications ?? 0) > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => navigation.navigate('Verifications')}
            activeOpacity={0.8}
          >
            <View style={styles.alertLeft}>
              <View style={styles.alertCountBox}>
                <Text style={styles.alertCountText}>{metrics?.pendingVerifications}</Text>
              </View>
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>Teacher Verifications Awaiting Review</Text>
                <Text style={styles.alertSubtitle}>
                  {metrics?.pendingVerifications} institutional {metrics?.pendingVerifications === 1 ? 'credential needs' : 'credentials need'} review.
                </Text>
              </View>
            </View>
            <View style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review</Text>
              <ChevronRight size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* Total Accounts */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('Users')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL ACCOUNTS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(17,66,142,0.1)' }]}>
                <Users size={16} color={Colors.accentPrimary} />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics?.totalUsers ?? 0}</Text>
            <Text style={styles.kpiBreakdown}>
              T: {metrics?.rolesBreakdown?.teacher || 0} • P: {metrics?.rolesBreakdown?.parent || 0} • S: {metrics?.rolesBreakdown?.student || 0}
            </Text>
          </TouchableOpacity>

          {/* School Classrooms */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => navigation.navigate('Classrooms')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>CLASSROOM SECTIONS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(22,163,74,0.1)' }]}>
                <School size={16} color={Colors.success} />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics?.totalClassrooms ?? 0}</Text>
            <Text style={[styles.kpiBreakdown, { color: Colors.success }]}>
              {metrics?.activeClassrooms ?? 0} Active Sections
            </Text>
          </TouchableOpacity>

          {/* Telemetry Syncs */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>PROGRESS SYNCS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(147,51,234,0.1)' }]}>
                <Activity size={16} color="#9333EA" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics?.totalProgressLogs ?? 0}</Text>
            <Text style={styles.kpiBreakdown}>Offline &amp; Cloud Batched Events</Text>
          </View>

          {/* AI Generations */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>AI GENERATIONS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(232,137,12,0.1)' }]}>
                <Sparkles size={16} color={Colors.warning} />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics?.totalAiLogs ?? 0}</Text>
            <Text style={styles.kpiBreakdown}>Gemini API Ingestions</Text>
          </View>
        </View>

        {/* Infrastructure Health Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Server size={18} color={Colors.accentPrimary} />
              <Text style={styles.cardTitle}>Infrastructure Health</Text>
            </View>
            <Text style={styles.serverTime}>
              {health?.serverTime ? new Date(health.serverTime).toLocaleTimeString() : ''}
            </Text>
          </View>

          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <View style={styles.healthItemLeft}>
                <Database size={15} color={Colors.accentPrimary} />
                <Text style={styles.healthItemLabel}>Database</Text>
              </View>
              <View style={styles.healthStatusPill}>
                <CheckCircle2 size={11} color={Colors.success} />
                <Text style={styles.healthStatusText}>{health?.database || 'Healthy'}</Text>
              </View>
            </View>

            <View style={styles.healthItem}>
              <View style={styles.healthItemLeft}>
                <Server size={15} color="#9333EA" />
                <Text style={styles.healthItemLabel}>Item Bank Cache</Text>
              </View>
              <View style={[styles.healthStatusPill, { backgroundColor: 'rgba(17,66,142,0.1)' }]}>
                <Text style={[styles.healthStatusText, { color: Colors.accentPrimary }]}>{health?.cache || 'Ready'}</Text>
              </View>
            </View>

            <View style={styles.healthItem}>
              <View style={styles.healthItemLeft}>
                <Sparkles size={15} color={Colors.warning} />
                <Text style={styles.healthItemLabel}>Gemini AI Service</Text>
              </View>
              <View style={styles.healthStatusPill}>
                <Text style={styles.healthStatusText}>{health?.aiEngine || 'Configured'}</Text>
              </View>
            </View>

            <View style={styles.healthItem}>
              <View style={styles.healthItemLeft}>
                <BookOpen size={15} color={Colors.success} />
                <Text style={styles.healthItemLabel}>Offline Asset Bank</Text>
              </View>
              <View style={styles.healthStatusPill}>
                <Text style={styles.healthStatusText}>{health?.itemBankStorage || 'Online'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.purgeContainer}>
            <Text style={styles.purgeDesc}>Purge system and cached item banks to enforce immediate update:</Text>
            <TouchableOpacity
              style={[styles.purgeBtn, purgingCache && { opacity: 0.6 }]}
              onPress={handlePurgeCache}
              disabled={purgingCache}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={Colors.accentPrimary} />
              <Text style={styles.purgeBtnText}>{purgingCache ? 'Purging…' : 'Purge All Caches'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Telemetry Stream Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Activity size={18} color={Colors.success} />
              <Text style={styles.cardTitle}>Live Telemetry Ingestion</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          </View>

          {recentSyncs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent progress events received yet.</Text>
            </View>
          ) : (
            <View style={styles.syncList}>
              {recentSyncs.slice(0, 6).map((log, idx) => {
                const percentage = Math.round((log.score / Math.max(1, log.total_questions)) * 100);
                const isPerfect = percentage >= 80;
                return (
                  <View key={log.id || idx} style={styles.syncItem}>
                    <View style={styles.syncLeft}>
                      <Text style={styles.syncStudentId}>{log.student_id}</Text>
                      <View style={styles.syncTopicRow}>
                        {log.subject === 'Mathematics' ? (
                          <Calculator size={11} color={Colors.accentPrimary} />
                        ) : (
                          <BookOpen size={11} color={Colors.success} />
                        )}
                        <Text style={styles.syncTopicText}>
                          {log.topic} (G{log.grade_level})
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.syncScore, { color: isPerfect ? Colors.success : Colors.warning }]}>
                      {log.score}/{log.total_questions} ({percentage}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shieldIconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(160,19,34,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.lg,
    color: Colors.textMain,
    fontWeight: '700',
  },
  rootBadge: {
    backgroundColor: 'rgba(160,19,34,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
  },
  rootBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.accentSecondary,
    marginTop: 1,
    fontWeight: '600',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    backgroundColor: 'rgba(232,137,12,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,137,12,0.35)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    marginRight: Spacing.xs,
  },
  alertCountBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCountText: {
    color: '#FFFFFF',
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '700',
  },
  alertSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  reviewBtn: {
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.textMain,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  kpiBreakdown: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  serverTime: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  healthGrid: {
    gap: Spacing.xs,
    marginTop: 4,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgMain,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  healthItemLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
  },
  healthStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22,163,74,0.1)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  healthStatusText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700',
  },
  purgeContainer: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  purgeDesc: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 8,
  },
  purgeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.accentPrimary,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: 'rgba(22,163,74,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  liveBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.success,
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  syncList: {
    gap: Spacing.xs,
  },
  syncItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgMain,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  syncLeft: {
    gap: 2,
  },
  syncStudentId: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '700',
  },
  syncTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncTopicText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  syncScore: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
});
