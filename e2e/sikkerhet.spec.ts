import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('sikkerhetshodene sendes, og appen kan ikke bygges inn i andre sider', async ({ request }) => {
  for (const path of ['/', '/manifest.json']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['content-security-policy']).toBe("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
  }
});
