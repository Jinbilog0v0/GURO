import { render, screen, fireEvent } from '@testing-library/react';
import { StudentTile } from './StudentTile';
import '@testing-library/jest-dom';

describe('StudentTile Component', () => {
  const mockLogs = [
    {
      studentId: 'NEAL-GUEST',
      eventId: 'evt-1',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 8,
      totalQuestions: 10,
      timestamp: '2026-06-11T18:00:00Z',
    },
    {
      studentId: 'NEAL-GUEST',
      eventId: 'evt-2',
      subject: 'English',
      gradeLevel: 4,
      topic: 'Figurative Language',
      score: 9,
      totalQuestions: 10,
      timestamp: '2026-06-11T18:10:00Z',
    }
  ];

  const defaultProps = {
    studentId: 'NEAL-GUEST',
    logs: mockLogs,
    onSelect: jest.fn(),
    isSelected: false,
  };

  test('renders student ID and calculated averages correctly', () => {
    render(<StudentTile {...defaultProps} />);

    expect(screen.getByText('NEAL-GUEST')).toBeInTheDocument();
    
    // Average score should be (80% + 90%) / 2 = 85%
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('2 Quizzes')).toBeInTheDocument();
    expect(screen.getByText('2 Topics')).toBeInTheDocument();
    expect(screen.getByText('Mastery ⭐')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    render(<StudentTile {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(defaultProps.onSelect).toHaveBeenCalledWith('NEAL-GUEST');
  });
});
