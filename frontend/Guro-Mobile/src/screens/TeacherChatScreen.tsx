import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Keyboard,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, resolveServerUrl } from '../store/useAppStore';
import { Colors } from '../theme/colors';
import { Fonts, FontSizes } from '../theme/typography';
import { Spacing, Radius } from '../theme/spacing';
import { GlassCard } from '../components/ui/GlassCard';
import { PrimaryButton, SecondaryButton } from '../components/ui/Buttons';
import { ThemedTextInput } from '../components/ui/ThemedTextInput';
import { SyncBadge } from '../components/shared/SyncBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components';
import {
  MessageSquare,
  MessageCircle,
  Calendar,
  Clock,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  History,
  X,
  Ban,
  RefreshCw,
  User,
  Users,
  School,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
} from 'lucide-react-native';

export interface ChatThread {
  studentId: string;
  studentName: string;
  parentName?: string;
  latestMessage?: string;
  latestSenderRole?: string;
  latestSenderName?: string;
  latestTimestamp?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  classroom_id?: string;
  student_id?: string;
  sender_id?: string;
  sender_name?: string;
  sender_role: string;
  message_body: string;
  created_at: string;
  is_unsent?: boolean;
  unsent_at?: string | null;
  original_message_body?: string | null;
  edited_at?: string | null;
  edit_history?: Array<{ previous_body: string; edited_at: string }> | null;
}

const formatTime = (ts?: string | null) => {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export function TeacherChatScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((state) => state.currentUser);
  const activeSchoolYear = useAppStore((state) => state.activeSchoolYear || '2026-2027');
  const activeTerm = useAppStore((state) => state.activeTerm || 'Quarter 1');
  const storedClassroomId = useAppStore((state) => state.classroomId);
  const serverUrlFromStore = useAppStore((state) => state.serverUrl);
  const serverUrl = serverUrlFromStore || process.env.EXPO_PUBLIC_API_URL || 'https://neoguro.app';

  const [activeClassroomId, setActiveClassroomId] = useState<string>(currentUser?.classroomId || storedClassroomId || '');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [consultationHours, setConsultationHours] = useState<string>('Monday – Friday: 3:00 PM – 5:00 PM');
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Forgiveness & options state
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  const [selectedActionMessage, setSelectedActionMessage] = useState<ChatMessage | null>(null);
  const [editingModalMessage, setEditingModalMessage] = useState<ChatMessage | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [viewHistoryMessage, setViewHistoryMessage] = useState<ChatMessage | null>(null);
  const [isConfirmingUnsend, setIsConfirmingUnsend] = useState<boolean>(false);

  const chatScrollRef = useRef<ScrollView>(null);

  // Fetch threads for teacher classroom
  const fetchThreads = async (classroomIdToUse?: string) => {
    const cId = classroomIdToUse || activeClassroomId;
    if (!cId) return;
    setLoadingThreads(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/threads?classroomId=${encodeURIComponent(cId)}`);
      if (res.ok) {
        const data = await res.json();
        const threadList: ChatThread[] = data.threads || [];
        setThreads(threadList);
        if (data.consultationHours) setConsultationHours(data.consultationHours);

        // Keep active student if already selected; otherwise stay on inbox list
        if (activeStudentId && !threadList.some((t) => t.studentId === activeStudentId)) {
          setActiveStudentId(null);
        }
      }
    } catch (e) {
      console.warn('[TeacherChatScreen] fetchThreads error:', e);
    } finally {
      setLoadingThreads(false);
      setRefreshing(false);
    }
  };

  // Fetch messages for active student thread
  const fetchMessages = async (studentIdToUse?: string) => {
    const sId = studentIdToUse || activeStudentId;
    if (!activeClassroomId || !sId) return;
    setLoadingMessages(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/messages?classroomId=${encodeURIComponent(activeClassroomId)}&studentId=${encodeURIComponent(sId)}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: ChatMessage[] = data.messages || [];
        setMessages(msgs);
        if (data.consultationHours) setConsultationHours(data.consultationHours);

        // Mark unread parent messages as read
        const unreadParentMsgIds = msgs
          .filter((m) => m.sender_role === 'parent')
          .map((m) => m.id);

        if (unreadParentMsgIds.length > 0) {
          fetch(`${resolvedUrl}/api/chat/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: unreadParentMsgIds }),
          }).then(() => {
            setThreads((prev) =>
              prev.map((t) => (t.studentId === sId ? { ...t, unreadCount: 0 } : t))
            );
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[TeacherChatScreen] fetchMessages error:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeClassroomId) {
      fetchThreads(activeClassroomId);
    }
  }, [activeClassroomId]);

  useEffect(() => {
    if (activeStudentId) {
      fetchMessages(activeStudentId);
    }
  }, [activeStudentId]);

  // Synchronize keyboard open/hide events to ensure active thread text is not obscured
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard?.addListener
      ? Keyboard.addListener(showEvent, () => {
          setIsKeyboardVisible(true);
          requestAnimationFrame(() => {
            chatScrollRef.current?.scrollToEnd({ animated: true });
          });
          setTimeout(() => {
            chatScrollRef.current?.scrollToEnd({ animated: true });
          }, 200);
        })
      : undefined;

    const hideSub = Keyboard?.addListener
      ? Keyboard.addListener(hideEvent, () => {
          setIsKeyboardVisible(false);
        })
      : undefined;

    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

  // Auto-scroll when messages stream updates
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      });
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length, activeStudentId]);

  // Send message from teacher
  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeClassroomId || !activeStudentId || isSending) return;

    setIsSending(true);
    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const teacherName = currentUser?.name || 'Teacher';
      const teacherId = currentUser?.userId || 'teacher';

      const res = await fetch(`${resolvedUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: activeClassroomId,
          studentId: activeStudentId,
          messageBody: text,
          senderRole: 'teacher',
          senderName: teacherName,
          senderId: teacherId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInputText('');
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        } else {
          await fetchMessages(activeStudentId);
        }
        requestAnimationFrame(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        });
        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 150);

        // Update local thread preview
        setThreads((prev) =>
          prev.map((t) =>
            t.studentId === activeStudentId
              ? {
                  ...t,
                  latestMessage: text,
                  latestSenderRole: 'teacher',
                  latestSenderName: 'You',
                  latestTimestamp: new Date().toISOString(),
                }
              : t
          )
        );

        setTimeout(() => {
          chatScrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
        toast.success('Consultation reply sent.');
      } else {
        toast.error('Failed to send consultation reply.');
      }
    } catch {
      toast.error('Network error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  // Optimistic edit handler
  const handleSaveTeacherEdit = async () => {
    if (!editingModalMessage || !editingText.trim()) return;
    const msgId = editingModalMessage.id;
    const newText = editingText.trim();
    const prevMsg = messages.find((m) => m.id === msgId);
    const previousBody = prevMsg?.message_body || editingModalMessage.message_body;

    // 1. Optimistic UI update: instantly update bubble and dismiss modal (0ms latency)
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              message_body: newText,
              edited_at: m.edited_at || new Date().toISOString(),
              original_message_body: m.original_message_body || previousBody,
            }
          : m
      )
    );
    setEditingModalMessage(null);
    setEditingText('');
    setIsSavingEdit(true);

    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          messageBody: newText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, ...data.message } : m))
        );
        toast.success('Message updated.');
      } else {
        // Rollback
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, message_body: previousBody } : m))
        );
        toast.error(data.error || 'Failed to edit message.');
      }
    } catch {
      // Rollback
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, message_body: previousBody } : m))
      );
      toast.error('Network error updating message.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Optimistic unsend handler
  const handleUnsendTeacher = async (msg: ChatMessage) => {
    const diffMins = (Date.now() - new Date(msg.created_at).getTime()) / (60 * 1000);
    if (diffMins > 30) {
      toast.error('Messages can only be unsent within 30 minutes of sending.');
      setSelectedActionMessage(null);
      setIsConfirmingUnsend(false);
      return;
    }
    const prevUnsent = msg.is_unsent;
    const msgId = Number(msg.id);
    // 1. Optimistic UI update: instantly mark unsent
    setMessages((prev) =>
      prev.map((m) => (Number(m.id) === msgId || m.id === msg.id ? { ...m, is_unsent: true } : m))
    );
    setThreads((prev) =>
      prev.map((t) => (t.studentId === activeStudentId ? { ...t, latestMessage: 'This message was unsent' } : t))
    );
    setSelectedActionMessage(null);
    setIsConfirmingUnsend(false);

    try {
      const resolvedUrl = resolveServerUrl(serverUrl);
      const res = await fetch(`${resolvedUrl}/api/chat/unsend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessages((prev) =>
          prev.map((m) => (Number(m.id) === msgId || m.id === msg.id ? { ...m, is_unsent: true, ...data.message } : m))
        );
        toast.success('Message unsent.');
      } else {
        // Rollback
        setMessages((prev) =>
          prev.map((m) => (Number(m.id) === msgId || m.id === msg.id ? { ...m, is_unsent: prevUnsent } : m))
        );
        toast.error(data.error || 'Failed to unsend message.');
      }
    } catch {
      // Rollback
      setMessages((prev) =>
        prev.map((m) => (Number(m.id) === msgId || m.id === msg.id ? { ...m, is_unsent: prevUnsent } : m))
      );
      toast.error('Network error unsending message.');
    }
  };

  const activeThread = threads.find((t) => t.studentId === activeStudentId);

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.studentName.toLowerCase().includes(q) ||
      (t.parentName && t.parentName.toLowerCase().includes(q)) ||
      t.studentId.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgMain }} edges={['top', 'left', 'right']}>
      {!activeStudentId ? (
        /* ── INBOX LIST VIEW (Messenger-Style Thread List First) ── */
        <View style={{ flex: 1, backgroundColor: Colors.bgApp }}>
          {/* Sticky Top Header with S.Y. & Consultation Hours */}
          <View
            style={{
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.md,
              paddingBottom: Spacing.sm,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* Top Blue Line */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: Colors.accentPrimary,
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.lg, color: Colors.textMain, letterSpacing: -0.5, fontWeight: '700' }}>
                  Parent Consultation
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(17,66,142,0.08)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(17,66,142,0.15)',
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    marginBottom: 3,
                  }}
                >
                  <Calendar size={11} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary }}>
                    {`S.Y. ${activeSchoolYear} • ${activeTerm}`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                  <Clock size={11} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                    {consultationHours || 'Monday – Friday: 3:00 PM – 5:00 PM'}
                  </Text>
                </View>
              </View>

              {/* Right Stack: TEACHER badge on top, Connected status on 2nd line */}
              <View style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', gap: 4, flexShrink: 0 }}>
                <View
                  style={{
                    backgroundColor: 'rgba(17,66,142,0.08)',
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(17,66,142,0.18)',
                  }}
                >
                  <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary, letterSpacing: 0.5 }}>
                    TEACHER
                  </Text>
                </View>
                <SyncBadge />
              </View>
            </View>
          </View>

          {/* Search Input Bar */}
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.border,
                paddingHorizontal: 10,
                height: 42,
              }}
            >
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                placeholder="Search students or parents..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontFamily: Fonts.body,
                  fontSize: 13,
                  color: Colors.textMain,
                  paddingVertical: 0,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Inbox Conversations List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, paddingBottom: Spacing.xxl }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchThreads();
                }}
                colors={[Colors.accentPrimary]}
                tintColor={Colors.accentPrimary}
              />
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs, marginTop: 4 }}>
              <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Conversations ({filteredThreads.length})
              </Text>
              <TouchableOpacity onPress={() => fetchThreads()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Refresh conversations">
                <RefreshCw size={13} color={Colors.accentPrimary} />
              </TouchableOpacity>
            </View>

            {loadingThreads && threads.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
                  Loading conversations...
                </Text>
              </View>
            ) : filteredThreads.length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: 'center', paddingHorizontal: Spacing.xl }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: 'rgba(17,66,142,0.08)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: Spacing.sm,
                  }}
                >
                  <MessageSquare size={24} color={Colors.accentPrimary} />
                </View>
                <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700', textAlign: 'center' }}>
                  No Conversations Found
                </Text>
                <Text style={{ fontFamily: Fonts.body, fontSize: FontSizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
                  {searchQuery
                    ? 'No student or parent matches your search query.'
                    : 'When parents send consultation messages regarding their children, conversations will appear here.'}
                </Text>
              </View>
            ) : (
              filteredThreads.map((thread) => {
                const initials =
                  thread.studentName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase() || 'ST';
                const hasUnread = (thread.unreadCount || 0) > 0;
                return (
                  <TouchableOpacity
                    key={thread.studentId}
                    accessibilityRole="button"
                    accessibilityLabel={`Open conversation with ${thread.studentName}`}
                    onPress={() => {
                      setActiveStudentId(thread.studentId);
                      fetchMessages(thread.studentId);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      padding: Spacing.sm,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: hasUnread ? 'rgba(17,66,142,0.3)' : Colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    {/* Circle Avatar with Initials */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: hasUnread ? 'rgba(17,66,142,0.15)' : 'rgba(17,66,142,0.08)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.accentPrimary }}>
                        {initials}
                      </Text>
                    </View>

                    {/* Details */}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text numberOfLines={1} style={{ fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.textMain, flex: 1, marginRight: 6 }}>
                          {thread.studentName}
                        </Text>
                        {thread.latestTimestamp && (
                          <Text style={{ fontFamily: Fonts.body, fontSize: 10.5, color: Colors.textMuted }}>
                            {formatTime(thread.latestTimestamp)}
                          </Text>
                        )}
                      </View>

                      {thread.parentName ? (
                        <Text numberOfLines={1} style={{ fontFamily: Fonts.bodySemiBold, fontSize: 11.5, color: Colors.accentPrimary, marginTop: 1 }}>
                          Parent: {thread.parentName}
                        </Text>
                      ) : null}

                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: hasUnread ? Fonts.bodyBold : Fonts.body,
                          fontSize: 12.5,
                          color: hasUnread ? Colors.textMain : Colors.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {thread.latestMessage || 'No messages yet'}
                      </Text>
                    </View>

                    {/* Right: Unread Badge & Chevron */}
                    <View style={{ alignItems: 'flex-end', marginLeft: 8, gap: 4 }}>
                      {hasUnread && (
                        <View
                          style={{
                            backgroundColor: Colors.accentPrimary,
                            minWidth: 18,
                            height: 18,
                            borderRadius: 9,
                            paddingHorizontal: 5,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: '#FFFFFF' }}>
                            {thread.unreadCount}
                          </Text>
                        </View>
                      )}
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : (
        /* ── ACTIVE CONVERSATION VIEW ── */
        <View style={{ flex: 1 }}>
          {/* Top Header with Back to Conversations Button */}
          <View
            style={{
              paddingHorizontal: Spacing.md,
              paddingTop: Spacing.md,
              paddingBottom: Spacing.sm,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
              position: 'relative',
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            {/* Blue Line on Top */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: Colors.accentPrimary,
              }}
            />

            {/* Row 1: < Chats button on left (above name), TEACHER badge on right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
              <TouchableOpacity
                onPress={() => setActiveStudentId(null)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Back to conversations list"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  backgroundColor: 'rgba(17,66,142,0.08)',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(17,66,142,0.18)',
                }}
              >
                <ChevronLeft size={15} color={Colors.accentPrimary} />
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.accentPrimary }}>
                  Chats
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: 'rgba(17,66,142,0.08)',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(17,66,142,0.18)',
                  flexShrink: 0,
                }}
              >
                <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.accentPrimary, letterSpacing: 0.5 }}>
                  TEACHER
                </Text>
              </View>
            </View>

            {/* Row 2: Student Name & Parent below Chats on left, Connected badge below role on right */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs, gap: Spacing.sm }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700' }}>
                  {activeThread?.studentName || 'Student Consultation'}
                </Text>
                <Text numberOfLines={1} style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                  {activeThread?.parentName ? `Parent: ${activeThread.parentName}` : 'Parent Consultation'}
                </Text>
              </View>

              <SyncBadge />
            </View>
          </View>

      {/* ── Messages Stream ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={chatScrollRef}
          style={{ flex: 1, paddingHorizontal: Spacing.md }}
          contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: Spacing.xl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => {
            chatScrollRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            chatScrollRef.current?.scrollToEnd({ animated: false });
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchThreads();
                if (activeStudentId) fetchMessages(activeStudentId);
              }}
              colors={[Colors.accentPrimary]}
              tintColor={Colors.accentPrimary}
            />
          }
        >
          {loadingMessages ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl }}>
              <ActivityIndicator size="small" color={Colors.accentPrimary} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
                Loading consultation history...
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(17,66,142,0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: Spacing.sm,
                }}
              >
                <MessageCircle size={26} color={Colors.accentPrimary} />
              </View>
              <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700' }}>
                Start a Parent Consultation
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
                No messages yet. Send a message below to share progress updates, remedial recommendations, or answers to parent inquiries.
              </Text>
            </View>
          ) : (
            <>
              {/* Flexible top spacer so consultation bubbles sit directly above the input bar */}
              <View style={{ flex: 1, minHeight: 0 }} />
              {messages.map((msg) => {
                const isTeacher = msg.sender_role === 'teacher';
                const isUnsent = msg.is_unsent;
                const isEdited = Boolean(msg.edited_at);
                const isHovered = hoveredMessageId === msg.id || selectedActionMessage?.id === msg.id;

              if (isUnsent) {
                return (
                  <View
                    key={msg.id}
                    style={{
                      alignSelf: isTeacher ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      marginVertical: 4,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.1)',
                      borderStyle: 'dashed',
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ban size={12} color={Colors.textMuted} />
                    <Text style={{ fontFamily: Fonts.body, fontSize: 12, fontStyle: 'italic', color: Colors.textMuted }}>
                      {isTeacher ? 'You unsent a message' : 'This message was unsent'}
                    </Text>
                  </View>
                );
              }

              return (
                <Pressable
                  key={msg.id}
                  onHoverIn={() => setHoveredMessageId(msg.id)}
                  onHoverOut={() => setHoveredMessageId((cur) => (cur === msg.id ? null : cur))}
                  onPress={() => {
                    if (isTeacher) {
                      setHoveredMessageId((cur) => (cur === msg.id ? null : msg.id));
                    }
                  }}
                  onLongPress={() => {
                    if (isTeacher) {
                      setSelectedActionMessage(msg);
                    }
                  }}
                  delayLongPress={350}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: isTeacher ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    marginVertical: 4,
                    gap: 4,
                  }}
                >
                  {/* Single 3-Dot Action button OUTSIDE the text bubble (for sender: Teacher) - appears on hover/tap */}
                  {isTeacher && (
                    <View
                      style={{
                        opacity: isHovered ? 1 : 0,
                        pointerEvents: isHovered ? 'auto' : 'none',
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setSelectedActionMessage(msg)}
                        accessibilityLabel={`Options for message ${msg.id}`}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{
                          padding: 6,
                          borderRadius: 14,
                          backgroundColor: 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <MoreVertical size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View
                    style={{
                      marginVertical: 0,
                      flexShrink: 1,
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radius.md,
                      borderBottomRightRadius: isTeacher ? 2 : Radius.md,
                      borderBottomLeftRadius: !isTeacher ? 2 : Radius.md,
                      backgroundColor: isTeacher ? Colors.accentPrimary : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isTeacher ? Colors.accentPrimary : Colors.border,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 }}>
                      <Text
                        style={{
                          fontFamily: Fonts.bodyBold,
                          fontSize: 10,
                          color: isTeacher ? 'rgba(255,255,255,0.9)' : Colors.accentPrimary,
                        }}
                      >
                        {isTeacher ? 'You (Teacher)' : (msg.sender_name || 'Parent')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text
                          style={{
                            fontFamily: Fonts.body,
                            fontSize: 9,
                            color: isTeacher ? 'rgba(255,255,255,0.7)' : Colors.textMuted,
                            fontVariant: ['tabular-nums'],
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {isEdited && (
                          <TouchableOpacity
                            onPress={() => setViewHistoryMessage(msg)}
                            accessibilityLabel="View edit history"
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text
                              style={{
                                fontFamily: Fonts.bodyBold,
                                fontSize: 10,
                                color: isTeacher ? 'rgba(255,255,255,0.85)' : Colors.accentPrimary,
                                textDecorationLine: 'underline',
                              }}
                            >
                              (edited)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text
                      style={{
                        fontFamily: Fonts.body,
                        fontSize: FontSizes.xs,
                        color: isTeacher ? '#FFFFFF' : Colors.textMain,
                        lineHeight: 18,
                      }}
                    >
                      {msg.message_body}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            </>
          )}
        </ScrollView>

        {/* ── Sticky Input Bar at Bottom ── */}
        <View
          style={{
            paddingHorizontal: Spacing.md,
            paddingTop: 6,
            paddingBottom: isKeyboardVisible ? 4 : Math.max(insets.bottom, 8),
            backgroundColor: Colors.bgSidebar,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            minHeight: isKeyboardVisible ? 48 : 58,
          }}
        >
          <View style={{ flex: 1 }}>
            <ThemedTextInput
              placeholder={activeStudentId ? "Type reply to parent..." : "Select a student above first..."}
              value={inputText}
              onChangeText={setInputText}
              editable={Boolean(activeStudentId)}
              containerStyle={{ marginBottom: 0 }}
              onFocus={() => {
                setIsKeyboardVisible(true);
                requestAnimationFrame(() => {
                  chatScrollRef.current?.scrollToEnd({ animated: true });
                });
                setTimeout(() => {
                  chatScrollRef.current?.scrollToEnd({ animated: true });
                }, 250);
              }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !activeStudentId || isSending}
            accessibilityLabel="Send reply to parent"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() && activeStudentId ? Colors.accentPrimary : Colors.bgInput,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: inputText.trim() && activeStudentId ? Colors.accentPrimary : Colors.border,
            }}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color={inputText.trim() && activeStudentId ? '#FFFFFF' : Colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )}

      {/* ── Message Options Bottom Sheet / Modal ── */}
      <Modal
        visible={Boolean(selectedActionMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSelectedActionMessage(null);
          setIsConfirmingUnsend(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setSelectedActionMessage(null);
            setIsConfirmingUnsend(false);
          }}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: 360 }}>
            <GlassCard style={{ padding: Spacing.lg, gap: Spacing.md }}>
              {!isConfirmingUnsend ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700' }}>
                      Message Actions
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedActionMessage(null);
                        setIsConfirmingUnsend(false);
                      }}
                      style={{ padding: 4 }}
                    >
                      <X size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 8 }}>
                    {/* Edit Message Button (Displayed always, disabled if > 30 mins) */}
                    {selectedActionMessage && (() => {
                      const isExpired = Date.now() - new Date(selectedActionMessage.created_at).getTime() > 30 * 60 * 1000;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            if (isExpired) return;
                            const target = selectedActionMessage;
                            setSelectedActionMessage(null);
                            setIsConfirmingUnsend(false);
                            setEditingModalMessage(target);
                            setEditingText(target.message_body);
                          }}
                          disabled={isExpired}
                          activeOpacity={isExpired ? 1 : 0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderRadius: 12,
                            backgroundColor: isExpired ? 'rgba(0,0,0,0.03)' : 'rgba(17,66,142,0.06)',
                            opacity: isExpired ? 0.45 : 1,
                          }}
                          accessibilityLabel={isExpired ? "Edit message (disabled, 30-minute window expired)" : "Edit message"}
                        >
                          <Edit2 size={16} color={isExpired ? Colors.textMuted : Colors.accentPrimary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: isExpired ? Colors.textMuted : Colors.textMain }}>
                              Edit Message
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                              {isExpired ? 'Expired • 30-minute limit exceeded' : 'Within 30 minutes of sending'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })()}

                    {/* Unsend Message Button (Displayed always for sender, disabled if > 30 mins) */}
                    {selectedActionMessage &&
                      (selectedActionMessage.sender_role === 'teacher' ||
                        selectedActionMessage.sender_id === (currentUser?.userId || 'teacher')) && (() => {
                      const isExpired = Date.now() - new Date(selectedActionMessage.created_at).getTime() > 30 * 60 * 1000;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            if (isExpired) return;
                            setIsConfirmingUnsend(true);
                          }}
                          disabled={isExpired}
                          activeOpacity={isExpired ? 1 : 0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderRadius: 12,
                            backgroundColor: isExpired ? 'rgba(0,0,0,0.03)' : 'rgba(239,68,68,0.06)',
                            opacity: isExpired ? 0.45 : 1,
                          }}
                          accessibilityLabel={isExpired ? "Unsend message (disabled, 30-minute window expired)" : "Unsend message"}
                        >
                          <Trash2 size={16} color={isExpired ? Colors.textMuted : Colors.danger} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: isExpired ? Colors.textMuted : Colors.danger }}>
                              Unsend Message
                            </Text>
                            <Text style={{ fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted }}>
                              {isExpired ? 'Expired • 30-minute limit exceeded' : 'Within 30 minutes of sending'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={18} color={Colors.danger} />
                    </View>
                    <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.danger, fontWeight: '700' }}>
                      Unsend Message?
                    </Text>
                  </View>

                  <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, lineHeight: 18 }}>
                    This message will be removed for everyone in the consultation chat.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs }}>
                    <SecondaryButton
                      label="Cancel"
                      onPress={() => setIsConfirmingUnsend(false)}
                      style={{ flex: 1 }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const target = selectedActionMessage;
                        if (target) {
                          handleUnsendTeacher(target);
                        }
                      }}
                      accessibilityLabel="Confirm unsend"
                      style={{
                        flex: 1,
                        backgroundColor: Colors.danger,
                        paddingVertical: 12,
                        borderRadius: Radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 13, color: '#FFFFFF' }}>Unsend</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </GlassCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Message Modal ── */}
      <Modal
        visible={Boolean(editingModalMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingModalMessage(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <View style={{ width: '100%', maxWidth: 400 }}>
            <GlassCard style={{ padding: Spacing.lg, gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Edit2 size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700' }}>
                    Edit Consultation Message
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingModalMessage(null)} style={{ padding: 4 }}>
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ThemedTextInput
                value={editingText}
                onChangeText={setEditingText}
                multiline
                numberOfLines={3}
                style={{ minHeight: 70 }}
                placeholder="Edit message..."
              />

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <SecondaryButton
                  label="Cancel"
                  onPress={() => setEditingModalMessage(null)}
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  label={isSavingEdit ? 'Saving...' : 'Save Changes'}
                  onPress={handleSaveTeacherEdit}
                  disabled={!editingText.trim() || isSavingEdit}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit History Modal (Messenger style) ── */}
      <Modal
        visible={Boolean(viewHistoryMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setViewHistoryMessage(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setViewHistoryMessage(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', maxWidth: 400 }}>
            <GlassCard style={{ padding: Spacing.lg, gap: Spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <History size={18} color={Colors.accentPrimary} />
                  <Text style={{ fontFamily: Fonts.display, fontSize: FontSizes.md, color: Colors.textMain, fontWeight: '700' }}>
                    Edit History
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setViewHistoryMessage(null)} style={{ padding: 4 }}>
                  <X size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {viewHistoryMessage && (
                  <View style={{ gap: 12 }}>
                    <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: Colors.border }}>
                      <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>
                        Original Message
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMain }}>
                        {viewHistoryMessage.original_message_body || viewHistoryMessage.message_body}
                      </Text>
                      <Text style={{ fontFamily: Fonts.body, fontSize: 9, color: Colors.textMuted, marginTop: 4 }}>
                        Sent at {new Date(viewHistoryMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {viewHistoryMessage.edited_at && (
                      <View style={{ padding: 10, borderRadius: 10, backgroundColor: 'rgba(17,66,142,0.05)', borderWidth: 1, borderColor: 'rgba(17,66,142,0.15)' }}>
                        <Text style={{ fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.accentPrimary, textTransform: 'uppercase', marginBottom: 2 }}>
                          Current Version
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: Colors.textMain }}>
                          {viewHistoryMessage.message_body}
                        </Text>
                        <Text style={{ fontFamily: Fonts.body, fontSize: 9, color: Colors.textMuted, marginTop: 4 }}>
                          Edited at {new Date(viewHistoryMessage.edited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </GlassCard>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}
