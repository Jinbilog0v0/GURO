import { render, screen, fireEvent } from '@testing-library/react';
import { StudentProfile } from './StudentProfile';
import '@testing-library/jest-dom';

describe('StudentProfile Component', () => {
  const defaultProps = {
    userName: 'NJ',
    email: 'nj@guro.app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders user name trigger button', () => {
    render(<StudentProfile {...defaultProps} />);
    
    expect(screen.getByText('NJ')).toBeInTheDocument();
    expect(screen.queryByText('nj@guro.app')).not.toBeInTheDocument();
  });

  test('toggles dropdown popover on click and shows email', () => {
    render(<StudentProfile {...defaultProps} />);
    
    const triggerBtn = screen.getByRole('button', { name: /NJ/i });
    fireEvent.click(triggerBtn);
    
    // Check that email is now visible
    expect(screen.getByText('nj@guro.app')).toBeInTheDocument();
    
    // Click again to close dropdown
    fireEvent.click(triggerBtn);
    expect(screen.queryByText('nj@guro.app')).not.toBeInTheDocument();
  });

  test('renders default fallback email when none is provided', () => {
    render(<StudentProfile userName="NJ" />);
    
    const triggerBtn = screen.getByRole('button', { name: /NJ/i });
    fireEvent.click(triggerBtn);
    
    expect(screen.getByText('guest@guro.local')).toBeInTheDocument();
  });
});
