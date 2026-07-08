// Lightweight client-side cache with TTL and invalidation
// Used to make page navigation near-instant (stale-while-revalidate pattern)

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = 30_000; // 30 seconds

export const apiCache = {
  /** Get cached data if fresh, undefined if stale or missing */
  get<T>(key: string, ttl = DEFAULT_TTL): T | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > ttl) return undefined;
    return entry.data as T;
  },

  /** Get stale data even if expired (for stale-while-revalidate) */
  getStale<T>(key: string): T | undefined {
    return cache.get(key)?.data as T | undefined;
  },

  /** Store data in cache */
  set<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
  },

  /** Check if entry is stale (expired but still exists) */
  isStale(key: string, ttl = DEFAULT_TTL): boolean {
    const entry = cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp > ttl;
  },

  /** Invalidate one or more cache keys (after writes) */
  invalidate(...keys: string[]): void {
    for (const key of keys) cache.delete(key);
  },

  /** Invalidate all keys matching a prefix */
  invalidatePrefix(prefix: string): void {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) cache.delete(key);
    }
  },

  /** Clear entire cache */
  clear(): void {
    cache.clear();
  },
};

/** Fetch with cache: returns stale data immediately, revalidates in background */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<{ data: T; fromCache: boolean }> {
  const stale = apiCache.getStale<T>(key);
  const isStale = apiCache.isStale(key, ttl);

  if (stale && !isStale) {
    // Fresh cache — return immediately
    return { data: stale, fromCache: true };
  }

  // Fetch fresh data
  const data = await fetcher();
  apiCache.set(key, data);
  return { data, fromCache: false };
}
