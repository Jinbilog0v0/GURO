import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualLessonBuilder } from './ManualLessonBuilder';
import '@testing-library/jest-dom';

describe('ManualLessonBuilder Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.fetch = jest.fn();
  });

  test('renders form elements correctly', () => {
    render(<ManualLessonBuilder />);
    
    expect(screen.getByText('Lesson Profile')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Grade Level')).toBeInTheDocument();
    expect(screen.getByText('Topic Title')).toBeInTheDocument();
    expect(screen.getByText('Lesson Summary Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Lesson & Questions' })).toBeInTheDocument();
    
    // Check initial question slot
    expect(screen.getByText('Question #1')).toBeInTheDocument();
  });

  test('can add and remove question slots', () => {
    render(<ManualLessonBuilder />);
    
    const addBtn = screen.getByRole('button', { name: 'Add Question Slot' });
    fireEvent.click(addBtn);
    
    expect(screen.getByText('Question #2')).toBeInTheDocument();
    
    // Remove the second question slot (we mock the delete btn by target index or title)
    const deleteButtons = screen.getAllByTitle('Delete question slot');
    expect(deleteButtons).toHaveLength(2);
    
    fireEvent.click(deleteButtons[1]);
    expect(screen.queryByText('Question #2')).not.toBeInTheDocument();
  });

  test('validates required fields and saves lesson successfully via fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { container } = render(<ManualLessonBuilder classroomId="class-123" />);
    const form = container.querySelector('form')!;

    // Try submitting empty form (using fireEvent.submit to bypass JSDOM HTML5 required blocks)
    fireEvent.submit(form);
    expect(global.alert).toHaveBeenCalledWith('Please provide a Topic Title.');

    // Fill in topic
    const topicInput = screen.getByPlaceholderText('e.g. Adjectives, Metric Systems');
    fireEvent.change(topicInput, { target: { value: 'Nouns' } });
    fireEvent.submit(form);
    expect(global.alert).toHaveBeenCalledWith('Please write the Lesson Summary Content.');

    // Fill in lesson content
    const summaryInput = screen.getByPlaceholderText('Write the summarized explanation or key rules that the students will learn...');
    fireEvent.change(summaryInput, { target: { value: 'Nouns are naming words.' } });
    fireEvent.submit(form);
    expect(global.alert).toHaveBeenCalledWith('Question #1 prompt cannot be empty.');

    // Fill in question prompt
    const promptInput = screen.getByPlaceholderText('e.g. Which of the following is an adjective?');
    fireEvent.change(promptInput, { target: { value: 'Identify the noun in "The dog barked".' } });
    fireEvent.submit(form);
    expect(global.alert).toHaveBeenCalledWith('Option A for Question #1 cannot be empty.');

    // Fill options
    const optionInputs = screen.getAllByPlaceholderText('Option value...');
    fireEvent.change(optionInputs[0], { target: { value: 'dog' } });
    fireEvent.change(optionInputs[1], { target: { value: 'barked' } });
    fireEvent.change(optionInputs[2], { target: { value: 'the' } });
    fireEvent.change(optionInputs[3], { target: { value: 'run' } });

    // Set correct answer
    fireEvent.click(screen.getAllByRole('radio')[0]);

    fireEvent.submit(form);
    expect(global.alert).toHaveBeenCalledWith('Explanation for Question #1 is required.');

    // Fill English explanation
    const explanationEn = screen.getByPlaceholderText('Explain why this option is correct...');
    fireEvent.change(explanationEn, { target: { value: 'Dog is a noun.' } });

    // Submit valid form
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/classroom/update-lesson',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"topic":"Nouns"'),
        })
      );
    });

    expect(global.alert).toHaveBeenCalledWith('Successfully saved "Nouns" lesson with 1 questions manually!');
  });
});
