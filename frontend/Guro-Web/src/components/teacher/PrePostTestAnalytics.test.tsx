import { render, screen, fireEvent } from '@testing-library/react';
import { PrePostTestAnalytics } from './PrePostTestAnalytics';
import '@testing-library/jest-dom';

describe('PrePostTestAnalytics Component', () => {
  const mockLogs = [
    {
      studentId: 'STUDENT-001',
      eventId: 'evt-1',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 2,
      totalQuestions: 5, // 40% pre-test
      assessmentType: 'pre-test',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
      timestamp: '2026-09-01T08:00:00.000Z',
    },
    {
      studentId: 'STUDENT-001',
      eventId: 'evt-2',
      subject: 'Mathematics',
      gradeLevel: 4,
      topic: 'Fractions',
      score: 5,
      totalQuestions: 5, // 100% post-test -> gain = +60%, normalized gain = (100-40)/(100-40)*100 = 100%
      assessmentType: 'post-test',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
      timestamp: '2026-09-01T09:00:00.000Z',
    },
    {
      studentId: 'STUDENT-002',
      eventId: 'evt-3',
      subject: 'English',
      gradeLevel: 4,
      topic: 'Figures of Speech',
      score: 3,
      totalQuestions: 5, // 60% pre-test
      assessmentType: 'pre-test',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
      timestamp: '2026-09-02T08:00:00.000Z',
    },
    {
      studentId: 'STUDENT-002',
      eventId: 'evt-4',
      subject: 'English',
      gradeLevel: 4,
      topic: 'Figures of Speech',
      score: 4,
      totalQuestions: 5, // 80% post-test -> gain = +20%, norm gain = (80-60)/(100-60)*100 = 50%
      assessmentType: 'post-test',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
      timestamp: '2026-09-02T09:00:00.000Z',
    },
  ];

  test('renders empty state message when no assessment records exist', () => {
    render(<PrePostTestAnalytics progressLogs={[]} />);
    expect(screen.getByText('No Assessment Growth Records Found')).toBeInTheDocument();
  });

  test('renders baseline, summative, and gain calculations correctly', () => {
    render(<PrePostTestAnalytics progressLogs={mockLogs} activeClassroomId="MATH-G4-XYZ" />);

    expect(screen.getByText('Pre-Test vs Post-Test Growth Analysis')).toBeInTheDocument();
    expect(screen.getByText('Classroom: MATH-G4-XYZ')).toBeInTheDocument();

    // Check student IDs in table
    expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    expect(screen.getByText('STUDENT-002')).toBeInTheDocument();

    // Check gain badges
    expect(screen.getByText('High Gain (Mastery)')).toBeInTheDocument();
    expect(screen.getByText('Medium Gain (Progressing)')).toBeInTheDocument();

    // Check score gain arrows/percentages
    expect(screen.getByText('+60%')).toBeInTheDocument();
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  test('filters growth table by search query', () => {
    render(<PrePostTestAnalytics progressLogs={mockLogs} />);

    const searchInput = screen.getByPlaceholderText('Search student ID...');
    fireEvent.change(searchInput, { target: { value: 'STUDENT-001' } });

    expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    expect(screen.queryByText('STUDENT-002')).not.toBeInTheDocument();
  });
});
