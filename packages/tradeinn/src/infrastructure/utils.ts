import { getRedis } from '@crawlers/base/dist/infrastructure/utils';

export const COLUMN_PREFIX = 'tradeinn_crawler';

const redis = getRedis(COLUMN_PREFIX);
export const getByKey = redis.getByKey;
export const saveByKey = redis.saveByKey;
