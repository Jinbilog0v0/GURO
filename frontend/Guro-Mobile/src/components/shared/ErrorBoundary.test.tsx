import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws on demand
function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion in render cycle');
  }
  return <Text>All is calm</Text>;
}

describe('ErrorBoundary', () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('renders children normally when there is no error', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <ErrorBoundary>
          <ProblemChild shouldThrow={false} />
        </ErrorBoundary>
      );
    });

    const json = tree!.toJSON() as any;
    expect(json).toBeDefined();
    expect(JSON.stringify(json)).toContain('All is calm');
  });

  test('catches error and displays fallback UI', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    const json = tree!.toJSON() as any;
    expect(json).toBeDefined();
    expect(JSON.stringify(json)).toContain('Oops! Something went wrong');
    expect(JSON.stringify(json)).toContain('Restart GURO');
  });

  test('toggles error details when toggle button is pressed', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <ErrorBoundary>
          <ProblemChild shouldThrow={true} />
        </ErrorBoundary>
      );
    });

    const instance = tree!.getInstance() as any;
    expect(instance.state.showDetails).toBe(false);

    await act(async () => {
      instance.toggleDetails();
    });

    expect(instance.state.showDetails).toBe(true);
    expect(JSON.stringify(tree!.toJSON())).toContain('Hide Details');
  });

  test('resets state when restart handler is called', async () => {
    function DynamicWrapper({ throwing }: { throwing: boolean }) {
      return (
        <ErrorBoundary>
          <ProblemChild shouldThrow={throwing} />
        </ErrorBoundary>
      );
    }

    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(<DynamicWrapper throwing={true} />);
    });

    const errorBoundary = tree!.root.findByType(ErrorBoundary);
    expect(errorBoundary.instance.state.hasError).toBe(true);

    // Stop throwing and trigger restart
    await act(async () => {
      tree!.update(<DynamicWrapper throwing={false} />);
      errorBoundary.instance.handleRestart();
    });

    expect(errorBoundary.instance.state.hasError).toBe(false);
    expect(JSON.stringify(tree!.toJSON())).toContain('All is calm');
  });
});
