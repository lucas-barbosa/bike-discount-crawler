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

init()
  .then(() => { console.log('App initialized!', new Date()); })
  .catch(err => { console.log('App failed!', err); });
