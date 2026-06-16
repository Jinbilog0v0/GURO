import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity, Text } from 'react-native';
import { PinPad } from './PinPad';

describe('PinPad Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  const defaultProps = {
    visible: true,
    title: 'Enter Teacher PIN',
    subtitle: 'Security check',
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render modal content when visible is true', () => {
    let root: any;
    act(() => {
      root = renderer.create(<PinPad {...defaultProps} />);
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Enter Teacher PIN');
    expect(stringified).toContain('Security check');
  });

  test('should call onSubmit when 4 digits are entered', async () => {
    mockOnSubmit.mockResolvedValue(true);
    let root: any;
    act(() => {
      root = renderer.create(<PinPad {...defaultProps} />);
    });

    // Find touchable buttons for digits 1, 2, 3, 4
    const touchables = root.root.findAllByType(TouchableOpacity);
    const getDigitBtn = (digit: string) => {
      return touchables.find((t: any) => {
        const textNode = t.findByType(Text);
        return textNode && textNode.props.children === digit;
      });
    };

    const btn1 = getDigitBtn('1');
    const btn2 = getDigitBtn('2');
    const btn3 = getDigitBtn('3');
    const btn4 = getDigitBtn('4');

    await act(async () => {
      btn1.props.onPress();
    });
    await act(async () => {
      btn2.props.onPress();
    });
    await act(async () => {
      btn3.props.onPress();
    });
    await act(async () => {
      btn4.props.onPress();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith('1234');
  });

  test('should handle backspace action', async () => {
    let root: any;
    act(() => {
      root = renderer.create(<PinPad {...defaultProps} />);
    });

    const touchables = root.root.findAllByType(TouchableOpacity);
    const getDigitBtn = (digit: string) => {
      return touchables.find((t: any) => {
        const textNode = t.findByType(Text);
        return textNode && textNode.props.children === digit;
      });
    };

    const btn1 = getDigitBtn('1');
    const backBtn = getDigitBtn('⌫');

    // Press '1' then '⌫'
    await act(async () => {
      btn1.props.onPress();
    });
    await act(async () => {
      backBtn.props.onPress();
    });

    // Submitting 4 digits now should submit the entered digits
    const btn2 = getDigitBtn('2');
    const btn3 = getDigitBtn('3');
    const btn4 = getDigitBtn('4');
    const btn5 = getDigitBtn('5');

    await act(async () => {
      btn2.props.onPress();
    });
    await act(async () => {
      btn3.props.onPress();
    });
    await act(async () => {
      btn4.props.onPress();
    });
    await act(async () => {
      btn5.props.onPress();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith('2345');
  });

  test('should call onCancel when Cancel button is clicked', () => {
    let root: any;
    act(() => {
      root = renderer.create(<PinPad {...defaultProps} />);
    });

    const cancelBtn = root.root.findAllByType(TouchableOpacity).find((t: any) => {
      const textNode = t.findByType(Text);
      return textNode && textNode.props.children === 'Cancel';
    });

    act(() => {
      cancelBtn.props.onPress();
    });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
