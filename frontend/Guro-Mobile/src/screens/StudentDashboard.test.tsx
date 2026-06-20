import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { StudentDashboard } from './StudentDashboard';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

// Mock Alert.alert to track calls
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Define a standard mock store state
const mockStandardStoreState = {
  itemBank: {
    'Mathematics': { '4': { 'Fractions': { 'Easy': { 'Multiple-Choice': [] } } } },
    'English': { '4': { 'Nouns': { 'Easy': { 'Multiple-Choice': [] } } } }
  },
  parentalControls: {
    dailyTimeLimit: 0,
    mathBeforeEnglish: false,
    forcedBilingual: false,
    priorityTopic: null,
  },
  studentProgress: [],
  dailyMinutesUsed: 0,
  currentUser: null,
  guestName: 'Juan',
  parentPin: '1234',
  addLog: jest.fn(),
  setParentPin: jest.fn(),
  setClassroomId: jest.fn(),
  fetchItemBankFromServer: jest.fn(),
};

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector: any) => {
      if (typeof selector !== 'function') return mockStandardStoreState;
      return selector(mockStandardStoreState);
    }),
    {
      getState: () => ({
        trackActiveMinutes: jest.fn(),
      }),
    }
  ),
}));

// Mock native modules
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StudentDashboard (Parental Controls)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Screen Time Limit: should block assessment if limit is exceeded', async () => {
    const customState = {
      ...mockStandardStoreState,
      parentalControls: { ...mockStandardStoreState.parentalControls, dailyTimeLimit: 30 },
      dailyMinutesUsed: 35,
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return customState;
      return selector(customState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const topicButton = root.root.findByProps({ accessibilityLabel: 'Start Fractions' });
    act(() => { topicButton.props.onPress(); });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Time's Up!",
      expect.stringContaining("reached your daily screen time limit")
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  test('Math Gate: should lock English if Math score is low', async () => {
    const customState = {
      ...mockStandardStoreState,
      parentalControls: { ...mockStandardStoreState.parentalControls, mathBeforeEnglish: true },
      studentProgress: [
        { subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 5, totalQuestions: 10 }
      ],
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return customState;
      return selector(customState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const englishPill = root.root.findByProps({ accessibilityLabel: 'English' });
    await act(async () => { englishPill.props.onPress(); });

    const topicButton = root.root.findByProps({ accessibilityLabel: 'Start Nouns' });
    act(() => { topicButton.props.onPress(); });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Keep Practising Maths!',
      expect.stringContaining("Score at least 80%")
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  test('Math Gate: should allow English if Math score is high', async () => {
    const customState = {
      ...mockStandardStoreState,
      parentalControls: { ...mockStandardStoreState.parentalControls, mathBeforeEnglish: true },
      studentProgress: [
        { subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 9, totalQuestions: 10 }
      ],
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return customState;
      return selector(customState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const englishPill = root.root.findByProps({ accessibilityLabel: 'English' });
    await act(async () => { englishPill.props.onPress(); });

    const topicButton = root.root.findByProps({ accessibilityLabel: 'Start Nouns' });
    act(() => { topicButton.props.onPress(); });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Study', expect.objectContaining({
      subject: 'English'
    }));
  });
});
