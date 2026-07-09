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

  // Compute profile data
  const displayName = currentUser ? currentUser.name : guestName || 'Student';
  const displayGrade = preferredGrade;
  const currentLevel = Math.floor(xpPoints / 100) + 1;

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
    const badges: { topic: string; subject: string; unlocked: boolean; desc: string; emoji: string }[] = [];
    
    subjectsList.forEach((sub) => {
      topicsBySubject[sub].forEach((topic) => {
        const { average } = getTopicMetrics(sub, topic);
        const unlocked = average !== null && average >= 80;
        const emoji = sub === 'Mathematics' ? '🧮' : '📖';
        badges.push({
          topic,
          subject: sub,
          unlocked,
          desc: `${sub} G${preferredGrade}`,
          emoji,
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
      let txt = `GURO Student Progress Report\n`;
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
              txt += `  • ${topic} — Not attempted yet 🔒\n`;
            } else {
              const passIcon = average >= 80 ? '✅' : '❌';
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
          txt += `  [✅] ${b.topic} (${b.subject})\n`;
        });
      }

      txt += `\nLocked:\n`;
      if (lockedBadges.length === 0) {
        txt += `  None\n`;
      } else {
        lockedBadges.forEach((b) => {
          txt += `  [🔒] ${b.topic} (${b.subject})\n`;
        });
      }

      txt += `\n==============================\n`;
      txt += `Saved by GURO Mobile App\n`;

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
        </GlassCard>

        {/* Summary Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard label="Total Sessions" value={totalSessions} icon="📝" />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              label="Avg Accuracy" 
              value={`${avgAccuracy}%`} 
              icon="🎯"
              valueColor={avgAccuracy >= 80 ? Colors.success : avgAccuracy >= 60 ? Colors.warning : Colors.danger}
            />
          </View>
          <View style={styles.statCardWrapper}>
            {/* O8: Child-friendly labels instead of 'Synced'/'Unsynced' */}
            <StatCard label="Shared with Teacher" value={syncedCount} icon="☁️" valueColor={Colors.success} />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              label="Waiting to Share 📡"
              value={unsyncedCount}
              icon="🕓"
              valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textMuted}
            />
          </View>
        </View>

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
                            <View style={[styles.topicBadge, { backgroundColor: Colors.border }]}>
                              <Text style={[styles.topicBadgeText, { color: Colors.textMuted }]}>
                                🔒 Locked
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
                  <Text style={[styles.badgeEmoji, { opacity: badge.unlocked ? 1 : 0.4 }]}>
                    {badge.unlocked ? badge.emoji : '🔒'}
                  </Text>
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
