import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { PrimaryButton, SecondaryButton, DangerButton } from './Buttons';

describe('Button Components', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('PrimaryButton renders label and handles press', () => {
    let root: any;
    act(() => {
      root = renderer.create(<PrimaryButton label="Save" onPress={onPress} />);
    });

    const button = root.root.findByType(TouchableOpacity);
    act(() => {
      button.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(root.toJSON())).toContain('Save');
  });

  test('PrimaryButton shows ActivityIndicator when loading', () => {
    let root: any;
    act(() => {
      root = renderer.create(<PrimaryButton label="Save" onPress={onPress} loading />);
    });

    expect(root.root.findByType(ActivityIndicator)).toBeTruthy();
  });

  test('SecondaryButton renders label and handles press', () => {
    let root: any;
    act(() => {
      root = renderer.create(<SecondaryButton label="Cancel" onPress={onPress} />);
    });

    const button = root.root.findByType(TouchableOpacity);
    act(() => {
      button.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(root.toJSON())).toContain('Cancel');
  });

  test('DangerButton renders label and handles press', () => {
    let root: any;
    act(() => {
      root = renderer.create(<DangerButton label="Delete" onPress={onPress} />);
    });

    const button = root.root.findByType(TouchableOpacity);
    act(() => {
      button.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(root.toJSON())).toContain('Delete');
  });
});
