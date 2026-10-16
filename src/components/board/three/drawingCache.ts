/**
 * Decoded drawing layers, most recently used last. At most `limit` stay on the GPU, also when
 * a request finishes after the user has moved on to another phase. The layer on screen is never evicted.
 */
export class DrawingCache<T extends { dispose(): void }> {
  private pending = new Map<string, Promise<T>>();
  private ready = new Map<string, T>();
  private disposed = false;

  constructor(private readonly limit: number, private readonly current: () => string) {}

  get(key: string, create: () => Promise<T>) {
    if (!this.pending.has(key)) this.pending.set(key, create().then(texture => {
      if (this.disposed) texture.dispose(); else this.use(key, texture);
      return texture;
    }).catch(error => {
      this.pending.delete(key); throw error;
    }));
    return this.pending.get(key)!;
  }

  /** Marks a layer as just used and disposes the oldest others beyond the limit. */
  use(key: string, texture: T) {
    this.ready.delete(key); this.ready.set(key, texture);
    const keep = this.current();
    for (const [oldKey, oldTexture] of this.ready) {
      if (this.ready.size <= this.limit) break;
      if (oldKey === keep) continue;
      oldTexture.dispose(); this.ready.delete(oldKey); this.pending.delete(oldKey);
    }
  }

  get size() { return this.ready.size; }

  dispose() {
    this.disposed = true;
    this.ready.forEach(texture => texture.dispose()); this.ready.clear(); this.pending.clear();
  }
}
