import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Enhetstester for rene funksjoner og storen. Kjøres i Node: appens
// lagring (safeStorage) tåler at window mangler, så storen kan testes direkte.
export default defineConfig({
  resolve: {
    // Samme alias som i tsconfig.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // tsconfig har "jsx": "preserve" for Next; testene trenger ferdig JSX.
  // Vitest 4 oversetter med oxc, ikke esbuild.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
