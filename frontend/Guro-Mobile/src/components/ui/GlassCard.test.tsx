import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { GlassCard } from './GlassCard';

describe('GlassCard Component', () => {
  test('renders children correctly', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <GlassCard>
          <Text>Hello World</Text>
        </GlassCard>
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Hello World');
  });

  test('applies custom padding and style', () => {
    let root: any;
    act(() => {
      root = renderer.create(
        <GlassCard padding={24} style={{ marginTop: 10 }}>
          <Text>Test Content</Text>
        </GlassCard>
      );
    });

    const style = root.toJSON()?.props.style;
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;

    expect(flatStyle.padding).toBe(24);
    expect(flatStyle.marginTop).toBe(10);
  });
});
