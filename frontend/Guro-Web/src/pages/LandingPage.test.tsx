import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LandingPage } from './LandingPage';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

global.fetch = jest.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LandingPage Portal (Web)', () => {
  beforeEach(() => {
    jest.setTimeout(30000);
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, user: { name: 'Neal', role: 'teacher' } })
      })
    );
  });

  test('renders login portal initially with brand text', () => {
    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('GURO')).toBeInTheDocument();
  });

  test('can navigate to register screen and submit new registration', async () => {
    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    const registerLink = screen.getByText(/Create one here/i);
    fireEvent.click(registerLink);

    expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Teacher Maria/i);
    const emailInput = screen.getByPlaceholderText('you@school.edu');
    const passwordInput = screen.getByPlaceholderText(/Minimum 6 characters/i);
    const registerBtn = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(nameInput, { target: { value: 'Neal Claro' } });
    fireEvent.change(emailInput, { target: { value: 'nealjeanclaro@guro.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'JinBilog0v0' } });

    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(mockLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ name: 'Neal' }));
    });
  });

  test('can select a role card in the guest section', () => {
    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    const guestBtn = screen.getByText(/Continue as guest/i);
    fireEvent.click(guestBtn);

    expect(screen.getByText(/Guest session/i)).toBeInTheDocument();

    const studentCard = screen.getByRole('heading', { name: /Student/i }).closest('button');
    if (studentCard) fireEvent.click(studentCard);

    expect(mockSelectRole).toHaveBeenCalledWith('student');
  });
});
