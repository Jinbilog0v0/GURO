import { render, screen, fireEvent } from '@testing-library/react';
import { ClassroomCard, type ClassroomItem } from './ClassroomCard';
import '@testing-library/jest-dom';

describe('ClassroomCard', () => {
  const mockClassroom: ClassroomItem = {
    id: 'MATH-4-RIZAL-789',
    teacherName: 'Teacher Santos',
    subject: 'Mathematics',
    gradeLevel: 4,
    sectionName: 'Rizal',
    schoolYear: '2026-2027',
    term: 'Quarter 1',
  };

  const mockOnSelectActive = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders classroom info and subject badge', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onSelectActive={mockOnSelectActive}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('MATH-4-RIZAL-789')).toBeInTheDocument();
    expect(screen.getByText('Teacher Santos')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText(/Section Rizal/i)).toBeInTheDocument();
    expect(screen.getByText(/Grade 4/i)).toBeInTheDocument();
  });

  test('indicates active state with badge', () => {
    const { rerender } = render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onSelectActive={mockOnSelectActive}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /set active/i })).toBeInTheDocument();

    rerender(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={true}
        onSelectActive={mockOnSelectActive}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  test('triggers onViewDetails when Details button is clicked', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onSelectActive={mockOnSelectActive}
        onViewDetails={mockOnViewDetails}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /details/i }));
    expect(mockOnViewDetails).toHaveBeenCalledWith('MATH-4-RIZAL-789');
  });

  test('triggers onSelectActive when Set Active is clicked', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onSelectActive={mockOnSelectActive}
        onViewDetails={mockOnViewDetails}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /set active/i }));
    expect(mockOnSelectActive).toHaveBeenCalledWith('MATH-4-RIZAL-789');
  });
});
