import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, Switch } from 'react-native';
import { ParentDashboard } from './ParentDashboard';
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render parental controls and statistics correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Parent Portal');
    expect(stringified).toContain('Fractions');
    expect(stringified).toContain('80%'); // score average (8/10)
    expect(stringified).toContain('12'); // minutes used
    expect(stringified).toContain('30'); // limit
  });

  test('should toggle mathBeforeEnglish switch and call updateParentalControls', () => {
    let root: any;
    act(() => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
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
  });

  test('should clear history when delete database button is pressed and confirmed', () => {
    let root: any;
    act(() => {
      root = renderer.create(<ParentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    // Mock confirmation alert dialog success trigger
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const deleteBtn = root.root.findByProps({ label: '🗑️ Clear Practice History' });
    act(() => {
      deleteBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Clear Student Progress'),
      expect.any(String),
      expect.any(Array)
    );
    expect(mockClearProgress).toHaveBeenCalled();
  });
});
