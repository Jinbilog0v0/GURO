import { render, screen } from '@testing-library/react';
import { MasteryMatrix } from './MasteryMatrix';
import '@testing-library/jest-dom';

describe('MasteryMatrix Component', () => {
  test('renders empty message when no progress telemetry logs are present', () => {
    render(<MasteryMatrix progressLogs={[]} />);
    expect(screen.getByText('No student progress telemetry synced yet.')).toBeInTheDocument();
  });

  test('renders table header topics and student rows with best accuracy calculations', () => {
    const mockLogs = [
      {
        studentId: 'stud-1',
        eventId: 'evt-1',
        subject: 'Math',
        gradeLevel: 5,
        topic: 'Algebra',
        score: 4,
        totalQuestions: 5, // 80% (best score)
        timestamp: '2026-06-12T00:00:00.000Z',
      },
      {
        studentId: 'stud-1',
        eventId: 'evt-2',
        subject: 'Math',
        gradeLevel: 5,
        topic: 'Algebra',
        score: 3,
        totalQuestions: 5, // 60% (ignored, best is 80)
        timestamp: '2026-06-12T00:01:00.000Z',
      },
      {
        studentId: 'stud-2',
        eventId: 'evt-3',
        subject: 'Math',
        gradeLevel: 5,
        topic: 'Algebra',
        score: 1,
        totalQuestions: 5, // 20%
        timestamp: '2026-06-12T00:02:00.000Z',
      },
      {
        studentId: 'stud-1',
        eventId: 'evt-4',
        subject: 'Math',
        gradeLevel: 5,
        topic: 'Decimals',
        score: 2,
        totalQuestions: 4, // 50%
        timestamp: '2026-06-12T00:03:00.000Z',
      },
    ];

    render(<MasteryMatrix progressLogs={mockLogs} />);

    // Check table headers
    expect(screen.getByText('Student / Device ID')).toBeInTheDocument();
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Decimals')).toBeInTheDocument();

    // Check student rows
    expect(screen.getByText('stud-1')).toBeInTheDocument();
    expect(screen.getByText('stud-2')).toBeInTheDocument();

    // Check cell values
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
