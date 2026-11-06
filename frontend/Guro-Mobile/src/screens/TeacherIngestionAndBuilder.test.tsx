import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TeacherIngestionScreen } from './TeacherIngestionScreen';
import { TeacherLessonBuilderScreen } from './TeacherLessonBuilderScreen';

jest.mock('../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        currentUser: { name: 'Teacher Santos', role: 'teacher', classroomId: 'MAT-G4-ROSE' },
        activeSchoolYear: '2026-2027',
        activeTerm: 'Quarter 1',
        classroomId: 'MAT-G4-ROSE',
        serverUrl: 'http://localhost:8000',
        token: 'mock-token',
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({
        currentUser: { name: 'Teacher Santos', role: 'teacher', classroomId: 'MAT-G4-ROSE' },
        activeSchoolYear: '2026-2027',
        activeTerm: 'Quarter 1',
        classroomId: 'MAT-G4-ROSE',
        serverUrl: 'http://localhost:8000',
        token: 'mock-token',
      }),
    }
  ),
  resolveServerUrl: (url: string) => url,
}));

jest.mock('../components', () => {
  const actual = jest.requireActual('../components');
  return {
    ...actual,
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
    },
  };
});

describe('Teacher Lesson Ingestor & Manual Builder Picture Options (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TeacherLessonBuilderScreen renders lesson visualization and question picture options', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<TeacherLessonBuilderScreen />);
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Manual Lesson Builder');
    expect(json).toContain('Lesson Summary Visualization');
    expect(json).toContain('Question Visualization / Diagram (Optional)');
    expect(json).toContain('AI Picture');
  });

  test('TeacherIngestionScreen renders AI lesson ingestor with educational visual controls upon generated content', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<TeacherIngestionScreen route={{ params: {} }} />);
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('AI Lesson Ingestor');
    expect(json).toContain('Generate 15 Assessment Items');
  });
});
