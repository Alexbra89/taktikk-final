import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as THREE from 'three';
import { DrawingCanvas } from '../DrawingCanvas';
import { VW, VH } from '@/data/formations';
import { svgMarkupToImage } from '@/lib/exportImage';
import type { Drawing } from '@/types';

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
  ctx.fillText(text, canvas.width / 2, 68, canvas.width - 16);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Use the existing drawing renderer, so curves, arrowheads and legacy drawings match 2D. */
export async function drawingTexture(drawings: Drawing[]) {
  const css = getComputedStyle(document.documentElement);
  let markup = renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width={VW * 3} height={VH * 3} viewBox={`0 0 ${VW} ${VH}`}>
    {drawings.map(d => <DrawingCanvas key={d.id} drawing={d} />)}
  </svg>);
  // Embedded SVG images cannot load the page's web fonts.
  markup = markup.replace(/font-family="[^"]*"/g, 'font-family="sans-serif"');
  markup = markup.replace(/var\((--[\w-]+)\)/g, (_, name: string) => css.getPropertyValue(name).trim());
  const image = await svgMarkupToImage(markup);
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
