import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  RefreshCw, 
  Clock, 
  Search, 
  User, 
  School, 
  CheckCircle2,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  History,
  X,
  Ban
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

interface Message {
  id: number;
  classroom_id: string;
  student_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'parent' | 'teacher' | 'admin';
  message_body: string;
  created_at: string;
  read_at: string | null;
  is_unsent?: boolean;
  unsent_at?: string | null;
  original_message_body?: string | null;
  edit_history?: Array<{ previous_body: string; edited_at: string }> | null;
  edited_at?: string | null;
}

interface Thread {
  studentId: string;
  studentName: string;
  latestMessage: string;
  latestSenderRole: 'parent' | 'teacher' | 'admin';
  latestSenderName: string;
  latestTimestamp: string | null;
  unreadCount: number;
}

interface ClassroomOption {
  id: string;
  teacherName: string;
  subject: string;
  gradeLevel: number;
  schoolYear?: string;
  term?: string;
  sectionName?: string;
}

interface ParentConsultationHubProps {
  currentUser?: {
    userId: string;
    email: string;
    name: string;
    role: string;
    classroomId?: string | null;
  } | null;
  classroomHistory?: ClassroomOption[];
}

export function ParentConsultationHub({ currentUser, classroomHistory = [] }: ParentConsultationHubProps) {
  // Available classrooms
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>(classroomHistory);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(() => {
    if (classroomHistory.length > 0) return classroomHistory[0].id;
    return currentUser?.classroomId || '';
  });

  // Threads state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active student conversation
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [consultationHours, setConsultationHours] = useState<string>('');
  const [activeTeacherName, setActiveTeacherName] = useState<string>('');

  // Composer
  const [replyText, setReplyText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Auto scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync classrooms from history prop or fetch
  useEffect(() => {
    if (classroomHistory.length > 0) {
      setClassrooms(classroomHistory);
      if (!selectedClassroomId) {
        setSelectedClassroomId(classroomHistory[0].id);
      }
    } else {
      // Fallback: fetch my classrooms
      apiFetch('/api/classroom/my-classrooms')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.classrooms) && data.classrooms.length > 0) {
            const list: ClassroomOption[] = data.classrooms.map((c: any) => ({
              id: c.classroom_id,
              teacherName: c.teacher_name,
              subject: c.subject,
              gradeLevel: c.grade_level,
              schoolYear: c.school_year,
              term: c.term,
              sectionName: c.section_name,
            }));
            setClassrooms(list);
            if (!selectedClassroomId) setSelectedClassroomId(list[0].id);
          }
        })
        .catch(() => {});
    }
  }, [classroomHistory]);

  // Fetch threads when classroom changes
  const fetchThreads = async (classroomId: string) => {
    if (!classroomId) return;
    setLoadingThreads(true);
    try {
      const res = await apiFetch(`/api/chat/threads?classroomId=${encodeURIComponent(classroomId)}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (data.consultationHours) setConsultationHours(data.consultationHours);
        if (data.teacherName) setActiveTeacherName(data.teacherName);

        // Auto-select first thread if none selected
        if (!activeStudentId && data.threads && data.threads.length > 0) {
          setActiveStudentId(data.threads[0].studentId);
        }
      }
    } catch (e) {
      console.warn('[ParentConsultationHub] Failed to fetch threads:', e);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    if (selectedClassroomId) {
      fetchThreads(selectedClassroomId);
    }
  }, [selectedClassroomId]);

  // Fetch messages for selected student
  const fetchMessages = async (classroomId: string, studentId: string) => {
    if (!classroomId || !studentId) return;
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/api/chat/messages?classroomId=${encodeURIComponent(classroomId)}&studentId=${encodeURIComponent(studentId)}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = data.messages || [];
        setMessages(msgs);
        if (data.consultationHours) setConsultationHours(data.consultationHours);
        if (data.teacherName) setActiveTeacherName(data.teacherName);

        // Mark unread parent messages as read
        const unreadIds = msgs
          .filter(m => m.sender_role === 'parent' && !m.read_at)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
          apiFetch('/api/chat/mark-read', {
            method: 'POST',
            body: JSON.stringify({ messageIds: unreadIds }),
          }).then(() => {
            // Update unread count locally in threads list
            setThreads(prev => prev.map(t => t.studentId === studentId ? { ...t, unreadCount: 0 } : t));
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[ParentConsultationHub] Failed to fetch messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedClassroomId && activeStudentId) {
      fetchMessages(selectedClassroomId, activeStudentId);
    }
  }, [selectedClassroomId, activeStudentId]);

  // Auto-scroll on messages update
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Send Message
  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || !selectedClassroomId || !activeStudentId || isSending) return;

    setIsSending(true);
    try {
      const res = await apiFetch('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          studentId: activeStudentId,
          messageBody: text,
          senderRole: 'teacher',
          senderName: currentUser?.name || activeTeacherName || 'Teacher',
          senderId: currentUser?.userId || 'teacher',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyText('');
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        } else {
          await fetchMessages(selectedClassroomId, activeStudentId);
        }
        // Update latest message in thread list
        setThreads(prev => prev.map(t => {
          if (t.studentId === activeStudentId) {
            return {
              ...t,
              latestMessage: text,
              latestSenderRole: 'teacher',
              latestSenderName: currentUser?.name || 'You',
              latestTimestamp: new Date().toISOString(),
            };
          }
          return t;
        }));
        toast.success('Consultation reply sent.');
      } else {
        toast.error('Failed to send message.');
      }
    } catch (e) {
      toast.error('Network error while delivering reply.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Message edit & forgiveness states
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [historyModalMessage, setHistoryModalMessage] = useState<Message | null>(null);

  const handleStartEdit = (msg: Message) => {
    const isWithin30Mins = Date.now() - new Date(msg.created_at).getTime() <= 30 * 60 * 1000;
    if (!isWithin30Mins) {
      toast.error('Messages can only be edited within 30 minutes of sending.');
      return;
    }
    setEditingMessageId(msg.id);
    setEditingText(msg.message_body);
    setActiveMenuMessageId(null);
  };

  const handleSaveEdit = async (messageId: number) => {
    const textToSave = editingText.trim();
    if (!textToSave) return;

    const targetMsg = messages.find(m => m.id === messageId);
    const previousBody = targetMsg ? targetMsg.message_body : '';

    // 1. Optimistic UI update: instantly update bubble and dismiss inline input
    setMessages(prev => prev.map(m => m.id === messageId ? {
      ...m,
      message_body: textToSave,
      edited_at: m.edited_at || new Date().toISOString(),
      original_message_body: m.original_message_body || previousBody,
    } : m));

    setThreads(prev => prev.map(t => {
      if (t.studentId === activeStudentId) {
        return { ...t, latestMessage: textToSave };
      }
      return t;
    }));

    setEditingMessageId(null);
    setEditingText('');
    setIsSubmittingEdit(true);

    try {
      const res = await apiFetch('/api/chat/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          messageBody: textToSave,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...data.message } : m));
        toast.success('Message updated.');
      } else {
        // Rollback on rejection
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_body: previousBody } : m));
        toast.error(data.error || 'Failed to edit message.');
      }
    } catch {
      // Rollback on network failure
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, message_body: previousBody } : m));
      toast.error('Network error while updating message.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleUnsend = async (messageId: number) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg) return;

    // 1. Optimistic UI update: instantly show unsent state
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_unsent: true } : m));
    setThreads(prev => prev.map(t => {
      if (t.studentId === activeStudentId) {
        return { ...t, latestMessage: 'This message was unsent' };
      }
      return t;
    }));
    setActiveMenuMessageId(null);

    try {
      const res = await apiFetch('/api/chat/unsend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...data.message, is_unsent: true } : m));
        toast.success('Message unsent.');
      } else {
        // Rollback
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_unsent: false } : m));
        toast.error(data.error || 'Failed to unsend message.');
      }
    } catch {
      // Rollback
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_unsent: false } : m));
      toast.error('Network error while unsending message.');
    }
  };

  const filteredThreads = threads.filter(t => 
    t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeThread = threads.find(t => t.studentId === activeStudentId);
  const selectedClassroomObj = classrooms.find(c => c.id === selectedClassroomId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
      
      {/* ── Top Bar: Classroom selector & DepEd Consultation Window ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#11428E]/10 border border-[#11428E]/20 flex items-center justify-center text-[#11428E] dark:text-blue-400">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              Parent Consultations & Inquiries
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#11428E]/10 text-[#11428E] dark:text-blue-300 border border-[#11428E]/20">
                Live 2-Way Chat
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Direct two-way consultation link with registered parents for guidance and academic updates.
            </p>
          </div>
        </div>

        {/* Search Student or ID + Refresh Messages */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--bg-main)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] w-56 sm:w-64 md:w-72 focus-within:border-[#11428E] focus-within:ring-2 focus-within:ring-[#11428E]/10 transition-all">
            <Search size={14} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or ID..."
              className="bg-transparent text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none w-full"
              aria-label="Search student or ID"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedClassroomId) {
                fetchThreads(selectedClassroomId);
                if (activeStudentId) fetchMessages(selectedClassroomId, activeStudentId);
              }
            }}
            disabled={loadingThreads || loadingMessages}
            title="Refresh messages"
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            aria-label="Refresh consultation messages"
          >
            <RefreshCw size={15} className={loadingThreads || loadingMessages ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── 2-Column Messaging Workspace ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Column: Student Inquiries Directory (Width 340px) */}
        <div className="w-80 md:w-96 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-sidebar)] shrink-0">
          
          {/* Classroom / Section Filter */}
          <div className="p-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 bg-[var(--bg-main)] px-3 py-2 rounded-xl border border-[var(--border-color)] focus-within:border-[#11428E] focus-within:ring-2 focus-within:ring-[#11428E]/10 transition-all">
              <School size={16} className="text-[#11428E] dark:text-blue-400 shrink-0" />
              <select
                value={selectedClassroomId}
                onChange={(e) => {
                  setSelectedClassroomId(e.target.value);
                  setActiveStudentId(null);
                }}
                className="bg-transparent text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer w-full pr-2"
                aria-label="Select Classroom"
              >
                {classrooms.length === 0 ? (
                  <option value="">No classrooms found</option>
                ) : (
                  classrooms.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--bg-card)] text-[var(--text-main)]">
                      {c.sectionName ? `${c.sectionName} (${c.id})` : c.id} — Gr. {c.gradeLevel} {c.subject}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Consultation Hours Badge */}
          <div className="px-3 py-2.5 bg-[#11428E]/5 border-b border-[var(--border-color)] flex items-center gap-2 text-xs text-[#11428E] dark:text-blue-300">
            <Clock size={13} className="shrink-0" />
            <span className="truncate text-[11px] font-medium">
              {consultationHours || 'DepEd Hours: Mon–Fri 3:00 PM – 5:00 PM'}
            </span>
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
            {loadingThreads ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                <RefreshCw size={18} className="animate-spin text-[#11428E]" />
                <span>Loading parent conversations...</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]">
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-main)]">No Inquiries Found</div>
                  <p className="text-[11px] mt-1 max-w-[200px] leading-relaxed">
                    {searchQuery 
                      ? 'No students matching your search.' 
                      : 'Parents have not submitted any consultation notes for this class yet.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.studentId === activeStudentId;
                const formattedTime = thread.latestTimestamp
                  ? new Date(thread.latestTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <button
                    key={thread.studentId}
                    onClick={() => setActiveStudentId(thread.studentId)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                      isActive 
                        ? 'bg-[#11428E]/10 border-l-4 border-l-[#11428E]' 
                        : 'hover:bg-white/5 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shrink-0 font-bold text-xs text-[#11428E] dark:text-blue-400">
                      {thread.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-xs truncate ${isActive ? 'font-bold text-[#11428E] dark:text-blue-300' : 'font-semibold text-[var(--text-main)]'}`}>
                          {thread.studentName}
                        </span>
                        {formattedTime && (
                          <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">
                            {formattedTime}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
                        {thread.latestSenderRole === 'parent' ? (
                          <span className="text-amber-500 font-semibold mr-1">Parent:</span>
                        ) : (
                          <span className="text-[#11428E] dark:text-blue-400 font-semibold mr-1">You:</span>
                        )}
                        {thread.latestMessage || 'No messages yet'}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#11428E] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs tabular-nums">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Thread */}
        <div className="flex-1 flex flex-col bg-[var(--bg-main)]">
          {activeStudentId ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-6 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#11428E]/10 border border-[#11428E]/20 flex items-center justify-center font-extrabold text-sm text-[#11428E] dark:text-blue-400">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--text-main)]">
                        {activeThread ? activeThread.studentName : activeStudentId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] font-mono">
                        {activeStudentId}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Class: <span className="font-semibold text-[var(--text-main)]">{selectedClassroomId}</span>
                      {selectedClassroomObj && ` · Grade ${selectedClassroomObj.gradeLevel} ${selectedClassroomObj.subject}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 size={13} /> Linked to Student App
                  </span>
                </div>
              </div>

              {/* Messages History Pane */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">
                {loadingMessages ? (
                  <div className="m-auto text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                    <RefreshCw size={20} className="animate-spin text-[#11428E]" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-center max-w-sm py-12 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#11428E]">
                      <MessageCircle size={26} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-main)]">Start a Parent Consultation</div>
                      <p className="text-xs mt-1 text-[var(--text-muted)] leading-relaxed">
                        No messages have been sent yet. Write a message below to share progress updates, remedial recommendations, or answers to parent inquiries.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isTeacher = msg.sender_role === 'teacher';
                    const isEditing = editingMessageId === msg.id;
                    const isMenuOpen = activeMenuMessageId === msg.id;
                    const isUnsent = msg.is_unsent;
                    const isEdited = Boolean(msg.edited_at);
                    const timeStr = msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const isWithin30Mins = Date.now() - new Date(msg.created_at).getTime() <= 30 * 60 * 1000;

                    return (
                      <div
                        key={msg.id}
                        className={`group relative flex flex-col max-w-[75%] md:max-w-[65%] ${
                          isTeacher ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isTeacher ? 'text-[#11428E] dark:text-blue-300' : 'text-amber-500'
                          }`}>
                            {isTeacher ? 'You (Teacher)' : (msg.sender_name || 'Parent')}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                            {timeStr}
                          </span>
                          {isEdited && !isUnsent && (
                            <button
                              type="button"
                              onClick={() => setHistoryModalMessage(msg)}
                              className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[#11428E] dark:hover:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                              title="Click to view original message"
                              aria-label="View edit history"
                            >
                              <span>(edited)</span>
                            </button>
                          )}
                        </div>

                        {isUnsent ? (
                          <div className="italic text-xs text-[var(--text-muted)] bg-[var(--bg-main)] border border-dashed border-[var(--border-color)] px-3.5 py-2 rounded-2xl flex items-center gap-1.5 opacity-80">
                            <Ban size={12} className="opacity-50" />
                            <span>{isTeacher ? 'You unsent a message' : 'This message was unsent'}</span>
                          </div>
                        ) : isEditing ? (
                          <div className="w-full bg-[var(--bg-card)] border-2 border-[#11428E] rounded-2xl p-3 shadow-lg flex flex-col gap-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={2}
                              className="w-full bg-transparent text-xs text-[var(--text-main)] outline-none resize-none leading-relaxed"
                              autoFocus
                            />
                            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]">
                              <span className="text-[10px] text-[var(--text-muted)]">30m edit window • Original kept</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageId(null)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(msg.id)}
                                  disabled={!editingText.trim() || isSubmittingEdit}
                                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-[#11428E] text-white hover:bg-[#0d3470] cursor-pointer disabled:opacity-50"
                                >
                                  {isSubmittingEdit ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/bubble">
                            {/* Single 3-Dot Action Menu OUTSIDE the text bubble (for sender: Teacher) */}
                            {isTeacher && (
                              <div className="relative order-first">
                                <button
                                  type="button"
                                  onClick={() => setActiveMenuMessageId(isMenuOpen ? null : msg.id)}
                                  className="p-1.5 rounded-lg border border-transparent hover:border-[var(--border-color)] bg-transparent hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer shadow-2xs"
                                  aria-label="Message options"
                                  title="Message options"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {isMenuOpen && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveMenuMessageId(null)}
                                    />
                                    <div
                                      className="absolute right-0 top-full mt-1 z-30 w-36 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col text-xs"
                                    >
                                      {/* Only show edit if within 30-minute window */}
                                      {isWithin30Mins && (
                                        <button
                                          type="button"
                                          onClick={() => handleStartEdit(msg)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--bg-main)] text-[var(--text-main)]"
                                        >
                                          <Edit2 size={12} />
                                          <span>Edit message</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleUnsend(msg.id)}
                                        className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors font-medium"
                                      >
                                        <Trash2 size={12} />
                                        <span>Unsend</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            <div
                              className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                isTeacher
                                  ? 'bg-[#11428E] text-white rounded-tr-xs'
                                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-tl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message_body}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-end gap-3">
                <div className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 focus-within:border-[#11428E] transition-colors">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type consultation reply... (Enter to send, Shift+Enter for new line)"
                    rows={2}
                    className="w-full bg-transparent text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none resize-none leading-relaxed"
                  />
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || isSending}
                  className="px-5 py-3 rounded-xl bg-[#11428E] hover:bg-[#0d3470] text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md"
                  aria-label="Send consultation reply"
                >
                  <Send size={15} />
                  <span>{isSending ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="m-auto text-center max-w-sm p-8 text-[var(--text-muted)] flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[#11428E]/60">
                <MessageCircle size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">Select a Student Inquiry</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  Choose a student from the left panel to review parent consultation history and send direct answers.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Edit History Modal (Messenger style) */}
      {historyModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)]">
                <History size={16} className="text-[#11428E] dark:text-blue-400" />
                <span>Edit History</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalMessage(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Original Message */}
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  <span>Original Message</span>
                  <span className="tabular-nums font-mono">
                    {historyModalMessage.created_at ? new Date(historyModalMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-main)] whitespace-pre-wrap mt-1">
                  {historyModalMessage.original_message_body || historyModalMessage.message_body}
                </p>
              </div>

              {/* Current Edited Message */}
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#11428E]/10 border border-[#11428E]/20">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#11428E] dark:text-blue-400 uppercase">
                  <span>Edited Version</span>
                  <span className="tabular-nums font-mono">
                    {historyModalMessage.edited_at ? new Date(historyModalMessage.edited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-main)] whitespace-pre-wrap mt-1">
                  {historyModalMessage.message_body}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalMessage(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
