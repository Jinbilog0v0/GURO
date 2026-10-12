import { render, screen, fireEvent } from '@testing-library/react';
import { MobileAppShowcase } from './MobileAppShowcase';
import '@testing-library/jest-dom';

describe('MobileAppShowcase Component', () => {
  const mockBackToOverview = jest.fn();
  const mockLaunchPortal = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders phone status bar, controls console, and default student home dashboard', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    expect(screen.getByText('Simulator Console')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Simulator')).toBeInTheDocument();
    expect(screen.getByText('9:41')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, Juan!/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Pick/i)).toBeInTheDocument();
  });

  test('calls onBackToOverview when Overview button is clicked', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const backBtn = screen.getByRole('button', { name: /Overview/i });
    fireEvent.click(backBtn);
    expect(mockBackToOverview).toHaveBeenCalledTimes(1);
  });

  test('can toggle simulated network state between Online and Offline', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const offlineBtn = screen.getByRole('button', { name: /Offline \(0 Data\)/i });
    fireEvent.click(offlineBtn);

    // Check that the phone status bar now displays Offline
    expect(screen.getAllByText('Offline').length).toBeGreaterThanOrEqual(1);

    const onlineBtn = screen.getByRole('button', { name: /Online/i });
    fireEvent.click(onlineBtn);
    expect(screen.getAllByText('Online').length).toBeGreaterThanOrEqual(1);
  });

  test('can switch roles to preview Teacher and Parent mobile views with working bottom nav', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Switch to Teacher
    const teacherRoleBtn = screen.getByRole('button', { name: /Teacher/i });
    fireEvent.click(teacherRoleBtn);
    expect(screen.getByText(/Teacher Console/i)).toBeInTheDocument();
    expect(screen.getByText(/DepEd SF9 Progress Ready/i)).toBeInTheDocument();

    // Click Teacher AI Ingest bottom tab
    const ingestTabs = screen.getAllByRole('button', { name: /AI Ingest/i });
    fireEvent.click(ingestTabs[ingestTabs.length - 1]);
    expect(screen.getByText(/AI Lesson Ingestion/i)).toBeInTheDocument();

    // Switch to Parent
    const parentRoleBtn = screen.getByRole('button', { name: /Parent/i });
    fireEvent.click(parentRoleBtn);
    expect(screen.getByText(/Linked Child/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Study Regulation/i)).toBeInTheDocument();

    // Click Parent Time Guard bottom tab
    const limitsTabs = screen.getAllByRole('button', { name: /Time Guard/i });
    fireEvent.click(limitsTabs[limitsTabs.length - 1]);
    expect(screen.getAllByText(/Screen Time Guard/i).length).toBeGreaterThanOrEqual(1);
  });

  test('bottom navigation switches screens inside the phone (Dashboard -> Lessons -> My Progress -> Profile)', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Click Lessons tab
    const lessonsTabs = screen.getAllByRole('button', { name: /Lessons/i });
    fireEvent.click(lessonsTabs[lessonsTabs.length - 1]);
    expect(screen.getByText(/Lesson Catalog/i)).toBeInTheDocument();

    // Click My Progress tab
    const progressTabs = screen.getAllByRole('button', { name: /My Progress/i });
    fireEvent.click(progressTabs[progressTabs.length - 1]);
    expect(screen.getByText(/MELC Competency Mastery/i)).toBeInTheDocument();

    // Click Profile tab
    const profileTabs = screen.getAllByRole('button', { name: /Profile/i });
    fireEvent.click(profileTabs[profileTabs.length - 1]);
    expect(screen.getByText('582-910')).toBeInTheDocument();
    expect(screen.getByText(/Parent Access Code/i)).toBeInTheDocument();
  });

  test('can launch quiz and answer interactively', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Click Take Quiz button from Home card
    const takeQuizBtn = screen.getByRole('button', { name: /Take Quiz/i });
    fireEvent.click(takeQuizBtn);

    expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument();

    // Click the correct answer
    const optionABtn = screen.getByRole('button', { name: /1 1\/2 cups/i });
    fireEvent.click(optionABtn);

    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();
  });

  test('Simulated Grade Curriculum is only shown when student role is selected', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Default role is student -> visible
    expect(screen.getByText(/4\. Simulated Grade Curriculum/i)).toBeInTheDocument();

    // Switch to teacher -> hidden
    const teacherRoleBtn = screen.getByRole('button', { name: /Teacher/i });
    fireEvent.click(teacherRoleBtn);
    expect(screen.queryByText(/4\. Simulated Grade Curriculum/i)).not.toBeInTheDocument();

    // Switch to parent -> hidden
    const parentRoleBtn = screen.getByRole('button', { name: /Parent/i });
    fireEvent.click(parentRoleBtn);
    expect(screen.queryByText(/4\. Simulated Grade Curriculum/i)).not.toBeInTheDocument();

    // Switch back to student -> visible again
    const studentRoleBtn = screen.getByRole('button', { name: /Student/i });
    fireEvent.click(studentRoleBtn);
    expect(screen.getByText(/4\. Simulated Grade Curriculum/i)).toBeInTheDocument();
  });
});
