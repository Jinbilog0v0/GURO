import { render, screen } from '@testing-library/react';
import { LiveActivityTicker } from './LiveActivityTicker';
import '@testing-library/jest-dom';

describe('LiveActivityTicker Component', () => {
  test('renders placeholder items when no telemetry events exist', () => {
    render(<LiveActivityTicker events={[]} />);
    
    expect(screen.getByText(/Live Telemetry Stream Active/)).toBeInTheDocument();
    expect(screen.getByText(/Tip: Teachers can define/)).toBeInTheDocument();
  });

  test('renders student practice events with correct styling and metrics', () => {
    const mockEvents = [
      {
        studentId: 'stud-abc',
        subject: 'English',
        topic: 'Verbs',
        score: 4,
        totalQuestions: 5,
        timestamp: '2026-06-12T00:00:00.000Z',
      },
      {
        studentId: 'stud-def',
        subject: 'Mathematics',
        topic: 'Division',
        score: 1,
        totalQuestions: 5,
        timestamp: '2026-06-12T00:01:00.000Z',
      },
    ];

    render(<LiveActivityTicker events={mockEvents} />);

    // First event: 4/5 = 80% (Acc. text: "80% Accuracy", fire emoji "🔥")
    expect(screen.getByText('stud-abc')).toBeInTheDocument();
    expect(screen.getByText('Verbs')).toBeInTheDocument();
    expect(screen.getByText('80% Accuracy')).toBeInTheDocument();

    // Second event: 1/5 = 20% (Acc. text: "20% Accuracy", warning emoji "⚠️")
    expect(screen.getByText('stud-def')).toBeInTheDocument();
    expect(screen.getByText('Division')).toBeInTheDocument();
    expect(screen.getByText('20% Accuracy')).toBeInTheDocument();
  });
});
