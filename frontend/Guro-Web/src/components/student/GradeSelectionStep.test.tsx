import { render, screen, fireEvent } from '@testing-library/react';
import { GradeSelectionStep } from './GradeSelectionStep';
import '@testing-library/jest-dom';

describe('GradeSelectionStep Component', () => {
  const defaultProps = {
    userName: 'NJ',
    onBack: jest.fn(),
    onSelectGrade: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user name and grade level options', () => {
    render(<GradeSelectionStep {...defaultProps} />);
    
    expect(screen.getByText('Hello, NJ!')).toBeInTheDocument();
    expect(screen.getByText('Grade 4')).toBeInTheDocument();
    expect(screen.getByText('Grade 5')).toBeInTheDocument();
    expect(screen.getByText('Grade 6')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<GradeSelectionStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('calls onSelectGrade with correct level when grade card is clicked', () => {
    render(<GradeSelectionStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Grade 5/ }));
    expect(defaultProps.onSelectGrade).toHaveBeenCalledWith(5);
  });
});
