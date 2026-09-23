import { render, screen } from '@testing-library/react';
import { DiagnosticAlerts } from './DiagnosticAlerts';
import '@testing-library/jest-dom';

describe('DiagnosticAlerts Component', () => {
  const mockLogs = [
    {
      studentId: 'stud-1',
      eventId: 'evt-1',
      subject: 'English',
      gradeLevel: 5,
      topic: 'Adjectives',
      score: 1,
      totalQuestions: 4, // 25% (struggling)
      timestamp: '2026-06-12T00:00:00.000Z',
    },
    {
      studentId: 'stud-2',
      eventId: 'evt-2',
      subject: 'English',
      gradeLevel: 5,
      topic: 'Adjectives',
      score: 2,
      totalQuestions: 4, // 50% (overall average for Adjectives = 37.5%, < 65%)
      timestamp: '2026-06-12T00:01:00.000Z',
    },
    {
      studentId: 'stud-1',
      eventId: 'evt-3',
      subject: 'Mathematics',
      gradeLevel: 5,
      topic: 'Fractions',
      score: 4,
      totalQuestions: 4, // 100% (not struggling)
      timestamp: '2026-06-12T00:02:00.000Z',
    },
  ];

  test('renders struggling topics and cohort strengths correctly', () => {
    render(<DiagnosticAlerts progressLogs={mockLogs} />);

    // Check header and tally metrics
    expect(screen.getByText(/Curriculum Health & Strong\/Weak Lessons Tally/i)).toBeInTheDocument();
    expect(screen.getByText(/Top Mastered Topics \(Cohort Strengths\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority Bottlenecks \(Needs Review\)/i)).toBeInTheDocument();

    // Adjectives average is 37.5% -> rounded to 38%
    expect(screen.getByText(/Adjectives \(G5 English\)/i)).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();

    // Fractions is 100%
    expect(screen.getByText(/Fractions \(G5 Mathematics\)/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('renders all topics above threshold message when cohort has no weak topics', () => {
    const highScoresOnly = [
      {
        studentId: 'stud-1',
        eventId: 'evt-4',
        subject: 'Mathematics',
        gradeLevel: 5,
        topic: 'Decimals',
        score: 4,
        totalQuestions: 5, // 80%
        timestamp: '2026-06-12T00:03:00.000Z',
      },
    ];

    render(<DiagnosticAlerts progressLogs={highScoresOnly} />);

    expect(screen.getByText(/Decimals \(G5 Mathematics\)/i)).toBeInTheDocument();
    expect(screen.getByText(/All topics are above mastery threshold!/i)).toBeInTheDocument();
  });
});
