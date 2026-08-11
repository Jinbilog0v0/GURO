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

import { Alert } from 'react-native';

// Mock the store
const mockAddLog = jest.fn();
const mockRecordProgress = jest.fn();
const mockTrackActiveMinutes = jest.fn();
const mockSetAdaptiveTier = jest.fn();
const mockIncrementConsecutiveFailures = jest.fn().mockReturnValue(1);
const mockResetConsecutiveFailures = jest.fn();

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
                    feedback: { en: 'Correct!', fil: 'Correct!' }
                  }
                ]
              }
            }
          }
        }
      },
      parentalControls: { forcedBilingual: false },
      adaptiveTiers: {},
      consecutiveFailures: {},
      addLog: mockAddLog,
      recordProgress: mockRecordProgress,
      trackActiveMinutes: mockTrackActiveMinutes,
      setAdaptiveTier: mockSetAdaptiveTier,
      incrementConsecutiveFailures: mockIncrementConsecutiveFailures,
      resetConsecutiveFailures: mockResetConsecutiveFailures,
    })),
    {
      getState: () => ({
        trackActiveMinutes: mockTrackActiveMinutes,
        setAdaptiveTier: mockSetAdaptiveTier,
        incrementConsecutiveFailures: mockIncrementConsecutiveFailures,
        resetConsecutiveFailures: mockResetConsecutiveFailures,
        adaptiveTiers: {},
        consecutiveFailures: {},
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

  test('should render bubbly spelling (letter-pop) question type correctly', async () => {
    (useAppStore as any).mockImplementation((selector: any) => selector({
      itemBank: {
        'Mathematics': {
          '4': {
            'Fractions': {
              'Easy': {
                'Spelling': [
                  {
                    id: 'MATH-G4-FRAC-002',
                    questionText: 'Spell the word fraction',
                    type: 'letter-pop',
                    options: [],
                    correctAnswer: 'FRACTION',
                    feedback: { en: 'Spelled correctly!', fil: 'Tamang baybay!' }
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
    }));

    let root: any;
    await act(async () => {
      root = renderer.create(
        <AssessmentScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Spell the word fraction');
  });

  test('should trigger adaptive progression and failure checks on quiz completion', async () => {
    (useAppStore as any).mockImplementation((selector: any) => selector({
      itemBank: {
        'Mathematics': {
          '5': {
            'Decimals': {
              'Easy': {
                'Multiple-Choice': [
                  {
                    id: 'MATH-G5-DEC-001',
                    questionText: 'What is 0.5 + 0.5?',
                    options: ['0.5', '1.0', '2.0', '0.0'],
                    correctAnswer: '1.0',
                    feedback: { en: 'Correct!', fil: 'Correct!' }
                  }
                ]
              }
            }
          }
        }
      },
      parentalControls: { forcedBilingual: false },
      adaptiveTiers: {},
      consecutiveFailures: {},
      addLog: mockAddLog,
      recordProgress: mockRecordProgress,
      trackActiveMinutes: mockTrackActiveMinutes,
      setAdaptiveTier: mockSetAdaptiveTier,
      incrementConsecutiveFailures: mockIncrementConsecutiveFailures,
      resetConsecutiveFailures: mockResetConsecutiveFailures,
    }));

    mockIncrementConsecutiveFailures.mockReturnValue(3);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    let root: any;
    await act(async () => {
      root = renderer.create(
        <AssessmentScreen 
          route={{
            params: {
              subject: 'Mathematics',
              gradeLevel: 5,
              topic: 'Decimals'
            }
          } as any} 
          navigation={mockNavigation as any} 
        />
      );
    });

    const options = root.root.findAllByProps({ accessibilityRole: 'radio' });
    const wrongOption = options.find((opt: any) =>
      !opt.findAllByType('Text').some((t: any) => t.props.children === '1.0')
    );
    
    await act(async () => {
      wrongOption.props.onPress();
    });

    const submitBtn = root.root.findByProps({ label: 'Submit Answer' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    const finishBtn = root.root.findByProps({ label: 'Finish Quiz' });
    await act(async () => {
      finishBtn.props.onPress();
    });

    expect(mockRecordProgress).toHaveBeenCalled();
    expect(mockSetAdaptiveTier).toHaveBeenCalled();
    expect(mockIncrementConsecutiveFailures).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
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
