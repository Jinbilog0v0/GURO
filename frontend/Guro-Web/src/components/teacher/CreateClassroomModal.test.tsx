import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateClassroomModal } from './CreateClassroomModal';
import '@testing-library/jest-dom';

describe('CreateClassroomModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <CreateClassroomModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal fields and default values when isOpen is true', () => {
    render(
      <CreateClassroomModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultTeacherName="Teacher Juan"
      />
    );

    expect(screen.getByRole('heading', { name: 'Set Up New Classroom' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Teacher Juan')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Rizal, Mabini/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate classroom invite code/i })).toBeInTheDocument();
  });

  test('submits form with configured values', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);

    render(
      <CreateClassroomModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        defaultTeacherName="Teacher Juan"
      />
    );

    // Change section name
    fireEvent.change(screen.getByPlaceholderText(/e.g. Rizal, Mabini/i), {
      target: { value: 'Grade 4 - Mabini' }
    });

    // Switch subject to English
    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /generate classroom invite code/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherName: 'Teacher Juan',
          sectionName: 'Grade 4 - Mabini',
          subject: 'English',
          gradeLevel: 4,
          schoolYear: '2026-2027',
          term: 'Quarter 1',
        })
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows pending verification warning and disables submit button', () => {
    render(
      <CreateClassroomModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isPendingVerification={true}
      />
    );

    expect(screen.getByText(/Teacher Verification Pending/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /generation locked/i });
    expect(submitBtn).toBeDisabled();
  });

  test('shows rejected verification warning and disables submit button', () => {
    render(
      <CreateClassroomModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        isRejectedVerification={true}
      />
    );

    expect(screen.getByText(/Account Verification Rejected/i)).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /generation locked/i });
    expect(submitBtn).toBeDisabled();
  });

  test('calls onClose when close icon or cancel button is clicked', () => {
    render(
      <CreateClassroomModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText(/close modal/i));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
