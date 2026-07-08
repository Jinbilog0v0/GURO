/**
 * ProgressScreen — XP level, 7-day activity calendar,
 * subject breakdown bars, and badge showcase.
 */

import React, { useState } from 'react';
import { Text, View, ScrollView, Alert, Clipboard, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { Trophy, Flame, Calculator, BookOpen, CheckCircle2, AlertCircle, Clock, Star } from 'lucide-react-native';
import { MASTERY_THRESHOLD } from '../utils/engine';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { Badges } from '../theme/styles';
import { GlassCard } from '../components/ui/GlassCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SyncBadge } from '../components/shared/SyncBadge';
import { toast } from '../components';
import { styles } from '../styles/ProgressScreen.styles';

const GRADES = [4, 5, 6] as const;
const SUBJECTS = ['Mathematics', 'English'] as const;

const BADGE_INFO: Record<string, { label: string; emoji: string; desc: string }> = {
  first_step:       { label: 'First Step',     emoji: '👣', desc: 'Completed your first lesson' },
  perfect_score:    { label: 'Perfect 100%',   emoji: '💯', desc: 'Got 100% on any quiz' },
  math_wizard:      { label: 'Math Wizard',    emoji: '🧮', desc: 'Perfect score in Mathematics' },
  english_champion: { label: 'English Champ',  emoji: '📖', desc: 'Perfect score in English' },
  streak_starter:   { label: 'Streak Starter', emoji: '🔥', desc: '3-day study streak' },
  streak_master:    { label: 'Streak Master',  emoji: '⚡', desc: '5-day study streak' },
};

const ALL_BADGES = Object.keys(BADGE_INFO);

export function ProgressScreen() {
  const xpPoints        = useAppStore((s) => s.xpPoints || 0);
  const virtualStars    = useAppStore((s) => s.virtualStars || 0);
  const streakCount     = useAppStore((s) => s.streakCount || 0);
  const bestStreak      = useAppStore((s) => s.bestStreak || 0);
  const unlockedBadges  = useAppStore((s) => s.unlockedBadges || []);
  const studentProgress = useAppStore((s) => s.studentProgress);

  // All-time stats calculations
  const totalSessions = studentProgress.length;
  const totalCorrect = studentProgress.reduce((acc, curr) => acc + curr.score, 0);
  const totalQuestions = studentProgress.reduce((acc, curr) => acc + curr.totalQuestions, 0);

  const [refreshing, setRefreshing] = useState(false);
  const [fullHistoryVisible, setFullHistoryVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    const appMode = useAppStore.getState().appMode;
    const serverUrl = useAppStore.getState().serverUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      if (appMode === 'online') {
        const result = await useAppStore.getState().syncProgressNow(serverUrl);
        if (result.success && result.syncedCount > 0) {
          // O6: Show success feedback so student knows sync happened
          toast.success(`Progress synced with teacher! (${result.syncedCount} update${result.syncedCount !== 1 ? 's' : ''} sent)`);
        } else if (result.success && result.syncedCount === 0) {
          // Already up to date — no toast needed, avoid nagging
        }
      } else {
        // O6: Inform student they're offline
        toast.warning("You're offline. Your progress is saved and will sync when you reconnect.");
      }
    } catch (err) {
      // O6: Replaced silent console.warn with user-visible feedback
      toast.warning("Couldn't sync right now. Your progress is saved on this device.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleBadgePress = (key: string) => {
    const info = BADGE_INFO[key];
    const unlocked = unlockedBadges.includes(key);

    if (unlocked) {
      Alert.alert(
        `🏆 ${info.label}`,
        `${info.desc}\n\nStatus: Unlocked! 🎉`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share Achievement',
            onPress: () => {
              Clipboard.setString(`I unlocked the "${info.label}" badge on GURO by learning ${info.desc.toLowerCase()}! 🚀`);
              toast.success('Achievement text copied to clipboard.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        `🔒 ${info.label} (Locked)`,
        `${info.desc}\n\nKeep practicing topics with 80%+ scores to unlock this milestone!`
      );
    }
  };

  // Recent activity: last 5 attempts, newest first
  const recentActivity = [...studentProgress]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Best topics: unique topic/subject/grade combos with bestScore ≥ 80%
  const topicBest: Record<string, { subject: string; grade: number; topic: string; best: number }> = {};
  studentProgress.forEach((p) => {
    const key = `${p.subject}-${p.gradeLevel}-${p.topic}`;
    const pct = Math.round((p.score / p.totalQuestions) * 100);
    if (!topicBest[key] || pct > topicBest[key].best) {
      topicBest[key] = { subject: p.subject, grade: p.gradeLevel, topic: p.topic, best: pct };
    }
  });
  const bestTopics = Object.values(topicBest).filter((t) => t.best >= 80).slice(0, 4);
  const needsWork  = Object.values(topicBest).filter((t) => t.best < 60).slice(0, 4);

  const level     = Math.floor(xpPoints / 100) + 1;
  const xpInLevel = xpPoints % 100;

  const getSubjectAvg = (subject: string, grade: number): number => {
    const logs = studentProgress.filter(
      (p) => p.subject === subject && p.gradeLevel === grade,
    );
    if (logs.length === 0) return 0;
    const sum = logs.reduce((acc, p) => acc + (p.score / p.totalQuestions) * 100, 0);
    return Math.round(sum / logs.length);
  };

  const getAttemptCount = (subject: string, grade: number): number =>
    studentProgress.filter((p) => p.subject === subject && p.gradeLevel === grade).length;

  // Last 7 days activity from progress timestamps
  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    const active = studentProgress.some((p) => p.timestamp.startsWith(dateStr));
    return { label, active };
  });

  const scoreColor = (avg: number) =>
    avg >= 80 ? Colors.success : avg >= 50 ? Colors.warning : Colors.danger;

  return (
    <SafeAreaView style={styles.screen}>
      {/* O1: SyncBadge added to Progress header */}
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSubtitle}>Track your learning journey.</Text>
        </View>
        <SyncBadge />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* XP / Level card */}
        <GlassCard padding={Spacing.lg} style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes['2xl'], color: Colors.textMain }}>
                Level {level}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted }}>
                {xpPoints} XP total
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: Spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: '#F59E0B' }}>
                  {virtualStars} Stars
                </Text>
              </View>
              <View style={[Badges.base, Badges.indigo, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Flame size={12} color={Colors.accentPrimary} />
                <Text style={[Badges.text, Badges.indigoText]}>Streak: {streakCount} (Best: {bestStreak})</Text>
              </View>
            </View>
          </View>
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                XP to next level
              </Text>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                {xpInLevel} / 100
              </Text>
            </View>
            <ProgressBar progress={xpInLevel} height={8} />
          </View>
        </GlassCard>

        {/* All-Time Stats card */}
        <GlassCard padding={Spacing.lg} style={{ gap: Spacing.md }}>
          <SectionHeader title="All-Time Stats" subtitle="Your learning milestone numbers" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: Spacing.md, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                {totalSessions}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' }}>
                Quests Played
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: Spacing.md, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.success }}>
                {totalCorrect}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' }}>
                Correct Answers
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: Spacing.md, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.accentPrimary }}>
                {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' }}>
                Total Accuracy
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* 7-day activity calendar */}
        <GlassCard padding={Spacing.lg} style={{ gap: Spacing.md }}>
          <SectionHeader title="This Week" subtitle="Days you studied" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weekActivity.map((day, idx) => (
              <View
                key={idx}
                style={{ alignItems: 'center', gap: 4 }}
                // A6: Screen-reader can announce each day's activity state
                accessibilityLabel={`${day.label}: ${day.active ? 'studied' : 'no activity'}`}
                accessibilityRole="text"
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: day.active ? Colors.accentPrimary : Colors.bgInput,
                  borderWidth: 1,
                  borderColor: day.active ? Colors.accentPrimary : Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {day.active && <Flame size={16} color={Colors.white} />}
                </View>
                <Text style={{
                  fontFamily: Fonts.body,
                  fontSize: FontSizes.xs,
                  color: day.active ? Colors.accentPrimary : Colors.textDark,
                }}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Subject breakdown */}
        <SectionHeader title="Subject Progress" subtitle="Average score per subject and grade" />
        {studentProgress.length === 0 ? (
          <GlassCard variant="subtle" padding={Spacing.xl} style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Trophy size={40} color={Colors.textMuted} />
            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
              No progress yet
            </Text>
            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center' }}>
              Complete lessons to see your scores here!
            </Text>
          </GlassCard>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {SUBJECTS.flatMap((subject) =>
              GRADES.map((grade) => {
                const attempts = getAttemptCount(subject, grade);
                if (attempts === 0) return null;
                const avg = getSubjectAvg(subject, grade);
                const color = scoreColor(avg);
                return (
                  <GlassCard key={`${subject}-${grade}`} padding={Spacing.md} style={{ gap: Spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        {subject === 'Mathematics' ? (
                          <Calculator size={16} color={Colors.accentPrimary} />
                        ) : (
                          <BookOpen size={16} color={Colors.accentSecondary} />
                        )}
                        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                          {subject} · Grade {grade}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color }}>
                        {avg}%
                      </Text>
                    </View>
                    <ProgressBar progress={avg} height={6} color={color} />
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                      {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
                    </Text>
                  </GlassCard>
                );
              }),
            )}
          </View>
        )}

        {/* Badge showcase */}
        <SectionHeader title="Badges" subtitle="Complete lessons and streaks to earn them" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {ALL_BADGES.map((key) => {
            const info = BADGE_INFO[key];
            const unlocked = unlockedBadges.includes(key);
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                onPress={() => handleBadgePress(key)}
                style={{ width: '48%' }}
              >
                <GlassCard
                  padding={Spacing.md}
                  style={[styles.badgeCard, { opacity: unlocked ? 1 : 0.38, width: '100%' }]}
                >
                  <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                  <Text style={styles.badgeLabel}>{info.label}</Text>
                  <Text style={styles.badgeDesc}>{info.desc}</Text>
                  {!unlocked && <Text style={styles.badgeLocked}>Locked</Text>}
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Best Topics */}
        {bestTopics.length > 0 && (
          <>
            <SectionHeader title="Best Topics" subtitle="Topics you've mastered (≥80%)" />
            <View style={{ gap: Spacing.sm }}>
              {bestTopics.map((t) => (
                <GlassCard key={`${t.subject}-${t.grade}-${t.topic}`} padding={Spacing.md}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <CheckCircle2 size={16} color={Colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                        {t.topic}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                        {t.subject} · Grade {t.grade}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.success }}>
                      {t.best}%
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        )}

        {/* Needs Work */}
        {needsWork.length > 0 && (
          <>
            <SectionHeader title="Needs Work" subtitle="Topics to practise more (<60%)" />
            <View style={{ gap: Spacing.sm }}>
              {needsWork.map((t) => (
                <GlassCard key={`${t.subject}-${t.grade}-${t.topic}`} padding={Spacing.md}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <AlertCircle size={16} color={Colors.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                        {t.topic}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                        {t.subject} · Grade {t.grade}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.warning }}>
                      {t.best}%
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <>
            <SectionHeader title="Recent Activity" subtitle="Your last 5 quiz attempts" />
            <View style={{ gap: Spacing.sm }}>
              {recentActivity.map((p, idx) => {
                const pct = Math.round((p.score / p.totalQuestions) * 100);
                const passed = pct >= MASTERY_THRESHOLD;
                const dateStr = new Date(p.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                return (
                  <GlassCard key={p.eventId || idx} padding={Spacing.md}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Clock size={14} color={Colors.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                          {p.topic}
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                          {p.subject} · G{p.gradeLevel} · {dateStr}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: passed ? Colors.success : Colors.warning }}>
                          {pct}%
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                          {p.score}/{p.totalQuestions}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
            {studentProgress.length > 5 && (
              <TouchableOpacity
                onPress={() => setFullHistoryVisible(true)}
                style={{
                  alignSelf: 'center',
                  paddingVertical: Spacing.xs,
                  paddingHorizontal: Spacing.md,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 16,
                  marginTop: Spacing.sm,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                  View Full History ({studentProgress.length} attempts)
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      {/* Full Activity History Modal */}
      <Modal
        visible={fullHistoryVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFullHistoryVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: Colors.bgSidebar,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: Spacing.lg,
            maxHeight: '80%',
            borderTopWidth: 1,
            borderTopColor: Colors.border,
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                  All Quiz Attempts
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }} numberOfLines={1}>
                  Total of {studentProgress.length} exercises played
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFullHistoryVisible(false)}
                style={{
                  padding: Spacing.xs,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xl }}
              showsVerticalScrollIndicator={false}
            >
              {[...studentProgress]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((p, idx) => {
                  const pct = Math.round((p.score / p.totalQuestions) * 100);
                  const passed = pct >= MASTERY_THRESHOLD;
                  const dateStr = new Date(p.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <TouchableOpacity
                      key={p.eventId || idx}
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert(
                          `📊 ${p.topic} Details`,
                          `Subject: ${p.subject}\nGrade Level: ${p.gradeLevel}\nScore: ${pct}% (${p.score}/${p.totalQuestions} correct answers)\nDate: ${dateStr}\nStatus: ${passed ? 'Mastered! 🎉' : 'Needs Practice! 📚'}`
                        );
                      }}
                    >
                      <GlassCard padding={Spacing.md}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                          <Clock size={14} color={Colors.textMuted} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                              {p.topic}
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                              {p.subject} · G{p.gradeLevel} · {dateStr}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: passed ? Colors.success : Colors.warning }}>
                              {pct}%
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                              {p.score}/{p.totalQuestions}
                            </Text>
                          </View>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
