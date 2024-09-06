import { getRedis } from '@crawlers/base/dist/infrastructure/utils';

const COLUMN_PREFIX = 'crawler';

const redis = getRedis(COLUMN_PREFIX);
export const getByKey = redis.getByKey;
export const saveByKey = redis.saveByKey;
export const deleteByKey = redis.deleteByKey;
