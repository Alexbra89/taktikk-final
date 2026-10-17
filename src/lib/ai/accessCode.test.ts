import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_LINK_SCRIPT, readCode, writeCode } from './accessCode';

afterEach(() => vi.unstubAllGlobals());

function open(url: string, blocked = false, previous = '') {
  const values = new Map<string, string>();
  if (previous) values.set('taktikk:ai-access-code', previous);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (blocked) throw new Error('blokkert'); values.set(key, value); },
    removeItem: (key: string) => values.delete(key),
  };
  const win = Object.assign(new EventTarget(), { localStorage: storage });
  const replaceState = vi.fn();
  const state = { next: 'behold' };
  runInNewContext(ACCESS_LINK_SCRIPT, { URL, location: { href: url }, history: { state, replaceState }, localStorage: storage, window: win });
  vi.stubGlobal('window', win);
  return { values, replaceState, state };
}

describe('AI-kode bare på enheten', () => {
  it('henter og dekoder lenkekode, erstatter historikk og bevarer andre parametre og fragment', () => {
    const { replaceState, state } = open('https://app.example/?vis=trening&kode=ny%26kode%2B%C3%A5&kode=annen#bane');
    expect(readCode()).toBe('ny&kode+å');
    expect(replaceState).toHaveBeenCalledExactlyOnceWith(state, '', '/?vis=trening#bane');
  });
  it('fjerner også tom kode fra adressen uten å slette lagret tilgang', () => {
    const { replaceState } = open('https://app.example/?kode=', false, 'allerede-lagret');
    expect(replaceState).toHaveBeenCalledOnce();
    expect(readCode()).toBe('allerede-lagret');
    const plain = open('https://app.example/?vis=trening');
    expect(plain.replaceState).not.toHaveBeenCalled();
  });
  it('virker i økten selv med blokkert lagring og lar brukeren glemme koden', () => {
    open('https://app.example/?kode=testkode', true);
    expect(readCode()).toBe('testkode');
    writeCode('ny kode'); expect(readCode()).toBe('ny kode');
    writeCode(''); expect(readCode()).toBe('');
  });
  it('husker manuelt skrevet kode og sletter den helt ved glem', () => {
    const { values } = open('https://app.example/');
    writeCode(' min-kode ');
    expect(values.get('taktikk:ai-access-code')).toBe('min-kode');
    expect(readCode()).toBe('min-kode');
    writeCode(''); expect(values.has('taktikk:ai-access-code')).toBe(false);
  });
});
