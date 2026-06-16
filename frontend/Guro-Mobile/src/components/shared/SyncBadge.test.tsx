import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SyncBadge } from './SyncBadge';
import { useAppStore } from '../../store/useAppStore';

// Mock useAppStore
const mockProgress = [
  { eventId: 'evt1', synced: true },
  { eventId: 'evt2', synced: false }, // 1 pending
];

const mockState = {
  studentProgress: mockProgress,
};

jest.mock('../../store/useAppStore', () => {
  const hook = jest.fn((selector: any) => selector ? selector(mockState) : mockState);
  (hook as any).getState = () => mockState;
  return {
    useAppStore: hook,
  };
});

describe('SyncBadge Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test('should display offline status when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    let root: any;
    await act(async () => {
      root = renderer.create(<SyncBadge />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Offline');
  });

  test('should display pending count when online and pending items exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    let root: any;
    await act(async () => {
      root = renderer.create(<SyncBadge />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('1 Pending');
  });
});
