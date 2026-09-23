import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, resolveServerUrl, Question } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Spacing, Radius } from '../theme/spacing';
import { Fonts, FontSizes } from '../theme/typography';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton, DangerButton } from '../components/ui/Buttons';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { Badge } from '../components/ui/Badge';
import { SyncBadge } from '../components/shared/SyncBadge';
import { FileService } from '../services/fileService';
import { styles } from '../styles/TeacherDashboard.styles';
import {
  ClipboardList,
  Target,
  Cloud,
  BookOpen,
  HelpCircle,
  Tag,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Activity,
  Trash2,
  School,
  Users,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Calculator,
  Sparkles,
  Zap,
  BookOpenText,
  Award,
  TrendingDown,
  TrendingUp,
  FileText,
  Printer,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Check,
  Calendar,
} from 'lucide-react-native';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components';

export function TeacherDashboardScreen() {
  const navigation = useNavigation<any>();
  const itemBank = useAppStore((state) => state.itemBank);
  const appMode = useAppStore((state) => state.appMode);
  const currentUser = useAppStore((state) => state.currentUser);
  const storeClassroomId = useAppStore((state) => state.classroomId);
  const setClassroomId = useAppStore((state) => state.setClassroomId);
  const fetchItemBankFromServer = useAppStore((state) => state.fetchItemBankFromServer);
  const studentProgress = useAppStore((state) => state.studentProgress);
  const studentId = useAppStore((state) => state.studentId);
  const token = useAppStore((state) => state.token);
  const activeSchoolYear = useAppStore((state) => state.activeSchoolYear || '2026-2027');
  const activeTerm = useAppStore((state) => state.activeTerm || 'Quarter 1');
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [activeClassroom, setActiveClassroom] = useState<string | null>(currentUser?.classroomId || storeClassroomId || null);
  const [activeClassroomData, setActiveClassroomData] = useState<any>(null);
  const [classroomMembers, setClassroomMembers] = useState<string[]>([]);
  const [classroomTelemetry, setClassroomTelemetry] = useState<any[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [telemetrySearchInput, setTelemetrySearchInput] = useState('');
  const [telemetryFilterText, setTelemetryFilterText] = useState('');
  const [telemetrySelectedSubject, setTelemetrySelectedSubject] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [telemetrySelectedSection, setTelemetrySelectedSection] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  // SF9 Modal State & Signatories
  const [selectedSf9StudentId, setSelectedSf9StudentId] = useState<string | null>(null);
  const [sf9AdviserName, setSf9AdviserName] = useState('Class Adviser');
  const [sf9PrincipalName, setSf9PrincipalName] = useState('School Head');

  // Custom Delete Lesson Dialog State
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<{ subject: string; grade: string; topic: string } | null>(null);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Available Topics Overview states
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [topicsSubjectFilter, setTopicsSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [topicsGradeFilter, setTopicsGradeFilter] = useState<'All' | '4' | '5' | '6'>('All');
  const [topicsSearchQuery, setTopicsSearchQuery] = useState('');

  // Grade-Level Curriculum Health Tally states
  const [curriculumGradeFilter, setCurriculumGradeFilter] = useState<'All' | '4' | '5' | '6'>('All');
  const [curriculumSubjectFilter, setCurriculumSubjectFilter] = useState<'All' | 'Mathematics' | 'English'>('All');
  const [curriculumMasteryFilter, setCurriculumMasteryFilter] = useState<'All' | 'Strong' | 'Moderate' | 'Weak'>('All');

  const isPinMode = currentUser?.role === 'student';
  const effectiveClassroomId = activeClassroom || currentUser?.classroomId || storeClassroomId || (classrooms[0]?.id ?? null);

  const fetchClassroomDetails = async (code: string) => {
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/verify?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveClassroomData(data);
      }
    } catch (e) {
      console.warn('[TeacherDashboard] Failed to fetch classroom details:', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (!isPinMode) {
      await fetchTeacherClassrooms();
      await fetchClassroomTelemetry();
    }
    setRefreshing(false);
  };

  const fetchTeacherClassrooms = async () => {
    if (isPinMode) return;
    setLoadingClassrooms(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${cleanUrl}/api/classroom/my-classrooms`, { headers });
      if (res.ok) {
        const data = await res.json();
        const serverClassrooms = data.classrooms || [];
        setClassrooms(serverClassrooms);

        if (serverClassrooms.length > 0) {
          const currentCode = activeClassroom || currentUser?.classroomId || storeClassroomId || serverClassrooms[0].id;
          const match = serverClassrooms.find((c: any) => c.id === currentCode) || serverClassrooms[0];
          setActiveClassroom(match.id);
          setActiveClassroomData(match);
          if (match.id !== storeClassroomId && setClassroomId) {
            setClassroomId(match.id, match.teacherName);
          }
          await fetchClassroomDetails(match.id);
          await fetchClassroomTelemetry(match.id);
        }
      }
    } catch (err) {
      console.warn('[TeacherDashboard] Failed to fetch teacher classrooms:', err);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  const parseStudentId = (id: string) => {
    if (!id) return { name: '', section: '' };
    let cleaned = id.replace(/-/g, ' ').trim();
    cleaned = cleaned.replace(/\s+GUEST$/i, '');
    cleaned = cleaned.replace(/\s+LOCAL$/i, '');
    cleaned = cleaned.trim();

    const sectionMatch = cleaned.match(/(.*)\s*\(([^)]+)\)/);
    if (sectionMatch) {
      const name = sectionMatch[1].trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      const section = sectionMatch[2].trim().toUpperCase();
      return { name, section };
    }
    const name = cleaned
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return { name, section: '' };
  };

  const formatStudentName = (id: string) => {
    return parseStudentId(id).name;
  };

  const fetchClassroomTelemetry = async (overrideCode?: string) => {
    const classCode = overrideCode || effectiveClassroomId;
    if (!classCode) return;
    setLoadingTelemetry(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${cleanUrl}/api/progress?classroomId=${encodeURIComponent(classCode)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setClassroomTelemetry(data);
        }
      }

      // Also fetch classroom members
      const memRes = await fetch(`${cleanUrl}/api/classroom/members?classroomId=${encodeURIComponent(classCode)}`, { headers });
      if (memRes.ok) {
        const memData = await memRes.json();
        if (Array.isArray(memData)) {
          setClassroomMembers(memData.map((m: any) => m.studentId));
        }
      }
    } catch (err) {
      console.warn('[Telemetry] Failed to fetch student telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const handleSelectClassroom = (code: string) => {
    setActiveClassroom(code);
    const selected = classrooms.find((c) => c.id === code);
    if (selected) {
      setActiveClassroomData(selected);
    }
    if (setClassroomId) {
      setClassroomId(code, selected?.teacherName);
    }
    fetchClassroomDetails(code);
    fetchClassroomTelemetry(code);
  };

  const handleDeleteTopic = (subject: string, grade: string, topic: string) => {
    if (!effectiveClassroomId) return;
    setDeleteTopicTarget({ subject, grade, topic });
  };

  const executeDeleteTopic = async () => {
    if (!effectiveClassroomId || !deleteTopicTarget) return;
    const { subject, grade, topic } = deleteTopicTarget;
    setIsDeletingTopic(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const cleanUrl = resolvedUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/classroom/delete-lesson`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          classroomId: effectiveClassroomId,
          subject,
          grade,
          topic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Deleted lesson "${topic}" from classroom.`);
        if (data.customItemBank) {
          setActiveClassroomData((prev: any) => prev ? { ...prev, customItemBank: data.customItemBank } : prev);
          setClassrooms((prev) => prev.map((c) => c.id === effectiveClassroomId ? { ...c, customItemBank: data.customItemBank } : c));
        }
        setDeleteTopicTarget(null);
        fetchTeacherClassrooms();
      } else {
        toast.error('Failed to delete lesson.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting lesson.');
    } finally {
      setIsDeletingTopic(false);
    }
  };

  useEffect(() => {
    if (!isPinMode) {
      fetchTeacherClassrooms();
      fetchClassroomTelemetry();

      const interval = setInterval(() => {
        fetchClassroomTelemetry();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isPinMode, token, currentUser?.userId]);

  const getDiagnosticAlerts = () => {
    const studentTopicStats: Record<string, Record<string, { totalScore: number, totalQuestions: number, attempts: number, subject: string }>> = {};

    classroomTelemetry.forEach((evt) => {
      const sId = evt.studentId;
      const topic = evt.topic;
      if (!studentTopicStats[sId]) {
        studentTopicStats[sId] = {};
      }
      if (!studentTopicStats[sId][topic]) {
        studentTopicStats[sId][topic] = { totalScore: 0, totalQuestions: 0, attempts: 0, subject: evt.subject };
      }
      studentTopicStats[sId][topic].totalScore += evt.score;
      studentTopicStats[sId][topic].totalQuestions += evt.totalQuestions;
      studentTopicStats[sId][topic].attempts += 1;
    });

    const alerts: { studentId: string, name: string, topic: string, subject: string, avgPct: number, attempts: number }[] = [];

    Object.keys(studentTopicStats).forEach((sId) => {
      Object.keys(studentTopicStats[sId]).forEach((topic) => {
        const stats = studentTopicStats[sId][topic];
        const avgPct = Math.round((stats.totalScore / stats.totalQuestions) * 100);
        if (avgPct < 60) {
          alerts.push({
            studentId: sId,
            name: formatStudentName(sId),
            topic,
            subject: stats.subject,
            avgPct,
            attempts: stats.attempts
          });
        }
      });
    });

    return alerts.sort((a, b) => a.avgPct - b.avgPct);
  };

  const getGradeLevelCurriculumTally = () => {
    const topicMap: Record<string, { sum: number; count: number; totalScore: number; totalQuestions: number; subject: string; grade: number }> = {};

    classroomTelemetry.forEach((evt) => {
      const gMatch = curriculumGradeFilter === 'All' || String(evt.gradeLevel) === String(curriculumGradeFilter);
      const sMatch = curriculumSubjectFilter === 'All' || evt.subject?.toLowerCase() === curriculumSubjectFilter.toLowerCase() || (curriculumSubjectFilter === 'Mathematics' && (evt.subject === 'Math' || evt.subject === 'Mathematics'));
      if (!gMatch || !sMatch) return;

      const key = `${evt.subject}-${evt.gradeLevel}-${evt.topic}`;
      if (!topicMap[key]) {
        topicMap[key] = { sum: 0, count: 0, totalScore: 0, totalQuestions: 0, subject: evt.subject, grade: evt.gradeLevel };
      }
      const pct = evt.totalQuestions > 0 ? (evt.score / evt.totalQuestions) * 100 : 0;
      topicMap[key].sum += pct;
      topicMap[key].totalScore += evt.score;
      topicMap[key].totalQuestions += evt.totalQuestions;
      topicMap[key].count += 1;
    });

    const list = Object.keys(topicMap).map((key) => {
      const item = topicMap[key];
      const topicName = key.split('-').slice(2).join('-');
      const avg = Math.round(item.sum / Math.max(1, item.count));
      return {
        key,
        topic: topicName,
        subject: item.subject,
        grade: item.grade,
        average: avg,
        attempts: item.count,
      };
    });

    const strongTopics = list.filter((t) => t.average >= 80).sort((a, b) => b.average - a.average);
    const progressingTopics = list.filter((t) => t.average >= 50 && t.average < 80).sort((a, b) => b.average - a.average);
    const weakTopics = list.filter((t) => t.average < 50).sort((a, b) => a.average - b.average);

    return {
      allTopics: list,
      strongTopics,
      progressingTopics,
      weakTopics,
    };
  };

  const getSf9ReportForStudent = (sId: string) => {
    const isPinCurrent = isPinMode && (sId === studentId || sId === 'PIN_STUDENT');
    const logs = isPinCurrent
      ? (studentProgress || [])
      : classroomTelemetry.filter((evt) => evt.studentId === sId);

    const name = formatStudentName(sId);
    const { section } = parseStudentId(sId);
    const grade = logs[0]?.gradeLevel || activeClassroomData?.gradeLevel || 4;
    const subj = logs[0]?.subject === 'Math' ? 'Mathematics' : (logs[0]?.subject || activeClassroomData?.subject || 'Mathematics');
    const schoolYr = activeClassroomData?.schoolYear || '2026-2027';

    // Quarterly logs
    const q1Logs = logs.filter((l) => (l.term === 'Quarter 1' || l.term === 'Term 1' || !l.term));
    const q2Logs = logs.filter((l) => (l.term === 'Quarter 2' || l.term === 'Term 2'));
    const q3Logs = logs.filter((l) => (l.term === 'Quarter 3' || l.term === 'Term 3'));
    const q4Logs = logs.filter((l) => (l.term === 'Quarter 4' || l.term === 'Term 4'));

    const getAvg = (list: any[]) => {
      if (list.length === 0) return null;
      const total = list.reduce((sum: number, item: any) => sum + item.totalQuestions, 0);
      const score = list.reduce((sum: number, item: any) => sum + item.score, 0);
      return total > 0 ? Math.round((score / total) * 100) : 0;
    };

    const q1 = getAvg(q1Logs);
    const q2 = getAvg(q2Logs);
    const q3 = getAvg(q3Logs);
    const q4 = getAvg(q4Logs);

    // Overall General Average
    const allTotal = logs.reduce((sum: number, item: any) => sum + item.totalQuestions, 0);
    const allScore = logs.reduce((sum: number, item: any) => sum + item.score, 0);
    const genAvg = allTotal > 0 ? Math.round((allScore / allTotal) * 100) : 0;

    // Pre vs Post growth
    const preLogs = logs.filter((l) => l.assessmentType === 'pre-test');
    const postLogs = logs.filter((l) => l.assessmentType === 'post-test');
    const preAvg = getAvg(preLogs);
    const postAvg = getAvg(postLogs);
    let gain: number | null = null;
    if (preAvg !== null && postAvg !== null) {
      if (preAvg < 100) {
        gain = Math.round(((postAvg - preAvg) / (100 - preAvg)) * 100);
      } else {
        gain = postAvg - preAvg;
      }
    }

    const isEligible = genAvg >= 75;
    const nextGrade = grade < 6 ? grade + 1 : 6;

    return {
      studentId: sId,
      studentName: name,
      section: section || activeClassroomData?.sectionName || '',
      grade,
      nextGrade,
      subject: subj,
      schoolYear: schoolYr,
      q1,
      q2,
      q3,
      q4,
      generalAverage: genAvg,
      preTestAvg: preAvg,
      postTestAvg: postAvg,
      learningGain: gain,
      isEligible,
      status: isEligible ? 'ELIGIBLE FOR PROMOTION' : 'CONDITIONAL / REMEDIAL',
      totalSessions: logs.length,
    };
  };

  const handleExportSf9 = async (sId: string) => {
    const report = getSf9ReportForStudent(sId);
    try {
      let txt = `====================================================\n`;
      txt += `  REPUBLIC OF THE PHILIPPINES • DEPARTMENT OF EDUCATION\n`;
      txt += `  SCHOOL FORM 9 (SF9) / LEARNER PROGRESS REPORT\n`;
      txt += `  Official Form 138 • School Year: ${report.schoolYear}\n`;
      txt += `====================================================\n\n`;
      txt += `Learner Name:     ${report.studentName}\n`;
      txt += `Learner ID / LRN: ${report.studentId}\n`;
      txt += `Grade & Section:  Grade ${report.grade}${report.section ? ` - ${report.section}` : ''}\n`;
      txt += `Learning Area:    ${report.subject} (${effectiveClassroomId || 'Classroom'})\n\n`;
      txt += `----------------------------------------------------\n`;
      txt += `QUARTERLY SCHOLASTIC RATING (DEPED FORM 138)\n`;
      txt += `----------------------------------------------------\n`;
      txt += `Quarter 1 (Term 1): ${report.q1 !== null ? `${report.q1}%` : '—'}\n`;
      txt += `Quarter 2 (Term 2): ${report.q2 !== null ? `${report.q2}%` : '—'}\n`;
      txt += `Quarter 3 (Term 3): ${report.q3 !== null ? `${report.q3}%` : '—'}\n`;
      txt += `Quarter 4 (Term 4): ${report.q4 !== null ? `${report.q4}%` : '—'}\n`;
      txt += `----------------------------------------------------\n`;
      txt += `GENERAL FINAL AVERAGE: ${report.generalAverage}% (${report.generalAverage >= 75 ? 'PASSED' : 'REMEDIAL'})\n\n`;
      if (report.preTestAvg !== null && report.postTestAvg !== null) {
        txt += `Diagnostic Pre-Test:  ${report.preTestAvg}%\n`;
        txt += `Summative Post-Test: ${report.postTestAvg}%\n`;
        txt += `Normalized Gain:     g = ${report.learningGain}%\n\n`;
      }
      txt += `CERTIFICATE OF PROMOTION:\n`;
      txt += `${report.isEligible ? `Eligible for promotion to Grade ${report.nextGrade}` : `Needs remedial coursework in Grade ${report.grade}`}\n\n`;
      txt += `Class Adviser: ${sf9AdviserName || 'Class Adviser'}\n`;
      txt += `School Head:   ${sf9PrincipalName || 'School Head'}\n\n`;
      txt += `Generated by GURO Diagnostic Evaluation Platform\n`;

      const safeName = report.studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `SF9_${safeName}_Grade${report.grade}.txt`;
      await FileService.saveFile(filename, txt);
      toast.success(`SF9 report saved: ${filename}`);
    } catch (err: any) {
      toast.error(err.message || 'Unable to save SF9 report.');
    }
  };

  const handleIngestExtension = (topic: string, subject: string) => {
    navigation.navigate('Ingestion', {
      prefillTopic: `${topic} Extension`,
      prefillSubject: subject,
    });
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleIngestForTopic = (topicName: string, subjectName: string, gradeLevel: string) => {
    navigation.navigate('Ingestion', {
      prefillTopic: topicName,
      prefillSubject: subjectName,
      prefillGrade: Number(gradeLevel) || 4,
    });
  };

  const getTopicQuestions = (topicNode: any): Array<Question & { difficulty: string; category: string }> => {
    const list: Array<Question & { difficulty: string; category: string }> = [];
    if (!topicNode || typeof topicNode !== 'object') return list;

    Object.keys(topicNode).forEach((diff) => {
      if (diff === 'studyContent') return;
      const diffNode = topicNode[diff];
      if (diffNode && typeof diffNode === 'object') {
        Object.keys(diffNode).forEach((cat) => {
          const qList = diffNode[cat];
          if (Array.isArray(qList)) {
            qList.forEach((q: any, idx: number) => {
              list.push({
                id: q.id || `Item-${idx + 1}`,
                questionText: q.questionText || '',
                options: q.options || [],
                correctAnswer: q.correctAnswer || '',
                feedback: q.feedback || { en: '', fil: '' },
                type: q.type || 'multiple-choice',
                matchingPairs: q.matchingPairs,
                difficulty: q.difficulty || diff,
                category: q.category || cat,
              });
            });
          }
        });
      }
    });

    return list;
  };

  const countTopicQuestions = (topicNode: any): number => {
    if (!topicNode || typeof topicNode !== 'object') return 0;
    let count = 0;
    Object.keys(topicNode).forEach((diff) => {
      if (diff === 'studyContent') return;
      const diffNode = topicNode[diff];
      if (diffNode && typeof diffNode === 'object') {
        Object.keys(diffNode).forEach((cat) => {
          if (Array.isArray(diffNode[cat])) {
            count += diffNode[cat].length;
          }
        });
      }
    });
    return count;
  };

  const currentClassroom = classrooms.find((c) => c.id === effectiveClassroomId) || classrooms[0];
  const effectiveClassroomBank = (() => {
    if (activeClassroomData?.customItemBank && typeof activeClassroomData.customItemBank === 'object' && Object.keys(activeClassroomData.customItemBank).length > 0) {
      return activeClassroomData.customItemBank;
    }
    if (currentClassroom?.customItemBank && typeof currentClassroom.customItemBank === 'object' && Object.keys(currentClassroom.customItemBank).length > 0) {
      return currentClassroom.customItemBank;
    }
    // If classrooms exist but none have claimed lessons, return empty object (only claimed lessons should show)
    if (classrooms.length > 0 || activeClassroomData) {
      return {};
    }
    // Fallback for tests or sandbox where no classrooms exist
    return itemBank || {};
  })();

  const getStats = () => {
    let subjectCount = 0;
    let totalQuestions = 0;
    const topicsList: string[] = [];
    if (effectiveClassroomBank) {
      subjectCount = Object.keys(effectiveClassroomBank).length;
      Object.keys(effectiveClassroomBank).forEach((subject) => {
        Object.keys(effectiveClassroomBank[subject] || {}).forEach((grade) => {
          Object.keys(effectiveClassroomBank[subject][grade] || {}).forEach((topic) => {
            if (!topicsList.includes(topic)) topicsList.push(topic);
            Object.keys(effectiveClassroomBank[subject][grade][topic] || {}).forEach((diff) => {
              if (diff === 'studyContent') return;
              const diffData = effectiveClassroomBank[subject][grade][topic][diff] as Record<string, Question[]> | undefined;
              if (!diffData || typeof diffData !== 'object') return;
              Object.keys(diffData).forEach((cat) => {
                if (Array.isArray(diffData[cat])) {
                  totalQuestions += diffData[cat].length;
                }
              });
            });
          });
        });
      });
    }
    return { subjectCount, totalQuestions, topicCount: topicsList.length };
  };

  const stats = getStats();

  const totalCompleted = studentProgress.length;
  const unsyncedCount = studentProgress.filter((e) => !e.synced).length;
  const averageScore =
    totalCompleted === 0
      ? 0
      : Math.round(
          studentProgress.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) /
            totalCompleted
        );

  const uniqueSections = Array.from(new Set(
    classroomTelemetry
      .map(evt => parseStudentId(evt.studentId).section)
      .filter(sec => sec !== '')
  )).sort();

  const filteredTelemetry = classroomTelemetry.filter((evt) => {
    if (telemetrySelectedSubject !== 'All') {
      const isMathFilter = telemetrySelectedSubject === 'Mathematics';
      const isMathLog = evt.subject === 'Mathematics' || evt.subject === 'Math' || evt.subject?.toLowerCase() === 'mathematics' || evt.subject?.toLowerCase() === 'math';
      if (isMathFilter && !isMathLog) return false;
      if (!isMathFilter && evt.subject?.toLowerCase() !== telemetrySelectedSubject.toLowerCase()) return false;
    }

    if (telemetrySelectedSection !== 'All') {
      const { section } = parseStudentId(evt.studentId);
      if (telemetrySelectedSection === 'No Section') {
        if (section !== '') return false;
      } else {
        if (section !== telemetrySelectedSection) return false;
      }
    }

    if (telemetryFilterText.trim()) {
      const query = telemetryFilterText.trim().toLowerCase();
      const matchId = evt.studentId.toLowerCase().includes(query);
      const matchName = formatStudentName(evt.studentId).toLowerCase().includes(query);
      const matchTopic = evt.topic.toLowerCase().includes(query);
      if (!matchId && !matchName && !matchTopic) {
        return false;
      }
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 140 }}>
            {isPinMode && (
              <TouchableOpacity
                onPress={() => navigation.replace('StudentDashboard')}
                style={{
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing.xs,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: Radius.sm,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                accessibilityLabel="Return to student dashboard"
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.textMain }}>← Return</Text>
              </TouchableOpacity>
            )}
            <View style={styles.headerLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.screenTitle} numberOfLines={1}>{isPinMode ? 'Teacher Evaluation' : 'Teacher Console'}</Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(17,66,142,0.08)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(17,66,142,0.15)',
                }}>
                  <Calendar size={11} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                    S.Y. {activeSchoolYear} • {activeTerm}
                  </Text>
                </View>
              </View>
              <Text style={styles.screenSubtitle} numberOfLines={1}>{isPinMode ? `Reviewing: ${formatStudentName(studentId)}` : 'Real-Time Classroom Telemetry & DepEd Reporting'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Badge label="Teacher" variant="indigo" style={styles.roleBadge} />
            <SyncBadge />
          </View>
        </View>

        {isPinMode ? (
          <>
            <SectionHeader
              title={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BarChart2 size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>This Student's Performance</Text>
                </View>
              }
              subtitle="Local device statistics"
            />
            <View style={styles.statsRow}>
              <StatCard icon={ClipboardList} label="Sessions" value={totalCompleted} />
              <StatCard icon={Target} label="Avg Score" value={`${averageScore}%`} valueColor={averageScore >= 80 ? Colors.success : averageScore >= 60 ? Colors.warning : Colors.danger} />
              <StatCard icon={Cloud} label="Unsynced" value={unsyncedCount} valueColor={unsyncedCount > 0 ? Colors.warning : Colors.textDark} />
            </View>

            <TouchableOpacity
              onPress={() => setSelectedSf9StudentId(studentId || 'PIN_STUDENT')}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(17,66,142,0.12)',
                borderWidth: 1,
                borderColor: Colors.accentPrimary,
                borderRadius: Radius.md,
                padding: Spacing.sm,
                marginBottom: Spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, marginRight: Spacing.xs }}>
                <FileText size={20} color={Colors.accentPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }}>
                    Official SF9 / Form 138 Report
                  </Text>
                  <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                    View quarterly ratings, growth gain &amp; promotion certificate
                  </Text>
                </View>
              </View>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                View SF9 →
              </Text>
            </TouchableOpacity>

            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ClipboardList size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Recent Results</Text>
                  </View>
                }
                subtitle="Last 5 activities"
              />
              {studentProgress.length === 0 ? (
                <Text style={styles.emptyText}>No practice logs yet.</Text>
              ) : (
                studentProgress.slice(0, 5).map((evt) => {
                  const pct = Math.round((evt.score / evt.totalQuestions) * 100);
                  const isSuccess = pct >= 80;
                  return (
                    <GlassCard key={evt.eventId} variant="subtle" padding={Spacing.sm} style={{ marginBottom: Spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, minWidth: 0 }}>
                          {isSuccess ? (
                            <CheckCircle size={16} color={Colors.success} style={{ flexShrink: 0 }} />
                          ) : (
                            <AlertTriangle size={16} color={Colors.warning} style={{ flexShrink: 0 }} />
                          )}
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                              {evt.topic}
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }} numberOfLines={1}>
                              G{evt.gradeLevel} · {evt.subject}
                            </Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end', flexShrink: 0, minWidth: 44 }}>
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: isSuccess ? Colors.success : Colors.warning }}>
                            {evt.score}/{evt.totalQuestions}
                          </Text>
                          <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textDark }}>
                            {pct}%
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </GlassCard>
          </>
        ) : (
          <>
            {/* ── Active Classroom Banner & Switcher ── */}
            <GlassCard style={[styles.section, { marginBottom: Spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <School size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain }}>
                    Classroom Section
                  </Text>
                </View>
                {effectiveClassroomId && (
                  <Badge label={effectiveClassroomId} variant="indigo" />
                )}
              </View>

              {classrooms.length === 0 ? (
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                  {effectiveClassroomId ? `Linked section: ${effectiveClassroomId}` : 'No active classrooms linked. Ingest lessons or configure on web.'}
                </Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4, marginBottom: classrooms.length > 1 ? Spacing.sm : 0, flexWrap: 'wrap' }}>
                    <Users size={14} color={Colors.accentSecondary} />
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }}>
                      {(() => {
                        const current = classrooms.find((c) => c.id === effectiveClassroomId) || classrooms[0];
                        return `${current.subject} · Grade ${current.gradeLevel}${current.sectionName ? ` · Sec: ${current.sectionName}` : ''} · ${classroomMembers.length} Student${classroomMembers.length === 1 ? '' : 's'} Enrolled`;
                      })()}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                      <Calendar size={12} color={Colors.accentPrimary} />
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.accentPrimary }}>
                        {(() => {
                          const current = classrooms.find((c) => c.id === effectiveClassroomId) || classrooms[0];
                          const sy = current.schoolYear || activeSchoolYear;
                          const trm = current.term || activeTerm;
                          return `S.Y. ${sy} • ${trm}`;
                        })()}
                      </Text>
                    </View>
                  </View>

                  {classrooms.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs, marginTop: Spacing.xs }}>
                      {classrooms.map((c: any) => {
                        const isActive = effectiveClassroomId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => handleSelectClassroom(c.id)}
                            style={{
                              paddingHorizontal: Spacing.sm,
                              paddingVertical: Spacing.xs,
                              borderRadius: Radius.full,
                              backgroundColor: isActive ? 'rgba(17,66,142,0.12)' : 'rgba(255,255,255,0.04)',
                              borderWidth: 1,
                              borderColor: isActive ? Colors.accentPrimary : Colors.border,
                            }}
                          >
                            <Text style={{ fontFamily: isActive ? Fonts.bodyBold : Fonts.body, fontSize: FontSizes.xs, color: isActive ? Colors.accentPrimary : Colors.textMuted }}>
                              {c.id} {c.sectionName ? `(${c.sectionName})` : `(${c.subject})`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </>
              )}
            </GlassCard>

            <SectionHeader
              title="Item Bank Overview"
              subtitle="Live count from local item bank"
            />
            <View style={styles.statsRow}>
              <StatCard
                icon={BookOpen}
                label="Subjects"
                value={stats.subjectCount}
                valueColor={Colors.accentPrimary}
              />
              <StatCard
                icon={HelpCircle}
                label="Questions"
                value={stats.totalQuestions}
                valueColor={Colors.accentSecondary}
              />
              <StatCard
                icon={Tag}
                label="Topics"
                value={stats.topicCount}
                valueColor={Colors.success}
              />
            </View>

            {/* ── Ingested Curriculum / Available Topics Overview ── */}
            <GlassCard style={[styles.section, { marginBottom: Spacing.md }]}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <FolderOpen size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain, flexShrink: 1 }} numberOfLines={1}>
                      Lessons Overview
                    </Text>
                  </View>
                }
                subtitle={`Claimed & active lessons in ${effectiveClassroomId || 'classroom'}`}
                right={
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Ingestion')}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: 'rgba(17,66,142,0.1)',
                      borderWidth: 1,
                      borderColor: Colors.accentPrimary,
                      borderRadius: Radius.full,
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: Spacing.xs,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={12} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary }}>
                      + Ingest
                    </Text>
                  </TouchableOpacity>
                }
              />

              {/* Search Bar */}
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <ThemedTextInput
                    placeholder="Search topics or questions..."
                    value={topicsSearchQuery}
                    onChangeText={setTopicsSearchQuery}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                {topicsSearchQuery !== '' && (
                  <DangerButton
                    label=""
                    icon={<Trash2 size={16} color={Colors.dangerText} />}
                    onPress={() => setTopicsSearchQuery('')}
                    style={{ width: 44, paddingHorizontal: 0, justifyContent: 'center', alignItems: 'center', height: 44 }}
                  />
                )}
              </View>

              {/* Filter Pills Row 1: Subject Filter */}
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs }}>
                {(['All', 'Mathematics', 'English'] as const).map((subj) => {
                  const active = topicsSubjectFilter === subj;
                  return (
                    <TouchableOpacity
                      key={subj}
                      onPress={() => setTopicsSubjectFilter(subj)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: Spacing.xs,
                        borderRadius: Radius.full,
                        backgroundColor: active ? 'rgba(17,66,142,0.12)' : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: active ? Colors.accentPrimary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? Fonts.bodyBold : Fonts.body,
                          fontSize: FontSizes.xs,
                          color: active ? Colors.accentPrimary : Colors.textMuted,
                        }}
                      >
                        {subj === 'All' ? 'All Subjects' : subj}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter Pills Row 2: Grade Level Filter */}
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
                {(['All', '4', '5', '6'] as const).map((gr) => {
                  const active = topicsGradeFilter === gr;
                  const label = gr === 'All' ? 'All Grades' : `Grade ${gr}`;
                  return (
                    <TouchableOpacity
                      key={gr}
                      onPress={() => setTopicsGradeFilter(gr)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 5,
                        borderRadius: Radius.full,
                        backgroundColor: active ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: active ? Colors.accentSecondary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? Fonts.bodyBold : Fonts.body,
                          fontSize: 11,
                          color: active ? Colors.accentSecondary : Colors.textMuted,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Topic Tree Content */}
              {(!effectiveClassroomBank || Object.keys(effectiveClassroomBank).length === 0) ? (
                <View style={{ padding: Spacing.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs }}>
                  <FolderOpen size={32} color={Colors.textDark} />
                  <Text style={[styles.emptyText, { paddingVertical: Spacing.xs }]}>
                    No claimed or ingested lessons for this classroom yet.
                  </Text>
                  <PrimaryButton
                    label="Ingest First Lesson"
                    icon={<Zap size={14} color="#FFF" />}
                    onPress={() => navigation.navigate('Ingestion')}
                    style={{ marginTop: Spacing.xs }}
                  />
                </View>
              ) : (
                (() => {
                  const subjects = Object.keys(effectiveClassroomBank).filter((s) =>
                    topicsSubjectFilter === 'All' ? true : s.toLowerCase() === topicsSubjectFilter.toLowerCase()
                  );

                  let renderedAnyTopic = false;

                  const subjectNodes = subjects.map((subjName) => {
                    const gradesObj = effectiveClassroomBank[subjName] || {};
                    const gradeKeys = Object.keys(gradesObj).filter((g) =>
                      topicsGradeFilter === 'All' ? true : String(g) === String(topicsGradeFilter)
                    );

                    const gradeElements = gradeKeys.map((gradeKey) => {
                      const topicsObj = gradesObj[gradeKey] || {};
                      let topicKeys = Object.keys(topicsObj);

                      if (topicsSearchQuery.trim()) {
                        const query = topicsSearchQuery.toLowerCase();
                        topicKeys = topicKeys.filter((tName) => {
                          const matchesTitle = tName.toLowerCase().includes(query);
                          const questions = getTopicQuestions(topicsObj[tName]);
                          const matchesQuestion = questions.some((q) => q.questionText.toLowerCase().includes(query));
                          return matchesTitle || matchesQuestion;
                        });
                      }

                      if (topicKeys.length === 0) return null;
                      renderedAnyTopic = true;

                      return (
                        <View key={gradeKey} style={{ marginBottom: Spacing.sm }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6, marginTop: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success }} />
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Grade {gradeKey}
                            </Text>
                          </View>

                          <View style={{ gap: Spacing.xs }}>
                            {topicKeys.map((topicName) => {
                              const topicNode = topicsObj[topicName];
                              const topicKey = `${subjName}-${gradeKey}-${topicName}`;
                              const isExpanded = !!expandedTopics[topicKey];
                              const qCount = countTopicQuestions(topicNode);
                              const questions = getTopicQuestions(topicNode);
                              const hasStudy = Boolean(topicNode?.studyContent);

                              return (
                                <View
                                  key={topicName}
                                  style={{
                                    borderRadius: Radius.md,
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderWidth: 1,
                                    borderColor: isExpanded ? Colors.accentPrimary : Colors.border,
                                    overflow: 'hidden',
                                  }}
                                >
                                  {/* Topic Card Header */}
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => toggleTopic(topicKey)}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      paddingHorizontal: Spacing.md,
                                      paddingVertical: Spacing.sm,
                                      backgroundColor: isExpanded ? 'rgba(17,66,142,0.05)' : 'transparent',
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, marginRight: Spacing.xs }}>
                                      {isExpanded ? (
                                        <ChevronUp size={16} color={Colors.accentPrimary} />
                                      ) : (
                                        <ChevronDown size={16} color={Colors.textMuted} />
                                      )}
                                      <Text
                                        style={{
                                          fontFamily: Fonts.bodyBold,
                                          fontSize: FontSizes.sm,
                                          color: isExpanded ? Colors.accentPrimary : Colors.textMain,
                                          flex: 1,
                                        }}
                                        numberOfLines={1}
                                      >
                                        {topicName}
                                      </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                                      {hasStudy && (
                                        <View
                                          style={{
                                            backgroundColor: 'rgba(6,182,212,0.1)',
                                            borderColor: 'rgba(6,182,212,0.25)',
                                            borderWidth: 1,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: Radius.full,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 3,
                                          }}
                                        >
                                          <BookOpenText size={10} color={Colors.accentSecondary} />
                                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentSecondary }}>
                                            Guide
                                          </Text>
                                        </View>
                                      )}
                                      <View
                                        style={{
                                          backgroundColor: 'rgba(255,255,255,0.06)',
                                          borderColor: Colors.border,
                                          borderWidth: 1,
                                          paddingHorizontal: 7,
                                          paddingVertical: 2,
                                          borderRadius: Radius.full,
                                        }}
                                      >
                                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted }}>
                                          {qCount} {qCount === 1 ? 'item' : 'items'}
                                        </Text>
                                      </View>
                                    </View>
                                  </TouchableOpacity>

                                  {/* Topic Card Body (Expanded) */}
                                  {isExpanded && (
                                    <View
                                      style={{
                                        borderTopWidth: 1,
                                        borderTopColor: Colors.border,
                                        padding: Spacing.md,
                                        backgroundColor: 'rgba(0,0,0,0.15)',
                                        gap: Spacing.sm,
                                      }}
                                    >
                                      {/* Quick Ingest / Action Bar */}
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          flexWrap: 'wrap',
                                          gap: Spacing.xs,
                                          backgroundColor: 'rgba(255,255,255,0.02)',
                                          padding: Spacing.xs,
                                          borderRadius: Radius.sm,
                                          borderWidth: 1,
                                          borderColor: Colors.border,
                                        }}
                                      >
                                        <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, flex: 1, minWidth: 110 }} numberOfLines={1}>
                                          Topic: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{topicName}</Text>
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 0 }}>
                                          <TouchableOpacity
                                            onPress={() => handleIngestForTopic(topicName, subjName, gradeKey)}
                                            activeOpacity={0.8}
                                            style={{
                                              backgroundColor: 'rgba(17,66,142,0.1)',
                                              borderWidth: 1,
                                              borderColor: Colors.accentPrimary,
                                              borderRadius: Radius.sm,
                                              paddingHorizontal: Spacing.xs,
                                              paddingVertical: 4,
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 3,
                                            }}
                                          >
                                            <Zap size={11} color={Colors.accentPrimary} />
                                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                                              AI Ingest
                                            </Text>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            onPress={() => handleDeleteTopic(subjName, gradeKey, topicName)}
                                            activeOpacity={0.8}
                                            style={{
                                              backgroundColor: 'rgba(220,38,38,0.1)',
                                              borderWidth: 1,
                                              borderColor: Colors.danger,
                                              borderRadius: Radius.sm,
                                              paddingHorizontal: Spacing.xs,
                                              paddingVertical: 4,
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              gap: 3,
                                            }}
                                          >
                                            <Trash2 size={11} color={Colors.danger} />
                                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.danger }}>
                                              Delete
                                            </Text>
                                          </TouchableOpacity>
                                        </View>
                                      </View>

                                      {/* Study Content Preview (if available) */}
                                      {topicNode?.studyContent && (
                                        <View
                                          style={{
                                            backgroundColor: 'rgba(6,182,212,0.04)',
                                            borderWidth: 1,
                                            borderColor: 'rgba(6,182,212,0.18)',
                                            borderRadius: Radius.sm,
                                            padding: Spacing.sm,
                                            gap: 4,
                                          }}
                                        >
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <BookOpenText size={13} color={Colors.accentSecondary} />
                                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentSecondary }}>
                                              Study Guide Summary
                                            </Text>
                                          </View>
                                          {topicNode.studyContent.introduction && (
                                            <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textDark, lineHeight: 16 }}>
                                              {topicNode.studyContent.introduction}
                                            </Text>
                                          )}
                                          {Array.isArray(topicNode.studyContent.summary) && topicNode.studyContent.summary.length > 0 && (
                                            <View style={{ marginTop: 2, gap: 2 }}>
                                              {topicNode.studyContent.summary.map((pt: string, pIdx: number) => (
                                                <Text key={pIdx} style={{ fontFamily: Fonts.body, fontSize: 10.5, color: Colors.textMuted }}>
                                                  • {pt}
                                                </Text>
                                              ))}
                                            </View>
                                          )}
                                        </View>
                                      )}

                                      {/* Questions List */}
                                      {questions.length === 0 ? (
                                        <View style={{ padding: Spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
                                          <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' }}>
                                            No questions loaded for this topic yet.
                                          </Text>
                                        </View>
                                      ) : (
                                        questions.map((q, qIdx) => {
                                          const diff = q.difficulty || 'Easy';
                                          const isEasy = diff === 'Easy';
                                          const isDiff = diff === 'Difficult';
                                          const diffBg = isEasy
                                            ? 'rgba(22,163,74,0.12)'
                                            : isDiff
                                            ? 'rgba(220,38,38,0.12)'
                                            : 'rgba(217,119,6,0.12)';
                                          const diffColor = isEasy
                                            ? Colors.success
                                            : isDiff
                                            ? Colors.danger
                                            : Colors.warning;
                                          const diffBorder = isEasy
                                            ? 'rgba(22,163,74,0.3)'
                                            : isDiff
                                            ? 'rgba(220,38,38,0.3)'
                                            : 'rgba(217,119,6,0.3)';

                                          return (
                                            <View
                                              key={q.id || qIdx}
                                              style={{
                                                backgroundColor: 'rgba(255,255,255,0.02)',
                                                borderWidth: 1,
                                                borderColor: Colors.border,
                                                borderRadius: Radius.sm,
                                                padding: Spacing.sm,
                                                gap: 6,
                                              }}
                                            >
                                              {/* Item Header */}
                                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <View
                                                  style={{
                                                    backgroundColor: 'rgba(17,66,142,0.1)',
                                                    borderWidth: 1,
                                                    borderColor: 'rgba(17,66,142,0.2)',
                                                    paddingHorizontal: 6,
                                                    paddingVertical: 1,
                                                    borderRadius: 4,
                                                  }}
                                                >
                                                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                                                    {q.id || `Item ${qIdx + 1}`} ({q.category || 'General'})
                                                  </Text>
                                                </View>

                                                <View
                                                  style={{
                                                    backgroundColor: diffBg,
                                                    borderWidth: 1,
                                                    borderColor: diffBorder,
                                                    paddingHorizontal: 6,
                                                    paddingVertical: 1,
                                                    borderRadius: 4,
                                                  }}
                                                >
                                                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: diffColor }}>
                                                    {diff}
                                                  </Text>
                                                </View>
                                              </View>

                                              {/* Question Prompt */}
                                              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.textMain, lineHeight: 17 }}>
                                                {q.questionText}
                                              </Text>

                                              {/* Multiple Choice Options */}
                                              {Array.isArray(q.options) && q.options.length > 0 && (
                                                <View style={{ gap: 4, marginTop: 2 }}>
                                                  {q.options.map((opt, oIdx) => {
                                                    const isCorrect = String(opt).trim() === String(q.correctAnswer).trim();
                                                    return (
                                                      <View
                                                        key={oIdx}
                                                        style={{
                                                          flexDirection: 'row',
                                                          alignItems: 'center',
                                                          paddingHorizontal: 8,
                                                          paddingVertical: 4,
                                                          borderRadius: 4,
                                                          backgroundColor: isCorrect ? 'rgba(22,163,74,0.08)' : 'rgba(255,255,255,0.02)',
                                                          borderWidth: 1,
                                                          borderColor: isCorrect ? 'rgba(22,163,74,0.3)' : 'transparent',
                                                          gap: 6,
                                                        }}
                                                      >
                                                        <Text
                                                          style={{
                                                            fontFamily: Fonts.mono,
                                                            fontSize: 11,
                                                            color: isCorrect ? Colors.success : Colors.textMuted,
                                                            fontWeight: 'bold',
                                                          }}
                                                        >
                                                          {String.fromCharCode(65 + oIdx)}.
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
                                                          <Text
                                                            style={{
                                                              fontFamily: isCorrect ? Fonts.bodyBold : Fonts.body,
                                                              fontSize: 11,
                                                              color: isCorrect ? Colors.success : Colors.textDark,
                                                              flex: 1,
                                                            }}
                                                          >
                                                            {opt}
                                                          </Text>
                                                          {isCorrect && <Check size={12} color={Colors.success} strokeWidth={3} />}
                                                        </View>
                                                      </View>
                                                    );
                                                  })}
                                                </View>
                                              )}

                                              {/* Matching Pairs */}
                                              {q.matchingPairs && Object.keys(q.matchingPairs).length > 0 && (
                                                <View style={{ gap: 3, marginTop: 2 }}>
                                                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' }}>
                                                    Matching Pairs:
                                                  </Text>
                                                  {Object.entries(q.matchingPairs).map(([left, right], pIdx) => (
                                                    <View key={pIdx} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                      <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.textMain }}>{left}</Text>
                                                      <Text style={{ color: Colors.textMuted }}>→</Text>
                                                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.success }}>{String(right)}</Text>
                                                    </View>
                                                  ))}
                                                </View>
                                              )}

                                              {/* Feedback / Explanation */}
                                              {Boolean(q.feedback) && (
                                                <View
                                                  style={{
                                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                                    borderWidth: 1,
                                                    borderColor: Colors.border,
                                                    borderRadius: 4,
                                                    padding: 6,
                                                    marginTop: 2,
                                                  }}
                                                >
                                                  <Text style={{ fontFamily: Fonts.body, fontSize: 10.5, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 15 }}>
                                                    <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>Explanation: </Text>
                                                    {typeof q.feedback === 'object' ? q.feedback?.en || q.feedback?.fil || JSON.stringify(q.feedback) : q.feedback}
                                                  </Text>
                                                </View>
                                              )}
                                            </View>
                                          );
                                        })
                                      )}
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    });

                    if (gradeElements.every((el) => el === null)) return null;

                    const isMath = subjName.toLowerCase().includes('math');

                    return (
                      <View key={subjName} style={{ marginBottom: Spacing.md, padding: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs }}>
                          <View
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isMath ? 'rgba(17,66,142,0.15)' : 'rgba(220,38,38,0.15)',
                            }}
                          >
                            {isMath ? (
                              <Calculator size={14} color={Colors.accentPrimary} />
                            ) : (
                              <BookOpen size={14} color={Colors.danger} />
                            )}
                          </View>
                          <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain }}>
                            {subjName}
                          </Text>
                        </View>

                        {gradeElements}
                      </View>
                    );
                  });

                  if (!renderedAnyTopic) {
                    return (
                      <View style={{ padding: Spacing.md, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs }}>
                        <FolderOpen size={28} color={Colors.textDark} />
                        <Text style={[styles.emptyText, { paddingVertical: Spacing.xs }]}>
                          No topics match your current filter criteria.
                        </Text>
                        <SecondaryButton
                          label="Reset Filters"
                          onPress={() => {
                            setTopicsSubjectFilter('All');
                            setTopicsGradeFilter('All');
                            setTopicsSearchQuery('');
                          }}
                          style={{ paddingHorizontal: Spacing.md, height: 38, marginTop: Spacing.xs }}
                        />
                      </View>
                    );
                  }

                  return subjectNodes;
                })()
              )}
            </GlassCard>

            {/* ── Curriculum Health & Grade-Level Tally ── */}
            {(() => {
              const tally = getGradeLevelCurriculumTally();
              return (
                <GlassCard style={[styles.section, { marginBottom: Spacing.md }]}>
                  <SectionHeader
                    title={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TrendingDown size={18} color={Colors.accentPrimary} />
                        <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>
                          Curriculum Health &amp; Tally
                        </Text>
                      </View>
                    }
                    subtitle="Cohort mastery &amp; bottleneck lessons per grade"
                  />

                  {/* Filter Pills */}
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                    {(['All', '4', '5', '6'] as const).map((gr) => {
                      const active = curriculumGradeFilter === gr;
                      const label = gr === 'All' ? 'All Grades' : `Grade ${gr}`;
                      return (
                        <TouchableOpacity
                          key={gr}
                          onPress={() => setCurriculumGradeFilter(gr)}
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 5,
                            borderRadius: Radius.full,
                            backgroundColor: active ? 'rgba(17,66,142,0.15)' : 'rgba(255,255,255,0.03)',
                            borderWidth: 1,
                            borderColor: active ? Colors.accentPrimary : Colors.border,
                          }}
                        >
                          <Text style={{ fontFamily: active ? Fonts.bodyBold : Fonts.body, fontSize: 10.5, color: active ? Colors.accentPrimary : Colors.textMuted }}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Tally Metrics Row (Clickable Category Cards) */}
                  <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                    {/* All Topics */}
                    <TouchableOpacity
                      onPress={() => setCurriculumMasteryFilter('All')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: curriculumMasteryFilter === 'All' ? 'rgba(17,66,142,0.18)' : 'rgba(255,255,255,0.02)',
                        borderWidth: 1,
                        borderColor: curriculumMasteryFilter === 'All' ? Colors.accentPrimary : Colors.border,
                        borderRadius: Radius.sm,
                        padding: Spacing.xs,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: curriculumMasteryFilter === 'All' ? Colors.accentPrimary : Colors.textMuted }}>All</Text>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: curriculumMasteryFilter === 'All' ? Colors.accentPrimary : Colors.textMain }}>{tally.allTopics.length}</Text>
                    </TouchableOpacity>

                    {/* Strong Topics */}
                    <TouchableOpacity
                      onPress={() => setCurriculumMasteryFilter('Strong')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: curriculumMasteryFilter === 'Strong' ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.06)',
                        borderWidth: 1,
                        borderColor: curriculumMasteryFilter === 'Strong' ? Colors.success : 'rgba(16,185,129,0.25)',
                        borderRadius: Radius.sm,
                        padding: Spacing.xs,
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <CheckCircle2 size={10} color={Colors.success} />
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.success }}>Strong</Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.success }}>{tally.strongTopics.length}</Text>
                    </TouchableOpacity>

                    {/* Moderate Topics */}
                    <TouchableOpacity
                      onPress={() => setCurriculumMasteryFilter('Moderate')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: curriculumMasteryFilter === 'Moderate' ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.06)',
                        borderWidth: 1,
                        borderColor: curriculumMasteryFilter === 'Moderate' ? Colors.warning : 'rgba(245,158,11,0.25)',
                        borderRadius: Radius.sm,
                        padding: Spacing.xs,
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <AlertCircle size={10} color={Colors.warning} />
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.warning }}>Moderate</Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.warning }}>{tally.progressingTopics.length}</Text>
                    </TouchableOpacity>

                    {/* Weak Topics */}
                    <TouchableOpacity
                      onPress={() => setCurriculumMasteryFilter('Weak')}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        backgroundColor: curriculumMasteryFilter === 'Weak' ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.06)',
                        borderWidth: 1,
                        borderColor: curriculumMasteryFilter === 'Weak' ? Colors.danger : 'rgba(239,68,68,0.25)',
                        borderRadius: Radius.sm,
                        padding: Spacing.xs,
                        alignItems: 'center',
                        gap: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <AlertTriangle size={10} color={Colors.danger} />
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.danger }}>Weak</Text>
                      </View>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.md, color: Colors.danger }}>{tally.weakTopics.length}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Interactive Selected Mastery Details List */}
                  {(() => {
                    let displayTopics: any[] = [];
                    let categoryTitle = '';
                    let categoryIcon: any = null;
                    let categoryColor: string = Colors.accentPrimary;
                    let categoryBg: string = 'rgba(17,66,142,0.04)';
                    let categoryBorder: string = 'rgba(17,66,142,0.18)';

                    if (curriculumMasteryFilter === 'Strong') {
                      displayTopics = tally.strongTopics;
                      categoryTitle = `Strong Mastery Topics (${tally.strongTopics.length})`;
                      categoryIcon = <Award size={13} color={Colors.success} />;
                      categoryColor = Colors.success;
                      categoryBg = 'rgba(16,185,129,0.04)';
                      categoryBorder = 'rgba(16,185,129,0.18)';
                    } else if (curriculumMasteryFilter === 'Moderate') {
                      displayTopics = tally.progressingTopics;
                      categoryTitle = `Moderate / Progressing Topics (${tally.progressingTopics.length})`;
                      categoryIcon = <AlertCircle size={13} color={Colors.warning} />;
                      categoryColor = Colors.warning;
                      categoryBg = 'rgba(245,158,11,0.04)';
                      categoryBorder = 'rgba(245,158,11,0.18)';
                    } else if (curriculumMasteryFilter === 'Weak') {
                      displayTopics = tally.weakTopics;
                      categoryTitle = `Priority Review Bottlenecks (${tally.weakTopics.length})`;
                      categoryIcon = <AlertTriangle size={13} color={Colors.danger} />;
                      categoryColor = Colors.danger;
                      categoryBg = 'rgba(239,68,68,0.04)';
                      categoryBorder = 'rgba(239,68,68,0.18)';
                    } else {
                      displayTopics = tally.allTopics;
                      categoryTitle = `All Assessed Topics (${tally.allTopics.length})`;
                      categoryIcon = <BarChart2 size={13} color={Colors.accentPrimary} />;
                      categoryColor = Colors.accentPrimary;
                      categoryBg = 'rgba(17,66,142,0.03)';
                      categoryBorder = 'rgba(17,66,142,0.15)';
                    }

                    const gradeScope = curriculumGradeFilter === 'All' ? 'across all grades' : `for Grade ${curriculumGradeFilter}`;

                    if (tally.allTopics.length === 0) {
                      return (
                        <View style={{ padding: Spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, textAlign: 'center' }}>
                            No student telemetry recorded {gradeScope}.
                          </Text>
                        </View>
                      );
                    }

                    if (displayTopics.length === 0) {
                      const categoryLabel = curriculumMasteryFilter === 'All' ? 'assessed' : curriculumMasteryFilter.toLowerCase();
                      return (
                        <View style={{ padding: Spacing.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: categoryBg, borderRadius: Radius.sm, borderWidth: 1, borderColor: categoryBorder }}>
                          <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, textAlign: 'center' }}>
                            No {categoryLabel} topics recorded {gradeScope}.
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <View style={{ backgroundColor: categoryBg, borderWidth: 1, borderColor: categoryBorder, borderRadius: Radius.sm, padding: Spacing.sm, gap: Spacing.xs }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            {categoryIcon}
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: categoryColor }}>
                              {categoryTitle}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: Fonts.body, fontSize: 9.5, color: Colors.textMuted }}>
                            Tap pill above to filter
                          </Text>
                        </View>

                        {displayTopics.map((item) => {
                          const isStr = item.average >= 80;
                          const isMod = item.average >= 50 && item.average < 80;
                          const itemColor = isStr ? Colors.success : isMod ? Colors.warning : Colors.danger;
                          const itemBg = isStr ? 'rgba(16,185,129,0.12)' : isMod ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
                          const itemBorder = isStr ? 'rgba(16,185,129,0.25)' : isMod ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)';
                          const statusLabel = isStr ? 'Strong' : isMod ? 'Moderate' : 'Weak';

                          return (
                            <View
                              key={item.key}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                paddingHorizontal: Spacing.sm,
                                paddingVertical: 6,
                                borderRadius: Radius.sm,
                                borderWidth: 1,
                                borderColor: Colors.border,
                                gap: Spacing.xs,
                              }}
                            >
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.textMain }} numberOfLines={1}>
                                  {item.topic}
                                </Text>
                                <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textMuted }} numberOfLines={1}>
                                  G{item.grade} {item.subject} · {item.attempts} attempt{item.attempts === 1 ? '' : 's'}
                                </Text>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <View
                                  style={{
                                    backgroundColor: itemBg,
                                    borderWidth: 1,
                                    borderColor: itemBorder,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    borderRadius: 4,
                                    alignItems: 'center',
                                  }}
                                >
                                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: itemColor }}>
                                    {item.average}% · {statusLabel}
                                  </Text>
                                </View>

                                {!isStr && (
                                  <TouchableOpacity
                                    onPress={() => handleIngestExtension(item.topic, item.subject)}
                                    activeOpacity={0.8}
                                    style={{
                                      backgroundColor: 'rgba(17,66,142,0.12)',
                                      borderWidth: 1,
                                      borderColor: Colors.accentPrimary,
                                      borderRadius: 4,
                                      paddingHorizontal: 6,
                                      paddingVertical: 3,
                                    }}
                                  >
                                    <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 9.5, color: Colors.accentPrimary }}>
                                      Ingest Help
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })()}
                </GlassCard>
              );
            })()}

            {/* ── Diagnostic Alerts ── */}
            <GlassCard style={[styles.section, { marginBottom: Spacing.md }]}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={18} color={Colors.warning} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Diagnostic Alerts</Text>
                  </View>
                }
                subtitle="Students scoring below target threshold (60%)"
              />

              {getDiagnosticAlerts().length === 0 ? (
                <Text style={styles.emptyText}>All students are performing above target threshold (≥ 60%).</Text>
              ) : (
                getDiagnosticAlerts().slice(0, 5).map((alert, idx) => (
                  <GlassCard key={idx} variant="subtle" padding={Spacing.sm} style={{ marginBottom: Spacing.xs, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                    {/* Student Header & Score */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: Spacing.xs }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain, flex: 1, minWidth: 0 }} numberOfLines={1}>
                        {alert.name}
                      </Text>
                      <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)', flexShrink: 0 }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.danger }}>
                          {alert.avgPct}% Avg · {alert.attempts} {alert.attempts === 1 ? 'attempt' : 'attempts'}
                        </Text>
                      </View>
                    </View>

                    {/* Struggling Topic Details */}
                    <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: Spacing.xs }} numberOfLines={2}>
                      Struggling on: <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.textMain }}>{alert.topic}</Text> ({alert.subject})
                    </Text>

                    {/* Action Buttons Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                      <TouchableOpacity
                        onPress={() => setSelectedSf9StudentId(alert.studentId || alert.name)}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(16,185,129,0.1)',
                          borderWidth: 1,
                          borderColor: Colors.success,
                          borderRadius: Radius.sm,
                          paddingVertical: 6,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.success }}>
                          SF9 Report
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleIngestExtension(alert.topic, alert.subject)}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(17,66,142,0.12)',
                          borderWidth: 1,
                          borderColor: Colors.accentPrimary,
                          borderRadius: Radius.sm,
                          paddingVertical: 6,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary }}>
                          Ingest Help
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                ))
              )}
            </GlassCard>

            {/* ── Student Telemetry ── */}
            <GlassCard style={styles.section}>
              <SectionHeader
                title={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Activity size={18} color={Colors.accentPrimary} />
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.xl, color: Colors.textMain }}>Student Telemetry</Text>
                  </View>
                }
                subtitle={`Active classroom: ${effectiveClassroomId || 'None'}`}
                right={
                  <SecondaryButton
                    label="Refresh"
                    onPress={fetchClassroomTelemetry}
                    loading={loadingTelemetry}
                    style={styles.clearBtn}
                  />
                }
              />

              {/* Search Input Row */}
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, alignItems: 'center' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ThemedTextInput
                    placeholder="Search student or topic..."
                    value={telemetrySearchInput}
                    onChangeText={(t) => {
                      setTelemetrySearchInput(t);
                      setTelemetryFilterText(t);
                    }}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                {(telemetrySearchInput !== '' || telemetryFilterText !== '') && (
                  <TouchableOpacity
                    onPress={() => {
                      setTelemetrySearchInput('');
                      setTelemetryFilterText('');
                    }}
                    activeOpacity={0.75}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: Radius.md,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Subject Filter Pills */}
              <View style={{ flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md }}>
                {(['All', 'Mathematics', 'English'] as const).map((subject) => {
                  const active = telemetrySelectedSubject === subject;
                  return (
                    <TouchableOpacity
                      key={subject}
                      onPress={() => setTelemetrySelectedSubject(subject)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: Spacing.xs,
                        borderRadius: Radius.full,
                        backgroundColor: active ? 'rgba(17,66,142,0.1)' : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: active ? Colors.accentPrimary : Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? Fonts.bodyBold : Fonts.body,
                          fontSize: FontSizes.xs,
                          color: active ? Colors.accentPrimary : Colors.textMuted,
                        }}
                      >
                        {subject === 'All' ? 'All Subjects' : subject}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section Filter Pills */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Filter by Section
                </Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: Spacing.xs, paddingBottom: Spacing.xs, marginBottom: Spacing.md }}
              >
                {['All', ...uniqueSections, 'No Section'].map((sec) => {
                  const active = telemetrySelectedSection === sec;
                  const label = sec === 'All' ? 'All Sections' : sec === 'No Section' ? 'No Section / Guest' : sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      onPress={() => setTelemetrySelectedSection(sec)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: Spacing.xs,
                        borderRadius: Radius.full,
                        backgroundColor: active ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: active ? Colors.accentSecondary : Colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: active ? Fonts.bodyBold : Fonts.body,
                          fontSize: FontSizes.xs,
                          color: active ? Colors.accentSecondary : Colors.textMuted,
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              
              {loadingTelemetry ? (
                <ActivityIndicator size="small" color={Colors.accentPrimary} style={{ marginVertical: Spacing.md }} />
              ) : filteredTelemetry.length === 0 ? (
                <Text style={styles.emptyText}>No matching telemetry logs.</Text>
              ) : (
                filteredTelemetry.slice(0, 10).map((evt) => {
                  const pct = Math.round((evt.score / evt.totalQuestions) * 100);
                  const isSuccess = pct >= 80;
                  const timeStr = new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <GlassCard key={evt.eventId} variant="subtle" padding={Spacing.sm} style={{ marginBottom: Spacing.xs }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs }}>
                        <TouchableOpacity 
                          style={{ flex: 1, minWidth: 0, marginRight: Spacing.xs }}
                          onPress={() => setSelectedSf9StudentId(evt.studentId)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: Colors.textMain }} numberOfLines={1}>
                            {formatStudentName(evt.studentId)}
                          </Text>
                          <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted }} numberOfLines={1}>
                            {evt.topic} · G{evt.gradeLevel} {evt.subject}
                          </Text>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: Spacing.xs, alignItems: 'center', flexShrink: 0 }}>
                          <View style={{ alignItems: 'flex-end', minWidth: 44 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: FontSizes.sm, color: isSuccess ? Colors.success : Colors.warning }}>
                              {evt.score}/{evt.totalQuestions}
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: 10, color: Colors.textDark }}>
                              {timeStr}
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => setSelectedSf9StudentId(evt.studentId)}
                            activeOpacity={0.8}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 5,
                              backgroundColor: 'rgba(17,66,142,0.1)',
                              borderWidth: 1,
                              borderColor: Colors.accentPrimary,
                              borderRadius: Radius.sm,
                            }}
                          >
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                              SF9
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </GlassCard>
                  );
                })
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>

      {/* ── DepEd SF9 / Form 138 Official Transcript Modal ── */}
      {selectedSf9StudentId && (() => {
        const sf9 = getSf9ReportForStudent(selectedSf9StudentId);
        return (
          <Modal
            visible={true}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setSelectedSf9StudentId(null)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: Spacing.md }}>
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, maxHeight: '90%', padding: Spacing.lg, borderWidth: 1, borderColor: '#CBD5E1' }}>
                
                {/* DepEd SF9 Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#0F172A', paddingBottom: Spacing.sm, marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#11428E', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: '#FFFFFF', fontWeight: '900' }}>DEPED</Text>
                      <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' }}>SF9</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                        Republic of the Philippines • DepEd
                      </Text>
                      <Text style={{ fontFamily: Fonts.display, fontSize: 15, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>
                        School Form 9 (SF9)
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#11428E' }}>
                        Learner Progress Report · SY {sf9.schoolYear}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedSf9StudentId(null)} style={{ padding: 4 }}>
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.xs }}>
                  {/* Learner Info Box */}
                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: Spacing.sm, borderWidth: 1, borderColor: '#E2E8F0', gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Learner Name:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A' }}>{sf9.studentName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Learner ID / LRN:</Text>
                      <Text style={{ fontSize: 11, fontFamily: Fonts.mono, fontWeight: '700', color: '#334155' }}>{sf9.studentId}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Grade & Section:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>Grade {sf9.grade}{sf9.section ? ` - ${sf9.section}` : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Learning Area:</Text>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#11428E' }}>{sf9.subject}</Text>
                    </View>
                  </View>

                  {/* Form 138 Quarterly Grading Table */}
                  <View style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingVertical: 6, paddingHorizontal: 8 }}>
                      <Text style={{ flex: 2, fontSize: 10, fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>Period / Quarter</Text>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: '#334155', textAlign: 'center', textTransform: 'uppercase' }}>Rating</Text>
                      <Text style={{ flex: 1, fontSize: 10, fontWeight: '800', color: '#334155', textAlign: 'center', textTransform: 'uppercase' }}>Remarks</Text>
                    </View>

                    {[
                      { name: 'Quarter 1 (Term 1)', val: sf9.q1 },
                      { name: 'Quarter 2 (Term 2)', val: sf9.q2 },
                      { name: 'Quarter 3 (Term 3)', val: sf9.q3 },
                      { name: 'Quarter 4 (Term 4)', val: sf9.q4 },
                    ].map((qItem, qIdx) => (
                      <View key={qIdx} style={{ flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center' }}>
                        <Text style={{ flex: 2, fontSize: 11, color: '#1E293B', fontWeight: '600' }}>{qItem.name}</Text>
                        <Text style={{ flex: 1, fontSize: 11, fontFamily: Fonts.mono, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                          {qItem.val !== null ? `${qItem.val}%` : '—'}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', textAlign: 'center', color: qItem.val !== null ? (qItem.val >= 75 ? '#047857' : '#DC2626') : '#94A3B8' }}>
                          {qItem.val !== null ? (qItem.val >= 75 ? 'Passed' : 'Failed') : 'Pending'}
                        </Text>
                      </View>
                    ))}

                    {/* General Average Row */}
                    <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#CBD5E1' }}>
                      <Text style={{ flex: 2, fontSize: 11, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase' }}>General Final Average</Text>
                      <Text style={{ flex: 1, fontSize: 13, fontFamily: Fonts.mono, fontWeight: '900', color: '#11428E', textAlign: 'center' }}>
                        {sf9.generalAverage}%
                      </Text>
                      <Text style={{ flex: 1, fontSize: 11, fontWeight: '900', textAlign: 'center', color: sf9.generalAverage >= 75 ? '#047857' : '#DC2626' }}>
                        {sf9.generalAverage >= 75 ? 'PASSED' : 'REMEDIAL'}
                      </Text>
                    </View>
                  </View>

                  {/* DepEd Grading Scale Legend */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 }}>
                    <Text style={{ fontSize: 8.5, color: '#64748B' }}>90–100: Outstanding</Text>
                    <Text style={{ fontSize: 8.5, color: '#64748B' }}>85–89: Very Satisfactory</Text>
                    <Text style={{ fontSize: 8.5, color: '#64748B' }}>80–84: Satisfactory</Text>
                    <Text style={{ fontSize: 8.5, color: '#64748B' }}>75–79: Fairly Sat.</Text>
                    <Text style={{ fontSize: 8.5, color: '#64748B' }}>&lt;75: Did Not Meet</Text>
                  </View>

                  {/* Pre/Post Growth Gain Box */}
                  {sf9.preTestAvg !== null && sf9.postTestAvg !== null && (
                    <View style={{ backgroundColor: 'rgba(17,66,142,0.06)', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: 'rgba(17,66,142,0.2)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#11428E' }}>Diagnostic vs Summative Growth</Text>
                        <Text style={{ fontSize: 9.5, color: '#334155', marginTop: 1 }}>
                          Pre: {sf9.preTestAvg}% · Post: {sf9.postTestAvg}%
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#11428E', textTransform: 'uppercase' }}>Normalized Gain</Text>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: '#11428E', fontFamily: Fonts.mono }}>g = {sf9.learningGain}%</Text>
                      </View>
                    </View>
                  )}

                  {/* Certificate of Promotion */}
                  <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                      Certificate of Promotion
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
                      {sf9.isEligible 
                        ? `Eligible for admission to Grade ${sf9.nextGrade}`
                        : `Needs remedial coursework in Grade ${sf9.grade}`}
                    </Text>
                  </View>

                  {/* Signature Placeholders with Editable Inputs */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                    <View style={{ alignItems: 'center', flex: 1, maxWidth: 140 }}>
                      <TextInput
                        value={sf9AdviserName}
                        onChangeText={setSf9AdviserName}
                        placeholder="Adviser Name"
                        placeholderTextColor="#94A3B8"
                        style={{ fontSize: 9.5, fontWeight: '700', color: '#0F172A', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#64748B', width: '100%', paddingVertical: 1, marginBottom: 2 }}
                      />
                      <Text style={{ fontSize: 8.5, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Class Adviser</Text>
                    </View>
                    <View style={{ alignItems: 'center', flex: 1, maxWidth: 140 }}>
                      <TextInput
                        value={sf9PrincipalName}
                        onChangeText={setSf9PrincipalName}
                        placeholder="Principal Name"
                        placeholderTextColor="#94A3B8"
                        style={{ fontSize: 9.5, fontWeight: '700', color: '#0F172A', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#64748B', width: '100%', paddingVertical: 1, marginBottom: 2 }}
                      />
                      <Text style={{ fontSize: 8.5, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>School Head</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => setSelectedSf9StudentId(null)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleExportSf9(selectedSf9StudentId)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#11428E', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                  >
                    <Download size={14} color="#FFFFFF" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Save SF9</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* Delete Lesson Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteTopicTarget}
        title="Delete Lesson?"
        message={
          deleteTopicTarget
            ? `Are you sure you want to delete "${deleteTopicTarget.topic}" (${deleteTopicTarget.subject} · Grade ${deleteTopicTarget.grade}) from this classroom? Students will no longer see it.`
            : ''
        }
        confirmText="Delete Lesson"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
        loading={isDeletingTopic}
        onConfirm={executeDeleteTopic}
        onCancel={() => setDeleteTopicTarget(null)}
      />
    </SafeAreaView>
  );
}
