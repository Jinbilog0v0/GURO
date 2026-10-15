import { render, screen, fireEvent, within } from '@testing-library/react';
import { SystemOverviewPage } from './SystemOverviewPage';
import '@testing-library/jest-dom';

describe('SystemOverviewPage Component', () => {
  const mockOpenMobileShowcase = jest.fn();
  const mockOpenAuth = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
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
    expect(screen.getAllByText(/100% Zero-Data/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Form SF9 Ready/i).length).toBeGreaterThanOrEqual(1);
  });

  test('calls onOpenMobileShowcase when Explore Mobile Showcase is clicked', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const heroShowcaseBtn = screen.getByRole('button', { name: /Explore Mobile Showcase/i });
    fireEvent.click(heroShowcaseBtn);
    expect(mockOpenMobileShowcase).toHaveBeenCalledTimes(1);
  });

  test('calls onOpenAuth when Sign In buttons are clicked', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const signInBtns = screen.getAllByRole('button', { name: /^Sign In$/i });
    expect(signInBtns.length).toBe(2);
    fireEvent.click(signInBtns[0]);
    expect(mockOpenAuth).toHaveBeenCalledTimes(1);

    fireEvent.click(signInBtns[1]);
    expect(mockOpenAuth).toHaveBeenCalledTimes(2);

    const aboutAccessBtn = screen.getByRole('button', { name: /Sign In to Platform/i });
    fireEvent.click(aboutAccessBtn);
    expect(mockOpenAuth).toHaveBeenCalledTimes(3);
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

    // Click Why GURO nav link
    const pillarsLink = screen.getByRole('link', { name: /Why GURO/i });
    fireEvent.click(pillarsLink);
    expect(underline).toHaveStyle({ left: '95px' });

    // Click Who It's For nav link
    const rolesLink = screen.getByRole('link', { name: /Who It's For/i });
    fireEvent.click(rolesLink);
    expect(underline).toHaveStyle({ left: '190px' });

    // Click About nav link
    const aboutLink = screen.getByRole('link', { name: /About/i });
    fireEvent.click(aboutLink);
    expect(underline).toHaveStyle({ left: '285px' });

    // Click Overview link back
    const overviewLink = screen.getByRole('link', { name: /^Overview$/i });
    fireEvent.click(overviewLink);
    expect(underline).toHaveStyle({ left: '0px' });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('renders Download APK links in header and hero section', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const apkLinks = screen.getAllByRole('link', { name: /Download.*APK/i });
    expect(apkLinks.length).toBe(2);
    expect(apkLinks[0]).toHaveAttribute('href', '/downloads/GURO.apk');
    expect(apkLinks[1]).toHaveAttribute('href', '/downloads/GURO.apk');
  });

  test('renders About section with GURO acronym pillars', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    expect(screen.getByText(/About the GURO Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar G/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar U/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar R/i)).toBeInTheDocument();
    expect(screen.getByText(/Pillar O/i)).toBeInTheDocument();
    expect(screen.getByText(/Anchored to DepEd K–12 Most Essential Learning Competencies/i)).toBeInTheDocument();
  });

  test('renders mobile bottom navigation bar with jump buttons', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    const bottomNav = screen.getByTestId('mobile-bottom-navigation');
    expect(bottomNav).toBeInTheDocument();

    const jumpWhyGuroBtn = screen.getByRole('button', { name: /Jump to Why GURO/i });
    expect(jumpWhyGuroBtn).toBeInTheDocument();
    fireEvent.click(jumpWhyGuroBtn);

    const jumpAboutBtn = screen.getByRole('button', { name: /Jump to About/i });
    expect(jumpAboutBtn).toBeInTheDocument();
    fireEvent.click(jumpAboutBtn);
  });

  test('opens and closes mobile top actions menu sheet', () => {
    render(
      <SystemOverviewPage
        onOpenMobileShowcase={mockOpenMobileShowcase}
        onOpenAuth={mockOpenAuth}
        isDarkMode={false}
        onToggleTheme={mockToggleTheme}
      />
    );

    // Initial state: menu is closed
    expect(screen.queryByTestId('mobile-top-action-menu')).not.toBeInTheDocument();

    // Click menu toggle button to open
    const openMenuBtn = screen.getByRole('button', { name: /Open navigation menu/i });
    fireEvent.click(openMenuBtn);

    const menuDropdown = screen.getByTestId('mobile-top-action-menu');
    expect(menuDropdown).toBeInTheDocument();
    expect(within(menuDropdown).getByText(/Download App/i)).toBeInTheDocument();

    // Toggle theme from mobile menu
    const themeBtn = within(menuDropdown).getByRole('button', { name: /Dark Mode/i });
    fireEvent.click(themeBtn);
    expect(mockToggleTheme).toHaveBeenCalled();

    // Menu closes after selection
    expect(screen.queryByTestId('mobile-top-action-menu')).not.toBeInTheDocument();
  });
});
