import { type Job, type Queue } from 'bullmq';
import { fetchStock } from '@usecases/fetch-stock';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { StockFoundCallback, StockQueueItem } from '@crawlers/base/dist/types/Queue';

const QUEUE_NAME = 'barrabes.product_stock';

let queue: Queue;
export const stockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const stockWorker = (onStockFound: StockFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<StockQueueItem>) => {
    console.log('STARTED loading stock', data);
    const result = await fetchStock(data.url);
    if (result) {
      console.log('Stock: ', result);
      await onStockFound(result);
    }
    console.log('FINISHED loading stock');
  });
  return worker;
};

export const enqueueStock = async (productUrl: string) => {
  stockQueue();
  await queue.add(`stock:${productUrl}`, {
    url: productUrl
  }, {
    repeat: {
      every: 48 * 60 * 60 * 1000 // (hours * minutes * seconds * milliseconds)
    },
    ...removeOptions
  }).catch(err => { console.log(`An error happened: ${err.message}`); });
};

export const startStockQueue = (onStockFound: StockFoundCallback) => {
  stockQueue();
  stockWorker(onStockFound);
};
