import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { Award } from 'lucide-react';
import '@testing-library/jest-dom';

describe('StatCard Component', () => {
  const defaultProps = {
    value: '12',
    labelEn: 'Badges Earned',
    Icon: Award,
    iconColor: 'text-amber-500',
  };

  test('renders icon, value, and English label correctly', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
  });
});
