import { render, screen } from '@testing-library/react';
import { BadgeCase } from './BadgeCase';
import '@testing-library/jest-dom';

describe('BadgeCase Component', () => {
  const mockLogs = [
    {
      studentId: 'STUDENT-1',
      eventId: 'evt-1',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 9,
      totalQuestions: 10,
      timestamp: '2026-06-11T18:00:00Z',
    },
    {
      studentId: 'STUDENT-1',
      eventId: 'evt-2',
      subject: 'Mathematics',
      gradeLevel: 5,
      topic: 'Decimals',
      score: 5,
      totalQuestions: 10,
      timestamp: '2026-06-11T18:00:00Z',
    }
  ];

  test('renders locked and unlocked badges correctly based on logs accuracy', () => {
    render(<BadgeCase logs={mockLogs} />);

    expect(screen.getByText("Child's Milestone Badge Case")).toBeInTheDocument();

    // First Step should be unlocked because logs length > 0
    expect(screen.getByText('First Step')).toBeInTheDocument();
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();

    // Perfect 100% should be locked because no quiz has 100% score
    expect(screen.getByText('Perfect 100%')).toBeInTheDocument();
    
    // There are 5 locked badges and 1 unlocked badge.
    // 'Locked' text should appear 5 times in the document
    const lockedLabels = screen.getAllByText('Locked');
    expect(lockedLabels.length).toBe(5);
  });
});
