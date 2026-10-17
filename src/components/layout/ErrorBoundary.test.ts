import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ERROR_TITLE, ErrorFallback, SectionErrorBoundary, webglSupported } from './ErrorBoundary';
import { ERROR_LOG_KEY, HIDDEN_MESSAGE, readErrorLog } from '@/lib/errorLog';

// Testene kjører i Node uten DOM, og React sin server-renderer kjører ikke
// feilgrenser. Derfor kjøres grensens egne steg (getDerivedStateFromError,
// componentDidCatch, render) i samme rekkefølge som React gjør, med en ekte
// komponent som kaster. Hele flyten i nettleseren dekkes av e2e/errors.spec.ts.

const Boom: React.FC = () => { throw new Error('Krasj i treningen til "Ola Nordmann"'); };

/** Det React gjør når et barn kaster: ny tilstand, så logging, så ny tegning. */
function crash(boundary: SectionErrorBoundary) {
  let thrown: unknown;
  try { renderToStaticMarkup(React.createElement(Boom)); } catch (e) { thrown = e; }
  expect(thrown).toBeInstanceOf(Error);
  boundary.state = SectionErrorBoundary.getDerivedStateFromError();
  boundary.componentDidCatch(thrown);
  return boundary.render() as React.ReactElement;
}

beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal('window', Object.assign(new EventTarget(), {
    localStorage: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } },
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('feilskjermen', () => {
  it('viser barna så lenge ingenting feiler', () => {
    const child = React.createElement('p', null, 'Treningen');
    const b = new SectionErrorBoundary({ area: 'training', children: child });
    expect(b.render()).toBe(child);
  });

  it('en komponent som kaster gir norsk melding med «Prøv igjen» og «Gå til forsiden»', () => {
    const b = new SectionErrorBoundary({ area: 'training', children: React.createElement(Boom) });
    const html = renderToStaticMarkup(crash(b));
    expect(html).toContain(ERROR_TITLE);
    expect(html).toContain('Noe gikk galt i denne delen');
    expect(html).toContain('Prøv igjen');
    expect(html).toContain('Gå til forsiden');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('Bytt til 2D');
  });

  it('feilen havner i den lokale feilloggen med riktig del, uten navnet', () => {
    crash(new SectionErrorBoundary({ area: 'training', children: React.createElement(Boom) }));
    const [e] = readErrorLog();
    expect(e).toMatchObject({ area: 'training', source: 'skjerm', message: `Error: ${HIDDEN_MESSAGE}` });
    expect(window.localStorage.getItem(ERROR_LOG_KEY)).not.toContain('Ola');
    expect(window.localStorage.getItem(ERROR_LOG_KEY)).not.toContain('treningen');
  });

  it('knappene: «Prøv igjen» nullstiller, «Gå til forsiden» nullstiller og går hjem', () => {
    const onHome = vi.fn();
    const b = new SectionErrorBoundary({ area: 'dashboard', onHome, children: React.createElement(Boom) });
    const setState = vi.spyOn(b, 'setState').mockImplementation(() => {});
    const fallback = crash(b).props as React.ComponentProps<typeof ErrorFallback>;
    fallback.onRetry();
    expect(setState).toHaveBeenLastCalledWith({ failed: false });
    fallback.onHome!();
    expect(setState).toHaveBeenCalledTimes(2);
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('3D: foreslår 2D og nevner WebGL', () => {
    const onSwitchTo2D = vi.fn();
    const b = new SectionErrorBoundary({ area: '3d', onSwitchTo2D, children: React.createElement(Boom) });
    vi.spyOn(b, 'setState').mockImplementation(() => {});
    const el = crash(b);
    const html = renderToStaticMarkup(el);
    expect(html).toContain(ERROR_TITLE);
    expect(html).toContain('Bytt til 2D');
    expect(html).toContain('WebGL');
    expect(html).toContain('Prøv igjen');
    expect(html).toContain('Gå til forsiden');
    (el.props as React.ComponentProps<typeof ErrorFallback>).onSwitchTo2D!();
    expect(onSwitchTo2D).toHaveBeenCalledOnce();
    expect(readErrorLog()[0].area).toBe('3d');
  });

  it('uten WebGL (her: ingen DOM) sier sjekken nei i stedet for å kaste', () => {
    expect(webglSupported()).toBe(false);
  });

  /** Et lerret som bare kan lage de oppgitte WebGL-typene. */
  function stubCanvas(contexts: string[]) {
    const loseContext = vi.fn();
    const getContext = vi.fn((type: string) =>
      contexts.includes(type) ? { getExtension: () => ({ loseContext }) } : null);
    vi.stubGlobal('document', { createElement: () => ({ getContext }) });
    return { getContext, loseContext };
  }

  it('bare WebGL 1: sier nei, for 3D (Three) krever WebGL 2', () => {
    const { getContext } = stubCanvas(['webgl', 'experimental-webgl']);
    expect(webglSupported()).toBe(false);
    expect(getContext).toHaveBeenCalledWith('webgl2');
    expect(getContext).not.toHaveBeenCalledWith('webgl');
  });

  it('WebGL 2: sier ja og gir flaten tilbake', () => {
    const { loseContext } = stubCanvas(['webgl2', 'webgl']);
    expect(webglSupported()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });
});
