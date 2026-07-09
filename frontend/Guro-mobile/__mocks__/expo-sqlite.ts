/**
 * __mocks__/expo-sqlite.ts
 * Minimal mock of expo-sqlite for Node/Jest testing.
 */

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);

export default {
  openDatabaseAsync,
};
