import { render, screen, fireEvent } from '@testing-library/react';
import { SystemOverviewPage } from './SystemOverviewPage';
import '@testing-library/jest-dom';

describe('SystemOverviewPage Component', () => {
  const mockOpenMobileShowcase = jest.fn();
  const mockOpenAuth = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders hero title and core platform value propositions', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    expect(screen.getByText(/Philippine Classrooms/i)).toBeInTheDocument();
    expect(screen.getAllByText(/DepEd MELC Aligned/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/100% Zero-Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Form SF9 Ready/i)).toBeInTheDocument();
  });

  test('calls onOpenMobileShowcase when Mobile Showcase buttons are clicked', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const heroShowcaseBtn = screen.getByRole('button', { name: /Explore Mobile App Showcase/i });
    fireEvent.click(heroShowcaseBtn);
    expect(mockOpenMobileShowcase).toHaveBeenCalledTimes(1);

    const calloutShowcaseBtn = screen.getByRole('button', { name: /Launch Mobile Simulator/i });
    fireEvent.click(calloutShowcaseBtn);
    expect(mockOpenMobileShowcase).toHaveBeenCalledTimes(2);
  });

  test('calls onOpenAuth when Sign In / Portal buttons are clicked', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const navSignInBtn = screen.getByRole('button', { name: /Sign In \/ Portal/i });
    fireEvent.click(navSignInBtn);
    expect(mockOpenAuth).toHaveBeenCalledTimes(1);

    const heroWorkspaceBtn = screen.getByRole('button', { name: /Launch Web Workspace/i });
    fireEvent.click(heroWorkspaceBtn);
    expect(mockOpenAuth).toHaveBeenCalledTimes(2);
  });

  test('can switch between audience tabs (Student, Teacher, Parent)', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Initial is student
    expect(screen.getByText(/Self-Paced Learning with Zero Barriers/i)).toBeInTheDocument();

    // Click Teacher tab
    const teacherTab = screen.getByRole('button', { name: /For Teachers/i });
    fireEvent.click(teacherTab);
    expect(screen.getByText(/Classroom Analytics & SF9 Reporting/i)).toBeInTheDocument();

    // Click Parent tab
    const parentTab = screen.getByRole('button', { name: /For Parents/i });
    fireEvent.click(parentTab);
    expect(screen.getByText(/Stay Connected to Your Child's Academic Journey/i)).toBeInTheDocument();
  });

  test('renders top navigation links with animated sliding underline for current section', () => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();

    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Initial underline is present
    const underline = screen.getByTestId('top-nav-sliding-underline');
    expect(underline).toBeInTheDocument();
    expect(underline).toHaveStyle({ left: '0px' });

    // Click Platform Pillars nav link
    const pillarsLink = screen.getByRole('link', { name: /Platform Pillars/i });
    fireEvent.click(pillarsLink);
    expect(underline).toHaveStyle({ left: '95px' });

    // Click Who It's For nav link
    const rolesLink = screen.getByRole('link', { name: /Who It's For/i });
    fireEvent.click(rolesLink);
    expect(underline).toHaveStyle({ left: '190px' });

    // Click Mobile App nav link
    const mobileLink = screen.getByRole('link', { name: /Mobile App/i });
    fireEvent.click(mobileLink);
    expect(underline).toHaveStyle({ left: '285px' });

    // Click Overview link back
    const overviewLink = screen.getByRole('link', { name: /^Overview$/i });
    fireEvent.click(overviewLink);
    expect(underline).toHaveStyle({ left: '0px' });
  });
});
