import { describe, expect, it } from 'vitest';
import { AiRateLimiter, AI_RATE_WINDOW_MS, clientIp } from './rateLimit';

describe('AI-fartsgrense uten nett eller database', () => {
  it('tillater 30 per IP, avviser nummer 31, og åpner etter én time', () => {
    const limiter = new AiRateLimiter();
    const start = 1_000_000;
    for (let i = 0; i < 30; i++) expect(limiter.take('192.0.2.1', start + i).allowed).toBe(true);
    expect(limiter.take('192.0.2.1', start + 30)).toEqual({ allowed: false, retryAfter: 3600 });
    expect(limiter.take('192.0.2.2', start + 30).allowed).toBe(true);
    expect(limiter.take('192.0.2.1', start + AI_RATE_WINDOW_MS).allowed).toBe(true);
    expect(limiter.take('192.0.2.1', start + AI_RATE_WINDOW_MS).allowed).toBe(false);
    expect(limiter.take('192.0.2.1', start + AI_RATE_WINDOW_MS + 30).allowed).toBe(true);
  });

  it('teller parallelle kall før de venter på AI', async () => {
    const limiter = new AiRateLimiter();
    const results = await Promise.all(Array.from({ length: 60 }, async () => limiter.take('2001:db8::1')));
    expect(results.filter(r => r.allowed)).toHaveLength(30);
  });

  it('bruker første proxy-IP og én felles grense ved manglende eller ugyldig IP', () => {
    const req = (value?: string) => new Request('http://localhost/api/ai', {
      headers: value ? { 'x-forwarded-for': value } : {},
    });
    expect(clientIp(req('192.0.2.1, 192.0.2.2'))).toBe('192.0.2.1');
    expect(clientIp(req('2001:db8::1'))).toBe('2001:db8::1');
    expect(clientIp(req('vilkårlig-tekst'))).toBe('unknown');
    expect(clientIp(req())).toBe('unknown');
  });
});
