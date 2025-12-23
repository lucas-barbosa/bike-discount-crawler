import { getRedisClient } from '@crawlers/base/dist/infrastructure/redis';
import { logger } from '@crawlers/base';

/**
 * Category Registry - Manage category scheduler enable/disable flags
 * Categories are read from crawler-settings, not stored in Redis
 */

const getEnabledKey = (crawlerId: string) =>
  `category-scheduler:enabled:${crawlerId}`;

/**
 * Enable a crawler in the category scheduler
 */
export const enableCategoryCrawler = async (crawlerId: string) => {
  const redis = await getRedisClient();
  const key = getEnabledKey(crawlerId);

  await redis.set(key, 'true');
  logger.info({ crawlerId }, 'Category crawler enabled');
};

/**
 * Disable a crawler in the category scheduler
 */
export const disableCategoryCrawler = async (crawlerId: string) => {
  const redis = await getRedisClient();
  const key = getEnabledKey(crawlerId);

  await redis.set(key, 'false');
  logger.info({ crawlerId }, 'Category crawler disabled');
};

/**
 * Check if a crawler is enabled for category crawling
 * Default: enabled (if key doesn't exist)
 */
export const isCategoryCrawlerEnabled = async (crawlerId: string): Promise<boolean> => {
  const redis = await getRedisClient();
  const key = getEnabledKey(crawlerId);

  const value = await redis.get(key);

  // If not set, default to enabled
  if (!value) return true;

  return value === 'true';
};
