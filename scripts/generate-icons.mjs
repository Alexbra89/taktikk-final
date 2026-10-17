// Ingen nye pakker: sharp følger allerede med Next. Kjør med node scripts/generate-icons.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const publicFile = name => new URL(`../public/${name}`, import.meta.url);
const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
for (const size of [192, 512]) {
  const buffer = await png(source, size);
  await writeFile(publicFile(`icon-pitch-v2-${size}.png`), buffer);
  // Gamle snarveier kan fortsatt peke hit.
  await writeFile(publicFile(`icon-${size}.png`), buffer);
}
await writeFile(publicFile('apple-touch-icon-pitch-v2.png'), await png(source, 180));
// Helt ugjennomsiktig bakgrunn. Hele banen er innenfor den trygge sirkelen
// (radius 40 % av ikonet), også når Android klipper til sirkel eller dråpe.
const maskable = source.replace('rx="22"', 'rx="0"')
  .replace('x="19" y="19" width="62" height="62"', 'x="20" y="20" width="60" height="60"');
await writeFile(publicFile('icon-maskable-pitch-v2-512.png'), await png(maskable, 512));

// ICO med tre PNG-bilder; både eldre og moderne nettlesere får riktig størrelse.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => png(source, size)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const at = 6 + i * 16;
  header[at] = sizes[i]; header[at + 1] = sizes[i];
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(images[i].length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += images[i].length;
}
const ico = Buffer.concat([header, ...images]);
await writeFile(publicFile('favicon-pitch-v2.ico'), ico);
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), ico);
console.log('Ikoner laget: 192, 512, maskable 512, apple 180 og favicon 16/32/48.');
