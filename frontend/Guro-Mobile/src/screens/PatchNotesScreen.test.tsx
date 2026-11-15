import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { PatchNotesScreen } from './PatchNotesScreen';
import { AppUpdateProvider } from '../context/AppUpdateContext';
import { APP_VERSION } from '../constants/appVersion';

const mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-updates', () => ({
  isEnabled: false,
  channel: 'production',
  runtimeVersion: '1.0.4',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

function findTextInJSON(json: any, text: string): boolean {
  if (!json) return false;
  if (typeof json === 'string') return json.includes(text);
  if (Array.isArray(json)) return json.some((item) => findTextInJSON(item, text));
  if (json.children) return findTextInJSON(json.children, text);
  if (json.props && json.props.children) return findTextInJSON(json.props.children, text);
  return false;
}

describe('PatchNotesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, active version card, and changelog history', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(
        <AppUpdateProvider>
          <PatchNotesScreen navigation={mockNavigation} />
        </AppUpdateProvider>
      );
    });

    const rootJSON = root.toJSON();
    expect(findTextInJSON(rootJSON, "What's New & Updates")).toBe(true);
    expect(findTextInJSON(rootJSON, 'Release Notes & OTA Patches')).toBe(true);
    expect(findTextInJSON(rootJSON, `v${APP_VERSION}`)).toBe(true);
    expect(findTextInJSON(rootJSON, 'RELEASE HISTORY & CHANGELOG')).toBe(true);
    expect(findTextInJSON(rootJSON, 'UI/UX Dark Mode, Chat Responsiveness & Security Challenges')).toBe(true);

    act(() => {
      root.unmount();
    });
  });

  it('navigates back when back button is pressed', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(
        <AppUpdateProvider>
          <PatchNotesScreen navigation={mockNavigation} />
        </AppUpdateProvider>
      );
    });

    const backButton = root.root.findByProps({ accessibilityLabel: 'Go back' });
    expect(backButton).toBeDefined();

    act(() => {
      backButton.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
