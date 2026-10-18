import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : entry.isFile() ? [path] : [];
  }));
  return groups.flat().sort();
}

/** Les bare filer som faktisk serveres, aldri Next sine interne manifester. */
export async function generateServiceWorker(root = project) {
  const buildId = (await readFile(resolve(root, '.next/BUILD_ID'), 'utf8')).trim();
  const template = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
  const publicRoot = resolve(root, 'public');
  const staticRoot = resolve(root, '.next/static');
  const urlPath = path => path.split(sep).map(encodeURIComponent).join('/');
  const publicFiles = (await filesIn(publicRoot)).filter(path => {
    const name = relative(publicRoot, path).split(sep).join('/');
    return !/^(?:models\/|noprecache\/|sw\.js(?:\.map)?$|(?:workbox|worker|fallback)-)/.test(name)
      && !name.endsWith('.map');
  });
  const staticFiles = (await filesIn(staticRoot)).filter(path => !path.endsWith('.map'));
  const assets = [
    ...publicFiles.map(path => [path, `/${urlPath(relative(publicRoot, path))}`]),
    ...staticFiles.map(path => [path, `/_next/static/${urlPath(relative(staticRoot, path))}`]),
  ];
  // Også endring av ikoner/manifest eller worker-kode må gi ny cacheversjon.
  const hash = createHash('sha256').update(buildId).update(template);
  for (const [path, url] of assets) hash.update(url).update(await readFile(path));
  const version = hash.digest('hex').slice(0, 24);
  const urls = ['/', '/favicon.ico', ...assets.map(([, url]) => url)];
  const output = template
    .replace("/* __CACHE_VERSION__ */ ''", JSON.stringify(version))
    .replace('/* __PRECACHE_URLS__ */ []', JSON.stringify([...new Set(urls)]));
  await writeFile(resolve(publicRoot, 'sw.js'), output, 'utf8');
  return { version, urls };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { urls } = await generateServiceWorker();
  console.info(`Service worker: ${urls.length} URL-er klargjort for bruk uten nett.`);
}
