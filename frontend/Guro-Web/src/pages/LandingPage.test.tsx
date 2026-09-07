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

  test('can navigate to register screen and submit new registration as parent', async () => {
    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    const registerLink = screen.getByText(/Create one here/i);
    fireEvent.click(registerLink);

    expect(screen.getByRole('heading', { name: /Create account/i })).toBeInTheDocument();

    const parentRoleBtn = screen.getByRole('button', { name: /parent/i });
    fireEvent.click(parentRoleBtn);

    const firstNameInput = screen.getByPlaceholderText(/e.g. Maria/i);
    const lastNameInput = screen.getByPlaceholderText(/e.g. Santos/i);
    const emailInput = screen.getByPlaceholderText('you@school.edu');
    const passwordInput = screen.getByPlaceholderText(/Min. 8 chars/i);
    const registerBtn = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'Neal' } });
    fireEvent.change(lastNameInput, { target: { value: 'Claro' } });
    fireEvent.change(emailInput, { target: { value: 'nealjeanclaro@guro.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'JinBilog0v0!' } });

    fireEvent.click(registerBtn);

    await waitFor(() => {
      expect(mockLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ name: 'Neal' }));
    });
  });

  test('requires and submits institutional details when registering as teacher', async () => {
    const originalFileReader = global.FileReader;
    class MockFileReader {
      onload: any = null;
      result: string = 'data:image/png;base64,ZmFrZS1pZA==';
      readAsDataURL() {
        if (this.onload) {
          this.onload({ target: { result: this.result } });
        }
      }
    }
    global.FileReader = MockFileReader as any;

    try {
      const mockSelectRole = jest.fn();
      const mockLoginSuccess = jest.fn();
      render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

      const registerLink = screen.getByText(/Create one here/i);
      fireEvent.click(registerLink);

      const firstNameInput = screen.getByPlaceholderText(/e.g. Maria/i);
      const lastNameInput = screen.getByPlaceholderText(/e.g. Santos/i);
      const emailInput = screen.getByPlaceholderText('you@school.edu');
      const passwordInput = screen.getByPlaceholderText(/Min. 8 chars/i);
      const schoolNameInput = screen.getByPlaceholderText(/Manila Science Elementary School/i);
      const schoolIdInput = screen.getByPlaceholderText(/DepEd ID 109283/i);
      const registerBtn = screen.getByRole('button', { name: /Create account/i });

      fireEvent.change(firstNameInput, { target: { value: 'Teacher' } });
      fireEvent.change(lastNameInput, { target: { value: 'Maria' } });
      fireEvent.change(emailInput, { target: { value: 'teacher@deped.gov.ph' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(schoolNameInput, { target: { value: 'Manila Central School' } });
      fireEvent.change(schoolIdInput, { target: { value: 'PRC-0918234' } });

      const file = new File(['fake-id-content'], 'deped_id.png', { type: 'image/png' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fireEvent.change(fileInput, { target: { files: [file] } });
      }

      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Manila Central School')
        }));
        expect(mockLoginSuccess).not.toHaveBeenCalled();
        expect(screen.getByText(/Verification in Progress/i)).toBeInTheDocument();
      });
    } finally {
      global.FileReader = originalFileReader;
    }
  });

  test('can select a role card in the guest section', () => {
    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    const guestBtn = screen.getByText(/Continue as guest/i);
    fireEvent.click(guestBtn);

    expect(screen.getByText(/Guest session/i)).toBeInTheDocument();

    const studentCard = screen.getByRole('heading', { name: /Grade 4 Student/i }).closest('button');
    if (studentCard) fireEvent.click(studentCard);

    expect(mockSelectRole).toHaveBeenCalledWith('student', 4);
  });

  test('can toggle admin mode via 5-tap logo gesture and authenticate as admin', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, token: 'dev-token-123', user: { name: 'Guro Developer', role: 'developer' } })
      })
    );

    const mockSelectRole = jest.fn();
    const mockLoginSuccess = jest.fn();
    render(<LandingPage onSelectRole={mockSelectRole} onLoginSuccess={mockLoginSuccess} />);

    const logoBtn = screen.getByLabelText(/GURO Logo/i);
    // Click logo 5 times to unlock Admin mode
    fireEvent.click(logoBtn);
    fireEvent.click(logoBtn);
    fireEvent.click(logoBtn);
    fireEvent.click(logoBtn);
    fireEvent.click(logoBtn);

    expect(screen.getByText(/Staff & IT Console/i)).toBeInTheDocument();
    expect(screen.getByText(/System Authorization/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('admin@guro.dev');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /Authenticate as Admin/i });

    fireEvent.change(emailInput, { target: { value: 'nealjeanclaro@guro.dev' } });
    fireEvent.change(passwordInput, { target: { value: 'JinBilog0v0' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLoginSuccess).toHaveBeenCalledWith(expect.objectContaining({ role: 'developer' }));
    });
  });
});
