import { MemoryCache } from "./memoryCache";

// Singleton cache instance for suppliers
export const supplierCache = new MemoryCache(20); // 20 MB limit
export const userCheckCache = new MemoryCache(15);
export const shopCheckCache = new MemoryCache(15);
export const loginCache = new MemoryCache(40);