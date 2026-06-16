import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardStep } from './DashboardStep';
import '@testing-library/jest-dom';

describe('DashboardStep Component', () => {
  const defaultProps = {
    userName: 'NJ',
    selectedGrade: 5,
    onBack: jest.fn(),
    onSelectSubject: jest.fn(),
    mathTopics: ['Algebra', 'Fractions'],
    englishTopics: ['Comprehension', 'Vocabulary'],
    mathProgress: 60,
    englishProgress: 80,
    stats: {
      lessonsCompleted: 8,
      averageScore: 90,
      streak: 4,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user welcome banner, subject cards and stat cards', () => {
    render(<DashboardStep {...defaultProps} />);
    
    expect(screen.getByText('Welcome back, NJ!')).toBeInTheDocument();
    expect(screen.getByText('Grade 5')).toBeInTheDocument();
    
    // Check Mathematics SubjectCard
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    
    // Check English SubjectCard
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Comprehension')).toBeInTheDocument();
    
    // Check StatCards
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('calls onBack when Back button is clicked', () => {
    render(<DashboardStep {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('calls onSelectSubject when a subject card is clicked', () => {
    render(<DashboardStep {...defaultProps} />);
    
    // Click Mathematics Subject Card
    fireEvent.click(screen.getByRole('button', { name: /Mathematics/i }));
    expect(defaultProps.onSelectSubject).toHaveBeenCalledWith('Mathematics');
  });
});
