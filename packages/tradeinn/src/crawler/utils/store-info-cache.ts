import { type TradeInnStoreData } from './get-store-info';

/**
 * Simple in-memory cache for fetched attributes
 * Keyed by `${idTienda}_${parentId}`
 */
const cache: Record<string, TradeInnStoreData> = {};

/**
 * Returns cached store info or undefined
 */
export function getCachedStoreInfoDictionary (cacheKey: string): TradeInnStoreData | undefined {
  return cache[cacheKey];
}

/**
 * Sets store info in cache
 */
export function setCachedStoreInfoDictionary (cacheKey: string, data: TradeInnStoreData) {
  cache[cacheKey] = data;
}
