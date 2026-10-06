import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import '@testing-library/jest-dom';

describe('SettingsModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnToggleTheme = jest.fn();
  const mockOnLogout = jest.fn();
  const mockOnSaveProfile = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        currentUser={null}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('renders spacious modal with teacher settings and categories when open', () => {
    const teacherUser = {
      userId: 'TEACHER-101',
      email: 'teacher@deped.gov.ph',
      name: 'Maria Santos',
      role: 'teacher',
      schoolName: 'Central Elementary School',
      schoolIdNumber: 'PRC-1234567',
      verificationStatus: 'approved' as const,
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentUser={teacherUser}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    // Modal Dialog container
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Teacher Workspace Settings')).toBeInTheDocument();

    // Menu Bar tabs
    expect(screen.getByText('Profile & Classroom')).toBeInTheDocument();
    expect(screen.getByText('Theme & Preferences')).toBeInTheDocument();
    expect(screen.getByText('Password & Security')).toBeInTheDocument();
    expect(screen.getByText('Session & Account')).toBeInTheDocument();

    // Teacher specific details rendered
    expect(screen.getByText('Teacher Credentials & School')).toBeInTheDocument();
    expect(screen.getByText('Central Elementary School')).toBeInTheDocument();
    expect(screen.getByText('Accredited Faculty')).toBeInTheDocument();
  });

  test('navigates between category tabs smoothly', () => {
    const teacherUser = {
      userId: 'TEACHER-101',
      email: 'teacher@deped.gov.ph',
      name: 'Maria Santos',
      role: 'teacher',
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentUser={teacherUser}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    // Switch to Theme & Preferences tab
    fireEvent.click(screen.getByText('Theme & Preferences'));
    expect(screen.getByText('Theme Mode & Appearance')).toBeInTheDocument();
    expect(screen.getByText('Light Workspace')).toBeInTheDocument();
    expect(screen.getByText('Dark Workspace')).toBeInTheDocument();
    expect(screen.getByText('Audio & Narration Feedback')).toBeInTheDocument();

    // Switch to Password & Security tab
    fireEvent.click(screen.getByText('Password & Security'));
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();

    // Switch to Session & Account tab
    fireEvent.click(screen.getByText('Session & Account'));
    expect(screen.getByText('Active Account & Device')).toBeInTheDocument();
    expect(screen.getByText('teacher@deped.gov.ph')).toBeInTheDocument();
    expect(screen.getByText('Sign Out of GURO')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked or Escape key pressed', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentUser={{ userId: 'S-1', email: 'stud@guro.ph', name: 'Learner', role: 'student' }}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
      />
    );

    // Click close button
    const closeBtn = screen.getByTitle('Close (Esc)');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Press Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  test('renders student settings with Parent Code sharing capsule', () => {
    const studentUser = {
      userId: 'STUDENT-99',
      email: 'student@guro.ph',
      name: 'Juan Dela Cruz',
      role: 'student',
    };

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentUser={studentUser}
        isDarkMode={false}
        onToggleTheme={mockOnToggleTheme}
        onLogout={mockOnLogout}
        onSaveProfile={mockOnSaveProfile}
        parentAccessCode="GURO-P-8888"
      />
    );

    expect(screen.getByText('Student Learning Settings')).toBeInTheDocument();
    expect(screen.getByText('Share Access with Parent or Guardian')).toBeInTheDocument();
    expect(screen.getByText('GURO-P-8888')).toBeInTheDocument();
    expect(screen.getByText('Learning Accommodations & Display')).toBeInTheDocument();
  });
});
