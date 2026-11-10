import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateStudentModal } from './CreateStudentModal';
import '@testing-library/jest-dom';

// Mock apiFetch
jest.mock('../../utils/api', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('../../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('CreateStudentModal Component', () => {
  const { apiFetch } = require('../../utils/api');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form fields when open and enforces 12-digit LRN', () => {
    render(
      <CreateStudentModal
        isOpen={true}
        onClose={jest.fn()}
        classroomId="GRADE4-QUEZON"
      />
    );

    expect(screen.getByText(/Create & Enroll Student Account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. 109283748291/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Juan/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Dela Cruz/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Enroll Student/i });
    expect(submitBtn).toBeDisabled();

    // Type 12 digits
    const lrnInput = screen.getByPlaceholderText(/e.g. 109283748291/i);
    fireEvent.change(lrnInput, { target: { value: '109283748291' } });
    expect(submitBtn).not.toBeDisabled();
  });

  test('calls API and shows credential slip upon success', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Student created successfully.',
        student: {
          studentId: 'LRN-109283748291',
          name: 'Juan Dela Cruz (QUEZON)',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          middleName: null,
          lrn: '109283748291',
          gender: 'Male',
          email: 'lrn109283748291@student.guro.local',
          temporaryPassword: 'Guro2026!',
          parentAccessToken: '839201',
          sectionName: 'QUEZON',
        },
      }),
    });

    const onCreated = jest.fn();

    render(
      <CreateStudentModal
        isOpen={true}
        onClose={jest.fn()}
        classroomId="GRADE4-QUEZON"
        onStudentCreated={onCreated}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/e.g. 109283748291/i), {
      target: { value: '109283748291' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. Juan/i), {
      target: { value: 'Juan' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e.g. Dela Cruz/i), {
      target: { value: 'Dela Cruz' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enroll Student/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enrolled Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('839201')).toBeInTheDocument();
      expect(screen.getByText('lrn109283748291@student.guro.local')).toBeInTheDocument();
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });
});
