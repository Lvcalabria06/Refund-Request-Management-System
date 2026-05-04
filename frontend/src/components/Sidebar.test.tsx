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

describe('Sidebar — renderização condicional por perfil', () => {
  it('mostra apenas itens do EMPLOYEE quando o usuário é EMPLOYEE', () => {
    currentUser = { id: '1', name: 'Emp', role: 'EMPLOYEE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/meus reembolsos/i)).toBeInTheDocument();

    // Não deve ver itens de outros perfis
    expect(screen.queryByText(/aprovações/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pagamentos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usuários/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/categorias/i)).not.toBeInTheDocument();
  });

  it('mostra apenas itens do MANAGER quando o usuário é MANAGER', () => {
    currentUser = { id: '2', name: 'Mgr', role: 'MANAGER' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/aprovações/i)).toBeInTheDocument();

    expect(screen.queryByText(/meus reembolsos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pagamentos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usuários/i)).not.toBeInTheDocument();
  });

  it('mostra apenas itens do FINANCE quando o usuário é FINANCE', () => {
    currentUser = { id: '3', name: 'Fin', role: 'FINANCE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/pagamentos/i)).toBeInTheDocument();

    expect(screen.queryByText(/meus reembolsos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aprovações/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usuários/i)).not.toBeInTheDocument();
  });

  it('mostra apenas itens do ADMIN quando o usuário é ADMIN', () => {
    currentUser = { id: '4', name: 'Admin', role: 'ADMIN' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/usuários/i)).toBeInTheDocument();
    expect(screen.getByText(/categorias/i)).toBeInTheDocument();

    expect(screen.queryByText(/meus reembolsos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/aprovações/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pagamentos/i)).not.toBeInTheDocument();
  });

  it('mostra o nome e o role do usuário logado', () => {
    currentUser = { id: '99', name: 'Maria Silva', role: 'EMPLOYEE' };
    renderWithProviders(<Sidebar />);

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('EMPLOYEE')).toBeInTheDocument();
  });
});
