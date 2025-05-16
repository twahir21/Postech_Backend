type CacheValue = Record<string, any> | string | number | boolean;

interface Entry {
  value: CacheValue;
  size: number; // in bytes
}

export class MemoryCache {
  private cache = new Map<string, Entry>();
  private totalSize = 0;
  private maxSizeInMB: number;
  private maxSizeInBytes: number;

  constructor(maxSizeInMB: number = 100) {
    this.maxSizeInMB = maxSizeInMB;
    this.maxSizeInBytes = maxSizeInMB * 1024 * 1024; // Convert MB to Bytes
  }

  /**
   * Estimate JSON size in bytes
   */
  private estimateSize(value: CacheValue): number {
    return Buffer.byteLength(JSON.stringify(value));
  }

  /**
   * Set item in cache
   */
  set(key: string, value: CacheValue): void {
    const size = this.estimateSize(value);

    // If item is bigger than total cache, skip
    if (size > this.maxSizeInBytes) return;

    // Add item
    this.cache.set(key, { value, size });
    this.totalSize += size;

    // Evict until under limit
    this.evict();
  }

  /**
   * Get item from cache
   */
  get(key: string): CacheValue | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Move to end to mark as "recently used"
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  /**
   * Remove oldest items until under size limit
   */
  private evict(): void {
    while (this.totalSize > this.maxSizeInBytes) {
      const firstKey = this.cache.keys().next().value;
      if (!firstKey) break;

      const entry = this.cache.get(firstKey);
      if (entry) {
        this.totalSize -= entry.size;
      }

      this.cache.delete(firstKey);
    }
  }

  /**
   * Get current memory usage in MB
   */
  getMemoryUsage(): { usedMB: number; freeMB: number; usedPercent: number } {
    const usedMB = this.totalSize / (1024 * 1024);
    const freeMB = this.maxSizeInMB - usedMB;
    const usedPercent = (usedMB / this.maxSizeInMB) * 100;

    return { usedMB, freeMB, usedPercent };
  }
}


export interface CachedSupplierResponse {
    data: any[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
  
  export function isCachedSupplierResponse(value: any): value is CachedSupplierResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'data' in value &&
      'total' in value &&
      'page' in value &&
      'limit' in value &&
      'pages' in value
    );
  }