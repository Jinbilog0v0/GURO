import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock, ChevronRight, BookOpen, Calculator } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { ProgressBar } from './ProgressBar';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface LessonCardProps {
  topic: string;
  subject: string;
  gradeLevel: number;
  completionPercent: number;
  bestScore: number | null;
  questionCount: number;
  isLocked?: boolean;
  lockReason?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function LessonCard({
  topic,
  subject,
  gradeLevel,
  completionPercent,
  bestScore,
  questionCount,
  isLocked = false,
  lockReason,
  onPress,
  accessibilityLabel,
}: LessonCardProps) {
  const Icon = subject === 'Mathematics' ? Calculator : BookOpen;
  const isCompleted = completionPercent >= 80;

  const statusColor = isLocked
    ? Colors.textDark
    : isCompleted
    ? Colors.success
    : completionPercent > 0
    ? Colors.accentSecondary
    : Colors.textMuted;

  const statusLabel = isLocked
    ? 'Locked'
    : isCompleted
    ? 'Completed'
    : completionPercent > 0
    ? 'In Progress'
    : 'Not Started';

  const barColor = isCompleted ? Colors.success : completionPercent > 0 ? Colors.accentPrimary : Colors.border;

  return (
    <GlassCard padding={0} style={isLocked ? styles.lockedCard : undefined}>
      <TouchableOpacity
        onPress={isLocked ? undefined : onPress}
        activeOpacity={isLocked ? 1 : 0.75}
        style={styles.row}
        disabled={isLocked}
        accessibilityLabel={accessibilityLabel}
      >
        <View style={[styles.iconWrap, { backgroundColor: isLocked ? Colors.bgInput : Colors.accentPrimaryDeep }]}>
          {isLocked ? (
            <Lock size={20} color={Colors.textDark} />
          ) : (
            <Icon size={20} color={Colors.accentPrimary} />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.topicName} numberOfLines={1}>{topic}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            {bestScore !== null && (
              <Text style={styles.metaText}>Best: {bestScore}%</Text>
            )}
            {questionCount > 0 && (
              <Text style={styles.metaText}>{questionCount} Qs</Text>
            )}
          </View>
          {!isLocked && (
            <View style={styles.progressWrap}>
              <ProgressBar progress={completionPercent} height={5} color={barColor} />
            </View>
          )}
          {isLocked && lockReason && (
            <Text style={styles.lockReason} numberOfLines={1}>{lockReason}</Text>
          )}
        </View>

        {!isLocked && <ChevronRight size={18} color={Colors.textDark} />}
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  lockedCard: { opacity: 0.65 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  topicName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.md,
    color: Colors.textMain,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  progressWrap: { marginTop: 2 },
  lockReason: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.warning,
    marginTop: 1,
  },
});
