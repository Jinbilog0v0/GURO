import { render, screen, fireEvent } from '@testing-library/react';
import { NameInputStep } from './NameInputStep';
import '@testing-library/jest-dom';

describe('NameInputStep Component', () => {
  const defaultProps = {
    onBack: jest.fn(),
    onStartLearning: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input form with heading and inputs', () => {
    render(<NameInputStep {...defaultProps} />);
    
    expect(screen.getByText('Enter your name to start learning as a guest')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Juan Dela Cruz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Learning' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to sign in' })).toBeInTheDocument();
  });

  test('calls onBack when Back button is clicked', () => {
    render(<NameInputStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('disables Start Learning button when input is empty', () => {
    render(<NameInputStep {...defaultProps} />);
    
    const startBtn = screen.getByRole('button', { name: 'Start Learning' });
    expect(startBtn).toBeDisabled();
  });

  test('enables Start Learning button and calls onStartLearning on submit', () => {
    render(<NameInputStep {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('e.g. Juan Dela Cruz');
    fireEvent.change(input, { target: { value: 'Alice' } });
    
    const startBtn = screen.getByRole('button', { name: 'Start Learning' });
    expect(startBtn).toBeEnabled();
    
    fireEvent.click(startBtn);
    expect(defaultProps.onStartLearning).toHaveBeenCalledWith('Alice');
  });
});
