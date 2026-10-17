/** Widest the phase pill's texture gets; BoardScene scales it to at most 30 % of the frame. */
export const PHASE_PILL_WIDTH = 720;

/**
 * Rendered inside WebGL, so the phase is included in every video frame.
 * Same compact pill as the live view: name on one line, the note on at most
 * two, cut with "…". A video cannot be tapped open, so it never grows.
 */
export function phasePillCanvas(name: string, note: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const padX = 30, padY = 20, dot = 12, gap = 14, nameFont = 'bold 34px sans-serif', noteFont = '29px sans-serif';
  const room = PHASE_PILL_WIDTH - padX * 2 - dot - gap;
  const clamp = (text: string, font: string, maxLines: number) => {
    ctx.font = font;
    const lines: string[] = []; let line = '';
    for (const word of text.trim().split(/\s+/).filter(Boolean)) {
      if (line && ctx.measureText(`${line} ${word}`).width > room) { lines.push(line); line = ''; }
      // Break long words too, so pasted notes cannot leave the pill.
      for (const char of (line ? ' ' : '') + word) {
        if (ctx.measureText(line + char).width > room) { lines.push(line); line = ''; if (char === ' ') continue; }
        line += char;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > room) last = last.slice(0, -1);
    return [...lines.slice(0, maxLines - 1), `${last.trimEnd()}…`];
  };
  const title = clamp(name, nameFont, 1), body = note ? clamp(note, noteFont, 2) : [];
  const widest = Math.max(...title.map(line => { ctx.font = nameFont; return ctx.measureText(line).width; }),
    ...body.map(line => { ctx.font = noteFont; return ctx.measureText(line).width; }), 1);
  canvas.width = Math.ceil(Math.min(PHASE_PILL_WIDTH, padX * 2 + dot + gap + widest));
  canvas.height = padY * 2 + 42 + body.length * 37;
  const radius = body.length ? 26 : canvas.height / 2;
  ctx.beginPath();
  ctx.moveTo(radius, 0); ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, radius);
  ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, radius);
  ctx.arcTo(0, canvas.height, 0, 0, radius); ctx.arcTo(0, 0, canvas.width, 0, radius); ctx.closePath();
  ctx.fillStyle = 'rgba(12,25,31,.62)'; ctx.fill();
  ctx.fillStyle = '#f3b75f'; ctx.beginPath(); ctx.arc(padX + dot / 2, padY + 21, dot / 2, 0, Math.PI * 2); ctx.fill();
  const x = padX + dot + gap;
  ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff'; ctx.font = nameFont;
  title.forEach(line => ctx.fillText(line, x, padY + 3));
  ctx.fillStyle = '#e2e9e5'; ctx.font = noteFont;
  body.forEach((line, i) => ctx.fillText(line, x, padY + 46 + i * 37));
  return canvas;
}
