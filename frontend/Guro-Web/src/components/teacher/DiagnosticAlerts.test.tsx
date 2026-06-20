import { render, screen, fireEvent } from '@testing-library/react';
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

  test('renders struggling topics and AI curriculum recommendations correctly', () => {
    render(<DiagnosticAlerts progressLogs={mockLogs} />);

    // Adjectives average is 37.5% -> rounded to 38%
    expect(screen.getByText('Struggling Topics (avg < 65%)')).toBeInTheDocument();
    expect(screen.getByText('Adjectives (Grade 5 English)')).toBeInTheDocument();
    expect(screen.getByText('38%')).toBeInTheDocument();

    // Recommendation card should target Adjectives
    expect(screen.getByText('Targeted Boost: Adjectives')).toBeInTheDocument();
  });

  test('renders stable message if no topic averages are below 65%', () => {
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

    // Open the collapsed panel
    const toggleBtn = screen.getByRole('button', { name: /Diagnostic Alerts/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('No topic averages fall below mastery thresholds currently.')).toBeInTheDocument();
    expect(screen.getByText('Keep building standard lessons!')).toBeInTheDocument();
  });
});
