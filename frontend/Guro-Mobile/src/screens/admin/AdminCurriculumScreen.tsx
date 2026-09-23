import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Layers,
  Menu,
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Trash2,
  HelpCircle,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import { adminService } from '../../services/adminService';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { toast } from '../../components';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function AdminCurriculumScreen({ navigation }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purging, setPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [itemBankData, setItemBankData] = useState<any>({});
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedGrade, setSelectedGrade] = useState<string>('4');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({ subjects: 0, topics: 0, questions: 0 });

  const loadCurriculum = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await adminService.getItemBank();
    if (res.success && res.data) {
      const db = res.data;
      setItemBankData(db);

      const subjects = Object.keys(db);
      if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
        setSelectedSubject(subjects[0]);
      }

      let totalTopics = 0;
      let totalQuestions = 0;

      subjects.forEach((sub) => {
        if (db[sub]) {
          Object.keys(db[sub]).forEach((gradeKey) => {
            if (db[sub][gradeKey]) {
              Object.keys(db[sub][gradeKey]).forEach((topicKey) => {
                totalTopics++;
                const topicNode = db[sub][gradeKey][topicKey];
                if (topicNode && typeof topicNode === 'object') {
                  Object.keys(topicNode).forEach((diff) => {
                    if (diff === 'studyContent') return;
                    const diffNode = topicNode[diff];
                    if (diffNode && typeof diffNode === 'object') {
                      Object.keys(diffNode).forEach((cat) => {
                        const qList = diffNode[cat];
                        if (Array.isArray(qList)) {
                          totalQuestions += qList.length;
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      setStats({
        subjects: subjects.length,
        topics: totalTopics,
        questions: totalQuestions,
      });
    } else {
      toast.error(res.error || 'Failed to load master item bank.');
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadCurriculum();
  }, []);

  const handlePurgeCache = () => {
    setShowPurgeConfirm(true);
  };

  const executePurgeCache = async () => {
    setPurging(true);
    const res = await adminService.purgeCache();
    setPurging(false);
    setShowPurgeConfirm(false);
    if (res.success) {
      toast.success(res.message);
      loadCurriculum(true);
    } else {
      toast.error(res.message || 'Cache purge failed.');
    }
  };

  const toggleTopic = (topicKey: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
  };

  // Get current grade topics
  const currentGradeData = itemBankData[selectedSubject]?.[selectedGrade] || {};
  const currentTopics = Object.keys(currentGradeData);

  const getTopicQuestionsList = (topicNode: any) => {
    const list: any[] = [];
    if (!topicNode || typeof topicNode !== 'object') return list;

    Object.keys(topicNode).forEach((diff) => {
      if (diff === 'studyContent') return;
      const diffNode = topicNode[diff];
      if (diffNode && typeof diffNode === 'object') {
        Object.keys(diffNode).forEach((cat) => {
          const qList = diffNode[cat];
          if (Array.isArray(qList)) {
            qList.forEach((q: any) => {
              list.push({
                ...q,
                difficulty: diff,
                category: cat,
              });
            });
          }
        });
      }
    });

    return list;
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
            <Layers size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Master Curriculum</Text>
            <Text style={styles.subtitle}>Curriculum hierarchy &amp; item bank questions</Text>
          </View>
        </View>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statPill}>
          <Text style={styles.statPillValue}>{stats.subjects}</Text>
          <Text style={styles.statPillLabel}>Subjects</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statPillValue}>{stats.topics}</Text>
          <Text style={styles.statPillLabel}>Topics</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statPillValue}>{stats.questions}</Text>
          <Text style={styles.statPillLabel}>Questions</Text>
        </View>
        <TouchableOpacity
          style={styles.purgeBtn}
          onPress={handlePurgeCache}
          disabled={purging}
          activeOpacity={0.7}
        >
          {purging ? (
            <ActivityIndicator size="small" color={Colors.danger} />
          ) : (
            <>
              <Trash2 size={13} color={Colors.danger} />
              <Text style={styles.purgeBtnText}>Purge</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Subject Filter Pills */}
      <View style={styles.subjectRow}>
        {['Mathematics', 'English'].map((sub) => {
          const isActive = selectedSubject === sub;
          return (
            <TouchableOpacity
              key={sub}
              style={[styles.subjectBtn, isActive && styles.subjectBtnActive]}
              onPress={() => setSelectedSubject(sub)}
              activeOpacity={0.7}
            >
              {sub === 'Mathematics' ? (
                <Calculator size={14} color={isActive ? '#FFFFFF' : Colors.accentPrimary} />
              ) : (
                <BookOpen size={14} color={isActive ? '#FFFFFF' : Colors.success} />
              )}
              <Text style={[styles.subjectBtnText, isActive && styles.subjectBtnTextActive]}>
                {sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grade Selector Tabs */}
      <View style={styles.gradeTabsRow}>
        {['4', '5', '6'].map((grade) => {
          const isActive = selectedGrade === grade;
          const count = Object.keys(itemBankData[selectedSubject]?.[grade] || {}).length;
          return (
            <TouchableOpacity
              key={grade}
              style={[styles.gradeTab, isActive && styles.gradeTabActive]}
              onPress={() => setSelectedGrade(grade)}
              activeOpacity={0.7}
            >
              <Text style={[styles.gradeTabText, isActive && styles.gradeTabTextActive]}>
                Grade {grade}
              </Text>
              <View style={[styles.gradeBadge, isActive && styles.gradeBadgeActive]}>
                <Text style={[styles.gradeBadgeText, isActive && styles.gradeBadgeTextActive]}>
                  {count} topics
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accentSecondary} />
          <Text style={styles.loadingText}>Loading curriculum assets…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCurriculum(true)}
              tintColor={Colors.accentSecondary}
            />
          }
        >
          {currentTopics.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FolderOpen size={36} color={Colors.textDark} />
              <Text style={styles.emptyTitle}>No Topics in Grade {selectedGrade}</Text>
              <Text style={styles.emptyText}>
                No curriculum modules are currently loaded for {selectedSubject} Grade {selectedGrade}.
              </Text>
            </View>
          ) : (
            currentTopics.map((topicKey) => {
              const topicNode = currentGradeData[topicKey];
              const questions = getTopicQuestionsList(topicNode);
              const isExpanded = expandedTopics[topicKey] ?? false;

              return (
                <View key={topicKey} style={styles.topicCard}>
                  <TouchableOpacity
                    style={styles.topicHeader}
                    onPress={() => toggleTopic(topicKey)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.topicHeaderLeft}>
                      <Text style={styles.topicTitle}>{topicKey}</Text>
                      <View style={styles.topicMetaRow}>
                        <View style={styles.qCountBadge}>
                          <HelpCircle size={11} color={Colors.accentPrimary} />
                          <Text style={styles.qCountText}>{questions.length} Items</Text>
                        </View>
                        {topicNode?.studyContent && (
                          <View style={styles.studyBadge}>
                            <BookOpen size={11} color={Colors.success} />
                            <Text style={styles.studyBadgeText}>Study Content</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.expandIconBox}>
                      {isExpanded ? (
                        <ChevronUp size={16} color={Colors.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={Colors.textMuted} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Questions */}
                  {isExpanded && (
                    <View style={styles.topicQuestionsContainer}>
                      {questions.length === 0 ? (
                        <Text style={styles.noQuestionsText}>
                          No individual assessment items loaded.
                        </Text>
                      ) : (
                        questions.map((q, idx) => (
                          <View key={q.id || idx} style={styles.questionItem}>
                            <View style={styles.questionItemHeader}>
                              <Text style={styles.questionNumber}>#{idx + 1}</Text>
                              <View style={styles.difficultyBadge}>
                                <Text style={styles.difficultyText}>{q.difficulty}</Text>
                              </View>
                            </View>

                            <Text style={styles.questionPrompt}>{q.questionText}</Text>

                            {q.options && q.options.length > 0 && (
                              <View style={styles.optionsList}>
                                {q.options.map((opt: string, optIdx: number) => {
                                  const isCorrect = opt === q.correctAnswer;
                                  return (
                                    <View
                                      key={optIdx}
                                      style={[
                                        styles.optionRow,
                                        isCorrect && styles.optionRowCorrect,
                                      ]}
                                    >
                                      {isCorrect && (
                                        <CheckCircle2 size={12} color={Colors.success} />
                                      )}
                                      <Text
                                        style={[
                                          styles.optionText,
                                          isCorrect && styles.optionTextCorrect,
                                        ]}
                                      >
                                        {opt}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            )}

                            {q.feedback && (
                              <View style={styles.feedbackBox}>
                                <Text style={styles.feedbackTitle}>Feedback:</Text>
                                <Text style={styles.feedbackText}>
                                  {typeof q.feedback === 'object'
                                    ? q.feedback.en || q.feedback.fil
                                    : q.feedback}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Purge Cache Confirmation Modal */}
      <ConfirmDialog
        visible={showPurgeConfirm}
        variant="danger"
        title="Purge Server Cache"
        description="Purge all in-memory item bank caches on the server and reload fresh curriculum data?"
        confirmLabel="Purge Cache"
        cancelLabel="Cancel"
        loading={purging}
        onConfirm={executePurgeCache}
        onCancel={() => setShowPurgeConfirm(false)}
      />

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentRoute="Curriculum"
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
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  statPill: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statPillValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  statPillLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(160,19,34,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160,19,34,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  purgeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginVertical: Spacing.xs,
  },
  subjectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  subjectBtnActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  subjectBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    fontWeight: '600',
  },
  subjectBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gradeTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  gradeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 8,
    gap: 4,
  },
  gradeTabActive: {
    backgroundColor: 'rgba(160,19,34,0.1)',
    borderColor: 'rgba(160,19,34,0.3)',
  },
  gradeTabText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.textMuted,
  },
  gradeTabTextActive: {
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  gradeBadge: {
    backgroundColor: Colors.bgMain,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gradeBadgeActive: {
    backgroundColor: 'rgba(160,19,34,0.15)',
    borderColor: 'rgba(160,19,34,0.3)',
  },
  gradeBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.textDark,
  },
  gradeBadgeTextActive: {
    color: Colors.accentSecondary,
    fontWeight: '800',
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
  emptyContainer: {
    paddingVertical: Spacing['3xl'],
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.md,
    color: Colors.textMain,
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  topicCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  topicHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  topicTitle: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.sm,
    color: Colors.textMain,
    fontWeight: '700',
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  qCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(17,66,142,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  qCountText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.accentPrimary,
  },
  studyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(22,163,74,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  studyBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.success,
  },
  expandIconBox: {
    padding: 4,
  },
  topicQuestionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgMain,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  noQuestionsText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: Spacing.sm,
  },
  questionItem: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: 4,
  },
  questionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionNumber: {
    fontFamily: Fonts.display,
    fontSize: 11,
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  difficultyBadge: {
    backgroundColor: 'rgba(91,97,112,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  difficultyText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.textMuted,
  },
  questionPrompt: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    marginTop: 2,
  },
  optionsList: {
    gap: 3,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgMain,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionRowCorrect: {
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderColor: 'rgba(22,163,74,0.3)',
  },
  optionText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  optionTextCorrect: {
    color: Colors.success,
    fontFamily: Fonts.bodySemiBold,
    fontWeight: '700',
  },
  feedbackBox: {
    backgroundColor: 'rgba(17,66,142,0.05)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.accentPrimary,
    padding: 6,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  feedbackTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    color: Colors.accentPrimary,
    fontWeight: '700',
  },
  feedbackText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textDark,
  },
});
