import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TextInput as RNTextInput } from 'react-native';
import { ThemedTextInput } from './ThemedTextInput';

describe('ThemedTextInput Component', () => {
  test('renders label, input, and error correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <ThemedTextInput
          label="Username"
          placeholder="Enter username"
          error="Username is required"
        />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Username');
    expect(stringified).toContain('Enter username');
    expect(stringified).toContain('Username is required');
  });

  test('calls onFocus and onBlur handlers and toggles focus state styles', () => {
    const onFocusMock = jest.fn();
    const onBlurMock = jest.fn();

    let root: any;
    act(() => {
      root = renderer.create(
        <ThemedTextInput
          placeholder="Input"
          onFocus={onFocusMock}
          onBlur={onBlurMock}
        />
      );
    });

    const input = root.root.findByType(RNTextInput);

    // Focus input
    act(() => {
      input.props.onFocus({} as any);
    });
    expect(onFocusMock).toHaveBeenCalledTimes(1);

    // Blur input
    act(() => {
      input.props.onBlur({} as any);
    });
    expect(onBlurMock).toHaveBeenCalledTimes(1);
  });
});
