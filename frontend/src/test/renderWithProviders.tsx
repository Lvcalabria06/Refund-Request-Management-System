import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Helper para renderizar componentes em testes com os providers necessários
 * (Chakra UI + React Router). Evita repetir setup em cada teste.
 *
 * Uso:
 *   renderWithProviders(<MeuComponente />);
 *   renderWithProviders(<MeuComponente />, { route: '/dashboard' });
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: { route?: string }
) {
  const route = options?.route ?? '/';
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </ChakraProvider>
  );
}
