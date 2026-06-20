import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StudentDashboard } from './StudentDashboard';
import { AssessmentScreen } from './AssessmentScreen';
import { StudyScreen } from './StudyScreen';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  replace: jest.fn(),
};

// StudentDashboard now uses useNavigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockAddLog = jest.fn();
const mockRecordProgress = jest.fn();
const mockTrackActiveMinutes = jest.fn();

const mockState = {
  itemBank: {
    Mathematics: {
      '4': {
        Fractions: {
          studyContent: {
            introduction: 'Learn about Fractions!',
            definitions: [
              { term: 'Fraction', definition: 'Part of a whole.', examples: ['half a pizza'] },
            ],
            summary: ['Fractions are parts.'],
          },
          Easy: {
            'Multiple-Choice': [
              {
                id: 'MATH-G4-FRAC-001',
                questionText: 'What is 1/2 + 1/2?',
                options: ['1/2', '1', '2', '0'],
                correctAnswer: '1',
                feedback: { en: 'Correct!', fil: 'Correct!' },
              },
            ],
          },
        },
      },
    },
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
  guestName: 'Neal',
  streakCount: 0,
  avatarEmoji: '🚀',
  xpPoints: 0,
  virtualStars: 0,
  mascotOutfit: 'default',
  parentPin: '1234',
  addLog: mockAddLog,
  recordProgress: mockRecordProgress,
  trackActiveMinutes: mockTrackActiveMinutes,
};

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector: any) => {
      if (typeof selector !== 'function') return mockState;
      return selector(mockState);
    }),
    {
      getState: () => ({ trackActiveMinutes: mockTrackActiveMinutes }),
    }
  ),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Student Lifecycle Integration Flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Increase timeout since this test renders 3 screens in sequence
  jest.setTimeout(30000);

  test('full student flow: view dashboard, start lesson from Today\'s Pick, complete study slides, take quiz, and finish', async () => {
    // 1. RENDER STUDENT DASHBOARD (Home tab)
    let dashboardRoot: any;
    await act(async () => {
      dashboardRoot = renderer.create(<StudentDashboard />);
    });

    // Verify student name and Today's Pick topic are visible
    const stringifiedDashboard = JSON.stringify(dashboardRoot.toJSON());
    expect(stringifiedDashboard).toContain('Neal');
    expect(stringifiedDashboard).toContain('Fractions');

    // 2. PRESS "Start Lesson" IN TODAY'S PICK CARD
    const startLessonBtn = dashboardRoot.root.findByProps({ accessibilityLabel: "Start Today's Lesson" });
    act(() => {
      startLessonBtn.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Study', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
    }));

    const studyNavigateParams = mockNavigation.navigate.mock.calls[0][1];

    // 2b. RENDER STUDY SCREEN AND STEP THROUGH SLIDES
    let studyRoot: any;
    await act(async () => {
      studyRoot = renderer.create(
        <StudyScreen route={{ params: studyNavigateParams } as any} navigation={mockNavigation as any} />
      );
    });

    const stringifiedStudy = JSON.stringify(studyRoot.toJSON());
    expect(stringifiedStudy).toContain('Learn about Fractions!');

    // Slide 0 → Next
    const nextBtn1 = studyRoot.root.findByProps({ label: 'Next →' });
    act(() => { nextBtn1.props.onPress(); });

    // Slide 1 → Next
    const nextBtn2 = studyRoot.root.findByProps({ label: 'Next →' });
    act(() => { nextBtn2.props.onPress(); });

    // Slide 2 → Start Quiz
    const startQuizBtn = studyRoot.root.findByProps({ label: 'Start Quiz!' });
    act(() => { startQuizBtn.props.onPress(); });

    expect(mockNavigation.navigate).toHaveBeenLastCalledWith('Assessment', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
    }));

    const assessmentParams = mockNavigation.navigate.mock.calls[1][1];

    act(() => { studyRoot.unmount(); });

    // 3. RENDER ASSESSMENT SCREEN
    let assessmentRoot: any;
    await act(async () => {
      assessmentRoot = renderer.create(
        <AssessmentScreen route={{ params: assessmentParams } as any} navigation={mockNavigation as any} />
      );
    });

    const stringifiedAssessment = JSON.stringify(assessmentRoot.toJSON());
    expect(stringifiedAssessment).toContain('What is 1/2 + 1/2?');

    // 4. SELECT CORRECT OPTION ('1')
    const options = assessmentRoot.root.findAllByProps({ accessibilityRole: 'radio' });
    const correctOption = options.find((opt: any) =>
      opt.findAllByType('Text').some((t: any) => t.props.children === '1')
    );
    if (!correctOption) throw new Error('Could not find correct option card');
    act(() => { correctOption.props.onPress(); });

    // 5. SUBMIT ANSWER
    const submitBtn = assessmentRoot.root.findByProps({ label: 'Submit Answer' });
    act(() => { submitBtn.props.onPress(); });

    expect(mockAddLog).toHaveBeenCalledWith(expect.stringContaining('Submitted answer'));

    // 6. FINISH QUIZ
    const finishBtn = assessmentRoot.root.findByProps({ label: 'Finish Quiz' });
    act(() => { finishBtn.props.onPress(); });

    expect(mockRecordProgress).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 1,
      totalQuestions: 1,
    }));
    expect(mockAddLog).toHaveBeenCalledWith(
      expect.stringContaining('Completed quiz for topic "Fractions". Final Score: 1/1')
    );

    // 7. BACK TO TOPICS
    const doneBtn = assessmentRoot.root.findByProps({ label: 'Back to Topics' });
    act(() => { doneBtn.props.onPress(); });

    expect(mockNavigation.goBack).toHaveBeenCalled();

    act(() => {
      assessmentRoot.unmount();
      dashboardRoot.unmount();
    });
  });
});
