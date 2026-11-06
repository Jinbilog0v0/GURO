import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ParentConsultationHub } from './ParentConsultationHub';
import '@testing-library/jest-dom';

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock apiFetch
jest.mock('../../utils/api', () => ({
  apiFetch: jest.fn(),
}));

// Mock toast
jest.mock('../../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { apiFetch } from '../../utils/api';

describe('ParentConsultationHub', () => {
  const mockClassrooms = [
    {
      id: 'MTH-G4-ROSE',
      teacherName: 'Teacher Maria',
      subject: 'Mathematics',
      gradeLevel: 4,
      sectionName: 'Rose',
    },
  ];

  const mockUser = {
    userId: 'teacher-101',
    email: 'teacher@school.edu',
    name: 'Teacher Maria',
    role: 'teacher',
    classroomId: 'MTH-G4-ROSE',
  };

  const mockThreadsResponse = {
    success: true,
    classroomId: 'MTH-G4-ROSE',
    teacherName: 'Teacher Maria',
    consultationHours: 'Monday – Friday: 3:00 PM – 5:00 PM',
    threads: [
      {
        studentId: 'STU-001',
        studentName: 'Juan Dela Cruz',
        latestMessage: 'Good morning teacher, is there a refresher quiz?',
        latestSenderRole: 'parent',
        latestSenderName: 'Maria Dela Cruz',
        latestTimestamp: '2026-11-05T08:00:00Z',
        unreadCount: 1,
      },
    ],
  };

  const mockMessagesResponse = {
    success: true,
    classroomId: 'MTH-G4-ROSE',
    studentId: 'STU-001',
    teacherName: 'Teacher Maria',
    consultationHours: 'Monday – Friday: 3:00 PM – 5:00 PM',
    messages: [
      {
        id: 1,
        classroom_id: 'MTH-G4-ROSE',
        student_id: 'STU-001',
        sender_id: 'parent-1',
        sender_name: 'Maria Dela Cruz',
        sender_role: 'parent',
        message_body: 'Good morning teacher, is there a refresher quiz?',
        created_at: '2026-11-05T08:00:00Z',
        read_at: null,
      },
      {
        id: 3,
        classroom_id: 'MTH-G4-ROSE',
        student_id: 'STU-001',
        sender_id: 'teacher-101',
        sender_name: 'Teacher Maria',
        sender_role: 'teacher',
        message_body: 'Yes, it is now ready.',
        original_message_body: 'Yes, it is redy.',
        created_at: new Date().toISOString(),
        edited_at: new Date().toISOString(),
        read_at: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiFetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/chat/threads')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockThreadsResponse),
        });
      }
      if (url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessagesResponse),
        });
      }
      if (url.includes('/api/chat/mark-read')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes('/api/chat/edit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 2,
              classroom_id: 'MTH-G4-ROSE',
              student_id: 'STU-001',
              sender_id: 'teacher-101',
              sender_name: 'Teacher Maria',
              sender_role: 'teacher',
              message_body: 'Updated text by teacher',
              original_message_body: 'Yes, it is redy.',
              edited_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              read_at: null,
            },
          }),
        });
      }
      if (url.includes('/api/chat/unsend')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 2,
              classroom_id: 'MTH-G4-ROSE',
              student_id: 'STU-001',
              sender_id: 'teacher-101',
              sender_name: 'Teacher Maria',
              sender_role: 'teacher',
              message_body: 'Yes, it is now ready.',
              is_unsent: true,
              created_at: new Date().toISOString(),
              read_at: null,
            },
          }),
        });
      }
      if (url.includes('/api/chat/send')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 2,
              classroom_id: 'MTH-G4-ROSE',
              student_id: 'STU-001',
              sender_id: 'teacher-101',
              sender_name: 'Teacher Maria',
              sender_role: 'teacher',
              message_body: 'Yes, it is now unlocked on Juan tablet!',
              created_at: '2026-11-05T08:05:00Z',
              read_at: null,
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('renders header with live 2-way chat badge and classroom selector', async () => {
    await act(async () => {
      render(
        <ParentConsultationHub
          currentUser={mockUser}
          classroomHistory={mockClassrooms}
        />
      );
    });

    expect(screen.getByText(/Parent Consultations & Inquiries/i)).toBeInTheDocument();
    expect(screen.getByText(/Live 2-Way Chat/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select Classroom/i })).toBeInTheDocument();
  });

  test('loads student threads and displays consultation history', async () => {
    await act(async () => {
      render(
        <ParentConsultationHub
          currentUser={mockUser}
          classroomHistory={mockClassrooms}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('Juan Dela Cruz').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getAllByText('Good morning teacher, is there a refresher quiz?').length).toBeGreaterThan(0);
    });
  });

  test('allows typing and sending a consultation reply to the parent', async () => {
    await act(async () => {
      render(
        <ParentConsultationHub
          currentUser={mockUser}
          classroomHistory={mockClassrooms}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText('Juan Dela Cruz').length).toBeGreaterThan(0);
    });

    const textarea = screen.getByPlaceholderText(/Type consultation reply/i);
    expect(textarea).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Yes, it is now unlocked on Juan tablet!' } });
    });

    const sendBtn = screen.getByRole('button', { name: /Send consultation reply/i });
    expect(sendBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(sendBtn);
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/chat/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  test('allows viewing edit history when clicking (edited)', async () => {
    await act(async () => {
      render(
        <ParentConsultationHub
          currentUser={mockUser}
          classroomHistory={mockClassrooms}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    const editedBtn = screen.getByText('(edited)');
    await act(async () => {
      fireEvent.click(editedBtn);
    });

    expect(screen.getByText('Edit History')).toBeInTheDocument();
    expect(screen.getByText('Original Message')).toBeInTheDocument();
    expect(screen.getByText('Yes, it is redy.')).toBeInTheDocument();
  });

  test('allows editing and unsending a message via 3-dot options menu', async () => {
    await act(async () => {
      render(
        <ParentConsultationHub
          currentUser={mockUser}
          classroomHistory={mockClassrooms}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Yes, it is now ready.')).toBeInTheDocument();
    });

    const optionsBtn = screen.getByRole('button', { name: /Message options/i });
    expect(optionsBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(optionsBtn);
    });

    expect(screen.getByText('Edit message')).toBeInTheDocument();
    const unsendBtn = screen.getByText('Unsend');
    expect(unsendBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(unsendBtn);
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/chat/unsend',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ messageId: 3 }),
        })
      );
    });
  });
});
