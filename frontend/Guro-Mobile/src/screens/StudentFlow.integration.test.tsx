import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StudentDashboard } from './StudentDashboard';
import { AssessmentScreen } from './AssessmentScreen';
import { StudyScreen } from './StudyScreen';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  replace: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Spies for store actions
const mockAddLog = jest.fn();
const mockRecordProgress = jest.fn();
const mockTrackActiveMinutes = jest.fn();

const mockState = {
  itemBank: {
    'Mathematics': {
      '4': {
        'Fractions': {
          studyContent: {
            introduction: 'Learn about Fractions!',
            definitions: [
              {
                term: 'Fraction',
                definition: 'Part of a whole.',
                examples: ['half a pizza']
              }
            ],
            summary: ['Fractions are parts.']
          },
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
      getState: () => ({
        trackActiveMinutes: mockTrackActiveMinutes,
      }),
    }
  ),
}));

// Mock Reanimated and other native modules
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

  test('full student flow: view dashboard, start assessment, select correct answer, submit, and finish quiz', async () => {
    // 1. RENDER STUDENT DASHBOARD
    let dashboardRoot: any;
    await act(async () => {
      dashboardRoot = renderer.create(
        <StudentDashboard navigation={mockNavigation as any} route={{} as any} />
      );
    });

    // Verify student name and topic display on dashboard
    const stringifiedDashboard = JSON.stringify(dashboardRoot.toJSON());
    expect(stringifiedDashboard).toContain('Neal');
    expect(stringifiedDashboard).toContain('Fractions');

    // 2. NAVIGATE TO STUDY SCREEN
    const startTopicButton = dashboardRoot.root.findByProps({ accessibilityLabel: 'Start Fractions' });
    act(() => {
      startTopicButton.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Study', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions'
    }));

    // Grab the navigation args to render Study screen
    const studyNavigateParams = mockNavigation.navigate.mock.calls[0][1];

    // 2b. RENDER STUDY SCREEN AND CAROUSEL STEP THROUGH
    let studyRoot: any;
    await act(async () => {
      studyRoot = renderer.create(
        <StudyScreen route={{ params: studyNavigateParams } as any} navigation={mockNavigation as any} />
      );
    });

    const stringifiedStudy = JSON.stringify(studyRoot.toJSON());
    expect(stringifiedStudy).toContain('Learn about Fractions!');

    // Slide 0: Press Next
    const nextBtn1 = studyRoot.root.findByProps({ label: 'Next →' });
    act(() => {
      nextBtn1.props.onPress();
    });

    // Slide 1: Press Next
    const nextBtn2 = studyRoot.root.findByProps({ label: 'Next →' });
    act(() => {
      nextBtn2.props.onPress();
    });

    // Slide 2: Press Start Quiz
    const startQuizBtn = studyRoot.root.findByProps({ label: 'Start Quiz! 🚀' });
    act(() => {
      startQuizBtn.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenLastCalledWith('Assessment', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions'
    }));

    // Grab the navigation args to render the next screen
    const navigateParams = mockNavigation.navigate.mock.calls[1][1];

    // Unmount study screen to clean up timers
    act(() => {
      studyRoot.unmount();
    });

    // 3. RENDER ASSESSMENT SCREEN
    let assessmentRoot: any;
    await act(async () => {
      assessmentRoot = renderer.create(
        <AssessmentScreen route={{ params: navigateParams } as any} navigation={mockNavigation as any} />
      );
    });

    const stringifiedAssessment = JSON.stringify(assessmentRoot.toJSON());
    expect(stringifiedAssessment).toContain('What is 1/2 + 1/2?');

    // 4. SELECT CORRECT OPTION ('1' is the correct answer)
    const options = assessmentRoot.root.findAllByProps({ accessibilityRole: 'radio' });
    const correctOptionCard = options.find((opt: any) => {
      const texts = opt.findAllByType('Text');
      return texts.some((t: any) => t.props.children === '1');
    });
    if (!correctOptionCard) throw new Error('Could not find correct option card');
    act(() => {
      correctOptionCard.props.onPress();
    });

    // 5. SUBMIT ANSWER
    const submitBtn = assessmentRoot.root.findByProps({ label: 'Submit Answer' });
    act(() => {
      submitBtn.props.onPress();
    });

    // Verify it is answered and feedback/explanation is shown
    expect(mockAddLog).toHaveBeenCalledWith(expect.stringContaining('Submitted answer'));
    
    // 6. FINISH QUIZ
    const finishBtn = assessmentRoot.root.findByProps({ label: 'Finish Quiz 🎉' });
    act(() => {
      finishBtn.props.onPress();
    });

    // Verify score is recorded (1 out of 1 correct answers)
    expect(mockRecordProgress).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 1,
      totalQuestions: 1
    }));

    // Verify completion log is added
    expect(mockAddLog).toHaveBeenCalledWith(expect.stringContaining('Completed quiz for topic "Fractions". Final Score: 1/1'));

    // 7. RETURN TO DASHBOARD
    const doneBtn = assessmentRoot.root.findByProps({ label: 'Back to Topics' });
    act(() => {
      doneBtn.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();

    // Clean up all renderer instances to avoid leaked timers
    act(() => {
      assessmentRoot.unmount();
      dashboardRoot.unmount();
    });
  });
});
