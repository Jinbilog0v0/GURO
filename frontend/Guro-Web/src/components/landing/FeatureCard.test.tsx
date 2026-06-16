import { render, screen } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';
import '@testing-library/jest-dom';

describe('FeatureCard Component', () => {
  test('renders feature label and icon', () => {
    render(<FeatureCard label="Test Feature" icon="🚀" />);
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });
});
