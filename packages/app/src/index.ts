import { getBrowserPool } from '@crawlers/base/dist/crawler/browser-pool';
import { closeRedis } from '@crawlers/base/dist/infrastructure/redis';
import { logger } from '@crawlers/base';
import { api } from './api';
import { initCrawlers } from './crawlers';
import { initQueue } from './queue';

let server: ReturnType<typeof api.listen>;

const init = async () => {
  await initQueue();
  await initCrawlers();
  server = api.listen(3000, () => {
    logger.info('Server running...');
  });
};

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await getBrowserPool().drain().catch(() => { });
    await closeRedis().catch(() => { });
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());

init()
  .then(() => { logger.info({ date: new Date() }, 'App initialized!'); })
  .catch(err => { logger.error({ err }, 'App failed!'); });
