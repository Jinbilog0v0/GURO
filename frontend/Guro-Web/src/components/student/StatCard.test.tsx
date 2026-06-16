import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { Award } from 'lucide-react';
import '@testing-library/jest-dom';

describe('StatCard Component', () => {
  const defaultProps = {
    value: '12',
    labelEn: 'Badges Earned',
    labelFil: 'Nakuhang Badge',
    Icon: Award,
    iconColor: 'text-amber-500',
  };

  test('renders icon, value, and bilingual labels correctly', () => {
    render(<StatCard {...defaultProps} />);
    
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Badges Earned')).toBeInTheDocument();
    expect(screen.getByText('Nakuhang Badge')).toBeInTheDocument();
  });
});
