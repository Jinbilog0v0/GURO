import { render, screen, fireEvent } from '@testing-library/react';
import { SubjectCard } from './SubjectCard';
import { BookOpen } from 'lucide-react';
import '@testing-library/jest-dom';

describe('SubjectCard Component', () => {
  const defaultProps = {
    title: 'English Literacy',
    description: 'Learn and master grammar and comprehension',
    progress: 45,
    topics: ['Adjectives', 'Pronouns'],
    Icon: BookOpen,
    variant: 'blue' as const,
    onClick: jest.fn(),
  };

  test('renders subject details correctly', () => {
    render(<SubjectCard {...defaultProps} />);
    
    expect(screen.getByText('English Literacy')).toBeInTheDocument();
    expect(screen.getByText('Learn and master grammar and comprehension')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Adjectives')).toBeInTheDocument();
    expect(screen.getByText('Pronouns')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    render(<SubjectCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('applies theme classes correctly for variant', () => {
    const { container } = render(<SubjectCard {...defaultProps} variant="purple" />);
    
    // Check for purple progress bar background class
    const progressBar = container.querySelector('.bg-purple-600');
    expect(progressBar).toBeInTheDocument();
  });
});
