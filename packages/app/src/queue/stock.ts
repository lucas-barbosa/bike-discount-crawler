import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { publishStockChanges } from '#publishers/stock';
import { addStockToCache, hasStockChanged } from '#infrastructure/stock-cache';

const QUEUE_NAME = 'crawlers.main.product_stock';

let queue: Queue;
export const stockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const stockWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductStock>) => {
    console.log('START PUBLISHING stock', data);
    if (await hasStockChanged(data)) {
      const results = await publishStockChanges(data);
      const allFulfilled = results.every(result => result.status === 'fulfilled');
      if (allFulfilled) {
        await addStockToCache(data);
      }
    }
    console.log('FINISHED PUBLISHING stock');
  });
  return worker;
};

export const enqueueStock = async (stock: ProductStock) => {
  await queue.add(`stock:${stock.crawlerId}-${stock.id}`, stock, { ...removeOptions });
};

export const startStockQueue = () => {
  stockQueue();
  stockWorker();
};
