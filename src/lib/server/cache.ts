type Entry<T> = { value: T; expiresAt: number };

class SimpleCache {
  private store = new Map<string, Entry<any>>();

  get<T>(key: string): T | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return e.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  getOrSet<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return Promise.resolve(cached);
    return compute().then((val) => {
      this.set(key, val, ttlMs);
      return val;
    });
  }
}

// Singleton cache instance across route handler hot reloads
// @ts-ignore
export const serverCache: SimpleCache = (global as any).___serverCache || new SimpleCache();
// @ts-ignore
if (!(global as any).___serverCache) (global as any).___serverCache = serverCache;
