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

  test('renders phone status bar, controls console, and default study slide', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    expect(screen.getByText('Simulator Console')).toBeInTheDocument();
    expect(screen.getByText('Mobile Simulator')).toBeInTheDocument();
    expect(screen.getByText('9:41')).toBeInTheDocument();
    expect(screen.getByText(/Equivalent Fractions/i)).toBeInTheDocument();
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

  test('can switch roles to preview Teacher and Parent mobile views', () => {
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
    expect(screen.getByText(/Teacher Mobile Console/i)).toBeInTheDocument();
    expect(screen.getByText(/DepEd SF9 Progress/i)).toBeInTheDocument();

    // Switch to Parent
    const parentRoleBtn = screen.getByRole('button', { name: /Parent/i });
    fireEvent.click(parentRoleBtn);
    expect(screen.getByText(/Linked Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Daily Study Regulation/i)).toBeInTheDocument();
  });

  test('can interact with the in-phone quiz screen and earn stars', () => {
    render(
      <MobileAppShowcase
        onBackToOverview={mockBackToOverview}
        onLaunchPortal={mockLaunchPortal}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Switch to Quiz screen
    const quizScreenBtn = screen.getByRole('button', { name: /Gamified Quiz/i });
    fireEvent.click(quizScreenBtn);

    expect(screen.getByText(/Question 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/12 Stars/i)).toBeInTheDocument();

    // Click the correct answer
    const optionABtn = screen.getByRole('button', { name: /1 1\/2 cups/i });
    fireEvent.click(optionABtn);

    expect(screen.getByText(/Great job!/i)).toBeInTheDocument();
    expect(screen.getByText(/13 Stars/i)).toBeInTheDocument();
  });
});
