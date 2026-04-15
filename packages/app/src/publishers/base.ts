import { getListeners, type Listener } from '#infrastructure/listeners';
import { request } from '#infrastructure/request';
import { logger } from '@crawlers/base';

const LISTENER_CACHE_TTL = 3_600_000; // 1 hour
let cachedListeners: Listener[] | null = null;
let cachedAt = 0;

const getCachedListeners = async () => {
  const now = Date.now();
  if (cachedListeners && (now - cachedAt) < LISTENER_CACHE_TTL) {
    return cachedListeners;
  }
  cachedListeners = await getListeners();
  cachedAt = now;
  return cachedListeners;
};

export const publish = async (path: string, data: any) => {
  const listeners = await getCachedListeners();
  if (!listeners || listeners.length === 0) {
    logger.warn('No listeners found!');
    return [];
  }

  const promises = listeners.map((listener) => {
    return request.post(`${listener.url}/${path}`, {
      data,
      version: '1.0',
      sendAt: new Date(),
      headers: { authorization_key: listener.authenticationKey }
    });
  });

  return await Promise.allSettled(promises);
};
