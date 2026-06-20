import { render, screen, fireEvent } from '@testing-library/react';
import { QuizOption } from './QuizOption';
import '@testing-library/jest-dom';

describe('QuizOption Component', () => {
  const defaultProps = {
    text: 'Option Text Value',
    isSelected: false,
    isSubmitted: false,
    isCorrectAnswer: false,
    onSelect: jest.fn(),
  };

  test('renders option text correctly', () => {
    render(<QuizOption {...defaultProps} />);
    expect(screen.getByText('Option Text Value')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    render(<QuizOption {...defaultProps} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });

  test('disables button when submitted', () => {
    render(<QuizOption {...defaultProps} isSubmitted={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  test('renders success icon when submitted and correct', () => {
    render(<QuizOption {...defaultProps} isSubmitted={true} isCorrectAnswer={true} />);
    // Check if the check icon or green border styling is present
    expect(buttonHasClass(screen.getByRole('button'), 'border-emerald-500')).toBe(true);
  });

  test('renders error icon when submitted, selected, and incorrect', () => {
    render(<QuizOption {...defaultProps} isSubmitted={true} isSelected={true} isCorrectAnswer={false} />);
    expect(buttonHasClass(screen.getByRole('button'), 'border-[#A01322]')).toBe(true);
  });

  function buttonHasClass(element: HTMLElement, cls: string) {
    return element.className.includes(cls);
  }
});
