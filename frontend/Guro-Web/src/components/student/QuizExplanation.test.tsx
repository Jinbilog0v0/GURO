import { render, screen } from '@testing-library/react';
import { QuizExplanation } from './QuizExplanation';
import '@testing-library/jest-dom';

describe('QuizExplanation Component', () => {
  const defaultProps = {
    isCorrect: true,
    explanationEn: 'This is correct because 2 + 2 = 4.',
    explanationFil: 'Ito ay tama dahil ang 2 + 2 = 4.',
  };

  test('renders correct explanation state and text', () => {
    render(<QuizExplanation {...defaultProps} />);
    
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
    expect(screen.getByText('This is correct because 2 + 2 = 4.')).toBeInTheDocument();
    expect(screen.getByText('Ito ay tama dahil ang 2 + 2 = 4.')).toBeInTheDocument();
  });

  test('renders incorrect state when isCorrect is false', () => {
    render(<QuizExplanation {...defaultProps} isCorrect={false} />);
    
    expect(screen.getByText('✕ Not quite right')).toBeInTheDocument();
  });
});
