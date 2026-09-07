import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardSpace } from './DashboardSpace';
import '@testing-library/jest-dom';

// Mock apiFetch
jest.mock('../utils/api', () => ({
  apiFetch: jest.fn()
}));

import { apiFetch } from '../utils/api';

const mockItemBank = {
  "Mathematics": {
    "4": {
      "Fractions": {
        "studyContent": {
          "introduction": "Intro to fractions",
          "definitions": [
            { "term": "Numerator", "definition": "Top number" }
          ],
          "summary": ["Fractions are parts of a whole"]
        },
        "Easy": {
          "Multiple-Choice": [
            {
              "id": "MATH-G4-FRAC-001",
              "questionText": "What is the sum of 1/4 and 2/4?",
              "options": ["1/4", "3/4", "4/4"],
              "correctAnswer": "3/4",
              "feedback": "Simply add numerators"
            }
          ]
        }
      }
    }
  }
};

describe('DashboardSpace Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Ingested Asset Tree and calculates counts correctly', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ customItemBank: mockItemBank })
    });

    render(
      <DashboardSpace
        currentUser={{ userId: '1', email: 'teacher@guro.com', name: 'Teacher', role: 'teacher', classroomId: 'ROOM1' }}
        stagedQuestionsCount={0}
        progressLogs={[]}
        progressLoading={false}
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });

    // Check that Grade 4 header is displayed
    expect(screen.getByText('Grade 4')).toBeInTheDocument();

    // Check that Fractions topic is displayed
    expect(screen.getByText('Fractions')).toBeInTheDocument();

    // The item count should be 1, not 3 (ignoring definitions/summaries from studyContent)
    expect(screen.getByText('1 item')).toBeInTheDocument();

    // Verify stats cards count
    // Total Classroom Topics should be 1
    const topicsCard = screen.getByText('Classroom Topics').parentElement;
    expect(topicsCard).toHaveTextContent('1');
  });

  test('clicking topic expands it to show detailed questions/items', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ customItemBank: mockItemBank })
    });

    render(
      <DashboardSpace
        currentUser={{ userId: '1', email: 'teacher@guro.com', name: 'Teacher', role: 'teacher', classroomId: 'ROOM1' }}
        stagedQuestionsCount={0}
        progressLogs={[]}
        progressLoading={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fractions')).toBeInTheDocument();
    });

    // Before click, question text should not be visible
    expect(screen.queryByText('What is the sum of 1/4 and 2/4?')).not.toBeInTheDocument();

    // Click on Fractions topic header to expand it
    fireEvent.click(screen.getByText('Fractions'));

    // Question text and options should now be visible
    expect(screen.getByText('What is the sum of 1/4 and 2/4?')).toBeInTheDocument();
    expect(screen.getByText('MATH-G4-FRAC-001 (Multiple-Choice)')).toBeInTheDocument();
    expect(screen.getByText('3/4 ✓')).toBeInTheDocument();
    expect(screen.getByText('Simply add numerators')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(screen.getByText('Fractions'));

    // Question details should be removed from view
    expect(screen.queryByText('What is the sum of 1/4 and 2/4?')).not.toBeInTheDocument();
  });

  test('renders clean blank dashboard for newly created teacher with no classroom', async () => {
    localStorage.clear();

    render(
      <DashboardSpace
        currentUser={{ userId: 'USR-NEW', email: 'newteacher@guro.com', name: 'New Teacher', role: 'teacher', classroomId: null }}
        stagedQuestionsCount={0}
        progressLogs={[]}
        progressLoading={false}
        onNavigate={jest.fn()}
      />
    );

    // Should display blank / empty state prompt
    expect(await screen.findByText('No active classroom session or lessons found.')).toBeInTheDocument();

    // Verify stats are 0
    const topicsCard = screen.getByText('Classroom Topics').parentElement;
    expect(topicsCard).toHaveTextContent('0');

    // Button to setup classroom is present
    expect(screen.getByText('Go to Classroom Setup')).toBeInTheDocument();
  });
});
