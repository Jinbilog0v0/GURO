import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('./pages/StudentSpace', () => ({
  StudentSpace: () => <div data-testid="student-space">Student Space Mock</div>
}));
jest.mock('./pages/TeacherSpace', () => ({
  TeacherSpace: () => <div data-testid="teacher-space">Teacher Space Mock</div>
}));
jest.mock('./pages/ParentSpace', () => ({
  ParentSpace: () => <div data-testid="parent-space">Parent Space Mock</div>
}));
jest.mock('./pages/LessonSpace', () => ({
  LessonSpace: () => <div data-testid="lesson-space">Lesson Space Mock</div>
}));
jest.mock('./pages/DashboardSpace', () => ({
  DashboardSpace: () => <div data-testid="dashboard-space">Dashboard Space Mock</div>
}));

global.fetch = jest.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('App Portal and Navigation Layout (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => []
      })
    );
  });

  test('renders Landing Page initially if no user is cached', () => {
    render(<App />);
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
    expect(screen.queryByText('Teacher Portal')).not.toBeInTheDocument();
  });

  test('renders Teacher Portal layout for teacher role', async () => {
    const teacherUser = {
      userId: 'TEACHER-1',
      email: 'teacher@school.edu',
      name: 'Teacher Maria',
      role: 'teacher'
    };
    localStorage.setItem('guro_user_session', JSON.stringify(teacherUser));

    render(<App />);

    // Wait for the components to mount and display Teacher Portal
    expect(await screen.findByText('Teacher Portal')).toBeInTheDocument();
    expect(screen.queryByText('Admin Console')).not.toBeInTheDocument();
    
    // Check navigation options visible for Teacher (using getAllByText to avoid breadcrumb duplicates)
    expect(screen.getAllByText('Teacher Console').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Classroom Analytics').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Classroom Setup').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Create Lesson Manually').length).toBeGreaterThanOrEqual(1);
    
    // Sync indicator label
    expect(screen.getByText('TEACHER · Sync\'d')).toBeInTheDocument();
  });

  test('renders Admin Console layout for admin role', async () => {
    const adminUser = {
      userId: 'ADMIN-1',
      email: 'admin@guro.gov',
      name: 'Director Santos',
      role: 'admin'
    };
    localStorage.setItem('guro_user_session', JSON.stringify(adminUser));

    render(<App />);

    // Wait for the components to mount and display Admin Console
    expect(await screen.findByText('Admin Console')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Portal')).not.toBeInTheDocument();
    
    // Check navigation options
    expect(screen.getAllByText('Main Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Lesson Ingestor').length).toBeGreaterThanOrEqual(1);
    
    // Navigation options for teachers, parents should be hidden
    expect(screen.queryByText('Teacher Console')).not.toBeInTheDocument();
    expect(screen.queryByText('Classroom Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Classroom Setup')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Lesson Manually')).not.toBeInTheDocument();
    expect(screen.queryByText('Parent Explorer')).not.toBeInTheDocument();
    
    // Sync indicator label
    expect(screen.getByText('ADMIN · Division Office')).toBeInTheDocument();
  });
});
