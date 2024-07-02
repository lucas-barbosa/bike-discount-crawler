import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { queues as bdQueues } from '@crawlers/bike-discount';
import { productQueue } from '../queue/product';
import { stockQueue } from '../queue/stock';
import { translationQueue } from '../queue/translation';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const getQueues = () => {
  const queues = [
    stockQueue(),
    productQueue(),
    translationQueue(),
    ...bdQueues()
  ];
  return queues.map(x => new BullAdapter(x));
};

createBullBoard({
  queues: getQueues(),
  serverAdapter
});

export default serverAdapter.getRouter();
