import { closeRedis } from '@crawlers/base/dist/infrastructure/redis';
import { api } from './api';
import { initCrawlers } from './crawlers';
import { initQueue } from './queue';

const init = async () => {
  initQueue();
  await initCrawlers();
  api.listen(3000, () => {
    console.log('Server running...');
  });
};

const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  void closeRedis();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

init()
  .then(() => { console.log('App initialized!', new Date()); })
  .catch(err => { console.log('App failed!', err); });
