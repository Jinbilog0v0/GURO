import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EosyPromotionConsole } from './EosyPromotionConsole';
import { apiFetch } from '../../utils/api';
import '@testing-library/jest-dom';

jest.mock('../../utils/api', () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('EosyPromotionConsole Component', () => {
  const mockEosyReport = {
    classroomId: 'MATH-G4-TEST',
    subject: 'Mathematics',
    gradeLevel: 4,
    schoolYear: '2026-2027',
    term: 'Quarter 1',
    roster: [
      {
        studentId: 'STUDENT-001',
        status: 'ELIGIBLE FOR PROMOTION',
        promotedToGrade: null,
        promotedAt: null,
        preTestAvg: 50.0,
        postTestAvg: 90.0,
        learningGain: 80.0,
        termAverages: {
          Q1: 85.0,
          Q2: 88.0,
          Q3: 90.0,
          Q4: 92.0,
        },
        generalAverage: 88.8,
        currentGrade: 4,
        suggestedGrade: 5,
        totalQuizzesTaken: 12,
      },
      {
        studentId: 'STUDENT-002',
        status: 'CONDITIONAL / REMEDIAL',
        promotedToGrade: null,
        promotedAt: null,
        preTestAvg: 40.0,
        postTestAvg: 65.0,
        learningGain: 41.7,
        termAverages: {
          Q1: 65.0,
          Q2: 68.0,
          Q3: 70.0,
          Q4: 72.0,
        },
        generalAverage: 68.8,
        currentGrade: 4,
        suggestedGrade: 5,
        totalQuizzesTaken: 8,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders prompt to select classroom when classroomCode is null', () => {
    render(<EosyPromotionConsole classroomCode={null} />);
    expect(screen.getByText('No Active Classroom Selected')).toBeInTheDocument();
  });

  test('fetches and renders EOSY roster records with DepEd status badges', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEosyReport,
    } as any);

    render(<EosyPromotionConsole classroomCode="MATH-G4-TEST" />);

    await waitFor(() => {
      expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    });

    expect(screen.getByText('STUDENT-002')).toBeInTheDocument();
    expect(screen.getByText('88.8%')).toBeInTheDocument();
    expect(screen.getByText('ELIGIBLE FOR PROMOTION')).toBeInTheDocument();
    expect(screen.getByText('CONDITIONAL / REMEDIAL')).toBeInTheDocument();
  });

  test('opens SF9 official transcript modal when clicking SF9 Report', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEosyReport,
    } as any);

    render(<EosyPromotionConsole classroomCode="MATH-G4-TEST" />);

    await waitFor(() => {
      expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    });

    const sf9Buttons = screen.getAllByRole('button', { name: /SF9 Report/i });
    fireEvent.click(sf9Buttons[0]);

    expect(screen.getByText('School Form 9 (SF9) / Learner Progress Report')).toBeInTheDocument();
    expect(screen.getByText('Quarter 1 (Term 1)')).toBeInTheDocument();
    expect(screen.getByText('Official Action on Promotion')).toBeInTheDocument();

    // Test closing with X button
    const closeBtn = screen.getByRole('button', { name: /Close SF9 Modal/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('School Form 9 (SF9) / Learner Progress Report')).not.toBeInTheDocument();
  });

  test('closes SF9 modal when pressing Escape key', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEosyReport,
    } as any);

    render(<EosyPromotionConsole classroomCode="MATH-G4-TEST" />);

    await waitFor(() => {
      expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    });

    const sf9Buttons = screen.getAllByRole('button', { name: /SF9 Report/i });
    fireEvent.click(sf9Buttons[0]);
    expect(screen.getByText('School Form 9 (SF9) / Learner Progress Report')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('School Form 9 (SF9) / Learner Progress Report')).not.toBeInTheDocument();
  });

  test('allows editing signatory names and provides download and print buttons', async () => {
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockEosyReport,
    } as any);

    // Mock URL methods for file download
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();

    render(<EosyPromotionConsole classroomCode="MATH-G4-TEST" />);

    await waitFor(() => {
      expect(screen.getByText('STUDENT-001')).toBeInTheDocument();
    });

    const sf9Buttons = screen.getAllByRole('button', { name: /SF9 Report/i });
    fireEvent.click(sf9Buttons[0]);

    // Check signatory inputs
    const adviserInput = screen.getByLabelText('Class Adviser Name');
    const principalInput = screen.getByLabelText('Principal / School Head Name');

    fireEvent.change(adviserInput, { target: { value: 'Maria Santos, LPT' } });
    fireEvent.change(principalInput, { target: { value: 'Dr. Roberto Reyes' } });

    expect(adviserInput).toHaveValue('Maria Santos, LPT');
    expect(principalInput).toHaveValue('Dr. Roberto Reyes');

    // Check buttons
    const downloadBtn = screen.getByRole('button', { name: /Download SF9/i });
    const printBtn = screen.getByRole('button', { name: /Print \/ Save as PDF/i });

    expect(downloadBtn).toBeInTheDocument();
    expect(printBtn).toBeInTheDocument();

    fireEvent.click(downloadBtn);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });
});
