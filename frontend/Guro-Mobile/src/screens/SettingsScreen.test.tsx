import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SettingsScreen } from './SettingsScreen';
import { useAppStore } from '../store/useAppStore';
import * as updateService from '../services/updateService';

const mockNavigation: any = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute: any = {
  params: {},
};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

function findTextInJSON(json: any, text: string): boolean {
  if (!json) return false;
  if (typeof json === 'string') return json.includes(text);
  if (Array.isArray(json)) return json.some((item) => findTextInJSON(item, text));
  if (json.children) return findTextInJSON(json.children, text);
  if (json.props && json.props.children) return findTextInJSON(json.props.children, text);
  return false;
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAppStore.setState({
        guestName: 'Maria Santos',
        appMode: 'offline',
        logs: ['Log 1: Database ready', 'Log 2: Synced 0 events'],
        colorTheme: 'blue',
        avatarEmoji: '🦉',
      });
    });
  });

  it('renders settings screen with header and category navigation', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<SettingsScreen navigation={mockNavigation} route={mockRoute} />);
    });

    const rootJSON = root.toJSON();
    expect(findTextInJSON(rootJSON, 'GURO System Settings')).toBe(true);
    expect(findTextInJSON(rootJSON, 'My Profile')).toBe(true);
    expect(findTextInJSON(rootJSON, 'Sound & Voice')).toBe(true);
    expect(findTextInJSON(rootJSON, 'Themes Skin')).toBe(true);
    expect(findTextInJSON(rootJSON, 'Treasure Chest')).toBe(true);

    act(() => {
      root.unmount();
    });
  });

  it('navigates to Treasure Chest tab and displays EAS OTA updates panel', async () => {
    let root: any;
    await act(async () => {
      root = renderer.create(<SettingsScreen navigation={mockNavigation} route={mockRoute} />);
    });

    // Find Treasure Chest tab via testID and press it
    const dbTab = root.root.findByProps({ testID: 'tab-database' });
    expect(dbTab).toBeDefined();

    await act(async () => {
      dbTab.props.onPress();
    });

    const updatedJSON = root.toJSON();
    expect(findTextInJSON(updatedJSON, 'EAS Over-The-Air (OTA) Updates:')).toBe(true);
    expect(findTextInJSON(updatedJSON, 'Check for Updates Now')).toBe(true);

    act(() => {
      root.unmount();
    });
  });

  it('triggers checkForAppUpdate when user presses update button', async () => {
    const checkSpy = jest.spyOn(updateService, 'checkForAppUpdate').mockResolvedValueOnce({
      isAvailable: false,
      reason: 'App is up to date!',
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<SettingsScreen navigation={mockNavigation} route={mockRoute} />);
    });

    // Switch to Treasure Chest tab
    const dbTab = root.root.findByProps({ testID: 'tab-database' });
    expect(dbTab).toBeDefined();

    await act(async () => {
      dbTab.props.onPress();
    });

    // Find update button via testID
    const updateBtn = root.root.findByProps({ testID: 'check-updates-btn' });
    expect(updateBtn).toBeDefined();

    await act(async () => {
      await updateBtn.props.onPress();
    });

    expect(checkSpy).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
