import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonSpace } from './LessonSpace';
import '@testing-library/jest-dom';
import { toast } from 'react-hot-toast';

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockQuestions = [
  {
    id: 'Q1',
    difficulty: 'Easy',
    category: 'Multiple-Choice',
    questionText: 'Test Question?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    feedback: { en: 'Good', fil: 'Mabuti' }
  }
];

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LessonSpace Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/item-bank') {
        return Promise.resolve({
          ok: true,
          json: async () => ({})
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  test('renders the Lesson Plan Ingestion header', () => {
    render(<LessonSpace currentUser={null} />);
    expect(screen.getByText('📖 Lesson Plan Ingestion')).toBeInTheDocument();
  });

  test('triggers generation when form is submitted', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/generate') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            questions: mockQuestions,
            studyContent: { introduction: 'Test Intro', definitions: [], summary: [] }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    render(<LessonSpace currentUser={null} />);

    fireEvent.change(screen.getByPlaceholderText(/e.g. Metric Conversions/i), { target: { value: 'Test Topic' } });
    fireEvent.change(screen.getByPlaceholderText(/Paste textbook/i), { target: { value: 'Test Content' } });
    
    fireEvent.click(screen.getByText('⚡ Parse & Generate Items'));

    await waitFor(() => {
      expect(screen.getByText('📖 Study Content Guide')).toBeInTheDocument();
    });

    // Click on Question Bank tab to render questions
    fireEvent.click(screen.getByText(/Question Bank/i));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Question?')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Commit 1 Items/i)).toBeInTheDocument();
  });

  test('triggers save when commit button is clicked', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/generate') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ 
            questions: mockQuestions,
            studyContent: { introduction: 'Test Intro', definitions: [], summary: [] }
          })
        });
      }
      if (url === '/api/save') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    render(<LessonSpace currentUser={null} />);
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Metric Conversions/i), { target: { value: 'Test Topic' } });
    fireEvent.change(screen.getByPlaceholderText(/Paste textbook/i), { target: { value: 'Test Content' } });
    fireEvent.click(screen.getByText('⚡ Parse & Generate Items'));

    await waitFor(() => {
      expect(screen.getByText('📖 Study Content Guide')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Question Bank/i));

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Question?')).toBeInTheDocument();
    });

    // 2. Mock save response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const commitBtn = screen.getByText(/Commit 1 Items/i);
    fireEvent.click(commitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Successfully committed'),
        expect.any(Object)
      );
    });
  });
});
