import nextVitals from 'eslint-config-next/core-web-vitals';

// Samme Core Web Vitals-regelsett som før; Next 16 bruker flat config.
const config = [
  ...nextVitals,
  {
    ignores: [
      '.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts',
      'test-results/**', 'playwright-report/**', 'blob-report/**',
      'public/sw.js', 'public/workbox-*.js', 'public/worker-*.js',
    ],
  },
];

export default config;
