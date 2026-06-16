import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionStep } from './QuestionStep';
import '@testing-library/jest-dom';

describe('QuestionStep Component', () => {
  const defaultProps = {
    currentQuestionIndex: 1,
    totalQuestions: 2,
    score: 0,
    questionText: 'What is 5 + 3?',
    options: ['7', '8', '9', '10'],
    correctOption: '8',
    explanationEn: '5 plus 3 is equal to 8.',
    explanationFil: 'Ang 5 plus 3 ay katumbas ng 8.',
    onBack: jest.fn(),
    onNextOrFinish: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quiz information and options', () => {
    render(<QuestionStep {...defaultProps} />);
    
    expect(screen.getByText('What is 5 + 3?')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('Score: 0')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled();
  });

  test('submitting correct answer displays correct explanation', () => {
    render(<QuestionStep {...defaultProps} />);
    
    // Select option '8'
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    
    const submitBtn = screen.getByRole('button', { name: 'Submit Answer' });
    expect(submitBtn).toBeEnabled();
    
    fireEvent.click(submitBtn);
    
    // Check explanation shows up
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
    expect(screen.getByText('5 plus 3 is equal to 8.')).toBeInTheDocument();
    
    // Button label transitions to 'Next Question →' since it's index 1 of 2
    expect(screen.getByRole('button', { name: 'Next Question →' })).toBeInTheDocument();
  });

  test('submitting incorrect answer displays incorrect explanation', () => {
    render(<QuestionStep {...defaultProps} />);
    
    // Select option '7'
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
    
    expect(screen.getByText('✕ Not quite right')).toBeInTheDocument();
  });

  test('calls onNextOrFinish with boolean representing correctness when next button is clicked', () => {
    render(<QuestionStep {...defaultProps} />);
    
    // Select correct answer and submit
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
    
    // Click next question button
    fireEvent.click(screen.getByRole('button', { name: 'Next Question →' }));
    
    expect(defaultProps.onNextOrFinish).toHaveBeenCalledWith(true);
  });

  test('shows Finish Quiz button for the last question', () => {
    render(<QuestionStep {...defaultProps} currentQuestionIndex={2} />);
    
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
    
    expect(screen.getByRole('button', { name: 'Finish Quiz →' })).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<QuestionStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });
});
