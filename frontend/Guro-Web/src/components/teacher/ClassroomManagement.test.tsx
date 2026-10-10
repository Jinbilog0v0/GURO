import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassroomManagement } from './ClassroomManagement';
import '@testing-library/jest-dom';

describe('ClassroomManagement', () => {
  const mockClassrooms = [
    {
      id: 'MATH-101',
      teacherName: 'Teacher Ana',
      subject: 'Mathematics',
      gradeLevel: 4,
      sectionName: 'Sampaguita',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
    },
    {
      id: 'ENG-202',
      teacherName: 'Teacher Ben',
      subject: 'English',
      gradeLevel: 4,
      sectionName: 'Rosal',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
    }
  ];

  const defaultProps = {
    classrooms: mockClassrooms,
    activeClassroomCode: null,
    activeClassroomData: null,
    onSelectActiveClassroom: jest.fn(),
    onDeselectActiveClassroom: jest.fn(),
    onViewClassroomDetails: jest.fn(),
    onCreateClassroom: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header and classroom cards', () => {
    render(<ClassroomManagement {...defaultProps} />);

    expect(screen.getByText('My Classrooms')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set up new classroom/i })).toBeInTheDocument();
    expect(screen.getByText('MATH-101')).toBeInTheDocument();
    expect(screen.getByText('ENG-202')).toBeInTheDocument();
  });

  test('shows active classroom hero card when active room is present', () => {
    const activeData = {
      classroomId: 'MATH-101',
      teacherName: 'Teacher Ana',
      subject: 'Mathematics',
      gradeLevel: 4,
      sectionName: 'Sampaguita',
      schoolYear: '2026-2027',
      term: 'Quarter 1',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    render(
      <ClassroomManagement
        {...defaultProps}
        activeClassroomCode="MATH-101"
        activeClassroomData={activeData}
      />
    );

    expect(screen.getByText('Active Classroom Session')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deselect session/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /deselect session/i }));
    expect(defaultProps.onDeselectActiveClassroom).toHaveBeenCalled();
  });

  test('filters classroom list via search query', () => {
    render(<ClassroomManagement {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search code/i);
    fireEvent.change(searchInput, { target: { value: 'Sampaguita' } });

    expect(screen.getByText('MATH-101')).toBeInTheDocument();
    expect(screen.queryByText('ENG-202')).not.toBeInTheDocument();
  });

  test('filters classroom list via subject filter tabs', () => {
    render(<ClassroomManagement {...defaultProps} />);

    const englishPill = screen.getByRole('button', { name: /^english/i });
    fireEvent.click(englishPill);

    expect(screen.queryByText('MATH-101')).not.toBeInTheDocument();
    expect(screen.getByText('ENG-202')).toBeInTheDocument();
  });

  test('renders empty state when no classrooms match filter', () => {
    render(<ClassroomManagement {...defaultProps} classrooms={[]} />);

    expect(screen.getByText(/no classrooms created yet/i)).toBeInTheDocument();
  });

  test('opens and submits CreateClassroomModal', async () => {
    render(<ClassroomManagement {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /set up new classroom/i }));

    expect(screen.getByRole('heading', { name: 'Set Up New Classroom' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/e.g. Teacher Maria Santos/i), {
      target: { value: 'Teacher Carla' }
    });
    fireEvent.click(screen.getByRole('button', { name: /generate classroom invite code/i }));

    await waitFor(() => {
      expect(defaultProps.onCreateClassroom).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherName: 'Teacher Carla'
        })
      );
    });
  });
});
