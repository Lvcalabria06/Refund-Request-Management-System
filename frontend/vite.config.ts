/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vitest é usado como test runner por ser API-compatível com Jest
// e funcionar nativamente com o Vite. Os testes usam React Testing Library
// (`@testing-library/react`) conforme exigido no documento do desafio.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
