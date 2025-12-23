import { getListeners } from '#infrastructure/listeners';
import { request } from '#infrastructure/request';
import { logger } from '@crawlers/base';

export const publish = async (path: string, data: any) => {
  const listeners = await getListeners();
  if (!listeners) {
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
