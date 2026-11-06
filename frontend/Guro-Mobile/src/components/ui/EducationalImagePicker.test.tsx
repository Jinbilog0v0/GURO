import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { EducationalImagePicker } from './EducationalImagePicker';

jest.mock('../../store/useAppStore', () => ({
  useAppStore: Object.assign(
    jest.fn((selector) => {
      const state = {
        serverUrl: 'http://localhost:8000',
        token: 'test-token',
      };
      return selector ? selector(state) : state;
    }),
    {
      getState: () => ({
        serverUrl: 'http://localhost:8000',
        token: 'test-token',
      }),
    }
  ),
  resolveServerUrl: (url: string) => url,
}));

jest.mock('../ui/ToastContainer', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('EducationalImagePicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, imageUrl: 'https://images.unsplash.com/photo-test' }),
      })
    ) as any;
  });

  test('renders action buttons when value is empty', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <EducationalImagePicker
          label="Test Visual"
          value=""
          onChange={jest.fn()}
          defaultPrompt="Fractions"
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Test Visual');
    expect(json).toContain('AI Picture');
    expect(json).toContain('Pick Image');
    expect(json).toContain('Link');
  });

  test('renders preview and actions when value is provided', () => {
    const onChangeMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <EducationalImagePicker
          label="Topic Visual"
          value="https://images.unsplash.com/photo-test"
          onChange={onChangeMock}
          defaultPrompt="Solar System"
        />
      );
    });

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Topic Visual');
    expect(json).toContain('Regenerate AI');
    expect(json).toContain('Remove');

    const removeBtn = tree.root.findByProps({ accessibilityLabel: 'Remove picture' });
    act(() => {
      removeBtn.props.onPress();
    });

    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  test('triggers AI generation on button press', async () => {
    const onChangeMock = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <EducationalImagePicker
          label="AI Diagram"
          value=""
          onChange={onChangeMock}
          defaultPrompt="Photosynthesis"
          subject="Science"
          grade={5}
        />
      );
    });

    const aiBtn = tree.root.findByProps({ accessibilityLabel: 'Generate picture with AI' });
    await act(async () => {
      aiBtn.props.onPress();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(global.fetch).toHaveBeenCalled();
    expect(onChangeMock).toHaveBeenCalledWith('https://images.unsplash.com/photo-test');
  });
});
