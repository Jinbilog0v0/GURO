import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SettingsSpace } from './SettingsSpace';

// Mock dependencies
jest.mock('../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../utils/api', () => ({
  apiFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, user: { name: 'Updated User' } }),
  }),
}));

describe('SettingsSpace Component', () => {
  const mockOnBack = jest.fn();
  const mockOnToggleTheme = jest.fn();
  const mockOnLogout = jest.fn();
  const mockOnSaveProfile = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly for Teacher role and displays teacher-specific settings', () => {
    const teacherUser = {
      userId: 'teach-1',
      email: 'teacher@deped.gov.ph',
      name: 'Maria Santos',
      role: 'teacher',
      schoolName: 'Central Elementary School',
      schoolIdNumber: 'PRC-123456',
      verificationStatus: 'approved' as const,
    };

    render(
      <SettingsSpace
        currentUser={teacherUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    expect(screen.getByText('Teacher Workspace')).toBeInTheDocument();
    expect(screen.getByText('Teacher Credentials & School')).toBeInTheDocument();
    expect(screen.getByText('Accredited Faculty')).toBeInTheDocument();
    expect(screen.getByText('Central Elementary School')).toBeInTheDocument();
    expect(screen.getByText('Passing Mark Threshold')).toBeInTheDocument();
  });

  it('renders student settings for student role with Parent Access Code', () => {
    const studentUser = {
      userId: 'stud-1',
      email: 'student@guro.local',
      name: 'Juan Dela Cruz',
      role: 'student',
    };

    render(
      <SettingsSpace
        currentUser={studentUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
        selectedGrade={5}
        parentAccessCode="GURO-P-9999"
      />
    );

    expect(screen.getByText('Student Learning')).toBeInTheDocument();
    expect(screen.getByText('Share Access with Parent or Guardian')).toBeInTheDocument();
    expect(screen.getByText('GURO-P-9999')).toBeInTheDocument();
    expect(screen.getByText('Mascot Outfits, Theme & Voice Audio')).toBeInTheDocument();
  });

  it('renders parent settings for parent role with Linked Children and PIN management', () => {
    const parentUser = {
      userId: 'par-1',
      email: 'parent@gmail.com',
      name: 'Elena Ramos',
      role: 'parent',
    };

    render(
      <SettingsSpace
        currentUser={parentUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    expect(screen.getByText('Parent Supervision')).toBeInTheDocument();
    expect(screen.getByText('Linked Students Roster')).toBeInTheDocument();
    expect(screen.getByText('4-Digit Parent Security PIN')).toBeInTheDocument();
  });

  it('renders admin settings for admin role with Division Governance', () => {
    const adminUser = {
      userId: 'adm-1',
      email: 'admin@deped.gov.ph',
      name: 'Super Admin',
      role: 'admin',
    };

    render(
      <SettingsSpace
        currentUser={adminUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    expect(screen.getByText('Super Admin Console')).toBeInTheDocument();
    expect(screen.getByText('Administrative Clearance & Jurisdiction')).toBeInTheDocument();
    expect(screen.getByText('Division Diagnostic & Alert Thresholds')).toBeInTheDocument();
  });

  it('switches between tabs (Profile, Password & Security, Session & Account)', () => {
    const teacherUser = {
      userId: 'teach-1',
      email: 'teacher@deped.gov.ph',
      name: 'Maria Santos',
      role: 'teacher',
    };

    render(
      <SettingsSpace
        currentUser={teacherUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    // Click Password & Security tab
    fireEvent.click(screen.getByText('Password & Security'));
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByText('Account Integrity & Verification')).toBeInTheDocument();

    // Click Session & Account tab
    fireEvent.click(screen.getByText('Session & Account'));
    expect(screen.getByText('Active Account & Device')).toBeInTheDocument();
    expect(screen.getByText('Sign Out of GURO')).toBeInTheDocument();
  });

  it('triggers onBack when Back to Workspace button is clicked or Esc is pressed', () => {
    const teacherUser = {
      userId: 'teach-1',
      email: 'teacher@deped.gov.ph',
      name: 'Maria Santos',
      role: 'teacher',
    };

    render(
      <SettingsSpace
        currentUser={teacherUser}
        onBack={mockOnBack}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /back to workspace/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnBack).toHaveBeenCalledTimes(2);
  });
});
