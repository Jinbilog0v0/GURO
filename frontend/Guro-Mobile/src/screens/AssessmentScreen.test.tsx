import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AssessmentScreen } from './AssessmentScreen';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock navigation props
const mockRoute = {
  params: {
    subject: 'Mathematics',
    gradeLevel: 4,
    topic: 'Fractions',
  },
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock the store
const mockAddLog = jest.fn();
const mockRecordProgress = jest.fn();
const mockTrackActiveMinutes = jest.fn();

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector: any) => selector({
      itemBank: {
        'Mathematics': {
          '4': {
            'Fractions': {
              'Easy': {
                'Multiple-Choice': [
                  {
                    id: 'MATH-G4-FRAC-001',
                    questionText: 'What is 1/2 + 1/2?',
                    options: ['1/2', '1', '2', '0'],
                    correctAnswer: '1',
                    feedback: { en: 'Correct!', fil: 'Tama!' }
                  }
                ]
              }
            }
          }
        }
      },
      parentalControls: { forcedBilingual: false },
      addLog: mockAddLog,
      recordProgress: mockRecordProgress,
      trackActiveMinutes: mockTrackActiveMinutes,
    })),
    {
      getState: () => ({
        trackActiveMinutes: mockTrackActiveMinutes,
      }),
    }
  ),
}));

// Mock Reanimated and other native modules
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AssessmentScreen (Mobile)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should render the first question correctly', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(
        <AssessmentScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const json = root.toJSON();
    // Check if the question text is rendered
    const stringified = JSON.stringify(json);
    expect(stringified).toContain('What is 1/2 + 1/2?');
    expect(stringified).toContain('Mathematics');
    expect(stringified).toContain('Fractions');
  });

  test('should show "No Questions Found" if item bank is empty', async () => {
    // Override store for this test
    (useAppStore as any).mockImplementation((selector: any) => selector({
      itemBank: {}, // Empty bank
      parentalControls: { forcedBilingual: false },
    }));

    let root: any;
    await act(async () => {
      root = renderer.create(
        <AssessmentScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('No Questions Found');
  });

  test('active minutes should be tracked periodically', async () => {
    await act(async () => {
      renderer.create(
        <AssessmentScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    // Advance time by 15 seconds
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    expect(mockTrackActiveMinutes).toHaveBeenCalledWith(0.25);
  });
});
