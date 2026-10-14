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
    { eventId: 'EVT-001', subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 8, totalQuestions: 10, synced: false }
  ],
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
};

jest.mock('../store/useAppStore', () => {
  const hook = jest.fn((selector: any) => selector ? selector(mockState) : mockState);
  (hook as any).getState = () => mockState;
  return {
    useAppStore: hook,
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
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockState.studentProgress),
      })
    ) as jest.Mock;
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

  test('should switch tabs between Child Progress and Device Settings via bottom navigation bar', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const progressTabBtn = root.root.findByProps({ accessibilityLabel: 'Child Progress' });
    const settingsTabBtn = root.root.findByProps({ accessibilityLabel: 'Device Settings' });

    expect(progressTabBtn).toBeDefined();
    expect(settingsTabBtn).toBeDefined();
    expect(progressTabBtn.props.accessibilityState.selected).toBe(true);
    expect(settingsTabBtn.props.accessibilityState.selected).toBe(false);

    // Switch to settings
    act(() => {
      settingsTabBtn.props.onPress();
    });

    expect(progressTabBtn.props.accessibilityState.selected).toBe(false);
    expect(settingsTabBtn.props.accessibilityState.selected).toBe(true);

    act(() => {
      root.unmount();
    });
  });
});
