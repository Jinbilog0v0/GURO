import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EducationalImagePicker } from './EducationalImagePicker';

jest.mock('../../utils/api', () => ({
  apiFetch: jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ imageUrl: 'https://images.unsplash.com/photo-educational' }),
    })
  ),
}));

jest.mock('../../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('EducationalImagePicker (Web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders label and mode switch buttons', () => {
    render(
      <EducationalImagePicker
        label="Lesson Visualization"
        value=""
        onChange={jest.fn()}
        defaultPrompt="Water Cycle"
      />
    );

    expect(screen.getByText('Lesson Visualization')).toBeInTheDocument();
    expect(screen.getByText('AI Generate')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Paste Link')).toBeInTheDocument();
  });

  test('calls onChange when AI Generate is clicked', async () => {
    const onChangeMock = jest.fn();
    render(
      <EducationalImagePicker
        label="Science Graphic"
        value=""
        onChange={onChangeMock}
        defaultPrompt="Solar System"
        subject="Science"
        grade={5}
      />
    );

    const generateBtn = screen.getByText('Generate Visual');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(onChangeMock).toHaveBeenCalledWith('https://images.unsplash.com/photo-educational');
    });
  });

  test('renders image preview and remove button when value exists', () => {
    const onChangeMock = jest.fn();
    render(
      <EducationalImagePicker
        label="Math Visual"
        value="https://images.unsplash.com/photo-fractions"
        onChange={onChangeMock}
        defaultPrompt="Fractions"
      />
    );

    expect(screen.getByAltText('Visual preview')).toBeInTheDocument();
    const removeBtn = screen.getByText('Remove');
    fireEvent.click(removeBtn);
    expect(onChangeMock).toHaveBeenCalledWith('');
  });
});
