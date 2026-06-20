/**
 * ProgressScreen — XP level, 7-day activity calendar,
 * subject breakdown bars, and badge showcase.
 */

import React from 'react';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { Trophy, Flame, Calculator, BookOpen, CheckCircle2, AlertCircle, Clock } from 'lucide-react-native';

import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { Badges } from '../theme/styles';
import { GlassCard } from '../components/ui/GlassCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
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
  const unlockedBadges  = useAppStore((s) => s.unlockedBadges || []);
  const studentProgress = useAppStore((s) => s.studentProgress);

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
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Track your learning journey.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: '#F59E0B' }}>
                ⭐ {virtualStars} Stars
              </Text>
              <View style={[Badges.base, Badges.indigo, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Flame size={12} color={Colors.accentPrimary} />
                <Text style={[Badges.text, Badges.indigoText]}>{streakCount} Day Streak</Text>
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

        {/* 7-day activity calendar */}
        <GlassCard padding={Spacing.lg} style={{ gap: Spacing.md }}>
          <SectionHeader title="This Week" subtitle="Days you studied" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weekActivity.map((day, idx) => (
              <View key={idx} style={{ alignItems: 'center', gap: 4 }}>
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
              <GlassCard
                key={key}
                padding={Spacing.md}
                style={[styles.badgeCard, { opacity: unlocked ? 1 : 0.38 }]}
              >
                <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                <Text style={styles.badgeLabel}>{info.label}</Text>
                <Text style={styles.badgeDesc}>{info.desc}</Text>
                {!unlocked && <Text style={styles.badgeLocked}>Locked</Text>}
              </GlassCard>
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
                const passed = pct >= 75;
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
          </>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}
