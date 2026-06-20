import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { TeacherDashboard } from './TeacherDashboard';
import { useAppStore } from '../store/useAppStore';
import { FileService } from '../services/fileService';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../services/fileService', () => ({
  FileService: {
    listFiles: jest.fn().mockResolvedValue(['report-1.txt', 'report-2.txt']),
    saveFile: jest.fn().mockResolvedValue('file:///uri/report-1.txt'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  }
}));

const mockAddLog = jest.fn();
const mockState = {
  logs: ['Sync starting...'],
  itemBank: {
    'Mathematics': {
      '4': {
        'Fractions': {
          'Easy': {
            'Multiple-Choice': [
              { id: '1', questionText: 'q', options: [], correctAnswer: 'a', feedback: { en: '', fil: '' } }
            ]
          }
        }
      }
    }
  },
  addLog: mockAddLog,
  clearLogs: jest.fn(),
  appMode: 'online',
  currentUser: { name: 'Teacher Test', role: 'teacher' },
  studentProgress: [],
  studentId: 'STUDENT-LOCAL',
  syncProgressNow: jest.fn(),
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

describe('TeacherDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render teacher statistics and saved report file names', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Teacher Dashboard');
    expect(stringified).toContain('report-1.txt');
    expect(stringified).toContain('report-2.txt');
    expect(stringified).toContain('Questions');
  });

  test('should handle validation alert and not write when title or content is empty', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const submitBtn = root.root.findByProps({ label: 'Save to Device' });
    act(() => {
      submitBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Validation Error',
      'Please enter a report title and content.'
    );
    expect(FileService.saveFile).not.toHaveBeenCalled();
  });

  test('should call FileService.saveFile when title and content are valid', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherDashboard navigation={mockNavigation as any} route={{} as any} />);
    });

    const nameInput = root.root.findByProps({ placeholder: 'e.g. Grade5_Math_Session1' });
    const contentInput = root.root.findByProps({ placeholder: 'Enter diagnostic notes, results, or observations…' });

    act(() => {
      nameInput.props.onChangeText('Test-Report');
      contentInput.props.onChangeText('Student got 80% correct.');
    });

    const submitBtn = root.root.findByProps({ label: 'Save to Device' });
    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(FileService.saveFile).toHaveBeenCalledWith('Test-Report.txt', 'Student got 80% correct.');
    expect(mockAddLog).toHaveBeenCalledWith(expect.stringContaining('Generated local diagnostic report'));
  });
});
