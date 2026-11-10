import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  Sparkles,
  BookOpen,
  Target,
  Key,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  ArrowDown,
  GraduationCap,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface StudentFeatureTourModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TOUR_STEPS = [
  {
    title: 'Choose Subject & Topic',
    badge: 'Step 1 of 4 • Curriculum',
    description: 'Select Mathematics or English to explore bite-sized, DepEd MELC-aligned curriculum modules designed for your grade level.',
    Icon: BookOpen,
    tip: 'Tap any topic card to begin studying!',
  },
  {
    title: 'Interactive Study Slides',
    badge: 'Step 2 of 4 • Self-Paced',
    description: 'Read visual cards with illustrated diagrams, definitions, and Filipino cultural examples before testing your skills.',
    Icon: GraduationCap,
    tip: 'Take your time — study slides are untimed.',
  },
  {
    title: 'Take Diagnostic Quizzes',
    badge: 'Step 3 of 4 • Mastery Check',
    description: 'Answer practice questions with instant feedback! Earn XP jewels, maintain your study streak, and collect badges.',
    Icon: Target,
    tip: 'Score 80%+ to earn a Gold Mastery badge!',
  },
  {
    title: 'Connect Classroom Code',
    badge: 'Step 4 of 4 • Teacher Sync',
    description: 'Enter your teacher’s 6-character code (e.g. GRADE4-QUEZON) and your 12-digit DepEd LRN to submit progress and attendance.',
    Icon: Key,
    tip: 'Ask your class adviser for your section code.',
  },
];

export function StudentFeatureTourModal({
  visible,
  onClose,
  onComplete,
}: StudentFeatureTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!visible) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.Icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            {/* Arrow Coach Mark */}
            <View style={styles.coachMarkRow}>
              <View style={styles.coachBadge}>
                <Text style={styles.coachBadgeText}>App Feature Tour</Text>
              </View>
              <ArrowDown size={18} color="#11428E" />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <StepIcon size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badge}>{step.badge}</Text>
                <Text style={styles.title}>{step.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close tour">
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <Text style={styles.description}>{step.description}</Text>

            {/* Pro Tip */}
            <View style={styles.tipBox}>
              <Sparkles size={16} color="#D97706" style={{ marginTop: 2 }} />
              <Text style={styles.tipText}>
                <Text style={{ fontFamily: Fonts.bodyBold, color: '#0F172A' }}>Tip: </Text>
                {step.tip}
              </Text>
            </View>

            {/* Progress Dots */}
            <View style={styles.dotsRow}>
              {TOUR_STEPS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handlePrev}
                disabled={currentStep === 0}
                style={[styles.backBtn, currentStep === 0 && { opacity: 0.3 }]}
              >
                <ArrowLeft size={16} color={Colors.textMuted} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                  <Text style={styles.nextBtnText}>
                    {currentStep === TOUR_STEPS.length - 1 ? 'Start Learning!' : 'Next'}
                  </Text>
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <CheckCircle2 size={16} color="#FFFFFF" />
                  ) : (
                    <ArrowRight size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    gap: Spacing.md,
  },
  coachMarkRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: -4,
  },
  coachBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(17, 66, 142, 0.1)',
  },
  coachBadgeText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bodyBold,
    color: '#11428E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#11428E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.heading,
    color: '#11428E',
    fontWeight: '700',
  },
  title: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  description: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    color: '#475569',
    lineHeight: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: '#475569',
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#11428E',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backBtnText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bodyBold,
    color: '#64748B',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
  },
  skipBtnText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bodyBold,
    color: '#64748B',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#11428E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
  },
  nextBtnText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
