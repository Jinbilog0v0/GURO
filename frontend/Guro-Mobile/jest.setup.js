const React = require('react');

// Mock ScrollView to strip out refreshControl prop to prevent circular reference serialization crashes in tests
jest.mock('react-native/Libraries/Components/ScrollView/ScrollView', () => {
  const React = require('react');
  const MockScrollView = React.forwardRef((props, ref) => {
    const { refreshControl, ...otherProps } = props;
    // Render as a standard ScrollView in mock space without the React Element prop
    return React.createElement('ScrollView', { ...otherProps, ref }, props.children);
  });
  return {
    __esModule: true,
    default: MockScrollView,
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-updates
jest.mock('expo-updates', () => ({
  isEnabled: false,
  isEmbeddedLaunch: true,
  updateId: 'mock-update-id-001',
  channel: 'production',
  runtimeVersion: '1.0.1',
  checkForUpdateAsync: jest.fn().mockResolvedValue({ isAvailable: false }),
  fetchUpdateAsync: jest.fn().mockResolvedValue({ isNew: false }),
  reloadAsync: jest.fn().mockResolvedValue(undefined),
  useUpdates: jest.fn(() => ({
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
  })),
}));

