import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { StatCard } from './StatCard';

describe('StatCard Component', () => {
  test('renders labels, values, units and icon correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <StatCard
          label="Accuracy"
          value={85}
          unit="%"
          valueColor="#10B981"
          icon="🎯"
        />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Accuracy');
    expect(stringified).toContain('85');
    expect(stringified).toContain('%');
    expect(stringified).toContain('🎯');
  });
});
