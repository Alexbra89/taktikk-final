import nextVitals from 'eslint-config-next/core-web-vitals';

// Samme Core Web Vitals-regelsett som før; Next 16 bruker flat config.
const config = [
  ...nextVitals,
  {
    // Nye React Compiler-regler fra Next 16 ryddes i en egen oppgave senere.
    rules: {
      'react-hooks/config': 'warn',
      'react-hooks/error-boundaries': 'warn',
      'react-hooks/gating': 'warn',
      'react-hooks/globals': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/unsupported-syntax': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
  {
    ignores: [
      '.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts',
      'test-results/**', 'playwright-report/**', 'blob-report/**',
      'public/sw.js', 'public/workbox-*.js', 'public/worker-*.js',
    ],
  },
];

export default config;
