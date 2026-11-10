import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  X,
  BookOpen,
  GraduationCap,
  Users,
  HeartHandshake,
  CheckCircle2,
  Smartphone,
  Calendar,
  Award,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Spacing, Radius } from '../../theme/spacing';

interface UserManualModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRole?: 'student' | 'teacher' | 'parent';
}

export function UserManualModal({
  visible,
  onClose,
  defaultRole = 'student',
}: UserManualModalProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'parent'>(defaultRole);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <BookOpen size={20} color="#11428E" />
              </View>
              <View>
                <Text style={styles.title}>GURO User Manual</Text>
                <Text style={styles.subtitle}>Quick guide for students, teachers & parents</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close manual"
              accessibilityRole="button"
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Role Tabs */}
          <View style={styles.tabBar}>
            {[
              { id: 'student' as const, label: 'Student', Icon: GraduationCap },
              { id: 'teacher' as const, label: 'Teacher', Icon: Users },
              { id: 'parent' as const, label: 'Parent', Icon: HeartHandshake },
            ].map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setActiveTab(id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Icon size={16} color={isActive ? '#11428E' : Colors.textMuted} />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Scrollable Content */}
          <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {activeTab === 'student' && (
              <View style={styles.section}>
                <View style={styles.guideCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Join Your Section</Text>
                    <Text style={styles.cardText}>
                      Ask your teacher for the Section Code. Enter your 12-digit DepEd LRN to connect your classroom.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.stepBadgeText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Study Lessons</Text>
                    <Text style={styles.cardText}>
                      Browse Mathematics and English topics. Read interactive cards, diagrams, and definitions.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.stepBadgeText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Take Timed Quizzes</Text>
                    <Text style={styles.cardText}>
                      Test yourself with practice questions. Earn XP, maintain your study streak, and collect badges.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.stepBadgeText}>4</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Works Offline</Text>
                    <Text style={styles.cardText}>
                      Everything runs locally on your phone with zero data. Your answers sync whenever Wi-Fi is found.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'teacher' && (
              <View style={styles.section}>
                <View style={styles.guideCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Classroom & LRN Setup</Text>
                    <Text style={styles.cardText}>
                      Create your classroom. You can also create student accounts directly using their DepEd 12-digit LRN.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#0D9488' }]}>
                    <Text style={styles.stepBadgeText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Daily Attendance Roll Call</Text>
                    <Text style={styles.cardText}>
                      Take attendance in seconds with 1-click Present, Late, Absent, or Excused status. Export to DepEd SF2.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.stepBadgeText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Lesson & Quiz Builder</Text>
                    <Text style={styles.cardText}>
                      Create custom lessons or use AI generation aligned with DepEd MELCs. Configure timers per quiz.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#EC4899' }]}>
                    <Text style={styles.stepBadgeText}>4</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>DepEd Form SF9 Analytics</Text>
                    <Text style={styles.cardText}>
                      Review mastery rates, pre/post-test scores, and print consolidated quarterly report cards.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'parent' && (
              <View style={styles.section}>
                <View style={styles.guideCard}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Link Student Account</Text>
                    <Text style={styles.cardText}>
                      Enter the 6-digit Parent Access Code from your child or their teacher to connect their profile.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.stepBadgeText}>2</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Track Quiz Mastery</Text>
                    <Text style={styles.cardText}>
                      Check subject strengths, tricky topics, and daily active study minutes in Mathematics and English.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.stepBadgeText}>3</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Attendance Alerts</Text>
                    <Text style={styles.cardText}>
                      Get notified when your child logs in and completes their daily study sessions or is marked present.
                    </Text>
                  </View>
                </View>

                <View style={styles.guideCard}>
                  <View style={[styles.stepBadge, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.stepBadgeText}>4</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>Consultation Chat</Text>
                    <Text style={styles.cardText}>
                      Send messages directly to the teacher during designated DepEd consultation windows.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.gotItButton} onPress={onClose}>
              <Text style={styles.gotItButtonText}>Close Guide</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(17, 66, 142, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: '#64748B',
  },
  closeButton: {
    padding: Spacing.xs,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
  },
  tabButtonActive: {
    borderBottomColor: '#11428E',
  },
  tabLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#11428E',
    fontWeight: '700',
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  guideCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#11428E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.heading,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.body,
    color: '#475569',
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  gotItButton: {
    backgroundColor: '#11428E',
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
});
