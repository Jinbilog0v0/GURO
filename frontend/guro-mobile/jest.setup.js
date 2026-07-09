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
