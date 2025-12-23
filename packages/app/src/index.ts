import { getBrowserManager } from '@crawlers/base/dist/crawler/browser-manager';
import { closeRedis } from '@crawlers/base/dist/infrastructure/redis';
import { logger } from '@crawlers/base';
import { api } from './api';
import { initCrawlers } from './crawlers';
import { initQueue } from './queue';

const init = async () => {
  await initQueue();
  await initCrawlers();
  api.listen(3000, () => {
    logger.info('Server running...');
  });
};

const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  const browserPool = getBrowserManager();
  void browserPool.cleanUp().catch(() => { });
  void closeRedis().catch(() => { });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

init()
  .then(() => { logger.info({ date: new Date() }, 'App initialized!'); })
  .catch(err => { logger.error({ err }, 'App failed!'); });
