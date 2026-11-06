import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TeacherChatScreen } from './TeacherChatScreen';
import { useAppStore } from '../store/useAppStore';

jest.mock('../components', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockThreads = [
  {
    studentId: 'STU-001',
    studentName: 'Juan Dela Cruz',
    parentName: 'Maria Dela Cruz',
    latestMessage: 'Good afternoon teacher, about the homework...',
    latestSenderRole: 'parent',
    latestTimestamp: new Date().toISOString(),
    unreadCount: 1,
  },
  {
    studentId: 'STU-002',
    studentName: 'Jose Rizal',
    parentName: 'Teodora Alonzo',
    latestMessage: 'Thank you teacher!',
    latestSenderRole: 'parent',
    latestTimestamp: new Date().toISOString(),
    unreadCount: 0,
  },
];

const mockMessages = [
  {
    id: 1,
    classroom_id: 'MAT-G4-ROSE',
    student_id: 'STU-001',
    sender_id: 'parent-1',
    sender_name: 'Maria Dela Cruz',
    sender_role: 'parent',
    message_body: 'Good afternoon teacher, about the homework...',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read_at: null,
  },
  {
    id: 2,
    classroom_id: 'MAT-G4-ROSE',
    student_id: 'STU-001',
    sender_id: 'teacher-101',
    sender_name: 'Teacher Santos',
    sender_role: 'teacher',
    message_body: 'Yes, please review chapter 3.',
    original_message_body: 'Yes, plese review chapter 3.',
    edited_at: new Date().toISOString(),
    edit_history: [
      { previous_body: 'Yes, plese review chapter 3.', edited_at: new Date().toISOString() },
    ],
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    read_at: null,
  },
];

describe('TeacherChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAppStore.setState({
        currentUser: {
          userId: 'TEA-101',
          email: 'teacher@guro.dev',
          role: 'teacher',
          name: 'Teacher Santos',
          classroomId: 'MAT-G4-ROSE',
        } as any,
        classroomId: 'MAT-G4-ROSE',
        activeSchoolYear: '2026-2027',
        activeTerm: 'Quarter 1',
        serverUrl: 'https://neoguro.app',
      });
    });

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/chat/threads')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              threads: mockThreads,
              consultationHours: 'Monday – Friday: 3:00 PM – 5:00 PM',
            }),
        });
      }
      if (url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              messages: mockMessages,
              consultationHours: 'Monday – Friday: 3:00 PM – 5:00 PM',
            }),
        });
      }
      if (url.includes('/api/chat/send')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: {
                id: 3,
                classroom_id: 'MAT-G4-ROSE',
                student_id: 'STU-001',
                sender_id: 'TEA-101',
                sender_name: 'Teacher Santos',
                sender_role: 'teacher',
                message_body: 'New reply to parent',
                created_at: new Date().toISOString(),
              },
            }),
        });
      }
      if (url.includes('/api/chat/edit')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: {
                id: 2,
                message_body: 'Edited teacher message body',
                original_message_body: 'Yes, please review chapter 3.',
                edited_at: new Date().toISOString(),
              },
            }),
        });
      }
      if (url.includes('/api/chat/unsend')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: {
                id: 2,
                is_unsent: true,
              },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  test('renders header with semester badge, hours, and student chips', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Parent Consultations');
    expect(json).toContain('S.Y. 2026-2027 • Quarter 1');
    expect(json).toContain('Monday – Friday: 3:00 PM – 5:00 PM');
    expect(json).toContain('Juan Dela Cruz');
    expect(json).toContain('Jose Rizal');

    act(() => {
      root.unmount();
    });
  });

  test('displays consultation messages and allows sending a reply', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Good afternoon teacher, about the homework...');
    expect(json).toContain('Yes, please review chapter 3.');
    expect(json).toContain('(edited)');

    // Type a reply
    const input = root.root.findByProps({ placeholder: 'Type reply to parent...' });
    expect(input).toBeDefined();

    act(() => {
      input.props.onChangeText('We will review it tomorrow.');
    });

    const sendBtn = root.root.findByProps({ accessibilityLabel: 'Send reply to parent' });
    await act(async () => {
      sendBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat/send'),
      expect.objectContaining({
        method: 'POST',
      })
    );

    act(() => {
      root.unmount();
    });
  });

  test('opens edit history modal when clicking (edited)', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const editHistoryBtn = root.root.findByProps({ accessibilityLabel: 'View edit history' });
    expect(editHistoryBtn).toBeDefined();

    await act(async () => {
      editHistoryBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Edit History');
    expect(json).toContain('Original Message');
    expect(json).toContain('Yes, plese review chapter 3.');

    act(() => {
      root.unmount();
    });
  });

  test('allows opening 3-dot options menu to edit and unsend message for teacher', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const optionsBtn = root.root.findByProps({ accessibilityLabel: 'Options for message 2' });
    expect(optionsBtn).toBeDefined();

    await act(async () => {
      optionsBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Message Actions');
    expect(json).toContain('Edit Message');
    expect(json).toContain('Unsend Message');

    act(() => {
      root.unmount();
    });
  });

  test('omits edit option if message is older than 30 minutes', async () => {
    const oldMessages = [
      {
        id: 99,
        classroom_id: 'MAT-G4-ROSE',
        student_id: 'STU-001',
        sender_id: 'teacher-101',
        sender_name: 'Teacher Santos',
        sender_role: 'teacher',
        message_body: 'Message sent 1 hour ago',
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        read_at: null,
      },
    ];

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, messages: oldMessages }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, threads: mockThreads }),
      });
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const optionsBtn = root.root.findByProps({ accessibilityLabel: 'Options for message 99' });
    await act(async () => {
      optionsBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Message Actions');
    expect(json).not.toContain('Edit Message');
    expect(json).toContain('Unsend Message');

    act(() => {
      root.unmount();
    });
  });

  test('successfully unsends message when tapping unsend and confirming inline', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherChatScreen />);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    const optionsBtn = root.root.findByProps({ accessibilityLabel: 'Options for message 2' });
    await act(async () => {
      optionsBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    const unsendOption = root.root.findByProps({ accessibilityLabel: 'Unsend message' });
    await act(async () => {
      unsendOption.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    // Check inline confirmation appears
    let json = JSON.stringify(root.toJSON());
    expect(json).toContain('Unsend Message?');
    expect(json).toContain('This message will be removed for everyone in the consultation chat.');

    // Confirm unsend
    const confirmBtn = root.root.findByProps({ accessibilityLabel: 'Confirm unsend' });
    await act(async () => {
      confirmBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 20));
    });

    json = JSON.stringify(root.toJSON());
    expect(json).toContain('You unsent a message');

    act(() => {
      root.unmount();
    });
  });
});
