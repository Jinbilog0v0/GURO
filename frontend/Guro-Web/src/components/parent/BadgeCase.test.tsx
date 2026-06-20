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
      timestamp: '2026-06-11T18:00:00Z', // Under 80%
    }
  ];

  test('renders locked and unlocked badges correctly based on logs accuracy', () => {
    render(<BadgeCase logs={mockLogs} />);

    expect(screen.getByText("Child's Milestone Badge Case")).toBeInTheDocument();

    // Fraction Cadet should be unlocked (score 9/10 = 90% >= 80%)
    expect(screen.getByText('Fraction Cadet')).toBeInTheDocument();
    expect(screen.getByText('✓ Completed')).toBeInTheDocument();

    // Decimal Scout should be locked (score 5/10 = 50% < 80%)
    expect(screen.getByText('Decimal Scout')).toBeInTheDocument();
    
    // There are 3 locked badges and 1 unlocked badge.
    // 'Locked' text should appear 3 times in the document
    const lockedLabels = screen.getAllByText('Locked');
    expect(lockedLabels.length).toBe(3);
  });
});
