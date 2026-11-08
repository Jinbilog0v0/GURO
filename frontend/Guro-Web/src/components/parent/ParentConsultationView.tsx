import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  RefreshCw, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  Trash2,
  School
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { toast } from '../../utils/toast';

export interface LinkedChild {
  userId: string;
  studentId: string;
  name: string;
  classroomId?: string | null;
  teacherName?: string | null;
  sectionName?: string | null;
  gradeLevel?: number | null;
  consultationHours?: string | null;
}

export interface ParentConsultationViewProps {
  currentUser?: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
  selectedStudentId?: string;
}

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

export const ParentConsultationView: React.FC<ParentConsultationViewProps> = ({
  currentUser,
  selectedStudentId,
}) => {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>(selectedStudentId || '');
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Message thread state
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [teacherName, setTeacherName] = useState<string>('');
  const [consultationHours, setConsultationHours] = useState<string>('');
  const [activeClassroomId, setActiveClassroomId] = useState<string>('');

  // Composer
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Edit / Unsend
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChild = children.find(c => c.studentId === selectedChildId) || children[0];

  // Fetch children
  const fetchChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await apiFetch('/api/parent/children');
      if (res.ok) {
        const data = await res.json();
        const list: LinkedChild[] = data.children || [];
        setChildren(list);
        if (list.length > 0 && !selectedChildId) {
          setSelectedChildId(list[0].studentId);
        }
      }
    } catch {
      // Offline or network error
    } finally {
      setLoadingChildren(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Fetch messages for active child
  const fetchMessages = useCallback(async (classroomId: string, studentId: string) => {
    if (!classroomId || !studentId) return;
    setLoadingMessages(true);
    try {
      const res = await apiFetch(`/api/chat/messages?classroomId=${encodeURIComponent(classroomId)}&studentId=${encodeURIComponent(studentId)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.teacherName) setTeacherName(data.teacherName);
        if (data.consultationHours) setConsultationHours(data.consultationHours);
        setActiveClassroomId(data.classroomId || classroomId);

        // Mark teacher messages as read
        const unreadIds = (data.messages || [])
          .filter((m: Message) => m.sender_role === 'teacher' && !m.read_at)
          .map((m: Message) => m.id);

        if (unreadIds.length > 0) {
          apiFetch('/api/chat/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classroomId,
              studentId,
              readerRole: 'parent',
              messageIds: unreadIds,
            }),
          }).catch(() => {});
        }
      }
    } catch {
      toast.error('Unable to fetch consultation messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeChild && activeChild.classroomId) {
      setActiveClassroomId(activeChild.classroomId);
      if (activeChild.teacherName) setTeacherName(activeChild.teacherName);
      if (activeChild.consultationHours) setConsultationHours(activeChild.consultationHours);
      fetchMessages(activeChild.classroomId, activeChild.studentId);
    } else {
      setMessages([]);
      setActiveClassroomId('');
      setTeacherName('');
    }
  }, [activeChild, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !activeChild || !activeChild.classroomId || isSending) return;

    setIsSending(true);
    try {
      const res = await apiFetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: activeChild.classroomId,
          studentId: activeChild.studentId,
          messageBody: trimmed,
          senderRole: 'parent',
          senderName: currentUser?.name || 'Parent',
          senderId: currentUser?.userId || 'parent',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setMessageInput('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to send consultation message.');
      }
    } catch {
      toast.error('Network error. Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Edit message
  const handleSaveEdit = async (messageId: number) => {
    const trimmed = editBody.trim();
    if (!trimmed || isUpdatingMessage) return;

    setIsUpdatingMessage(true);
    try {
      const res = await apiFetch('/api/chat/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          newMessageBody: trimmed,
          senderId: currentUser?.userId || 'parent',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...data.message } : m));
        setEditingMessageId(null);
        setEditBody('');
        toast.success('Message updated.');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to edit message.');
      }
    } catch {
      toast.error('Network error editing message.');
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  // Unsend message
  const handleUnsend = async (messageId: number) => {
    if (isUpdatingMessage) return;
    setIsUpdatingMessage(true);
    try {
      const res = await apiFetch('/api/chat/unsend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          senderId: currentUser?.userId || 'parent',
        }),
      });

      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_unsent: true } : m));

        toast.success('Message unsent.');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to unsend message.');
      }
    } catch {
      toast.error('Network error unsending message.');
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header: Title & Child Switcher */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)] gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#11428E]/10 border border-[#11428E]/20 flex items-center justify-center text-[#11428E] dark:text-blue-400">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              Teacher Consultations
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Official DepEd Channel
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Direct two-way consultation link with your child's classroom teacher for guidance and progress reports.
            </p>
          </div>
        </div>

        {/* Child Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Learner:</span>
          {loadingChildren ? (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <RefreshCw size={13} className="animate-spin text-[#11428E]" />
              <span>Loading...</span>
            </div>
          ) : children.length === 0 ? (
            <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              No registered children found
            </span>
          ) : (
            <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
              {children.map(child => (
                <button
                  key={child.studentId}
                  onClick={() => setSelectedChildId(child.studentId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeChild?.studentId === child.studentId
                      ? 'bg-[#11428E] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'
                  }`}
                >
                  <User size={13} />
                  <span>{child.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              if (activeChild?.classroomId && activeChild?.studentId) {
                fetchMessages(activeChild.classroomId, activeChild.studentId);
              }
            }}
            disabled={loadingMessages || !activeChild?.classroomId}
            title="Refresh messages"
            className="p-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            aria-label="Refresh messages"
          >
            <RefreshCw size={15} className={loadingMessages ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Classroom Status & Consultation Hours Banner */}
      {activeChild?.classroomId ? (
        <div className="px-6 py-3 bg-[#11428E]/5 border-b border-[var(--border-color)] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#11428E]/10 flex items-center justify-center text-[#11428E]">
              <School size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[var(--text-main)]">
                  {teacherName ? `${teacherName}` : 'Classroom Teacher'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#11428E]/10 text-[#11428E] font-mono">
                  {activeClassroomId || activeChild.classroomId}
                </span>
                {activeChild.sectionName && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300">
                    Section {activeChild.sectionName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#11428E] dark:text-blue-300 bg-white/60 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
            <Clock size={14} className="shrink-0 text-amber-500" />
            <span className="font-semibold text-[11px]">
              Consultation Hours: <strong className="text-[var(--text-main)]">{consultationHours || 'Monday & Wednesday: 3:00 PM - 5:00 PM (DepEd Window)'}</strong>
            </span>
          </div>
        </div>
      ) : null}

      {/* Main Chat Workspace */}
      {!activeChild?.classroomId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">
            No Classroom Connection Linked
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mb-4 max-w-prose">
            {activeChild?.name || 'Your learner'} has not been enrolled in an active classroom session. Have your child join using the teacher's classroom pairing code to enable direct teacher consultations.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-main)]">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMessages && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--text-muted)] gap-2">
                <RefreshCw size={20} className="animate-spin text-[#11428E]" />
                <span>Loading consultation messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="size-14 rounded-2xl bg-[#11428E]/10 flex items-center justify-center text-[#11428E] mb-3">
                  <MessageCircle size={26} />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-main)]">No Consultation Messages Yet</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs max-w-prose">
                  Start a conversation with {teacherName || 'the teacher'} regarding {activeChild.name}'s progress or academic support.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender_role === 'parent';
                const isUnsent = msg.is_unsent;

                if (isUnsent) {
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="text-xs italic text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-dashed border-[var(--border-color)]">
                        This message was unsent.
                      </div>
                    </div>
                  );
                }

                const isEditingThis = editingMessageId === msg.id;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--text-main)]">
                        {isMe ? 'You' : msg.sender_name}
                      </span>
                      <span>•</span>
                      <span className="tabular-nums">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.edited_at && (
                        <span className="text-[10px] text-amber-500 font-medium">(edited)</span>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="w-full max-w-md p-3 rounded-2xl bg-[var(--bg-card)] border border-[#11428E] shadow-lg">
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] outline-none resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => { setEditingMessageId(null); setEditBody(''); }}
                            className="px-3 py-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={isUpdatingMessage || !editBody.trim()}
                            className="px-3 py-1 bg-[#11428E] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1 max-w-[85%] md:max-w-[70%]">
                        {/* Parent message action trigger */}
                        {isMe && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditBody(msg.message_body);
                              }}
                              title="Edit message"
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded hover:bg-white/10"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUnsend(msg.id)}
                              title="Unsend message"
                              className="p-1 text-red-400 hover:text-red-500 rounded hover:bg-red-500/10"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-prose shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-r from-[#11428E] to-[#A01322] text-white rounded-tr-none'
                              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message_body}</p>
                        </div>
                      </div>
                    )}

                    {/* Read receipt */}
                    {isMe && msg.read_at && (
                      <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-emerald-500 font-semibold">
                        <CheckCircle2 size={11} />
                        <span>Seen by teacher</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)] flex items-center gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message Teacher ${teacherName ? `${teacherName} ` : ''}about ${activeChild.name}...`}
              maxLength={1000}
              disabled={isSending}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] px-4 py-3 rounded-2xl focus:border-[#11428E] focus:outline-none transition-all"
            />

            <button
              type="submit"
              disabled={isSending || !messageInput.trim()}
              className="px-5 py-3 bg-gradient-to-r from-[#11428E] to-[#A01322] hover:opacity-95 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-2 shrink-0"
            >
              {isSending ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
