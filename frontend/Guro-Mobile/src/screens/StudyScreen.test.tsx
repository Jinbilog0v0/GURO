import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StudyScreen } from './StudyScreen';
import { useAppStore } from '../store/useAppStore';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock store state
const mockAddLog = jest.fn();
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
          }
        }
      }
    }
  },
  addLog: mockAddLog,
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

describe('StudyScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockRoute = {
    params: {
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
    }
  };

  test('should render introduction slide and content', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <StudyScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Step');
    expect(stringified).toContain('of 3');
    expect(stringified).toContain('Introduction');
    expect(stringified).toContain('Learn about Fractions!');

    act(() => {
      root.unmount();
    });
  });

  test('should navigate slides and launch assessment when finishing summary', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <StudyScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    // Step 1: Click Next
    const nextBtn1 = root.root.findByProps({ label: 'Next →' });
    act(() => {
      nextBtn1.props.onPress();
    });

    let stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Step');
    expect(stringified).toContain('of 3');
    expect(stringified).toContain('Key Terms');
    expect(stringified).toContain('Fraction');

    // Step 2: Click Next
    const nextBtn2 = root.root.findByProps({ label: 'Next →' });
    act(() => {
      nextBtn2.props.onPress();
    });

    stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Step');
    expect(stringified).toContain('of 3');
    expect(stringified).toContain('Recap Summary');
    expect(stringified).toContain('Fractions are parts.');

    // Step 3: Click Start Quiz
    const startQuizBtn = root.root.findByProps({ label: 'Start Quiz!' });
    act(() => {
      startQuizBtn.props.onPress();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Assessment', expect.objectContaining({
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
    }));

    act(() => {
      root.unmount();
    });
  });

  test('should trigger navigation.goBack when Close is clicked on the first slide', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <StudyScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const closeBtn = root.root.findByProps({ label: 'Close' });
    act(() => {
      closeBtn.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
