import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { Checkbox } from './Checkbox';

describe('Checkbox Component', () => {
  test('renders unchecked state and label correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <Checkbox
          checked={false}
          onPress={jest.fn()}
          label="Enable Notifications"
        />
      );
    });

    const json = JSON.stringify(root.toJSON());
    expect(json).toContain('Enable Notifications');
  });

  test('calls onPress with toggled boolean value when tapped', () => {
    const onPressMock = jest.fn();
    let root: any;
    act(() => {
      root = renderer.create(
        <Checkbox
          checked={false}
          onPress={onPressMock}
          label="Agree to terms"
        />
      );
    });

    const touchable = root.root.findByType(TouchableOpacity);
    act(() => {
      touchable.props.onPress();
    });

    expect(onPressMock).toHaveBeenCalledWith(true);
  });
});
