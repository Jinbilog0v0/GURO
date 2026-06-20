import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert, TouchableOpacity } from 'react-native';
import { StudentDashboard } from './StudentDashboard';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockStandardStoreState = {
  itemBank: {
    Mathematics: { '4': { Fractions: { Easy: { 'Multiple-Choice': [] } } } },
    English:     { '4': { Nouns:     { Easy: { 'Multiple-Choice': [] } } } },
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
  streakCount: 3,
  avatarEmoji: '🚀',
  xpPoints: 150,
  virtualStars: 10,
  mascotOutfit: 'default',
  parentPin: '1234',
  addLog: jest.fn(),
};

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector: any) => {
      if (typeof selector !== 'function') return mockStandardStoreState;
      return selector(mockStandardStoreState);
    }),
    {
      getState: () => ({ trackActiveMinutes: jest.fn() }),
    }
  ),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StudentDashboard (Home Tab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation to default state so tests don't bleed into each other
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return mockStandardStoreState;
      return selector(mockStandardStoreState);
    });
  });

  test('renders greeting with student name', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Juan');
  });

  test("shows Today's Pick with the first unattempted topic", async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const stringified = JSON.stringify(root.toJSON());
    // First unattempted topic in itemBank is Mathematics > 4 > Fractions
    expect(stringified).toContain("Today");
    expect(stringified).toContain('Fractions');
  });

  test("shows 'All caught up' when all topics have been attempted", async () => {
    const allDoneState = {
      ...mockStandardStoreState,
      studentProgress: [
        { subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 8, totalQuestions: 10, synced: false },
        { subject: 'English',     gradeLevel: 4, topic: 'Nouns',     score: 8, totalQuestions: 10, synced: false },
      ],
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return allDoneState;
      return selector(allDoneState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('caught up');
  });

  test("Start Lesson button shows time-limit alert when limit is exceeded", async () => {
    const timeLimitState = {
      ...mockStandardStoreState,
      parentalControls: { ...mockStandardStoreState.parentalControls, dailyTimeLimit: 30 },
      dailyMinutesUsed: 35,
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return timeLimitState;
      return selector(timeLimitState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const startBtn = root.root.findByProps({ accessibilityLabel: "Start Today's Lesson" });
    act(() => { startBtn.props.onPress(); });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Time's Up!",
      expect.stringContaining("reached your daily screen time limit")
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Study', expect.anything());
  });

  test("Start Lesson button navigates to Study when no time limit exceeded", async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const startBtn = root.root.findByProps({ accessibilityLabel: "Start Today's Lesson" });
    act(() => { startBtn.props.onPress(); });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Study', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
    }));
  });

  test('Browse Lessons button navigates to Lessons tab', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const touchables = root.root.findAllByType(TouchableOpacity);
    const browseBtn = touchables.find((t: any) => {
      const hasText = (node: any): boolean => {
        if (typeof node === 'string') return node.includes('Browse Lessons');
        if (node.children) {
          return node.children.some((child: any) => hasText(child));
        }
        return false;
      };
      return hasText(t);
    });
    expect(browseBtn).toBeDefined();
    act(() => { browseBtn.props.onPress(); });
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Lessons');
  });

  test('displays XP level card and stat labels', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<StudentDashboard />);
    });

    const stringified = JSON.stringify(root.toJSON());
    // Level card is rendered (xpPoints=150 → Level 2 Explorer)
    expect(stringified).toContain('Explorer');
    expect(stringified).toContain('XP to next level');
    // Stats row labels
    expect(stringified).toContain('Day Streak');
    expect(stringified).toContain('Stars');
    expect(stringified).toContain('Lessons');
  });
});
