import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParentSpace } from './ParentSpace';
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
    studentId: 'STUDENT-1',
    eventId: 'EVT-2',
    subject: 'English',
    gradeLevel: 4,
    topic: 'Nouns',
    score: 9,
    totalQuestions: 10,
    timestamp: new Date().toISOString(),
  }
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ParentSpace Page', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders the Parent Progress Explorer header', () => {
    render(<ParentSpace progressLogs={mockProgressLogs} lastUpdatedCell={null} />);
    expect(screen.getByText(/Parent Progress Explorer/)).toBeInTheDocument();
  });

  test('prompts to search when no student is searched', () => {
    render(<ParentSpace progressLogs={mockProgressLogs} lastUpdatedCell={null} />);
    expect(screen.getByText(/Search for your child by Name/i)).toBeInTheDocument();
  });

  test('searches for a student and displays their stats', async () => {
    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProgressLogs),
      })
    );
    global.fetch = mockFetch as any;

    render(<ParentSpace progressLogs={mockProgressLogs} lastUpdatedCell={null} />);
    
    const idInput = screen.getByPlaceholderText(/e\.g\. Cruz, Juan or Student ID/i);
    const codeInput = screen.getByPlaceholderText('e.g. 123456');
    const searchBtn = screen.getByRole('button', { name: /Search Reports/i });

    fireEvent.change(idInput, { target: { value: 'STUDENT-1' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(searchBtn);

    // Should show loading then results
    expect(screen.getByText('Retrieving learning curves...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Completed Quests')).toBeInTheDocument();
      expect(screen.queryByText('Retrieving learning curves...')).not.toBeInTheDocument();
    }, { timeout: 2000 });

    expect(screen.getByText('2')).toBeInTheDocument(); // 2 quests
    expect(screen.getByText('85%')).toBeInTheDocument(); // Avg of 80 and 90
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/progress?studentId=STUDENT-1&accessCode=123456',
      expect.any(Object)
    );
  });

  test('shows empty state when student not found', async () => {
    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
    global.fetch = mockFetch as any;

    render(<ParentSpace progressLogs={mockProgressLogs} lastUpdatedCell={null} />);
    
    const idInput = screen.getByPlaceholderText(/e\.g\. Cruz, Juan or Student ID/i);
    const codeInput = screen.getByPlaceholderText('e.g. 123456');
    const searchBtn = screen.getByRole('button', { name: /Search Reports/i });

    fireEvent.change(idInput, { target: { value: 'UNKNOWN-STUDENT' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/No reports registered for/i)).toBeInTheDocument();
      expect(screen.queryByText('Retrieving learning curves...')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('clears inputs when Clear button is clicked', () => {
    render(<ParentSpace progressLogs={mockProgressLogs} lastUpdatedCell={null} />);
    
    const idInput = screen.getByPlaceholderText(/e\.g\. Cruz, Juan or Student ID/i) as HTMLInputElement;
    const codeInput = screen.getByPlaceholderText('e.g. 123456') as HTMLInputElement;
    
    fireEvent.change(idInput, { target: { value: 'STUDENT-1' } });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    
    expect(idInput.value).toBe('STUDENT-1');
    expect(codeInput.value).toBe('123456');

    const clearBtn = screen.getByRole('button', { name: /Clear Search/i });
    fireEvent.click(clearBtn);

    expect(idInput.value).toBe('');
    expect(codeInput.value).toBe('');
  });

  test('renders student registration form when activeSubTab is create-student', () => {
    render(<ParentSpace activeSubTab="create-student" lastUpdatedCell={null} />);
    expect(screen.getByText('Student Account Registration & Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Juan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register Student Account/i })).toBeInTheDocument();
  });

  test('renders activity badges subcomponent when activeSubTab is parent-badges and student searched', async () => {
    localStorage.setItem('guro_parent_searched', 'true');
    localStorage.setItem('guro_parent_student_id', 'STUDENT-1');
    localStorage.setItem('guro_parent_access_code', '123456');

    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProgressLogs),
      })
    );
    global.fetch = mockFetch as any;

    render(<ParentSpace activeSubTab="parent-badges" lastUpdatedCell={null} />);

    await waitFor(() => {
      expect(screen.getByText(/Practice Habit & Milestones/i)).toBeInTheDocument();
    });
  });

  test('renders timeline subcomponent when activeSubTab is parent-timeline and student searched', async () => {
    localStorage.setItem('guro_parent_searched', 'true');
    localStorage.setItem('guro_parent_student_id', 'STUDENT-1');
    localStorage.setItem('guro_parent_access_code', '123456');

    const mockFetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProgressLogs),
      })
    );
    global.fetch = mockFetch as any;

    render(<ParentSpace activeSubTab="parent-timeline" lastUpdatedCell={null} />);

    await waitFor(() => {
      expect(screen.getByText(/Practice Timeline History/i)).toBeInTheDocument();
    });
  });
});
