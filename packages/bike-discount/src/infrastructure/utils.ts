import { closeRedis, getRedisClient } from './client';

const COLUMN_PREFIX = 'bd_crawler';

export const getColumnName = (column: string) => `${COLUMN_PREFIX}@${column}`;

export const getByKey = async (key: string) => {
  const redis = await getRedisClient();
  const cookies = await redis.get(getColumnName(key));
  await closeRedis(redis);
  return cookies;
};

export const saveByKey = async (key: string, value: any) => {
  const redis = await getRedisClient();
  await redis.set(getColumnName(key), value);
  await closeRedis(redis);
};
