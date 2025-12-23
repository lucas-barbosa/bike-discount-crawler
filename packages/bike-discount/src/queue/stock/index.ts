import { type Job, type Queue } from 'bullmq';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { logger } from '@crawlers/base';
import { fetchStock } from '@usecases/fetch-stock';

export type StockFoundCallback = (stock: ProductStock) => Promise<any>;

interface StockQueueItem {
  url: string
};

const QUEUE_NAME = 'bike_discount.product_stock';

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
