import { render, screen, fireEvent } from '@testing-library/react';
import { GradeCard } from './GradeCard';
import '@testing-library/jest-dom';

describe('GradeCard Component', () => {
  const defaultProps = {
    grade: 5,
    emoji: '📝',
    iconBgColor: 'bg-emerald-500',
    onClick: jest.fn(),
  };

  test('renders grade level, emoji and subtexts correctly', () => {
    render(<GradeCard {...defaultProps} />);
    
    expect(screen.getByText('Grade 5')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('Click to start')).toBeInTheDocument();
    expect(screen.getByText('Pindutin para magsimula')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    render(<GradeCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });
});
