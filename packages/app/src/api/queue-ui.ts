import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { queues as barrabesQueues } from '@crawlers/barrabes';
import { queues as bikeDiscountQueues } from '@crawlers/bike-discount';
import { queues as tradeinnQueues } from '@crawlers/tradeinn';
import { productQueue } from '../queue/product';
import { productImageQueue } from '../queue/product-image';
import { stockQueue } from '../queue/stock';
import { translationQueue } from '../queue/translation';
import { oldStockQueue } from '#queue/old-stock';
import { schedulerQueue } from '#queue/scheduler';
import { categorySchedulerQueue } from '#queue/category-scheduler';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const getQueues = () => {
  const queues = [
    stockQueue(),
    oldStockQueue(),
    productQueue(),
    productImageQueue(),
    translationQueue(),
    schedulerQueue(),
    categorySchedulerQueue(),
    ...barrabesQueues(),
    ...bikeDiscountQueues(),
    ...tradeinnQueues()
  ];
  return queues.map(x => new BullAdapter(x));
};

createBullBoard({
  queues: getQueues(),
  serverAdapter
});

export default serverAdapter.getRouter();
