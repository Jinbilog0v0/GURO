import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { StatCard } from '../components/ui/StatCard';
import { PrimaryButton } from '../components/ui/Buttons';
import { toast } from '../components';
import { FileService } from '../services/fileService';
import { styles } from '../styles/StudentProgressReport.styles';
import {
  Trophy,
  Calculator,
  BookOpen,
  Download,
  CheckCircle2,
  XCircle,
  Award,
  Lock,
  ClipboardList,
  Target,
  Cloud,
  Clock,
} from 'lucide-react-native';

export function StudentProgressReportScreen() {
  const navigation = useNavigation<any>();
  const [isSaving, setIsSaving] = useState(false);

  // Zustand Store Selectors
  const studentProgress = useAppStore((s) => s.studentProgress || []);
  const guestName = useAppStore((s) => s.guestName || '');
  const currentUser = useAppStore((s) => s.currentUser);
  const preferredGrade = useAppStore((s) => s.preferredGrade || 4);
  const xpPoints = useAppStore((s) => s.xpPoints || 0);
  const studentId = useAppStore((s) => s.studentId || 'GUEST');
  const itemBank = useAppStore((s) => s.itemBank);
  const activeSchoolYear = useAppStore((s) => s.activeSchoolYear || '2026-2027');
  const activeTerm = useAppStore((s) => s.activeTerm || 'Quarter 1');

  // Compute profile data
  const displayName = currentUser ? currentUser.name : guestName || 'Student';
  const displayGrade = preferredGrade;
  const currentLevel = Math.floor(xpPoints / 100) + 1;
  const isEligibleForPromotion = avgAccuracy >= 75;
  const nextGradeLevel = preferredGrade < 6 ? preferredGrade + 1 : 6;

  // Diagnostic Pre-Test vs Summative Post-Test Growth comparisons
  const growthComparisons = useMemo(() => {
    const list: { topic: string; subject: string; preScore: number; postScore: number; gain: number; normalizedGain: number }[] = [];
    const grouped: Record<string, { pre?: number; post?: number }> = {};

    studentProgress.forEach((p) => {
      const key = `${p.subject}::${p.topic}`;
      if (!grouped[key]) grouped[key] = {};
      const pct = p.totalQuestions > 0 ? Math.round((p.score / p.totalQuestions) * 100) : 0;
      if (p.assessmentType === 'pre-test') {
        if (grouped[key].pre === undefined) grouped[key].pre = pct;
      } else if (p.assessmentType === 'post-test' || !p.assessmentType) {
        if (grouped[key].post === undefined || pct > (grouped[key].post || 0)) {
          grouped[key].post = pct;
        }
      }
    });

    Object.keys(grouped).forEach((key) => {
      const [subject, topic] = key.split('::');
      const item = grouped[key];
      if (item.pre !== undefined && item.post !== undefined) {
        const gain = item.post - item.pre;
        const normalizedGain = item.pre < 100 ? Math.round(((item.post - item.pre) / (100 - item.pre)) * 100) : gain;
        list.push({ topic, subject, preScore: item.pre, postScore: item.post, gain, normalizedGain });
      }
    });

    return list;
  }, [studentProgress]);

  // Compute summary stats
  const totalSessions = studentProgress.length;
  const totalScore = studentProgress.reduce((sum, item) => sum + item.score, 0);
  const totalQuestions = studentProgress.reduce((sum, item) => sum + item.totalQuestions, 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
  const syncedCount = studentProgress.filter((p) => p.synced).length;
  const unsyncedCount = studentProgress.filter((p) => !p.synced).length;

  // Get list of all topics in curriculum (itemBank) and/or progress logs
  const gradeStr = String(preferredGrade);
  const subjectsList = ['Mathematics', 'English'] as const;

  const topicsBySubject = useMemo(() => {
    const map: Record<string, string[]> = { Mathematics: [], English: [] };
    
    // 1. Gather from curriculum for current preferred grade
    if (itemBank) {
      subjectsList.forEach((sub) => {
        const gradeData = itemBank[sub]?.[gradeStr];
        if (gradeData) {
          Object.keys(gradeData).forEach((topic) => {
            if (topic !== 'studyContent' && !map[sub].includes(topic)) {
              map[sub].push(topic);
            }
          });
        }
      });
    }

    // 2. Gather from actual attempts (e.g. if they attempted other grades' topics)
    studentProgress.forEach((p) => {
      const sub = p.subject;
      const topic = p.topic;
      if (map[sub] && !map[sub].includes(topic)) {
        map[sub].push(topic);
      }
    });

    return map;
  }, [itemBank, studentProgress, gradeStr]);

  // Compute topic metrics (count, total score, total questions, average accuracy)
  const topicStats = useMemo(() => {
    const stats: Record<string, { totalScore: number; totalQuestions: number; count: number; bestScore: number }> = {};
    
    studentProgress.forEach((p) => {
      const key = `${p.subject}::${p.topic}`;
      if (!stats[key]) {
        stats[key] = { totalScore: 0, totalQuestions: 0, count: 0, bestScore: 0 };
      }
      stats[key].totalScore += p.score;
      stats[key].totalQuestions += p.totalQuestions;
      stats[key].count += 1;
      const accuracy = p.totalQuestions > 0 ? Math.round((p.score / p.totalQuestions) * 100) : 0;
      if (accuracy > stats[key].bestScore) {
        stats[key].bestScore = accuracy;
      }
    });
    
    return stats;
  }, [studentProgress]);

  // Check average score for a topic
  const getTopicMetrics = (subject: string, topic: string) => {
    const key = `${subject}::${topic}`;
    const stat = topicStats[key];
    if (!stat || stat.totalQuestions === 0) {
      return { count: 0, average: null };
    }
    return {
      count: stat.count,
      average: Math.round((stat.totalScore / stat.totalQuestions) * 100),
    };
  };

  // Build badge lists: unlocked if average score >= 80%, else locked
  const badgeList = useMemo(() => {
    const badges: { topic: string; subject: string; unlocked: boolean; desc: string; icon: React.ComponentType<any>; color: string }[] = [];
    
    subjectsList.forEach((sub) => {
      topicsBySubject[sub].forEach((topic) => {
        const { average } = getTopicMetrics(sub, topic);
        const unlocked = average !== null && average >= 80;
        const icon = sub === 'Mathematics' ? Calculator : BookOpen;
        const color = sub === 'Mathematics' ? '#F59E0B' : '#8B5CF6';
        badges.push({
          topic,
          subject: sub,
          unlocked,
          desc: `${sub} G${preferredGrade}`,
          icon,
          color,
        });
      });
    });

    return badges;
  }, [topicsBySubject, topicStats, preferredGrade]);

  // Handle Save to Device
  const handleSaveReport = async () => {
    setIsSaving(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      
      // Build plain text report
      let txt = `GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Student Progress Report\n`;
      txt += `==============================\n`;
      txt += `Generated : ${dateStr}\n`;
      txt += `Student   : ${displayName}\n`;
      txt += `Grade     : ${displayGrade}\n`;
      txt += `Level     : ${currentLevel}  (XP: ${xpPoints})\n`;
      txt += `Student ID: ${studentId}\n\n`;

      txt += `SUMMARY\n`;
      txt += `-------\n`;
      txt += `Total Sessions  : ${totalSessions}\n`;
      txt += `Average Accuracy: ${avgAccuracy}%\n`;
      txt += `Synced Records  : ${syncedCount}\n`;
      txt += `Unsynced Records: ${unsyncedCount}\n\n`;

      txt += `SUBJECT BREAKDOWN\n`;
      txt += `-----------------\n`;
      
      subjectsList.forEach((sub) => {
        txt += `${sub}\n`;
        const topics = topicsBySubject[sub];
        if (topics.length === 0) {
          txt += `  • No topic data available\n`;
        } else {
          topics.forEach((topic) => {
            const { count, average } = getTopicMetrics(sub, topic);
            if (count === 0 || average === null) {
              txt += `  • ${topic} — Not attempted yet [Locked]\n`;
            } else {
              const passIcon = average >= 80 ? '[Mastered]' : '[Keep Practicing]';
              txt += `  • ${topic} — ${count} session(s) | avg ${average}% ${passIcon}\n`;
            }
          });
        }
        txt += `\n`;
      });

      txt += `BADGES STATUS\n`;
      txt += `-------------\n`;
      const unlockedBadges = badgeList.filter((b) => b.unlocked);
      const lockedBadges = badgeList.filter((b) => !b.unlocked);

      txt += `Unlocked:\n`;
      if (unlockedBadges.length === 0) {
        txt += `  None\n`;
      } else {
        unlockedBadges.forEach((b) => {
          txt += `  [Unlocked] ${b.topic} (${b.subject})\n`;
        });
      }

      txt += `\nLocked:\n`;
      if (lockedBadges.length === 0) {
        txt += `  None\n`;
      } else {
        lockedBadges.forEach((b) => {
          txt += `  [Locked] ${b.topic} (${b.subject})\n`;
        });
      }

      txt += `\n==============================\n`;
      txt += `Saved by GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION Mobile App\n`;

      // Save file
      const safeName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeName}_Progress_Report_${dateStr}.txt`;
      const uri = await FileService.saveFile(filename, txt);
      
      toast.success(`Progress report saved to device:\n${filename}`);
    } catch (e: any) {
      toast.error(`Failed to save report: ${e.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Section */}
        <GlassCard padding={Spacing.lg} style={styles.profileCard}>
          <Text style={styles.studentName}>{displayName}</Text>
          <Text style={styles.studentMeta}>
            Grade {displayGrade} · Level {currentLevel} ({xpPoints} XP)
          </Text>
          <Text style={styles.studentId}>ID: {studentId}</Text>

          {/* DepEd Academic Year & Promotional Status Banner */}
          <View
            style={{
              marginTop: Spacing.sm,
              paddingTop: Spacing.sm,
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <View>
              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                SY {activeSchoolYear} · {activeTerm}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: isEligibleForPromotion ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: isEligibleForPromotion ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.bodyBold,
                  fontSize: 10,
                  color: isEligibleForPromotion ? Colors.success : Colors.warning,
                }}
              >
                {isEligibleForPromotion ? `Eligible for Grade ${nextGradeLevel} Promotion 🎓` : 'Ongoing Quarterly Progress ⏳'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Summary Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard label="Total Sessions" value={totalSessions} icon={ClipboardList} />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              label="Avg Accuracy" 
              value={`${avgAccuracy}%`} 
              icon={Target}
              valueColor={avgAccuracy >= 80 ? Colors.success : avgAccuracy >= 60 ? Colors.warning : Colors.danger}
            />
          </View>
          <View style={styles.statCardWrapper}>
            {/* Child-friendly labels */}
            <StatCard label="Shared with Teacher" value={syncedCount} icon={Cloud} valueColor={Colors.success} />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              label="Waiting to Share"
              value={unsyncedCount}
              icon={Clock}
              valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textMuted}
            />
          </View>
        </View>

        {/* Diagnostic Pre-Test vs Post-Test Growth Section */}
        {growthComparisons.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
                Pre-Test vs Post-Test Growth 📈
              </Text>
            </View>

            <GlassCard padding={Spacing.md} style={{ gap: Spacing.sm }}>
              {growthComparisons.map((item) => (
                <View
                  key={`${item.subject}::${item.topic}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.border,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                      {item.topic}
                    </Text>
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                      {item.subject} · Pre: {item.preScore}% ➔ Post: {item.postScore}%
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: item.gain >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: item.gain >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.bodyBold,
                        fontSize: FontSizes.xs,
                        color: item.gain >= 0 ? Colors.success : Colors.warning,
                      }}
                    >
                      {item.gain >= 0 ? `+${item.gain}% Growth` : `${item.gain}%`}
                    </Text>
                  </View>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Subject Breakdown List */}
        <View style={{ gap: Spacing.lg }}>
          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
            Subject Breakdown
          </Text>

          {subjectsList.map((subject) => {
            const subjectIcon = subject === 'Mathematics' ? <Calculator size={16} color={Colors.accentPrimary} /> : <BookOpen size={16} color={Colors.accentPrimary} />;
            const topics = topicsBySubject[subject];

            return (
              <GlassCard key={subject} padding={Spacing.lg} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  {subjectIcon}
                  <Text style={styles.subjectTitle}>{subject}</Text>
                </View>

                <View style={styles.topicList}>
                  {topics.length === 0 ? (
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, fontStyle: 'italic' }}>
                      No topics completed in this subject yet.
                    </Text>
                  ) : (
                    topics.map((topic) => {
                      const { count, average } = getTopicMetrics(subject, topic);
                      const isMastered = average !== null && average >= 80;

                      return (
                        <View key={topic} style={styles.topicRow}>
                          <View style={styles.topicInfo}>
                            <Text style={styles.topicName}>{topic}</Text>
                            <Text style={styles.topicSessions}>
                              {count === 0 ? 'Not attempted' : `${count} session${count > 1 ? 's' : ''}`}
                            </Text>
                          </View>

                          {average !== null ? (
                            <View 
                              style={[
                                styles.topicBadge, 
                                { backgroundColor: isMastered ? Colors.successGlow : Colors.dangerGlow }
                              ]}
                            >
                              {isMastered ? (
                                <CheckCircle2 size={12} color={Colors.success} />
                              ) : (
                                <XCircle size={12} color={Colors.danger} />
                              )}
                              <Text 
                                style={[
                                  styles.topicBadgeText, 
                                  { color: isMastered ? Colors.success : Colors.danger }
                                ]}
                              >
                                {average}%
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.topicBadge, { backgroundColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
                              <Lock size={10} color={Colors.textMuted} />
                              <Text style={[styles.topicBadgeText, { color: Colors.textMuted }]}>
                                Locked
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </GlassCard>
            );
          })}
        </View>

        {/* Badges status grid */}
        <View style={{ gap: Spacing.lg }}>
          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
            Badge Milestones
          </Text>

          <View style={styles.badgeGrid}>
            {badgeList.length === 0 ? (
              <GlassCard padding={Spacing.lg} style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                  Complete quizzes to unlock badges!
                </Text>
              </GlassCard>
            ) : (
              badgeList.map((badge) => (
                <View 
                  key={`${badge.subject}::${badge.topic}`}
                  style={[
                    styles.badgeCard,
                    {
                      borderColor: badge.unlocked ? Colors.success : Colors.border,
                      backgroundColor: badge.unlocked ? Colors.successGlow : 'transparent',
                    }
                  ]}
                >
                  <View style={{ height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs, opacity: badge.unlocked ? 1 : 0.4 }}>
                    {badge.unlocked ? (
                      <badge.icon size={28} color={badge.color} />
                    ) : (
                      <Lock size={28} color={Colors.textMuted} />
                    )}
                  </View>
                  <Text 
                    style={[
                      styles.badgeLabel, 
                      { color: badge.unlocked ? Colors.textMain : Colors.textMuted }
                    ]}
                    numberOfLines={1}
                  >
                    {badge.topic}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Footer: Save to Device button */}
        <View style={styles.footer}>
          <PrimaryButton
            label="Save Progress Report to Device"
            onPress={handleSaveReport}
            loading={isSaving}
            icon={<Download size={18} color={Colors.white} style={{ marginRight: 8 }} />}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
