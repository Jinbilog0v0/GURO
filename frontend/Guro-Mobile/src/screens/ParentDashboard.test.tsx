import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Switch } from 'react-native';
import { ParentDashboard } from './ParentDashboard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockUpdateParentalControls = jest.fn();
const mockClearProgress = jest.fn();
const mockSyncProgressNow = jest.fn();

const mockState = {
  studentProgress: [
    { eventId: 'EVT-001', subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 8, totalQuestions: 10, classroomId: 'CLS-101', synced: false }
  ],
  classroomId: 'CLS-101',
  parentPin: '1234',
  setParentPin: jest.fn(),
  clearProgress: mockClearProgress,
  syncProgressNow: mockSyncProgressNow,
  addLog: jest.fn(),
  studentId: 'STUDENT-LOCAL',
  setStudentId: jest.fn(),
  parentalControls: {
    dailyTimeLimit: 30,
    mathBeforeEnglish: false,
    forcedBilingual: false,
    priorityTopic: null,
  },
  updateParentalControls: mockUpdateParentalControls,
  currentUser: null,
  registerAndPromote: jest.fn(),
  loginToCloud: jest.fn(),
  logoutFromCloud: jest.fn(),
  dailyMinutesUsed: 12,
  resetDailyMinutes: jest.fn(),
  appMode: 'offline',
  token: null as string | null,
  myChildren: [] as any[],
  activeChildId: null as string | null,
  setActiveChildId: jest.fn(),
  fetchMyChildren: jest.fn(),
  claimChild: jest.fn(),
};

jest.mock('../store/useAppStore', () => {
  const hook = jest.fn((selector: any) => selector ? selector(mockState) : mockState);
  (hook as any).getState = () => mockState;
  return {
    useAppStore: hook,
    resolveServerUrl: (url: string) => url || 'https://neoguro.app',
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock Reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url?: string) => {
      if (url && typeof url === 'string' && url.includes('/api/chat/edit')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 1,
              message_body: 'Hello teacher, updated question',
              original_message_body: 'Hello teacher, qustion about homework',
              edited_at: new Date().toISOString(),
            },
          }),
        });
      }
      if (url && typeof url === 'string' && url.includes('/api/chat/unsend')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            message: {
              id: 1,
              is_unsent: true,
            },
          }),
        });
      }
      if (url && typeof url === 'string' && url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            messages: [
              {
                id: 1,
                sender_role: 'parent',
                sender_name: 'Maria Dela Cruz',
                message_body: 'Hello teacher, question about homework',
                original_message_body: 'Hello teacher, qustion about homework',
                edited_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
            ],
            teacherName: 'Teacher Santos',
            consultationHours: '3:00 PM - 5:00 PM',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockState.studentProgress),
      });
    }) as jest.Mock;
  });

  test('should render parental controls and statistics correctly', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    // Wait for the async mount effects (AsyncStorage calls) to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Parent Portal');
    expect(stringified).toContain('Fractions');
    expect(stringified).toContain('80%'); // score average (8/10)
    expect(stringified).toContain('12'); // minutes used
    expect(stringified).toContain('30'); // limit

    act(() => {
      root.unmount();
    });
  });

  test('should toggle mathBeforeEnglish switch and call updateParentalControls', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    // Wait for the async mount effects (AsyncStorage calls) to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Find the switches
    const switches = root.root.findAllByType('RCTSwitch');
    expect(switches.length).toBeGreaterThanOrEqual(1);

    // Toggle the first switch (mathBeforeEnglish)
    act(() => {
      switches[0].props.onChange({ nativeEvent: { value: true } });
    });

    expect(mockUpdateParentalControls).toHaveBeenCalledWith(expect.objectContaining({
      mathBeforeEnglish: true
    }));

    act(() => {
      root.unmount();
    });
  });

  test('should clear history when delete database button is pressed and confirmed', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    // Wait for the async mount effects (AsyncStorage calls) to finish
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const deleteBtn = root.root.findByProps({ label: 'Clear Practice History' });
    act(() => {
      deleteBtn.props.onPress();
    });

    const clearDialog = root.root.findByProps({ title: 'Clear Student Progress?' });
    expect(clearDialog).toBeDefined();
    expect(clearDialog.props.visible).toBe(true);

    act(() => {
      clearDialog.props.onConfirm();
    });

    expect(mockClearProgress).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  test('should switch tabs between Child Progress, Teacher Chat, and Device Settings via bottom navigation bar', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const progressTabBtn = root.root.findByProps({ accessibilityLabel: 'Child Progress' });
    const chatTabBtn = root.root.findByProps({ accessibilityLabel: 'Teacher Chat' });
    const settingsTabBtn = root.root.findByProps({ accessibilityLabel: 'Device Settings' });

    expect(progressTabBtn).toBeDefined();
    expect(chatTabBtn).toBeDefined();
    expect(settingsTabBtn).toBeDefined();
    expect(progressTabBtn.props.accessibilityState.selected).toBe(true);
    expect(chatTabBtn.props.accessibilityState.selected).toBe(false);
    expect(settingsTabBtn.props.accessibilityState.selected).toBe(false);

    // Switch to chat
    act(() => {
      chatTabBtn.props.onPress();
    });

    expect(progressTabBtn.props.accessibilityState.selected).toBe(false);
    expect(chatTabBtn.props.accessibilityState.selected).toBe(true);
    expect(settingsTabBtn.props.accessibilityState.selected).toBe(false);

    // Switch to settings
    act(() => {
      settingsTabBtn.props.onPress();
    });

    expect(progressTabBtn.props.accessibilityState.selected).toBe(false);
    expect(chatTabBtn.props.accessibilityState.selected).toBe(false);
    expect(settingsTabBtn.props.accessibilityState.selected).toBe(true);

    act(() => {
      root.unmount();
    });
  });

  test('should display registered parent name with (Parent) in chat messages', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const chatTabBtn = root.root.findByProps({ accessibilityLabel: 'Teacher Chat' });
    await act(async () => {
      chatTabBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Maria Dela Cruz (Parent)');

    act(() => {
      root.unmount();
    });
  });

  test('should display registered children chips and allow switching children when user is parent', async () => {
    mockState.currentUser = { role: 'parent', name: 'Maria Dela Cruz', email: 'maria@parent.ph', userId: 'PAR-123' } as any;
    mockState.myChildren = [
      { studentId: 'STU-001', name: 'Jose Rizal', section: 'Grade 4 - Mabini', classroomId: 'CLS-101' },
      { studentId: 'STU-002', name: 'Andres Bonifacio', section: 'Grade 5 - Bonifacio', classroomId: 'CLS-102' },
    ] as any;
    mockState.activeChildId = 'STU-001';

    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('My Registered Children');
    expect(json).toContain('Jose Rizal');
    expect(json).toContain('Andres Bonifacio');

    const andresChip = root.root.findByProps({ accessibilityLabel: 'Select child Andres Bonifacio' });
    expect(andresChip).toBeDefined();

    await act(async () => {
      andresChip.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockState.setActiveChildId).toHaveBeenCalledWith('STU-002');

    act(() => {
      root.unmount();
      mockState.currentUser = null;
      mockState.myChildren = [];
      mockState.activeChildId = null;
    });
  });

  test('should display (edited) label and open edit history modal on mobile', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const chatTabBtn = root.root.findByProps({ accessibilityLabel: 'Teacher Chat' });
    await act(async () => {
      chatTabBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('(edited)');

    const editHistoryBtn = root.root.findByProps({ accessibilityLabel: 'View edit history' });
    expect(editHistoryBtn).toBeDefined();

    await act(async () => {
      editHistoryBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const historyJson = JSON.stringify(root.toJSON());
    expect(historyJson).toContain('Edit History');
    expect(historyJson).toContain('Original Message');
    expect(historyJson).toContain('Hello teacher, qustion about homework');

    act(() => {
      root.unmount();
    });
  });

  test('should allow opening message options to edit and unsend message on mobile', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const chatTabBtn = root.root.findByProps({ accessibilityLabel: 'Teacher Chat' });
    await act(async () => {
      chatTabBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const optionsBtn = root.root.findByProps({ accessibilityLabel: 'Options for message 1' });
    expect(optionsBtn).toBeDefined();

    await act(async () => {
      optionsBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const optionsJson = JSON.stringify(root.toJSON());
    expect(optionsJson).toContain('Message Actions');
    expect(optionsJson).toContain('Edit Message');
    expect(optionsJson).toContain('Unsend Message');

    act(() => {
      root.unmount();
    });
  });

  test('should omit Edit Message option from options modal if message is older than 30 minutes', async () => {
    (global.fetch as jest.Mock).mockImplementation((url?: string) => {
      if (url && typeof url === 'string' && url.includes('/api/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            messages: [
              {
                id: 99,
                sender_role: 'parent',
                sender_name: 'Maria Dela Cruz',
                message_body: 'Old message from 1 hour ago',
                created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
            ],
            teacherName: 'Teacher Santos',
            consultationHours: '3:00 PM - 5:00 PM',
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockState.studentProgress),
      });
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const chatTabBtn = root.root.findByProps({ accessibilityLabel: 'Teacher Chat' });
    await act(async () => {
      chatTabBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const optionsBtn = root.root.findByProps({ accessibilityLabel: 'Options for message 99' });
    expect(optionsBtn).toBeDefined();

    await act(async () => {
      optionsBtn.props.onPress();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const optionsJson = JSON.stringify(root.toJSON());
    expect(optionsJson).toContain('Message Actions');
    expect(optionsJson).not.toContain('Edit Message');
    expect(optionsJson).toContain('Unsend Message');

    act(() => {
      root.unmount();
    });
  });
});
