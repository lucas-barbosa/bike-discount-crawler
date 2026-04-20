import { getBrowserManager } from '@crawlers/base/dist/crawler/browser-manager';
import { closeRedis } from '@crawlers/base/dist/infrastructure/redis';
import { closeQueueClients } from '@crawlers/base/dist/queue/client';
import { captureException, closeSentry, initSentry, logger } from '@crawlers/base';
import { api } from './api';
import { initCrawlers } from './crawlers';
import { initQueue } from './queue';

// Must be called before anything else so early errors are captured.
initSentry();

let server: ReturnType<typeof api.listen>;

const init = async () => {
  await initQueue();
  await initCrawlers();
  server = api.listen(3000, () => {
    logger.info('Server running...');
  });
  server.setTimeout(30000);
};

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  try {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Close workers first so active jobs release locks and return to the
    // queue instead of being stuck "active" until lockDuration expires.
    await closeQueueClients().catch((err) => { logger.error({ err }, 'Error closing queue clients'); });
    await getBrowserManager().cleanUp().catch(() => { });
    await closeRedis().catch(() => { });
    await closeSentry().catch(() => { });
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
  } finally {
    process.exit(0);
  }
};

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled rejection');
  captureException(err, { kind: 'unhandledRejection' });
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  captureException(err, { kind: 'uncaughtException' });
  void gracefulShutdown();
});

init()
  .then(() => { logger.info({ date: new Date() }, 'App initialized!'); })
  .catch(err => { logger.error({ err }, 'App failed!'); });
