import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders } from '../test/renderWithProviders';

// Variável que controla o "estado" do useAuth em cada teste
let mockAuthValue = {
  isAuthenticated: false,
  user: null as null | { id: string; name: string; role: string },
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValue,
}));

// Mock do AppLayout para não renderizar Sidebar (que depende de mais coisa)
vi.mock('./AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

const Protected = () => <div>Private Content</div>;
const LoginPage = () => <div>Login Screen</div>;
const HomePage = () => <div>Home</div>;

function renderRoutes(initial = '/private', allowedRoles?: string[]) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route
        path="/private"
        element={
          <ProtectedRoute allowedRoles={allowedRoles}>
            <Protected />
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route: initial }
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when the user is NOT authenticated', () => {
    mockAuthValue = { isAuthenticated: false, user: null };
    renderRoutes('/private');

    expect(screen.getByText(/login screen/i)).toBeInTheDocument();
    expect(screen.queryByText(/private content/i)).not.toBeInTheDocument();
  });

  it('renders the content when the user IS authenticated', () => {
    mockAuthValue = {
      isAuthenticated: true,
      user: { id: '1', name: 'João', role: 'EMPLOYEE' },
    };
    renderRoutes('/private');

    expect(screen.getByText(/private content/i)).toBeInTheDocument();
  });

  it('redirects to / when the user role is NOT allowed', () => {
    mockAuthValue = {
      isAuthenticated: true,
      user: { id: '1', name: 'João', role: 'EMPLOYEE' },
    };
    renderRoutes('/private', ['MANAGER']); // só permite MANAGER, mas o user é EMPLOYEE

    expect(screen.getByText(/^home$/i)).toBeInTheDocument();
    expect(screen.queryByText(/private content/i)).not.toBeInTheDocument();
  });

  it('renders the content when the user role IS allowed', () => {
    mockAuthValue = {
      isAuthenticated: true,
      user: { id: '1', name: 'Ana', role: 'MANAGER' },
    };
    renderRoutes('/private', ['MANAGER', 'ADMIN']);

    expect(screen.getByText(/private content/i)).toBeInTheDocument();
  });
});
