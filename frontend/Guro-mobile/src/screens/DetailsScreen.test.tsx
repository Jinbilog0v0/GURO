import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { DetailsScreen } from './DetailsScreen';

describe('DetailsScreen', () => {
  const mockRoute = {
    params: {
      fileName: 'lesson-1.txt',
      content: 'lesson text content body'
    }
  };

  const mockNavigation = {
    goBack: jest.fn()
  };

  test('should render document name and contents correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <DetailsScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('lesson-1.txt');
    expect(stringified).toContain('lesson text content body');
  });

  test('should trigger navigation.goBack when Return to Dashboard is pressed', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <DetailsScreen route={mockRoute as any} navigation={mockNavigation as any} />
      );
    });

    const backBtn = root.root.findByType(TouchableOpacity);
    act(() => {
      backBtn.props.onPress();
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});
