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

  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders classroom info and subject badge', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('MATH-4-RIZAL-789')).toBeInTheDocument();
    expect(screen.getByText('Teacher Santos')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText(/Section Rizal/i)).toBeInTheDocument();
    expect(screen.getByText(/Grade 4/i)).toBeInTheDocument();
  });

  test('indicates active state with top badge and grade badge when inactive', () => {
    const { rerender } = render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByText('G4')).toBeInTheDocument();

    rerender(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={true}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('triggers onViewDetails when clicking anywhere on the card', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onViewDetails={mockOnViewDetails}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /section rizal/i }));
    expect(mockOnViewDetails).toHaveBeenCalledWith('MATH-4-RIZAL-789');
  });

  test('triggers onViewDetails on keyboard Enter', () => {
    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onViewDetails={mockOnViewDetails}
      />
    );

    fireEvent.keyDown(screen.getByRole('button', { name: /section rizal/i }), { key: 'Enter' });
    expect(mockOnViewDetails).toHaveBeenCalledWith('MATH-4-RIZAL-789');
  });

  test('copy button copies code and does not trigger onViewDetails', () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ClassroomCard
        classroom={mockClassroom}
        isActive={false}
        onViewDetails={mockOnViewDetails}
      />
    );

    const copyBtn = screen.getByTitle(/copy classroom code/i);
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('MATH-4-RIZAL-789');
    expect(mockOnViewDetails).not.toHaveBeenCalled();
  });
});
