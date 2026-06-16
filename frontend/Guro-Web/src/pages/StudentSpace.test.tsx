import { render, screen, fireEvent } from '@testing-library/react';
import { StudentSpace } from './StudentSpace';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StudentSpace Page (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    );
  });

  test('renders name input when logged out guest starts', () => {
    const mockExit = jest.fn();
    render(<StudentSpace onExit={mockExit} currentUser={null} />);
    expect(screen.getByPlaceholderText(/Your name\.\.\./i)).toBeInTheDocument();
  });

  test('proceeds to grade selection when guest enters name', () => {
    const mockExit = jest.fn();
    render(<StudentSpace onExit={mockExit} currentUser={null} />);

    const input = screen.getByPlaceholderText(/Your name\.\.\./i);
    fireEvent.change(input, { target: { value: 'Neal' } });

    const continueBtn = screen.getByRole('button', { name: /Start Learning/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Select your grade level/i)).toBeInTheDocument();
  });

  test('skips name input and goes to grade selection if currentUser is logged in', () => {
    const mockExit = jest.fn();
    const user = { name: 'Jeane', email: 'jeane@school.edu', userId: 'USR-123' };
    render(<StudentSpace onExit={mockExit} currentUser={user} />);

    expect(screen.getByText(/Select your grade level/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Enter your name/i)).not.toBeInTheDocument();
  });

  test('triggers exit when back/exit button is clicked', () => {
    const mockExit = jest.fn();
    render(<StudentSpace onExit={mockExit} currentUser={null} />);

    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);

    expect(mockExit).toHaveBeenCalled();
  });
});
