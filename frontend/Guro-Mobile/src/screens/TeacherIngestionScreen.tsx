import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore, resolveServerUrl } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { toast } from '../components';
import { styles } from '../styles/TeacherDashboard.styles';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpenText,
  Target,
  Sparkles,
  FileText,
  Trash2,
} from 'lucide-react-native';

export function TeacherIngestionScreen({ route }: any) {
  const currentUser = useAppStore((state) => state.currentUser);
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const [subject, setSubject] = useState<'Mathematics' | 'English'>('Mathematics');
  const [grade, setGrade] = useState<number>(4);
  const [topic, setTopic] = useState('');
  const [lessonText, setLessonText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [commiting, setCommiting] = useState(false);

  // PDF states
  const [pdfName, setPdfName] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');

  // Prefill hook
  useEffect(() => {
    if (route?.params?.prefillTopic) {
      setTopic(route.params.prefillTopic);
    }
    if (route?.params?.prefillSubject) {
      const subj = route.params.prefillSubject;
      if (subj === 'Mathematics' || subj === 'English') {
        setSubject(subj);
      }
    }
  }, [route?.params]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Str = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setPdfName(asset.name);
        setPdfBase64(base64Str);
        toast.success(`Selected PDF: ${asset.name}`);
        if (!topic.trim()) {
          const cleanName = asset.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
          setTopic(cleanName);
        }
      }
    } catch (err) {
      toast.error('Failed to pick or read the PDF file.');
    }
  };

  const handleClearPdf = () => {
    setPdfName('');
    setPdfBase64('');
  };

  // Staged AI results
  const [stagedQuestions, setStagedQuestions] = useState<any[]>([]);
  const [stagedStudyContent, setStagedStudyContent] = useState<any>(null);
  
  // Accordion status for viewing staged guide/questions
  const [viewGuide, setViewGuide] = useState(true);
  const [viewQuestions, setViewQuestions] = useState(true);

  const classroomId = currentUser?.classroomId;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.warning('Please specify a lesson topic.');
      return;
    }
    if (!pdfBase64 && !lessonText.trim()) {
      toast.warning('Please paste your lesson plan text or upload a PDF.');
      return;
    }

    setLoading(true);
    setStagedQuestions([]);
    setStagedStudyContent(null);
    
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          subject,
          grade,
          topic: topic.trim(),
          lessonText: pdfBase64 ? undefined : lessonText.trim(),
          pdf: pdfBase64 || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStagedQuestions(data.questions || []);
        setStagedStudyContent(data.studyContent || null);
        toast.success('Successfully parsed lesson and generated questions!');
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Unable to connect to the generator API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBank = async () => {
    if (stagedQuestions.length === 0) return;
    if (!classroomId) {
      toast.warning('An active classroom code is required to save ingested items.');
      return;
    }

    setCommiting(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/classroom/update-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useAppStore.getState().token}`,
        },
        body: JSON.stringify({
          classroomId,
          subject,
          grade,
          topic: topic.trim(),
          questions: stagedQuestions,
          studyContent: stagedStudyContent,
        })
      });

      if (res.ok) {
        toast.success('Lesson successfully committed to classroom bank!');
        // Clear inputs on success
        setTopic('');
        setLessonText('');
        setStagedQuestions([]);
        setStagedStudyContent(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to commit: ${res.status}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Network error committing custom lesson.');
    } finally {
      setCommiting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.screenTitle}>AI Lesson Ingestor</Text>
            <Text style={styles.screenSubtitle}>Upload or paste lesson plans to populate item banks</Text>
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
              This teacher account is not yet linked to a classroom. Go to the web dashboard to configure your classroom profile first so your custom ingested lessons can be saved to your private bank.
            </Text>
          </GlassCard>
        )}

        {/* ── Pipeline Inputs ── */}
        <GlassCard style={styles.section}>
          <SectionHeader
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Zap size={20} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Ingestion Workspace</Text>
              </View>
            }
            subtitle="Configure course parameters and paste lesson details"
          />

          {/* Subject Switcher */}
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

          {/* Grade Level Selector */}
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

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <TouchableOpacity
              onPress={handlePickDocument}
              activeOpacity={0.75}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: Spacing.md,
                backgroundColor: 'rgba(17,66,142,0.04)',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: Colors.accentPrimary,
                borderRadius: Radius.md,
              }}
            >
              <FileText size={18} color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.accentPrimary }}>
                {pdfName ? 'Change PDF Reference' : 'Upload PDF Lesson Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          {pdfName !== '' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(17,66,142,0.06)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(17,66,142,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <FileText size={16} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: FontSizes.xs, color: Colors.textMain, flex: 1 }} numberOfLines={1}>
                  {pdfName}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearPdf} style={{ padding: 4 }}>
                <Trash2 size={16} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          <ThemedTextInput
            label="Lesson Topic"
            placeholder="e.g. Adding Dissimilar Fractions"
            value={topic}
            onChangeText={setTopic}
            containerStyle={styles.inputSpacing}
          />

          {!pdfBase64 && (
            <ThemedTextInput
              label="Raw Lesson Plan / Reference Material"
              placeholder="Paste your syllabus, reference textbook snippet, or outline notes here…"
              value={lessonText}
              onChangeText={setLessonText}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              containerStyle={styles.inputSpacing}
            />
          )}

          {pdfBase64 !== '' && (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: Spacing.md, borderRadius: Radius.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                ℹ️ Text Ingestion is disabled because a PDF document is selected. The generator will parse study content and items directly from the PDF context.
              </Text>
            </View>
          )}

          <PrimaryButton
            label="Process Ingestion Pipeline"
            icon={<Sparkles size={16} color={Colors.white} style={{ marginRight: 6 }} />}
            onPress={handleGenerate}
            loading={loading}
          />
        </GlassCard>

        {/* ── Generated Review Area ── */}
        {(stagedQuestions.length > 0 || stagedStudyContent) && (
          <View style={{ gap: Spacing.md }}>
            <SectionHeader
              title="Review Generated Content"
              subtitle="Examine AI generated study guide and item tiers"
            />

            {/* Study Content Accordion */}
            {stagedStudyContent && (
              <GlassCard style={styles.section}>
                <TouchableOpacity
                  onPress={() => setViewGuide(!viewGuide)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <BookOpenText size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                      Study Guide Content
                    </Text>
                  </View>
                  {viewGuide ? <ChevronUp size={18} color={Colors.textDark} /> : <ChevronDown size={18} color={Colors.textDark} />}
                </TouchableOpacity>

                {viewGuide && (
                  <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                    <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.textMain }}>Introduction:</Text>
                    <Text style={{ fontFamily: Fonts.body, color: Colors.textMuted, lineHeight: 18 }}>
                      {stagedStudyContent.introduction}
                    </Text>
                    
                    {stagedStudyContent.vocabulary && stagedStudyContent.vocabulary.length > 0 && (
                      <>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.textMain, marginTop: Spacing.xs }}>Vocabulary Terms:</Text>
                        {stagedStudyContent.vocabulary.map((vocab: any, i: number) => (
                          <View key={i} style={{ paddingLeft: Spacing.sm, borderLeftWidth: 2, borderLeftColor: Colors.accentPrimary }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>
                              {vocab.term}
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, color: Colors.textMuted, fontSize: FontSizes.sm }}>
                              {vocab.definition}
                            </Text>
                            {vocab.example && (
                              <Text style={{ fontFamily: Fonts.body, color: Colors.textDark, fontSize: FontSizes.xs, fontStyle: 'italic' }}>
                                Example: {vocab.example}
                              </Text>
                            )}
                          </View>
                        ))}
                      </>
                    )}

                    {stagedStudyContent.summary && stagedStudyContent.summary.length > 0 && (
                      <>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.textMain, marginTop: Spacing.xs }}>Summary Checklist:</Text>
                        {stagedStudyContent.summary.map((sum: string, i: number) => (
                          <Text key={i} style={{ fontFamily: Fonts.body, color: Colors.textMuted, paddingLeft: 6 }}>
                            • {sum}
                          </Text>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </GlassCard>
            )}

            {/* Questions list Accordion */}
            {stagedQuestions.length > 0 && (
              <GlassCard style={styles.section}>
                <TouchableOpacity
                  onPress={() => setViewQuestions(!viewQuestions)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Target size={18} color={Colors.accentSecondary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                      Questions Tier List ({stagedQuestions.length})
                    </Text>
                  </View>
                  {viewQuestions ? <ChevronUp size={18} color={Colors.textDark} /> : <ChevronDown size={18} color={Colors.textDark} />}
                </TouchableOpacity>

                {viewQuestions && (
                  <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
                    {stagedQuestions.map((q: any, i: number) => {
                      const difficultyColor = q.difficulty === 'Easy' ? Colors.success : q.difficulty === 'Difficult' ? Colors.danger : Colors.warning;
                      return (
                        <View key={i} style={{ padding: Spacing.md, backgroundColor: '#F8FAFC', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Badge label={`Q${i + 1} - ${q.category}`} variant="indigo" />
                            <Badge label={q.difficulty} variant="indigo" style={{ backgroundColor: 'transparent', borderColor: difficultyColor }} />
                          </View>
                          <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain, marginTop: 4 }}>
                            {q.questionText}
                          </Text>
                          {q.options && q.options.map((opt: string, idx: number) => {
                            const isCorrect = opt === q.correctAnswer;
                            return (
                              <Text key={idx} style={{ fontFamily: Fonts.body, color: isCorrect ? Colors.success : Colors.textMuted, fontSize: FontSizes.sm, paddingLeft: 6 }}>
                                {String.fromCharCode(65 + idx)}. {opt} {isCorrect ? '✓' : ''}
                              </Text>
                            );
                          })}
                          {q.feedback && (
                            <Text style={{ fontFamily: Fonts.body, color: Colors.textDark, fontSize: FontSizes.xs, fontStyle: 'italic', marginTop: 4 }}>
                              Feedback: {q.feedback.en}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </GlassCard>
            )}

            {/* Commit Button */}
            <PrimaryButton
              label="Commit Custom Lesson to Classroom Bank"
              icon={<Award size={16} color={Colors.white} style={{ marginRight: 6 }} />}
              onPress={handleSaveToBank}
              loading={commiting}
              style={{ backgroundColor: Colors.success }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
