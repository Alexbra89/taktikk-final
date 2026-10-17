const CODE_KEY = 'taktikk:ai-access-code';
export const ACCESS_CODE_EVENT = 'taktikk:ai-access-changed';

// Kjøres i <head>, før React, feillogg og service worker. Bare «kode» fjernes;
// andre parametre, fragment og Next sin historikktilstand bevares.
export const ACCESS_LINK_SCRIPT = `(()=>{try{const u=new URL(location.href);if(!u.searchParams.has('kode'))return;const c=(u.searchParams.get('kode')||'').trim();u.searchParams.delete('kode');history.replaceState(history.state,'',u.pathname+u.search+u.hash);if(c){try{localStorage.setItem('${CODE_KEY}',c)}catch{window.__taktikkAiCode=c}}}catch{}})();`;

declare global { interface Window { __taktikkAiCode?: string } }

export const readCode = () => {
  if (typeof window === 'undefined') return '';
  try { return window.__taktikkAiCode ?? window.localStorage.getItem(CODE_KEY) ?? ''; }
  catch { return window.__taktikkAiCode ?? ''; }
};
export const writeCode = (v: string) => {
  if (typeof window === 'undefined') return;
  v = v.trim();
  window.__taktikkAiCode = v;
  try { if (v) window.localStorage.setItem(CODE_KEY, v); else window.localStorage.removeItem(CODE_KEY); } catch { /* gjelder denne økten */ }
  window.dispatchEvent(new Event(ACCESS_CODE_EVENT));
};
