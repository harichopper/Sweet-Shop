import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { AuthProvider } from '../context/AuthContext';

// Mock the useAuth hook
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({
    user: { username: 'testuser', isAdmin: false },
    isAuthenticated: true,
    isAdmin: false
  })
}));

const MockedDashboard = () => (
  <BrowserRouter>
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard Component', () => {
  test('renders dashboard welcome message', () => {
    render(<MockedDashboard />);
    
    expect(screen.getByText(/sweet shop dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/our delicious sweets/i)).toBeInTheDocument();
  });

  test('shows sweet grid container', () => {
    render(<MockedDashboard />);
    
    const sweetGrid = screen.getByTestId('sweet-grid');
    expect(sweetGrid).toBeInTheDocument();
  });
});
