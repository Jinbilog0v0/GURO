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
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('5 plus 3 is equal to 8.')).toBeInTheDocument();
    
    // Button label transitions to 'Next Question →' since it's index 1 of 2
    expect(screen.getByRole('button', { name: 'Next Question →' })).toBeInTheDocument();
  });

  test('submitting incorrect answer displays incorrect explanation', () => {
    render(<QuestionStep {...defaultProps} />);
    
    // Select option '7'
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
    
    expect(screen.getByText('Not quite right')).toBeInTheDocument();
  });

  test('calls onNextOrFinish with boolean representing correctness when next button is clicked', () => {
    render(<QuestionStep {...defaultProps} />);
    
    // Select correct answer and submit
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));
    
    // Click next question button
    fireEvent.click(screen.getByRole('button', { name: 'Next Question →' }));
    
    expect(defaultProps.onNextOrFinish).toHaveBeenCalledWith(true, expect.any(Object));
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

  test('renders countdown timer formatted as MM:SS when timed', () => {
    render(<QuestionStep {...defaultProps} isTimed={true} timeRemainingSeconds={185} />);
    
    // 185s = 03:05
    expect(screen.getByText('03:05')).toBeInTheDocument();
  });

  test('displays urgent warning styling when timer is under 30s', () => {
    render(<QuestionStep {...defaultProps} isTimed={true} timeRemainingSeconds={25} />);
    
    const timerElem = screen.getByText('00:25');
    expect(timerElem).toBeInTheDocument();
    // Parent badge container should include text-rose-600 or rose border
    expect(timerElem.parentElement).toHaveClass('text-rose-600');
  });
});
