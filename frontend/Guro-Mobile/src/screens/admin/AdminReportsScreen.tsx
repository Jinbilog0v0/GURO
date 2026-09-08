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
  Award,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  BookOpen,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Target,
  ArrowLeft,
} from 'lucide-react-native';
import { adminService, ReportsData } from '../../services/adminService';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';
import { toast } from '../../components';

export function AdminReportsScreen() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);

  const loadReports = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    const result = await adminService.getReportsSummary();
    if (result.success && result.data) {
      setData(result.data);
    } else {
      toast.error(result.error || 'Failed to load institutional reports.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports(true);
  };

  const handlePurgeCache = async () => {
    setPurgingCache(true);
    const res = await adminService.purgeCache();
    setPurgingCache(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const strugglingTopics = data?.topicMastery?.filter((t) => t.isStruggling) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Overview')}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={Colors.textMain} />
          </TouchableOpacity>
          <View style={styles.iconBox}>
            <Award size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Division Analytics &amp; Reports</Text>
            <Text style={styles.subtitle}>Curriculum mastery and diagnostic intervention alerts</Text>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Computing division analytics…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accentSecondary} />}
        >
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>TOTAL ATTEMPTS</Text>
                <Target size={15} color={Colors.accentPrimary} />
              </View>
              <Text style={styles.summaryValue}>{data?.totalAssessments ?? 0}</Text>
              <Text style={styles.summarySubtitle}>Completed Quizzes</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>MATH AVERAGE</Text>
                <Calculator size={15} color={Colors.accentPrimary} />
              </View>
              <Text style={[styles.summaryValue, { color: Colors.accentPrimary }]}>
                {data?.mathAverage ?? 0}%
              </Text>
              <Text style={styles.summarySubtitle}>Across Grades 4-6</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryLabel}>ENGLISH AVERAGE</Text>
                <BookOpen size={15} color={Colors.success} />
              </View>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                {data?.englishAverage ?? 0}%
              </Text>
              <Text style={styles.summarySubtitle}>Across Grades 4-6</Text>
            </View>
          </View>

          {/* Diagnostic Intervention Alerts */}
          {strugglingTopics.length > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={18} color={Colors.danger} />
                <Text style={styles.alertTitle}>Priority Intervention Alerts</Text>
              </View>
              <Text style={styles.alertSubtitle}>
                {strugglingTopics.length} {strugglingTopics.length === 1 ? 'topic falls' : 'topics fall'} below the 75% mastery benchmark and require teacher intervention:
              </Text>

              <View style={styles.strugglingList}>
                {strugglingTopics.map((t) => (
                  <View key={t.key} style={styles.strugglingItem}>
                    <View style={styles.strugglingLeft}>
                      <Text style={styles.strugglingTopic}>{t.topic}</Text>
                      <Text style={styles.strugglingMeta}>
                        Grade {t.gradeLevel} · {t.subject} · {t.totalAttempts} attempts
                      </Text>
                    </View>
                    <View style={styles.strugglingBadge}>
                      <Text style={styles.strugglingBadgeText}>{t.averageScore}% avg</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Grade Breakdown Cards */}
          {data?.gradeBreakdown && Object.keys(data.gradeBreakdown).length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <BarChart2 size={18} color={Colors.accentPrimary} />
                <Text style={styles.cardTitle}>Grade-Level Performance Breakdown</Text>
              </View>

              <View style={styles.gradeGrid}>
                {Object.entries(data.gradeBreakdown).map(([grade, metrics]) => (
                  <View key={grade} style={styles.gradeCard}>
                    <Text style={styles.gradeLabel}>{grade}</Text>
                    <Text style={styles.gradeScore}>{metrics.averageScore}%</Text>
                    <Text style={styles.gradeMeta}>
                      {metrics.totalAttempts} attempts • {metrics.masteryRate}% mastery
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Topic Mastery Roster */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TrendingUp size={18} color={Colors.accentPrimary} />
              <Text style={styles.cardTitle}>Master Curriculum Topic Roster</Text>
            </View>

            {(!data?.topicMastery || data.topicMastery.length === 0) ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No assessment records available yet.</Text>
              </View>
            ) : (
              <View style={styles.topicList}>
                {data.topicMastery.map((t) => {
                  const isStruggling = t.isStruggling;
                  return (
                    <View key={t.key} style={styles.topicItem}>
                      <View style={styles.topicLeft}>
                        <Text style={styles.topicName}>{t.topic}</Text>
                        <View style={styles.topicSubRow}>
                          {t.subject === 'Mathematics' ? (
                            <Calculator size={11} color={Colors.accentPrimary} />
                          ) : (
                            <BookOpen size={11} color={Colors.success} />
                          )}
                          <Text style={styles.topicSubText}>
                            Grade {t.gradeLevel} · {t.subject} · {t.totalAttempts} tests
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.masteryPill,
                          isStruggling ? styles.masteryPillDanger : styles.masteryPillSuccess,
                        ]}
                      >
                        {isStruggling ? (
                          <AlertTriangle size={11} color={Colors.danger} />
                        ) : (
                          <CheckCircle2 size={11} color={Colors.success} />
                        )}
                        <Text
                          style={[
                            styles.masteryPillText,
                            { color: isStruggling ? Colors.danger : Colors.success },
                          ]}
                        >
                          {t.averageScore}% ({t.masteryRate}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* System Cache Maintenance */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <RefreshCw size={18} color={Colors.accentSecondary} />
              <Text style={styles.cardTitle}>Master Cache Maintenance</Text>
            </View>
            <Text style={styles.purgeDesc}>
              Purging cached item banks forces all devices to reload the latest official DepEd item banks on next sync.
            </Text>
            <TouchableOpacity
              style={[styles.purgeBtn, purgingCache && { opacity: 0.6 }]}
              onPress={handlePurgeCache}
              disabled={purgingCache}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color={Colors.accentSecondary} />
              <Text style={styles.purgeBtnText}>{purgingCache ? 'Purging…' : 'Purge All System Caches'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  backBtn: {
    padding: 6,
    marginRight: 2,
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: '29%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.textMain,
    fontWeight: '800',
    marginTop: 4,
  },
  summarySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: 'rgba(160,19,34,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  alertTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.danger,
    fontWeight: '700',
  },
  alertSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  strugglingList: {
    gap: Spacing.xs,
    marginTop: 4,
  },
  strugglingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
  },
  strugglingLeft: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  strugglingTopic: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '700',
  },
  strugglingMeta: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  strugglingBadge: {
    backgroundColor: 'rgba(160,19,34,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  strugglingBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '800',
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
    gap: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  gradeGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  gradeCard: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  gradeLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  gradeScore: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.accentPrimary,
    fontWeight: '800',
    marginTop: 2,
  },
  gradeMeta: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  topicList: {
    gap: Spacing.xs,
  },
  topicItem: {
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
  topicLeft: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  topicName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMain,
    fontWeight: '700',
  },
  topicSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  topicSubText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textMuted,
  },
  masteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  masteryPillSuccess: {
    backgroundColor: 'rgba(22,163,74,0.1)',
  },
  masteryPillDanger: {
    backgroundColor: 'rgba(160,19,34,0.1)',
  },
  masteryPillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
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
    backgroundColor: 'rgba(160,19,34,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
    borderRadius: Radius.lg,
    paddingVertical: 8,
  },
  purgeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
});
