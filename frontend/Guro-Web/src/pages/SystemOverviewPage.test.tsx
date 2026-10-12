import { render, screen, fireEvent } from '@testing-library/react';
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

    const heroShowcaseBtn = screen.getByRole('button', { name: /Explore Mobile Showcase/i });
    fireEvent.click(heroShowcaseBtn);
    expect(mockOpenMobileShowcase).toHaveBeenCalledTimes(1);

    const calloutShowcaseBtn = screen.getByRole('button', { name: /Launch Mobile Showcase/i });
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

    const signInBtns = screen.getAllByRole('button', { name: /Sign In \/ Portal/i });
    expect(signInBtns.length).toBe(2);
    fireEvent.click(signInBtns[0]);
    expect(mockOpenAuth).toHaveBeenCalledTimes(1);

    fireEvent.click(signInBtns[1]);
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

    // Click Why GURO nav link
    const pillarsLink = screen.getByRole('link', { name: /Why GURO/i });
    fireEvent.click(pillarsLink);
    expect(underline).toHaveStyle({ left: '95px' });

    // Click Who It's For nav link
    const rolesLink = screen.getByRole('link', { name: /Who It's For/i });
    fireEvent.click(rolesLink);
    expect(underline).toHaveStyle({ left: '190px' });

    // Click Mobile Showcase nav link
    const mobileLink = screen.getByRole('link', { name: /Mobile Showcase/i });
    fireEvent.click(mobileLink);
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
    expect(apkLinks[0]).toHaveAttribute('href', 'https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk');
    expect(apkLinks[1]).toHaveAttribute('href', 'https://expo.dev/artifacts/eas/bjOmN4X0gTuext8-S5sqI4HSyyiOCtFQJk8HscF0wuw.apk');
  });
});
