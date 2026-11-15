import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppUpdateModal } from './AppUpdateModal';
import * as AppUpdateContextModule from '../../context/AppUpdateContext';

function findTextInJSON(json: any, text: string): boolean {
  if (!json) return false;
  if (typeof json === 'string') return json.includes(text);
  if (Array.isArray(json)) return json.some((item) => findTextInJSON(item, text));
  if (json.children) return findTextInJSON(json.children, text);
  if (json.props && json.props.children) return findTextInJSON(json.props.children, text);
  return false;
}

describe('AppUpdateModal', () => {
  const baseMockContext: AppUpdateContextModule.AppUpdateContextValue = {
    currentVersion: '1.0.4',
    buildNumber: '8',
    isChecking: false,
    isDownloading: false,
    updateAvailable: false,
    updateManifest: null,
    showUpdateModal: false,
    setShowUpdateModal: jest.fn(),
    showNewPatchBanner: false,
    markPatchNotesAsSeen: jest.fn().mockResolvedValue(undefined),
    checkForAppUpdate: jest.fn().mockResolvedValue({ isAvailable: false }),
    applyUpdateNow: jest.fn().mockResolvedValue(undefined),
    activePatchNotes: {
      version: '1.0.5',
      date: 'November 2026',
      title: 'Performance & OTA Enhancements',
      highlights: ['⚡ Blazing fast startup', '🛡️ Enhanced security'],
    },
    patchHistory: [],
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when showUpdateModal is false', () => {
    jest.spyOn(AppUpdateContextModule, 'useAppUpdate').mockReturnValue({
      ...baseMockContext,
      showUpdateModal: false,
    });

    let root: any;
    act(() => {
      root = renderer.create(<AppUpdateModal />);
    });
    expect(root.toJSON()).toBeNull();
  });

  it('renders update modal with highlights and update button when update is available', () => {
    const applyMock = jest.fn();
    const dismissMock = jest.fn();

    jest.spyOn(AppUpdateContextModule, 'useAppUpdate').mockReturnValue({
      ...baseMockContext,
      showUpdateModal: true,
      setShowUpdateModal: dismissMock,
      applyUpdateNow: applyMock,
    });

    let root: any;
    act(() => {
      root = renderer.create(<AppUpdateModal />);
    });

    const json = root.toJSON();
    expect(findTextInJSON(json, 'New Update Available!')).toBe(true);
    expect(findTextInJSON(json, 'v1.0.5')).toBe(true);
    expect(findTextInJSON(json, 'Performance & OTA Enhancements')).toBe(true);
    expect(findTextInJSON(json, 'Blazing fast startup')).toBe(true);
    expect(findTextInJSON(json, 'UPDATE NOW & RELOAD')).toBe(true);
    expect(findTextInJSON(json, 'Later / Remind Me Next Launch')).toBe(true);

    const updateBtn = root.root.findByProps({ accessibilityLabel: 'Update now and reload application' });
    act(() => {
      updateBtn.props.onPress();
    });
    expect(applyMock).toHaveBeenCalledTimes(1);

    const laterBtn = root.root.findByProps({ accessibilityLabel: 'Remind me on next launch' });
    act(() => {
      laterBtn.props.onPress();
    });
    expect(dismissMock).toHaveBeenCalledWith(false);
  });

  it('renders downloading state when isDownloading is true', () => {
    jest.spyOn(AppUpdateContextModule, 'useAppUpdate').mockReturnValue({
      ...baseMockContext,
      showUpdateModal: true,
      isDownloading: true,
    });

    let root: any;
    act(() => {
      root = renderer.create(<AppUpdateModal />);
    });

    const json = root.toJSON();
    expect(findTextInJSON(json, 'Updating GURO...')).toBe(true);
    expect(findTextInJSON(json, 'Installing update package (0s downtime)...')).toBe(true);
  });
});
