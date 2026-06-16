import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Alert } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { useAppStore } from '../store/useAppStore';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigation = {
  replace: jest.fn(),
  navigate: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockLoginToCloud = jest.fn();
const mockSetAppMode = jest.fn();
const mockSetGuestName = jest.fn();
const mockSetStudentId = jest.fn();

const mockState = {
  loginToCloud: mockLoginToCloud,
  currentUser: null,
  appMode: 'offline',
  guestName: '',
  setAppMode: mockSetAppMode,
  setGuestName: mockSetGuestName,
  setStudentId: mockSetStudentId,
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

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render logo section and default forms', () => {
    let root: any;
    act(() => {
      root = renderer.create(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('GURO');
    expect(stringified).toContain('Offline-first learning platform');
  });

  test('should launch guest session when valid offline name is submitted', () => {
    let root: any;
    act(() => {
      root = renderer.create(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    });

    // Find the text input for guest name
    const input = root.root.findByProps({ placeholder: 'e.g. Juan' });
    act(() => {
      input.props.onChangeText('Neal Claro');
    });

    // Find and press the guest session start button
    const startGuestBtn = root.root.findByProps({ label: 'Continue Offline →' });
    act(() => {
      startGuestBtn.props.onPress();
    });

    expect(mockSetAppMode).toHaveBeenCalledWith('offline');
    expect(mockSetGuestName).toHaveBeenCalledWith('Neal Claro');
    expect(mockSetStudentId).toHaveBeenCalledWith('NEAL-CLARO-GUEST');
    expect(mockNavigation.replace).toHaveBeenCalledWith('StudentDashboard');
  });

  test('should show validation error if offline name is too short', () => {
    let root: any;
    act(() => {
      root = renderer.create(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    });

    const input = root.root.findByProps({ placeholder: 'e.g. Juan' });
    act(() => {
      input.props.onChangeText('Jo');
    });

    const startGuestBtn = root.root.findByProps({ label: 'Continue Offline →' });
    act(() => {
      startGuestBtn.props.onPress();
    });

    expect(mockSetAppMode).not.toHaveBeenCalled();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});
