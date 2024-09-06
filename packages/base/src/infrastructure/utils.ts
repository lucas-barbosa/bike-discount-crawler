import { getRedisClient } from "./redis";

export const getRedis = (columnPrefix: string) => {
  const getColumnName = (column: string) => `${columnPrefix}@${column}`;

  const getByKey = async (key: string) => {
    const redis = await getRedisClient();
    const cookies = await redis.get(getColumnName(key));
    return cookies;
  };

  const deleteByKey = async (key: string) => {
    const redis = await getRedisClient();
    await redis.del(getColumnName(key));
  }

  const saveByKey = async (key: string, value: any) => {
    const redis = await getRedisClient();
    await redis.set(getColumnName(key), value);
  };

  const saveMany = async (items: { key: string, value: any }[]) => {
    const redis = await getRedisClient();
    const promises = items.map(({ key, value }) => redis.set(getColumnName(key), value));
    await Promise.all(promises);
  };

  return {
    deleteByKey,
    getColumnName,
    getByKey,
    saveByKey,
    saveMany
  }
}
