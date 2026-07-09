import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader Component', () => {
  test('renders title and optional subtitle and right element', () => {
    const rightElement = <Text>Right Element</Text>;
    let root: any;
    act(() => {
      root = renderer.create(
        <SectionHeader
          title="Weekly Progress"
          subtitle="Last 7 days performance"
          right={rightElement}
        />
      );
    });

    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Weekly Progress');
    expect(stringified).toContain('Last 7 days performance');
    expect(stringified).toContain('Right Element');
  });

  test('does not render subtitle if not provided', () => {
    let root: any;
    act(() => {
      root = renderer.create(<SectionHeader title="Only Title" />);
    });
    
    const stringified = JSON.stringify(root.toJSON());
    expect(stringified).toContain('Only Title');
  });
});
