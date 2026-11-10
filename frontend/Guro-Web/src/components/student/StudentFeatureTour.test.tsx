import { render, screen, fireEvent } from '@testing-library/react';
import { StudentFeatureTour } from './StudentFeatureTour';
import '@testing-library/jest-dom';

describe('StudentFeatureTour Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders step 1 and cycles to next steps', () => {
    const onClose = jest.fn();
    const onComplete = jest.fn();

    render(
      <StudentFeatureTour
        isOpen={true}
        onClose={onClose}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/Step 1 of 4 • Curriculum/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Subjects & DepEd Topics/i)).toBeInTheDocument();

    // Next step -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 2 of 4 • Self-Paced/i)).toBeInTheDocument();

    // Next step -> Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 3 of 4 • Mastery Check/i)).toBeInTheDocument();

    // Next step -> Step 4
    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));
    expect(screen.getByText(/Step 4 of 4 • Classroom Sync/i)).toBeInTheDocument();

    // Finish
    fireEvent.click(screen.getByRole('button', { name: /Got it, let’s go!/i }));
    expect(localStorage.getItem('guro_student_tour_completed_v1')).toBe('true');
    expect(onClose).toHaveBeenCalled();
  });
});
