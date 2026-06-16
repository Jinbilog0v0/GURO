import { render, screen, fireEvent } from '@testing-library/react';
import { QuizResultsStep } from './QuizResultsStep';
import '@testing-library/jest-dom';

describe('QuizResultsStep Component', () => {
  const defaultProps = {
    correctAnswersCount: 3,
    totalQuestionsCount: 4,
    onBackToSubjects: jest.fn(),
    onTryAgain: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders results correctly with correct labels', () => {
    render(<QuizResultsStep {...defaultProps} />);
    
    expect(screen.getByText('Good Effort!')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Back to Subjects')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('calls onBackToSubjects when Back to Subjects button is clicked', () => {
    render(<QuizResultsStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Back to Subjects' }));
    expect(defaultProps.onBackToSubjects).toHaveBeenCalledTimes(1);
  });

  test('calls onTryAgain when Try Again button is clicked', () => {
    render(<QuizResultsStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(defaultProps.onTryAgain).toHaveBeenCalledTimes(1);
  });
});
