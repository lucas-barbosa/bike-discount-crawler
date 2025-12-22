import { getRedisClient } from '@crawlers/base/dist/infrastructure/redis';

type StockType = 'stock' | 'old-stock';

const getRegistryKey = (crawlerId: string, type: StockType = 'stock') =>
  `product-registry:${crawlerId}:${type}`;

const getMetadataKey = (crawlerId: string, type: StockType, url: string) =>
  `product-registry-meta:${crawlerId}:${type}:${url}`;

const getSchedulerEnabledKey = (crawlerId: string) =>
  `scheduler:enabled:${crawlerId}`;

/**
 * Register a product URL in the registry
 */
export const registerProduct = async (
  crawlerId: string,
  productUrl: string,
  type: StockType = 'stock',
  metadata?: Record<string, any>
) => {
  const redis = await getRedisClient();
  const key = getRegistryKey(crawlerId, type);

  await redis.sAdd(key, productUrl);

  // Store metadata for old-stock
  if (type === 'old-stock' && metadata) {
    const metaKey = getMetadataKey(crawlerId, type, productUrl);
    await redis.set(metaKey, JSON.stringify(metadata));
  }
};

/**
 * Get all products for a crawler by type
 */
export const getProducts = async (
  crawlerId: string,
  type: StockType = 'stock'
): Promise<string[]> => {
  const redis = await getRedisClient();
  const key = getRegistryKey(crawlerId, type);

  return await redis.sMembers(key);
};

/**
 * Get metadata for an old-stock product
 */
export const getProductMetadata = async (
  crawlerId: string,
  type: StockType,
  productUrl: string
): Promise<Record<string, any> | null> => {
  const redis = await getRedisClient();
  const metaKey = getMetadataKey(crawlerId, type, productUrl);

  const data = await redis.get(metaKey);
  if (!data) return null;

  return JSON.parse(data) as Record<string, any>;
};

/**
 * Remove a product from the registry
 */
export const removeProduct = async (
  crawlerId: string,
  productUrl: string,
  type: StockType = 'stock'
) => {
  const redis = await getRedisClient();
  const key = getRegistryKey(crawlerId, type);

  await redis.sRem(key, productUrl);

  // Remove metadata if it exists
  if (type === 'old-stock') {
    const metaKey = getMetadataKey(crawlerId, type, productUrl);
    await redis.del(metaKey);
  }
};

/**
 * Enable a crawler in the scheduler
 */
export const enableCrawler = async (crawlerId: string) => {
  const redis = await getRedisClient();
  const key = getSchedulerEnabledKey(crawlerId);
  await redis.set(key, 'true');
};

/**
 * Disable a crawler in the scheduler
 */
export const disableCrawler = async (crawlerId: string) => {
  const redis = await getRedisClient();
  const key = getSchedulerEnabledKey(crawlerId);
  await redis.set(key, 'false');
};

/**
 * Check if a crawler is enabled in the scheduler
 */
export const isCrawlerEnabled = async (crawlerId: string): Promise<boolean> => {
  const redis = await getRedisClient();
  const key = getSchedulerEnabledKey(crawlerId);
  const value = await redis.get(key);

  // Default to enabled if not set
  return value !== 'false';
};

/**
 * Get count of products for a crawler
 */
export const getProductCount = async (
  crawlerId: string,
  type: StockType = 'stock'
): Promise<number> => {
  const redis = await getRedisClient();
  const key = getRegistryKey(crawlerId, type);

  return await redis.sCard(key);
};
