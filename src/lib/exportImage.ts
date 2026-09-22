import { slugify } from '@/lib/download';

// ══════════════════════════════════════════════════════════════
//  BILDE-EKSPORT – brettets SVG → PNG
//
//  SVG-en klones, serialiseres og tegnes på et canvas via et <img>.
//  Bildet lever da utenfor dokumentet: CSS-variablene fra :root
//  (rgb(var(--k-ink)) osv.) finnes ikke der, og alt de farger ville
//  blitt svart. Derfor byttes hver var(--x) ut med verdien den har på
//  den levende SVG-en – det gir også riktig tema (kveld/dagslys).
//
//  Fonter: --font-sans/--font-mono peker på Next-fonter som bare er
//  lastet i dokumentet. I bildet faller teksten tilbake til systemfont.
// ══════════════════════════════════════════════════════════════

const SVG_NS = 'http://www.w3.org/2000/svg';
const VAR_RE = /var\((--[\w-]+)\)/g;

/** Minst 2×, 3× på skjermer med høy tetthet – skarpt nok for utskrift. */
export function exportScale(): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.min(3, Math.max(2, Math.ceil(dpr)));
}

/** `sotra-sk-hoyt-press-fase-1-2026-09-21.png` */
export function imageFilename(team: string, tactic: string, phase: string, when = new Date()): string {
  const d = when.toISOString().slice(0, 10);
  return `${slugify(team, 'lag')}-${slugify(tactic, 'taktikk')}-${slugify(phase, 'fase')}-${d}.png`;
}

const escapeAttr = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Brettets SVG som frittstående markup i størrelsen w × h, med CSS-variablene
 * byttet ut med verdiene de har akkurat nå. Brukes av både bilde- og videoeksport.
 */
export function serializeBoardSvg(svg: SVGSVGElement, w: number, h: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NS);
  // Uten eksplisitt størrelse tegner Firefox SVG-bildet som 0×0.
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  // flex, 100 %-bredde og markør gjelder bare på siden.
  clone.removeAttribute('style');
  // Arbeidsmarkeringer (valgt spiller o.l.) hører ikke hjemme i bildet.
  clone.querySelectorAll('[data-export="skip"]').forEach(el => el.remove());

  const computed = getComputedStyle(svg);
  const missing = new Set<string>();
  const markup = new XMLSerializer().serializeToString(clone).replace(VAR_RE, (_, name: string) => {
    const value = computed.getPropertyValue(name).trim();
    if (!value) missing.add(name);
    return escapeAttr(value);
  });
  // Et tomt var() blir svart i bildet. Heller en tydelig feil enn et svart bilde.
  if (missing.size) throw new Error(`Mangler verdi for ${[...missing].join(', ')}.`);

  return markup;
}

/** Markup → bilde, klart til å tegnes på et canvas. */
export async function svgMarkupToImage(markup: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function svgToPngBlob(svg: SVGSVGElement, scale: number): Promise<Blob> {
  const vb = svg.viewBox.baseVal;
  if (!vb || !vb.width || !vb.height) throw new Error('Brettet har ingen størrelse.');
  const w = Math.round(vb.width * scale);
  const h = Math.round(vb.height * scale);

  const img = await svgMarkupToImage(serializeBoardSvg(svg, w, h));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nettleseren kan ikke tegne bildet.');
  ctx.drawImage(img, 0, 0, w, h);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Bildet ble tomt.'))), 'image/png'));
}
