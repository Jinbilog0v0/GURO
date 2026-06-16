import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Badge } from './Badge';

describe('Badge Component', () => {
  test('renders correctly', async () => {
    let tree;
    await act(async () => {
      tree = renderer.create(<Badge label="Test Badge" variant="success" />);
    });
    expect(tree.toJSON()).toBeDefined();
  });
});
