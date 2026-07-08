import { render, screen, fireEvent, act } from '@testing-library/react';
import { StudentSpace } from './StudentSpace';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('StudentSpace Page (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    );
  });

  test('renders name input when logged out guest starts', async () => {
    const mockExit = jest.fn();
    const mockLogout = jest.fn();
    await act(async () => {
      render(<StudentSpace onExit={mockExit} onLogout={mockLogout} currentUser={null} isDarkMode={false} onToggleTheme={jest.fn()} />);
    });
    expect(screen.getByPlaceholderText(/e\.g\. Juan Dela Cruz/i)).toBeInTheDocument();
  });

  test('proceeds to dashboard when guest enters name', async () => {
    const mockExit = jest.fn();
    const mockLogout = jest.fn();
    await act(async () => {
      render(<StudentSpace onExit={mockExit} onLogout={mockLogout} currentUser={null} isDarkMode={false} onToggleTheme={jest.fn()} />);
    });

    const input = screen.getByPlaceholderText(/e\.g\. Juan Dela Cruz/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Neal' } });
    });

    const continueBtn = screen.getByRole('button', { name: /Start Learning/i });
    await act(async () => {
      fireEvent.click(continueBtn);
    });

    expect(screen.getAllByText(/Welcome back, Neal!/i).length).toBeGreaterThan(0);
  });

  test('skips name input and goes to dashboard if currentUser is logged in', async () => {
    const mockExit = jest.fn();
    const mockLogout = jest.fn();
    const user = { name: 'Jeane', email: 'jeane@school.edu', userId: 'USR-123' };
    await act(async () => {
      render(<StudentSpace onExit={mockExit} onLogout={mockLogout} currentUser={user} isDarkMode={false} onToggleTheme={jest.fn()} />);
    });

    expect(screen.getAllByText(/Welcome back, Jeane!/i).length).toBeGreaterThan(0);
    expect(screen.queryByPlaceholderText(/e\.g\. Juan Dela Cruz/i)).not.toBeInTheDocument();
  });

  test('triggers exit when back/exit button is clicked', async () => {
    const mockExit = jest.fn();
    const mockLogout = jest.fn();
    await act(async () => {
      render(<StudentSpace onExit={mockExit} onLogout={mockLogout} currentUser={null} isDarkMode={false} onToggleTheme={jest.fn()} />);
    });

    const backBtn = screen.getByRole('button', { name: 'Back to sign in' });
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(mockExit).toHaveBeenCalled();
  });

  test('clears localStorage and triggers onLogout when logout is confirmed', async () => {
    const mockExit = jest.fn();
    const mockLogout = jest.fn();
    const user = { name: 'Jeane', email: 'jeane@school.edu', userId: 'USR-123' };

    localStorage.setItem('guro_user_session', JSON.stringify(user));
    localStorage.setItem('guro_student_stars', '10');
    localStorage.setItem('guro_auth_token', 'dummy-token');

    await act(async () => {
      render(<StudentSpace onExit={mockExit} onLogout={mockLogout} currentUser={user} isDarkMode={false} onToggleTheme={jest.fn()} />);
    });

    // Find and click the "Log Out" button (directly accessible in the sidebar)
    const logoutBtn = screen.getByRole('button', { name: /Log Out/i });
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    // Now the modal should be open, find and click the "Logout" confirm button
    const confirmBtn = screen.getByRole('button', { name: 'Logout' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(localStorage.getItem('guro_user_session')).toBeNull();
    expect(localStorage.getItem('guro_student_stars')).toBeNull();
    expect(localStorage.getItem('guro_auth_token')).toBeNull();
  });
});
