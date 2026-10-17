/** Ingen automatisk reload: heller ikke lastefeil skal avbryte tegning/eksport. */
export const UPDATE_ERROR_TITLE = 'Appen er oppdatert – last inn på nytt';

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const name = typeof error === 'object' && 'name' in error ? error.name : '';
  const message = typeof error === 'string' ? error
    : typeof error === 'object' && 'message' in error ? String(error.message) : '';
  return name === 'ChunkLoadError' || /(?:ChunkLoadError|Loading (?:CSS )?chunk .+ failed|Failed to load chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module)/i.test(message);
}

export function reloadApp() { window.location.reload(); }

/** Native hendelser dekker også en worker som allerede venter, og andre faner. */
export function watchAppUpdate(sw: ServiceWorkerContainer, onReady: () => void, reload = reloadApp) {
  let registration: ServiceWorkerRegistration | undefined;
  let hadController = !!sw.controller;
  let requested = false;
  let available = false;
  let disposed = false;
  const workers = new Set<ServiceWorker>();
  const ready = () => { available = true; onReady(); };
  const changed = () => {
    if (hadController) {
      if (requested) { requested = false; reload(); }
      else ready(); // En annen fane oppdaterte. Denne fanen får selv velge reload.
    }
    hadController = !!sw.controller;
  };
  const inspect = () => {
    if (registration?.waiting && sw.controller) ready();
    const worker = registration?.installing;
    if (worker && !workers.has(worker)) {
      workers.add(worker);
      worker.addEventListener('statechange', inspect);
    }
  };
  sw.addEventListener('controllerchange', changed);
  void sw.ready.then(reg => {
    if (disposed) return;
    registration = reg;
    reg.addEventListener('updatefound', inspect);
    inspect();
  }).catch(() => {});

  return {
    check: () => { void registration?.update().catch(() => {}); },
    update: () => {
      if (requested || !available) return;
      if (registration?.waiting) {
        requested = true;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        // Workeren kan allerede ha blitt aktivert fra en annen fane.
        reload();
      }
    },
    dispose: () => {
      disposed = true;
      sw.removeEventListener('controllerchange', changed);
      registration?.removeEventListener('updatefound', inspect);
      workers.forEach(worker => worker.removeEventListener('statechange', inspect));
    },
  };
}
