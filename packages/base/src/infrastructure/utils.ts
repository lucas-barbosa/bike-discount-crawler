import { closeRedis, getRedisClient } from "./redis";

export const getRedis = (columnPrefix: string) => {
  const getColumnName = (column: string) => `${columnPrefix}@${column}`;

  const getByKey = async (key: string) => {
    const redis = await getRedisClient();
    const cookies = await redis.get(getColumnName(key));
    await closeRedis(redis).catch();
    return cookies;
  };

  const saveByKey = async (key: string, value: any) => {
    const redis = await getRedisClient();
    await redis.set(getColumnName(key), value);
    await closeRedis(redis).catch();
  };

  return {
    getColumnName,
    getByKey,
    saveByKey
  }
}
