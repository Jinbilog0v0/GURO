import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminBatchEnrollModal } from './AdminBatchEnrollModal';
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

describe('AdminBatchEnrollModal Component', () => {
  const { apiFetch } = require('../../utils/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads sample DepEd test roster into textarea', () => {
    render(
      <AdminBatchEnrollModal
        isOpen={true}
        onClose={jest.fn()}
        classroom={{
          id: 1,
          classroomId: 'GRADE4-QUEZON',
          teacherName: 'Teacher Maria',
          sectionName: 'QUEZON',
        }}
      />
    );

    expect(screen.getByText(/Admin Batch Master List Import/i)).toBeInTheDocument();
    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Test Roster/i });
    fireEvent.click(loadSampleBtn);

    const textarea = screen.getByPlaceholderText(/LRN, Last Name, First Name/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('109283748201');
    expect(textarea.value).toContain('Dela Cruz');
  });

  test('calls batch-students endpoint and displays credentials roster upon success', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Successfully processed 2 student records.',
        summary: {
          totalProcessed: 2,
          createdCount: 2,
          existingEnrolledCount: 0,
        },
        records: [
          {
            studentId: 'LRN-109283748201',
            lrn: '109283748201',
            name: 'Juan Dela Cruz (QUEZON)',
            gender: 'Male',
            temporaryPassword: 'Guro2026!',
            parentAccessToken: '839201',
            status: 'Newly Created & Enrolled',
          },
        ],
      }),
    });

    const onSuccess = jest.fn();

    render(
      <AdminBatchEnrollModal
        isOpen={true}
        onClose={jest.fn()}
        classroom={{
          id: 1,
          classroomId: 'GRADE4-QUEZON',
          teacherName: 'Teacher Maria',
          sectionName: 'QUEZON',
        }}
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Load Sample Test Roster/i }));
    fireEvent.click(screen.getByRole('button', { name: /Import & Enroll All/i }));

    await waitFor(() => {
      expect(screen.getByText(/Batch Import Successful!/i)).toBeInTheDocument();
      expect(screen.getByText('109283748201')).toBeInTheDocument();
      expect(screen.getByText('Juan Dela Cruz (QUEZON)')).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
