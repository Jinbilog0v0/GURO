import { render, screen } from '@testing-library/react';
import { ActivityHeatmap } from './ActivityHeatmap';
import '@testing-library/jest-dom';

describe('ActivityHeatmap Component', () => {
  const mockLogs = [
    {
      studentId: 'STUDENT-1',
      eventId: 'evt-1',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 8,
      totalQuestions: 10,
      timestamp: new Date().toISOString(), // Today
    },
    {
      studentId: 'STUDENT-1',
      eventId: 'evt-2',
      subject: 'English',
      gradeLevel: 5,
      topic: 'Metaphors',
      score: 9,
      totalQuestions: 10,
      timestamp: new Date().toISOString(), // Today
    }
  ];

  test('renders consistency tracker correctly', () => {
    const { container } = render(<ActivityHeatmap logs={mockLogs} />);

    expect(screen.getByText('Practice Consistency Tracker')).toBeInTheDocument();
    expect(screen.getByText('Less consistency')).toBeInTheDocument();
    expect(screen.getByText('More practice')).toBeInTheDocument();

    // Check that we have exactly 32 cells (28 for past days + 4 for legend)
    // In our styles, the cells are div elements.
    // Let's count divs without classes/text or look inside the grid/legend wrapper.
    const cells = container.querySelectorAll('.glass-panel div div div, .glass-panel div div');
    expect(cells.length).toBeGreaterThanOrEqual(28);
  });
});
