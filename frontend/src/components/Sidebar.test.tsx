import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { renderWithProviders } from '../test/renderWithProviders';

// O role muda em cada teste para validar a renderização condicional
let currentUser = { id: '1', name: 'Test User', role: 'EMPLOYEE' };

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    logout: vi.fn(),
  }),
}));

describe('Sidebar — conditional rendering by role', () => {
  it('shows only EMPLOYEE items when user is EMPLOYEE', () => {
    currentUser = { id: '1', name: 'Emp', role: 'EMPLOYEE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/my reimbursements/i)).toBeInTheDocument();

    // Não deve ver itens de outros perfis
    expect(screen.queryByText(/^approvals$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^payments$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^users$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^categories$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/all reimbursements/i)).not.toBeInTheDocument();
  });

  it('shows only MANAGER items when user is MANAGER', () => {
    currentUser = { id: '2', name: 'Mgr', role: 'MANAGER' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/^approvals$/i)).toBeInTheDocument();

    expect(screen.queryByText(/my reimbursements/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^payments$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^users$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^categories$/i)).not.toBeInTheDocument();
  });

  it('shows only FINANCE items when user is FINANCE', () => {
    currentUser = { id: '3', name: 'Fin', role: 'FINANCE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/^payments$/i)).toBeInTheDocument();

    expect(screen.queryByText(/my reimbursements/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^approvals$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^users$/i)).not.toBeInTheDocument();
  });

  it('shows only ADMIN items when user is ADMIN', () => {
    currentUser = { id: '4', name: 'Admin', role: 'ADMIN' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/^users$/i)).toBeInTheDocument();
    expect(screen.getByText(/^categories$/i)).toBeInTheDocument();
    expect(screen.getByText(/all reimbursements/i)).toBeInTheDocument();

    expect(screen.queryByText(/my reimbursements/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^approvals$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^payments$/i)).not.toBeInTheDocument();
  });

  it('shows the logged user name and role', () => {
    currentUser = { id: '99', name: 'Maria Silva', role: 'EMPLOYEE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('EMPLOYEE')).toBeInTheDocument();
  });
});
