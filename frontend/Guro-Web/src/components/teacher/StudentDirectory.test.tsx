import { render, screen, fireEvent } from '@testing-library/react';
import { StudentDirectory, SyncedEvent } from './StudentDirectory';
import '@testing-library/jest-dom';

describe('StudentDirectory Component', () => {
  const mockLogs: SyncedEvent[] = [
    {
      studentId: 'STU-1001',
      eventId: 'evt-1',
      subject: 'Science',
      gradeLevel: 4,
      topic: 'Matter & Solutions',
      score: 9,
      totalQuestions: 10,
      timestamp: '2026-10-10T08:00:00Z',
      classroomId: 'room-1'
    },
    {
      studentId: 'STU-1002',
      eventId: 'evt-2',
      subject: 'Mathematics',
      gradeLevel: 5,
      topic: 'Fractions',
      score: 4,
      totalQuestions: 10,
      timestamp: '2026-10-11T09:00:00Z',
      classroomId: 'room-1'
    }
  ];

  it('renders table view by default with student entries', () => {
    render(<StudentDirectory progressLogs={mockLogs} />);

    // Check table headers
    expect(screen.getByText(/Learner \/ LRN/i)).toBeInTheDocument();
    expect(screen.getByText(/Cohort Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg. Accuracy/i)).toBeInTheDocument();

    // Check student entries
    expect(screen.getByText('STU-1001')).toBeInTheDocument();
    expect(screen.getByText('STU-1002')).toBeInTheDocument();

    // Accuracy
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    // Status badges
    expect(screen.getByText('Mastery')).toBeInTheDocument();
    expect(screen.getByText('Remediation')).toBeInTheDocument();
  });

  it('switches between table and card views', () => {
    render(<StudentDirectory progressLogs={mockLogs} />);

    // Initially in table view
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Click Cards button
    const cardsBtn = screen.getByRole('button', { name: /Card View/i });
    fireEvent.click(cardsBtn);

    // Table should no longer be present
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Student cards are visible with Attempts and Accuracy
    expect(screen.getByText('STU-1001')).toBeInTheDocument();
    expect(screen.getAllByText(/Attempts/i).length).toBeGreaterThan(0);

    // Click Table button to toggle back
    const tableBtn = screen.getByRole('button', { name: /Table View/i });
    fireEvent.click(tableBtn);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('opens learner telemetry drilldown modal when clicking inspect', () => {
    render(<StudentDirectory progressLogs={mockLogs} />);

    const inspectButtons = screen.getAllByRole('button', { name: /Inspect/i });
    fireEvent.click(inspectButtons[0]);

    // Modal opens with student details and topic
    expect(screen.getByText(/Overall Accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/Matter & Solutions/i)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Overall Accuracy/i)).not.toBeInTheDocument();
  });
});
