import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const baseState = {
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
};

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector: any) => {
      if (typeof selector !== 'function') return baseState;
      return selector(baseState);
    }),
    { getState: () => ({}) }
  ),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('../components', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return {
    GlassCard: ({ children }: any) => children,
    LessonCard: ({ onPress, accessibilityLabel }: any) => (
      <TouchableOpacity accessibilityLabel={accessibilityLabel} onPress={onPress} />
    ),
    SectionHeader: () => null,
    toast: {
      warning: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

import { LessonsScreen } from './LessonsScreen';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LessonsScreen (Parental Controls)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return baseState;
      return selector(baseState);
    });
  });

  test('renders topics from item bank', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<LessonsScreen />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Fractions');
  });

  test('Screen Time Limit: blocks topic navigation and shows alert', async () => {
    const timeLimitState = {
      ...baseState,
      parentalControls: { ...baseState.parentalControls, dailyTimeLimit: 30 },
      dailyMinutesUsed: 35,
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return timeLimitState;
      return selector(timeLimitState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<LessonsScreen />);
    });

    // LessonCard renders with accessibilityLabel="Start Fractions"
    const topicBtn = root.root.findByProps({ accessibilityLabel: 'Start Fractions' });
    act(() => { topicBtn.props.onPress(); });

    const { toast } = require('../components');
    expect(toast.warning).toHaveBeenCalledWith(
      expect.stringContaining("reached your daily screen time limit")
    );
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Study', expect.anything());
  });

  test('Math Gate: shows English lock notice when Math score is low', async () => {
    const mathGateState = {
      ...baseState,
      parentalControls: { ...baseState.parentalControls, mathBeforeEnglish: true },
      studentProgress: [
        { subject: 'Mathematics', gradeLevel: 4, topic: 'Fractions', score: 4, totalQuestions: 10, synced: false },
      ],
    };
    (useAppStore as any).mockImplementation((selector: any) => {
      if (typeof selector !== 'function') return mathGateState;
      return selector(mathGateState);
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<LessonsScreen />);
    });

    // Switch to English tab using its accessibilityLabel
    const englishTabBtn = root.root.findByProps({ accessibilityLabel: 'English' });
    await act(async () => { englishTabBtn.props.onPress(); });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('locked');
  });
});
