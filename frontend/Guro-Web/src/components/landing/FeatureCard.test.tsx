import { render, screen } from '@testing-library/react';
import { FeatureCard } from './FeatureCard';
import { Rocket } from 'lucide-react';
import '@testing-library/jest-dom';

describe('FeatureCard Component', () => {
  test('renders feature label and icon', () => {
    render(<FeatureCard label="Test Feature" Icon={Rocket} />);

    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
