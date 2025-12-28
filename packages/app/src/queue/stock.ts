import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { logger } from '@crawlers/base';
import { publishStockChanges } from '#publishers/stock';
import { addStockToCache, hasStockChanged } from '#infrastructure/stock-cache';

const QUEUE_NAME = 'crawlers.main.product_stock';
const STOCK_WORKER_CONCURRENCY = Number(process.env.STOCK_WORKER_CONCURRENCY) || 1;

let queue: Queue;
export const stockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const stockWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductStock>) => {
    logger.info({ ...data }, 'START PUBLISHING stock');
    if (await hasStockChanged(data)) {
      const results = await publishStockChanges(data);
      const allFulfilled = results.every(result => result.status === 'fulfilled');
      if (allFulfilled) {
        await addStockToCache(data);
      }
    }
    logger.info('FINISHED PUBLISHING stock');
  }, {
    concurrency: STOCK_WORKER_CONCURRENCY
  });
  return worker;
};

export const enqueueStock = async (stock: ProductStock) => {
  const prependJob =
    (stock.variations?.length === 0 && stock.availability === 'outofstock') ||
    (stock.variations?.length > 0 && stock.variations.some(x => x.availability === 'outofstock'));
  await queue.add(`stock:${stock.crawlerId}-${stock.id}`, stock, { ...removeOptions, lifo: prependJob });
};

export const startStockQueue = () => {
  stockQueue();
  stockWorker();
};
