import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SyncBadge } from './SyncBadge';
import { useAppStore } from '../../store/useAppStore';
import * as Network from 'expo-network';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockProgress = [
  { eventId: 'evt1', synced: true },
  { eventId: 'evt2', synced: false }, // 1 pending
];

const mockState = {
  studentProgress: mockProgress,
};

jest.mock('../../store/useAppStore', () => {
  const hook = jest.fn((selector: any) => (selector ? selector(mockState) : mockState));
  (hook as any).getState = () => mockState;
  return { useAppStore: hook };
});

// SyncBadge uses expo-network — mock it so tests don't hit real networking
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SyncBadge Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display offline status when network is unavailable', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<SyncBadge />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Offline');
  });

  test('should display pending count when online and pending items exist', async () => {
    (Network.getNetworkStateAsync as jest.Mock).mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
    });

    let root: any;
    await act(async () => {
      root = renderer.create(<SyncBadge />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('1 Pending');
  });
});
