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
export async function drawingTexture(drawings: Drawing[], trails?: { from: Player[]; to: Player[] } | null) {
  const css = getComputedStyle(document.documentElement);
  let markup = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={VW * 3} height={VH * 3} viewBox={`0 0 ${VW} ${VH}`}>
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

/** Rendered inside WebGL, so the phase note is included in every video frame. */
export function phaseTexture(name: string, note: string) {
  const canvas = document.createElement('canvas'); canvas.width = 720;
  const ctx = canvas.getContext('2d')!;
  const wrap = (text: string, size: number) => {
    ctx.font = `${size}px sans-serif`;
    return text.split('\n').flatMap(paragraph => {
      const lines: string[] = []; let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (ctx.measureText(`${line} ${word}`).width > 652 && line) { lines.push(line); line = ''; }
        // Break long words too, so pasted notes cannot leave the panel.
        for (const char of (line ? ' ' : '') + word) {
          if (ctx.measureText(line + char).width > 652) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line); return lines;
    });
  };
  const title = wrap(name, 32), body = note ? wrap(note, 27) : [];
  canvas.height = 36 + title.length * 40 + (body.length ? 16 + body.length * 35 : 0) + 26;
  ctx.fillStyle = 'rgba(12,25,31,.90)'; ctx.fillRect(0, 0, 720, canvas.height);
  ctx.fillStyle = '#f3b75f'; ctx.fillRect(0, 0, 6, canvas.height);
  ctx.textBaseline = 'top'; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px sans-serif';
  title.forEach((line, i) => ctx.fillText(line, 32, 28 + i * 40));
  ctx.fillStyle = '#e2e9e5'; ctx.font = '27px sans-serif';
  body.forEach((line, i) => ctx.fillText(line, 32, 44 + title.length * 40 + i * 35));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
