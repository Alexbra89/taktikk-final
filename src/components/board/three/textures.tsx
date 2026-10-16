import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { DrawingCanvas } from '../DrawingCanvas';
import { PlayerTrails } from '../svg/PlayerTrails';
import { VW, VH } from '@/data/formations';
import { svgMarkupToImage } from '@/lib/exportImage';
import type { Drawing, Player } from '@/types';

export function themeColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `rgb(${value.split(/\s+/).join(',')})` : fallback;
}

export function textTexture(text: string, color: string, background?: string) {
  const canvas = document.createElement('canvas');
  canvas.width = /^\d+$/.test(text) ? 128 : 512; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, 128); }
  ctx.fillStyle = color; ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // Floating name tags have no backdrop; a dark edge keeps them readable on grass and sky.
  if (!background) {
    ctx.strokeStyle = 'rgba(10, 18, 22, 0.85)'; ctx.lineWidth = 12; ctx.lineJoin = 'round';
    ctx.strokeText(text, canvas.width / 2, 68, canvas.width - 16);
  }
  ctx.fillText(text, canvas.width / 2, 68, canvas.width - 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Use the existing drawing renderer, so curves, arrowheads and legacy drawings match 2D. */
export async function drawingTexture(drawings: Drawing[], trails?: { from: Player[]; to: Player[] } | null, resolution = 3) {
  const css = getComputedStyle(document.documentElement);
  let markup = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={VW * resolution} height={VH * resolution} viewBox={`0 0 ${VW} ${VH}`}>
    {trails && <PlayerTrails {...trails} />}
    {drawings.filter(d => d.type !== 'label').map(d => <DrawingCanvas key={d.id} drawing={d} />)}
  </svg>);
  // Embedded SVG images cannot load the page's web fonts.
  markup = markup.replace(/font-family="[^"]*"/g, 'font-family="sans-serif"');
  markup = markup.replace(/var\((--[\w-]+)\)/g, (_, name: string) => css.getPropertyValue(name).trim().replace(/\s+/g, ','));
  const image = await svgMarkupToImage(markup);
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  return texture;
}

/** Deterministic, tiled grass fibres: no downloaded grass images. */
export function grassTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#668661'; ctx.fillRect(0, 0, 512, 512);
  let seed = 1827;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 45000; i++) {
    const x = random() * 512, y = random() * 512, light = 55 + random() * 65;
    ctx.strokeStyle = `rgba(${light * .8},${light + 22},${light * .62},.35)`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 2 - 1, y - 1 - random() * 5); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 16); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Widest the phase pill's texture gets; BoardScene scales it to at most 30 % of the frame. */
export const PHASE_PILL_WIDTH = 720;

/**
 * Rendered inside WebGL, so the phase is included in every video frame.
 * Same compact pill as the live view: name on one line, the note on at most
 * two, cut with "…". A video cannot be tapped open, so it never grows.
 */
export function phaseTexture(name: string, note: string) {
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
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
