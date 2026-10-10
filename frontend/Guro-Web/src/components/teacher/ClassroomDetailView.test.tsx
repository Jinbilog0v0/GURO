import { render, screen, fireEvent } from '@testing-library/react';
import { ClassroomDetailView } from './ClassroomDetailView';
import '@testing-library/jest-dom';

describe('ClassroomDetailView', () => {
  const mockClassroom = {
    id: 'MATH-4-RIZAL-789',
    teacherName: 'Teacher Santos',
    subject: 'Mathematics',
    gradeLevel: 4,
    sectionName: 'Rizal',
    schoolYear: '2026-2027',
    term: 'Quarter 1',
  };

  const defaultProps = {
    classroom: mockClassroom,
    progressLogs: [],
    onBack: jest.fn(),
    onRefreshLogs: jest.fn(),
    isActive: false,
    onSetActiveClassroom: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders classroom header info', () => {
    render(<ClassroomDetailView {...defaultProps} />);

    expect(screen.getByText(/Grade 4 Mathematics — Rizal/i)).toBeInTheDocument();
    expect(screen.getByText('Teacher Santos')).toBeInTheDocument();
  });

  test('renders "Set as Active Classroom" button when isActive is false', () => {
    render(<ClassroomDetailView {...defaultProps} isActive={false} />);

    const setActiveBtn = screen.getByRole('button', { name: /set as active classroom/i });
    expect(setActiveBtn).toBeInTheDocument();

    fireEvent.click(setActiveBtn);
    expect(defaultProps.onSetActiveClassroom).toHaveBeenCalledWith('MATH-4-RIZAL-789');
  });

  test('renders "Active Classroom" indicator when isActive is true', () => {
    render(<ClassroomDetailView {...defaultProps} isActive={true} />);

    expect(screen.queryByRole('button', { name: /set as active classroom/i })).not.toBeInTheDocument();
    expect(screen.getByText('Active Classroom')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<ClassroomDetailView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /back to all classrooms/i }));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });
});
