import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { TeacherDashboardScreen } from './TeacherDashboardScreen';
import { TeacherSettingsScreen } from './TeacherSettingsScreen';
import { useAppStore } from '../store/useAppStore';
import { FileService } from '../services/fileService';
import { toast } from '../components';

jest.mock('../components', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

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
    readFile: jest.fn().mockResolvedValue('some content'),
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

// Mock Navigation Hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Teacher Screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TeacherDashboardScreen should render stats', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherDashboardScreen />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Teacher Dashboard');
    expect(stringified).toContain('Questions');
  });

  test('TeacherSettingsScreen should render saved reports and handle actions', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherSettingsScreen />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('report-1.txt');
    expect(stringified).toContain('report-2.txt');

    const submitBtn = root.root.findByProps({ label: 'Save to Device' });
    act(() => {
      submitBtn.props.onPress();
    });

    expect(toast.error as jest.Mock).toHaveBeenCalledWith('Please enter a report title and content.');
  });

  test('TeacherSettingsScreen should call FileService.saveFile when valid', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<TeacherSettingsScreen />);
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
  });
});
