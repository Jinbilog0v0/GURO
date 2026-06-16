import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeacherSpace } from './TeacherSpace';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockProgressLogs = [
  {
    studentId: 'STUDENT-1',
    eventId: 'EVT-1',
    subject: 'Mathematics',
    gradeLevel: 4,
    topic: 'Fractions',
    score: 8,
    totalQuestions: 10,
    timestamp: new Date().toISOString(),
  },
  {
    studentId: 'STUDENT-2',
    eventId: 'EVT-2',
    subject: 'English',
    gradeLevel: 4,
    topic: 'Nouns',
    score: 5,
    totalQuestions: 10,
    timestamp: new Date().toISOString(),
  }
];

const mockRefreshLogs = jest.fn();

// Mock fetch
global.fetch = jest.fn();

// ── Tests ──────────────────────────────────────────────────────────────────

describe('TeacherSpace Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  test('renders the Teacher Console header', () => {
    render(
      <TeacherSpace 
        progressLogs={mockProgressLogs} 
        lastUpdatedCell={null} 
        refreshLogs={mockRefreshLogs} 
        loading={false} 
      />
    );
    expect(screen.getByText('🏫 Teacher Console')).toBeInTheDocument();
  });

  test('displays summary statistics correctly', () => {
    render(
      <TeacherSpace 
        progressLogs={mockProgressLogs} 
        lastUpdatedCell={null} 
        refreshLogs={mockRefreshLogs} 
        loading={false} 
      />
    );
    
    // Total sync reports - expect 2
    const totalReportsCard = screen.getByText('Total Sync Reports').parentElement;
    expect(totalReportsCard).toHaveTextContent('2');

    // Unique students - expect 2
    const uniqueDevicesCard = screen.getByText('Unique Active Devices').parentElement;
    expect(uniqueDevicesCard).toHaveTextContent('2');
  });

  test('filters logs by search text in the table', async () => {
    render(
      <TeacherSpace 
        progressLogs={mockProgressLogs} 
        lastUpdatedCell={null} 
        refreshLogs={mockRefreshLogs} 
        loading={false} 
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by student identifier or topic...');
    fireEvent.change(searchInput, { target: { value: 'STUDENT-1' } });

    // Find the progress table and check its rows
    const tables = screen.getAllByRole('table');
    const progressTable = tables[tables.length - 1]; // The last table is the progress log
    expect(progressTable).toHaveTextContent('STUDENT-1');
    expect(progressTable).not.toHaveTextContent('STUDENT-2');
  });

  test('switching to Classroom Setup tab', () => {
    render(
      <TeacherSpace 
        progressLogs={mockProgressLogs} 
        lastUpdatedCell={null} 
        refreshLogs={mockRefreshLogs} 
        loading={false} 
      />
    );

    const setupTabBtn = screen.getByText('🔑 Classroom Setup');
    fireEvent.click(setupTabBtn);

    expect(screen.getByText(/Active Classroom Config & Pairing/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Teacher Maria')).toBeInTheDocument();
  });

  test('creating a new classroom', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/classroom/create')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            classroomId: 'CLASS-999',
            teacherName: 'Teacher Maria',
            subject: 'Mathematics',
            gradeLevel: 4
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    render(
      <TeacherSpace 
        progressLogs={mockProgressLogs} 
        lastUpdatedCell={null} 
        refreshLogs={mockRefreshLogs} 
        loading={false} 
      />
    );

    fireEvent.click(screen.getByText('🔑 Classroom Setup'));
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Teacher Maria'), { target: { value: 'Teacher Maria' } });
    fireEvent.click(screen.getByText('⚡ Generate Classroom Invite Code'));

    await waitFor(() => {
      expect(screen.getByText('CLASS-999')).toBeInTheDocument();
    });
    
    expect(localStorage.getItem('guro_teacher_classroom_code')).toBe('CLASS-999');
  });
});
