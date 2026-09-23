import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap,
  Menu,
  Calculator,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Layers,
  FileText,
  Send,
} from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { Radius, Spacing } from '../../theme/spacing';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { toast } from '../../components';
import { useAppStore, resolveServerUrl } from '../../store/useAppStore';

export function AdminLessonIngestorScreen({ navigation }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subject, setSubject] = useState<'Mathematics' | 'English'>('Mathematics');
  const [gradeLevel, setGradeLevel] = useState<number>(4);
  const [topicName, setTopicName] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [competency, setCompetency] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ingestedResult, setIngestedResult] = useState<any>(null);

  const token = useAppStore((s) => s.token);
  const serverUrl = useAppStore((s) => s.serverUrl);

  const handleGenerate = async () => {
    if (!topicName.trim()) {
      toast.error('Please specify a lesson topic name.');
      return;
    }

    setGenerating(true);
    try {
      const resolved = resolveServerUrl(serverUrl || 'http://localhost:8000');
      const res = await fetch(`${resolved}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject,
          grade: gradeLevel,
          gradeLevel,
          topic: topicName.trim(),
          competency: competency.trim() || undefined,
          questionCount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIngestedResult(data);
        const qCount = data.questions ? data.questions.length : questionCount;
        toast.success(`Curriculum module "${topicName}" (${qCount} items) generated!`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || err.error || 'Generation failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error during lesson ingestion.');
    } finally {
      setGenerating(false);
    }
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
            <Zap size={20} color={Colors.accentSecondary} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Lesson Ingestor</Text>
            <Text style={styles.subtitle}>Curriculum generator &amp; assessment builder</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Card */}
        <View style={styles.card}>
          {/* Subject Selector */}
          <Text style={styles.cardLabel}>SUBJECT</Text>
          <View style={styles.tabRow}>
            {(['Mathematics', 'English'] as const).map((sub) => {
              const active = subject === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setSubject(sub)}
                  activeOpacity={0.7}
                >
                  {sub === 'Mathematics' ? (
                    <Calculator size={14} color={active ? Colors.accentPrimary : Colors.textMuted} />
                  ) : (
                    <BookOpen size={14} color={active ? Colors.accentPrimary : Colors.textMuted} />
                  )}
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Grade Selector */}
          <Text style={[styles.cardLabel, { marginTop: Spacing.sm }]}>GRADE LEVEL</Text>
          <View style={styles.tabRow}>
            {([4, 5, 6] as const).map((g) => {
              const active = gradeLevel === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setGradeLevel(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    Grade {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Question Count Density Selector */}
          <Text style={[styles.cardLabel, { marginTop: Spacing.sm }]}>QUESTION VOLUME</Text>
          <View style={styles.tabRow}>
            {([10, 15, 20] as const).map((qc) => {
              const active = questionCount === qc;
              return (
                <TouchableOpacity
                  key={qc}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setQuestionCount(qc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                    {qc} Questions
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Topic Input */}
          <Text style={[styles.cardLabel, { marginTop: Spacing.sm }]}>TOPIC / LESSON NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Quadrilaterals, Fractions, Context Clues"
            placeholderTextColor={Colors.textDark}
            value={topicName}
            onChangeText={setTopicName}
          />

          {/* Competency Input */}
          <Text style={[styles.cardLabel, { marginTop: Spacing.sm }]}>
            DEPED LEARNING COMPETENCY (OPTIONAL)
          </Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="e.g. Identifies and describes different kinds of quadrilaterals..."
            placeholderTextColor={Colors.textDark}
            value={competency}
            onChangeText={setCompetency}
            multiline
            numberOfLines={3}
          />

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={generating}
            activeOpacity={0.7}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.generateBtnText}>Generate &amp; Ingest {questionCount} Items</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Result Preview if available */}
        {ingestedResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <CheckCircle2 size={18} color={Colors.success} />
              <Text style={styles.resultTitle}>Curriculum Ingestion Ready</Text>
            </View>
            <Text style={styles.resultText}>
              Module for {subject} Grade {gradeLevel}: "{topicName}" generated with {ingestedResult.questions?.length || questionCount} diagnostic questions across Easy, Average, and Difficult tiers.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentRoute="LessonIngestor"
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    color: Colors.textDark,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  subjectRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(17,66,142,0.08)',
    borderColor: Colors.accentPrimary,
  },
  tabBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: Colors.accentPrimary,
    fontWeight: '700',
  },
  subjectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
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
  gradeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  gradeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  gradeBtnActive: {
    backgroundColor: 'rgba(160,19,34,0.1)',
    borderColor: 'rgba(160,19,34,0.3)',
  },
  gradeBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  gradeBtnTextActive: {
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.bgMain,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    color: Colors.textMain,
    height: 42,
    marginTop: 4,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentPrimary,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  generateBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: 'rgba(22,163,74,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: '700',
  },
  resultText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textDark,
  },
});
