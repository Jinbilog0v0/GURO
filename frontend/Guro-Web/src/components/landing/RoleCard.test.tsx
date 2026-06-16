import { render, screen, fireEvent } from '@testing-library/react';
import { RoleCard } from './RoleCard';
import { User } from 'lucide-react';
import '@testing-library/jest-dom';

describe('RoleCard Component', () => {
  const defaultProps = {
    role: 'Student' as const,
    description: 'Learn Math & English with fun lessons',
    Icon: User,
    bgColor: 'bg-blue-600',
    onClick: jest.fn(),
  };

  test('renders role and description correctly', () => {
    render(<RoleCard {...defaultProps} />);
    
    expect(screen.getByText('I am a Student')).toBeInTheDocument();
    expect(screen.getByText('Learn Math & English with fun lessons')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    render(<RoleCard {...defaultProps} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });
});
