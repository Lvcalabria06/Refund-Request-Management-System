import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';
import { renderWithProviders } from '../test/renderWithProviders';

// Mock do AuthContext — login() não faz nada de verdade nos testes
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

// Mock do axios api — controlamos a resposta em cada teste
const mockPost = vi.fn();
vi.mock('../services/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe('Login', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('renderiza os campos de e-mail, senha e o botão Entrar', () => {
    renderWithProviders(<Login />);

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando o e-mail é inválido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/e-mail/i), 'naoehemail');
    await user.type(screen.getByLabelText(/senha/i), '123456');

    // fireEvent.submit bypassa a validação HTML5 do type="email"
    // (que normalmente bloquearia o submit no jsdom). Em produção
    // o usuário também é barrado, mas com a mensagem nativa do navegador.
    // Aqui forçamos o Zod a validar para conferir nossa própria mensagem.
    const form = screen.getByLabelText(/e-mail/i).closest('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('exibe mensagem de erro quando a senha tem menos de 6 caracteres', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/e-mail/i), 'teste@teste.com');
    await user.type(screen.getByLabelText(/senha/i), '123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(
      await screen.findByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('chama a API com os dados corretos quando o formulário é válido', async () => {
    mockPost.mockResolvedValue({
      data: { token: 'fake-jwt', user: { id: '1', name: 'João', email: 'joao@test.com', role: 'EMPLOYEE' } },
    });

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/e-mail/i), 'joao@test.com');
    await user.type(screen.getByLabelText(/senha/i), '123456');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'joao@test.com',
        password: '123456',
      });
    });
  });
});
