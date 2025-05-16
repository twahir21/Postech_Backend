import { loginCache, shopCheckCache, supplierCache, userCheckCache } from "./caches";
import type { MemoryCache } from "./memoryCache";


interface CacheStats {
  hits: number;
  misses: number;
}

type CacheMap = Record<string, MemoryCache>;

class CacheStatsTracker {
  private stats: Record<string, CacheStats> = {};
  private caches: CacheMap;

  constructor(caches: CacheMap) {
    this.caches = caches;

    // Initialize stats for each cache
    for (const name in caches) {
      this.stats[name] = { hits: 0, misses: 0 };
    }
  }

  recordHit(cacheName: string) {
    if (this.stats[cacheName]) {
      this.stats[cacheName].hits++;
    }
  }

  recordMiss(cacheName: string) {
    if (this.stats[cacheName]) {
      this.stats[cacheName].misses++;
    }
  }

  getStats() {
    const result: Record<string, any> = {};

    for (const name in this.caches) {
      const cache = this.caches[name];
      result[name] = {
        hits: this.stats[name]?.hits || 0,
        misses: this.stats[name]?.misses || 0,
        usage: cache.getMemoryUsage()
      };
    }

    return result;
  }

  resetStats() {
    for (const name in this.stats) {
      this.stats[name] = { hits: 0, misses: 0 };
    }
  }
}

// Register all caches here
const caches = {
  supplierCache,
  userCheckCache,
  shopCheckCache,
  loginCache
};

export const cacheStatsTracker = new CacheStatsTracker(caches);