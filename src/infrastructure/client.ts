import { type RedisClientType, createClient } from 'redis';

let redis: RedisClientType;
export const getRedisClient = async () => {
  if (!redis) {
    redis = createClient({
      url: process.env.REDIS_URL
    });
  }
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
};

export const closeRedis = async (redis: RedisClientType) => {
  await redis.disconnect();
};
