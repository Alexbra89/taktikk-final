const CODE_KEY = 'taktikk:ai-access-code';
export const readCode = () => { try { return localStorage.getItem(CODE_KEY) ?? ''; } catch { return ''; } };
export const writeCode = (v: string) => {
  try { if (v) localStorage.setItem(CODE_KEY, v); else localStorage.removeItem(CODE_KEY); } catch { /* gjelder denne økten */ }
};
