import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import '@testing-library/jest-dom';

describe('UserProfile Component', () => {
  const defaultProps = {
    currentUser: {
      name: 'NJ',
      email: 'nj@guro.app',
      role: 'teacher',
    },
    onLogout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user name trigger button', () => {
    render(<UserProfile {...defaultProps} />);
    
    expect(screen.getByText('NJ')).toBeInTheDocument();
    expect(screen.queryByText('nj@guro.app')).not.toBeInTheDocument();
  });

  test('toggles dropdown popover on click and shows email, role, and logout button', () => {
    render(<UserProfile {...defaultProps} />);
    
    const triggerBtn = screen.getByRole('button', { name: /NJ/i });
    fireEvent.click(triggerBtn);
    
    // Check details
    expect(screen.getByText('nj@guro.app')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    
    const logoutBtn = screen.getByRole('button', { name: /Log Out/i });
    expect(logoutBtn).toBeInTheDocument();
    
    // Click logout
    fireEvent.click(logoutBtn);
    expect(defaultProps.onLogout).toHaveBeenCalledTimes(1);
    
    // Check dropdown closes
    expect(screen.queryByText('nj@guro.app')).not.toBeInTheDocument();
  });

  test('renders guest defaults when currentUser is null', () => {
    render(<UserProfile currentUser={null} onLogout={jest.fn()} />);
    
    const triggerBtn = screen.getByRole('button', { name: /Guest User/i });
    fireEvent.click(triggerBtn);
    
    expect(screen.getByText('guest@guro.local')).toBeInTheDocument();
    expect(screen.getByText('Guest Explorer')).toBeInTheDocument();
  });
});
