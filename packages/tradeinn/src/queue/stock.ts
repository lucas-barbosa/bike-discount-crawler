import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type StockFoundCallback, type StockQueueItem } from '@crawlers/base/dist/types/Queue';
import { fetchStock } from '@usecases/fetch-stock';
import { CRAWLER_NAME } from '../config';
import { logger } from '@crawlers/base';

const QUEUE_NAME = `${CRAWLER_NAME}.product_stock`;

let queue: Queue;
export const stockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const stockWorker = (onStockFound: StockFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<StockQueueItem>) => {
    logger.info({ url: data.url }, 'STARTED loading stock');
    const result = await fetchStock(data.url);
    if (result) {
      logger.debug(result, 'Stock found');
      await onStockFound(result);
    }
    logger.info({ url: data.url }, 'FINISHED loading stock');
  }, {
    limiter: {
      max: 10,
      duration: 1000
    }
  });
  return worker;
};

export const enqueueStock = async (productUrl: string) => {
  stockQueue();
  await queue.add(`stock:${productUrl}`, {
    url: productUrl
  }, {
    ...removeOptions
  }).catch(err => { logger.error({ err }, 'Failed to enqueue stock'); });
};

export const startStockQueue = (onStockFound: StockFoundCallback) => {
  stockQueue();
  stockWorker(onStockFound);
};
