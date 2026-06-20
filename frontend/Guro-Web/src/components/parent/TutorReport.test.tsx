import { render, screen } from '@testing-library/react';
import { TutorReport } from './TutorReport';
import '@testing-library/jest-dom';

describe('TutorReport Component', () => {
  test('returns null if logs are empty', () => {
    const { container } = render(<TutorReport logs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders AI study feedback and parent tips based on topic logs', () => {
    const mockLogs = [
      {
        studentId: 'STUDENT-1',
        eventId: 'evt-1',
        subject: 'Mathematics',
        gradeLevel: 4,
        topic: 'Fractions',
        score: 9,
        totalQuestions: 10,
        timestamp: '2026-06-11T18:00:00Z', // 90%
      },
      {
        studentId: 'STUDENT-1',
        eventId: 'evt-2',
        subject: 'English',
        gradeLevel: 4,
        topic: 'Figurative Language',
        score: 6,
        totalQuestions: 10,
        timestamp: '2026-06-11T18:00:00Z', // 60%
      }
    ];

    render(<TutorReport logs={mockLogs} />);

    expect(screen.getByText('AI Study Feedback')).toBeInTheDocument();
    
    // Check strongest vs weakest topics
    expect(screen.getAllByText(/Fractions/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Figurative Language/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/60%/i).length).toBeGreaterThanOrEqual(1);

    // Check parent tip for Figurative Language
    expect(screen.getByText(/Tip: Read stories together and point out similes/i)).toBeInTheDocument();
  });
});
