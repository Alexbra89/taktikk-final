import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export const AI_RATE_LIMIT = 30;
export const AI_RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_CLIENTS = 10_000;

/** Kun i prosessen: deles ikke mellom Vercel-instanser og nullstilles ved omstart. */
export class AiRateLimiter {
  private readonly clients = new Map<string, number[]>();

  take(ip: string, now = Date.now()): { allowed: boolean; retryAfter: number } {
    const cutoff = now - AI_RATE_WINDOW_MS;
    for (const [key, times] of this.clients) {
      const active = times.filter(t => t > cutoff);
      if (active.length) this.clients.set(key, active);
      else this.clients.delete(key);
    }
    // Ingen rå IP eller tilgangskode lagres, heller ikke i logger.
    const key = createHash('sha256').update(ip).digest('hex');
    const times = this.clients.get(key) ?? [];
    if (times.length >= AI_RATE_LIMIT) {
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((times[0] + AI_RATE_WINDOW_MS - now) / 1000)) };
    }
    // Ikke kast eksisterende grenser hvis mange ulike IP-er fyller minnet.
    if (!times.length && this.clients.size >= MAX_CLIENTS) return { allowed: false, retryAfter: 3600 };
    times.push(now);
    this.clients.set(key, times);
    return { allowed: true, retryAfter: 0 };
  }
}

export const aiRateLimiter = new AiRateLimiter();

export function clientIp(req: Request): string {
  // Vercel overskriver x-forwarded-for. På annen hosting må en betrodd proxy gjøre det.
  // Uten en gyldig IP deles én grense; vilkårlig headertekst lager ikke nye bøtter.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';
  return isIP(ip) ? ip : 'unknown';
}
