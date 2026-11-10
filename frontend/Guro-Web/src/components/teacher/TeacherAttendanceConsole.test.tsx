import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeacherAttendanceConsole } from './TeacherAttendanceConsole';
import '@testing-library/jest-dom';

jest.mock('../../utils/api', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('../../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TeacherAttendanceConsole Component', () => {
  const { apiFetch } = require('../../utils/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders classroom daily attendance and fetches records', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        date: '2026-11-10',
        records: [
          {
            studentId: 'LRN-109283748201',
            name: 'Juan Dela Cruz',
            lrn: '109283748201',
            gender: 'Male',
            status: 'present',
            isRecorded: true,
          },
          {
            studentId: 'LRN-109283748202',
            name: 'Maria Aquino',
            lrn: '109283748202',
            gender: 'Female',
            status: 'late',
            isRecorded: true,
          },
        ],
      }),
    });

    render(<TeacherAttendanceConsole classroomCode="GRADE4-QUEZON" />);

    expect(screen.getByText(/Classroom Daily Attendance Roll Call/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
      expect(screen.getByText('Maria Aquino')).toBeInTheDocument();
    });
  });

  test('saves roll call when Save button clicked', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        date: '2026-11-10',
        records: [
          {
            studentId: 'LRN-109283748201',
            name: 'Juan Dela Cruz',
            lrn: '109283748201',
            gender: 'Male',
            status: 'present',
            isRecorded: false,
          },
        ],
      }),
    });

    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        savedCount: 1,
      }),
    });

    // Follow-up fetch after save
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        date: '2026-11-10',
        records: [
          {
            studentId: 'LRN-109283748201',
            name: 'Juan Dela Cruz',
            lrn: '109283748201',
            gender: 'Male',
            status: 'late',
            isRecorded: true,
          },
        ],
      }),
    });

    render(<TeacherAttendanceConsole classroomCode="GRADE4-QUEZON" />);

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const lateBtn = screen.getByRole('button', { name: /^Late$/i });
    fireEvent.click(lateBtn);

    const saveBtn = screen.getByRole('button', { name: /Save Roll Call/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/classroom/attendance/batch',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
