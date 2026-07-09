import React, { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore, resolveServerUrl } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { toast } from '../components';
import { styles } from '../styles/TeacherDashboard.styles';
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Send,
} from 'lucide-react-native';

interface QuestionDraft {
  id: string;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  feedback: string;
}

function emptyQuestion(): QuestionDraft {
  return {
    id: Math.random().toString(36).slice(2, 9),
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    feedback: '',
  };
}

export function TeacherLessonBuilderScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const [subject, setSubject] = useState<'Mathematics' | 'English'>('Mathematics');
  const [grade, setGrade] = useState<number>(4);
  const [topic, setTopic] = useState('');
  const [studyIntro, setStudyIntro] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);

  const classroomId = currentUser?.classroomId;

  const updateQuestion = (id: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  };

  const updateOption = (id: string, idx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const opts = [...q.options] as [string, string, string, string];
        opts[idx] = value;
        return { ...q, options: opts };
      }),
    );
  };

  const addQuestion = () => {
    if (questions.length >= 20) {
      toast.warning('Maximum of 20 questions per lesson.');
      return;
    }
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.warning('At least one question is required.');
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const validateAndSubmit = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a lesson topic.');
      return;
    }
    if (!classroomId) {
      toast.warning('An active classroom code is required to save this lesson.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Question ${i + 1}: question text cannot be empty.`);
        return;
      }
      const filled = q.options.filter((o) => o.trim().length > 0);
      if (filled.length < 2) {
        toast.error(`Question ${i + 1}: at least 2 options are required.`);
        return;
      }
      if (!q.options[q.correctIndex]?.trim()) {
        toast.error(`Question ${i + 1}: the marked correct answer is empty.`);
        return;
      }
    }

    const payload = {
      classroomId,
      subject,
      grade,
      topic: topic.trim(),
      studyContent: studyIntro.trim()
        ? {
            introduction: studyIntro.trim(),
            vocabulary: [],
            summary: [],
          }
        : null,
      questions: questions.map((q, i) => ({
        id: `MANUAL-${q.id}`,
        questionText: q.questionText.trim(),
        options: q.options.filter((o) => o.trim()),
        correctAnswer: q.options[q.correctIndex].trim(),
        difficulty: 'Average',
        category: 'Multiple-Choice',
        feedback: { en: q.feedback.trim() || 'Review the lesson content and try again.', fil: '' },
      })),
    };

    setSubmitting(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/classroom/update-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`"${topic.trim()}" lesson saved to classroom bank!`);
        setTopic('');
        setStudyIntro('');
        setQuestions([emptyQuestion()]);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || `Server error: ${res.status}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error saving lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.screenTitle}>Lesson Builder</Text>
              <Text style={styles.screenSubtitle}>Manually craft questions for your classroom</Text>
            </View>
            <View style={styles.headerRight}>
              <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
              <SyncBadge />
            </View>
          </View>

          {!classroomId && (
            <GlassCard style={[styles.section, { borderColor: Colors.warning, backgroundColor: 'rgba(245,158,11,0.03)' }]}>
              <Text style={{ fontFamily: Fonts.bodySemiBold, color: '#D97706', fontSize: FontSizes.sm }}>
                ⚠️ Active Classroom Required
              </Text>
              <Text style={{ fontFamily: Fonts.body, color: Colors.textMuted, fontSize: FontSizes.xs, marginTop: 4 }}>
                Link this teacher account to a classroom first so lessons can be saved to your private bank.
              </Text>
            </GlassCard>
          )}

          {/* Course Config */}
          <GlassCard style={styles.section}>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <BookOpen size={20} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Lesson Details</Text>
                </View>
              }
              subtitle="Set subject, grade, and topic"
            />

            {/* Subject */}
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Subject
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {(['Mathematics', 'English'] as const).map((sub) => {
                const active = subject === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    onPress={() => setSubject(sub)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: Spacing.md,
                      backgroundColor: active ? 'rgba(17,66,142,0.06)' : '#F8FAFC',
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: active ? Colors.accentPrimary : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontFamily: active ? Fonts.bodyBold : Fonts.bodyMedium, color: active ? Colors.accentPrimary : '#94A3B8' }}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Grade */}
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Grade Level
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {([4, 5, 6] as const).map((g) => {
                const active = grade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGrade(g)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: Spacing.md,
                      backgroundColor: active ? 'rgba(17,66,142,0.06)' : '#F8FAFC',
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: active ? Colors.accentPrimary : '#E2E8F0',
                    }}
                  >
                    <Text style={{ fontFamily: active ? Fonts.bodyBold : Fonts.bodyMedium, color: active ? Colors.accentPrimary : '#94A3B8' }}>
                      Grade {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedTextInput
              label="Lesson Topic *"
              placeholder="e.g. Adding Dissimilar Fractions"
              value={topic}
              onChangeText={setTopic}
              containerStyle={styles.inputSpacing}
            />

            <ThemedTextInput
              label="Study Guide Introduction (optional)"
              placeholder="Provide a brief intro students read before attempting the quiz…"
              value={studyIntro}
              onChangeText={setStudyIntro}
              multiline
              numberOfLines={4}
              style={styles.textArea}
              containerStyle={styles.inputSpacing}
            />
          </GlassCard>

          {/* Questions */}
          <SectionHeader
            title={`Questions (${questions.length})`}
            subtitle="Tap a letter bubble to mark the correct answer"
          />

          {questions.map((q, qIdx) => (
            <GlassCard key={q.id} style={[styles.section, { marginBottom: Spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                <Badge label={`Q${qIdx + 1}`} variant="indigo" />
                <TouchableOpacity onPress={() => removeQuestion(q.id)} activeOpacity={0.75}>
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              <ThemedTextInput
                label="Question Text *"
                placeholder="Type the question here…"
                value={q.questionText}
                onChangeText={(v) => updateQuestion(q.id, { questionText: v })}
                multiline
                numberOfLines={3}
                containerStyle={{ marginBottom: Spacing.md }}
              />

              <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.xs }}>
                Answer Options — tap a letter to mark correct
              </Text>
              {q.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isCorrect = q.correctIndex === idx;
                return (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => updateQuestion(q.id, { correctIndex: idx })}
                      activeOpacity={0.75}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: isCorrect ? Colors.success : 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: isCorrect ? Colors.success : Colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isCorrect
                        ? <CheckCircle2 size={16} color={Colors.white} />
                        : <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMuted }}>{letter}</Text>
                      }
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <ThemedTextInput
                        placeholder={`Option ${letter}`}
                        value={opt}
                        onChangeText={(v) => updateOption(q.id, idx, v)}
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  </View>
                );
              })}

              <ThemedTextInput
                label="Feedback (optional)"
                placeholder="Hint or explanation shown after answering…"
                value={q.feedback}
                onChangeText={(v) => updateQuestion(q.id, { feedback: v })}
                containerStyle={{ marginTop: Spacing.sm }}
              />
            </GlassCard>
          ))}

          <SecondaryButton
            label="Add Another Question"
            icon={<Plus size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />}
            onPress={addQuestion}
            style={{ marginBottom: Spacing.md }}
          />

          <PrimaryButton
            label={`Commit ${questions.length} Question${questions.length !== 1 ? 's' : ''} to Classroom`}
            icon={<Send size={16} color={Colors.white} style={{ marginRight: 6 }} />}
            onPress={validateAndSubmit}
            loading={submitting}
            style={{ backgroundColor: Colors.success, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
