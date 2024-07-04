import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type ProductStock } from '@crawlers/bike-discount/dist/types/ProductStock';

const QUEUE_NAME = 'crawlers.main.old_product_stock';

let queue: Queue;
export const oldStockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const oldStockWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductStock[]>) => {
    console.log('START PUBLISHING old stock', data);
    // if (await hasStockChanged(data)) {
    // await publishStockChanges(data);
    // await addStockToCache(data);
    // }
    console.log('FINISHED PUBLISHING old stock');
  });
  return worker;
};

export const enqueueOldStock = async (stock: ProductStock[]) => {
  if (stock.length) {
    await queue.add(`old-stock:${stock[0].crawlerId}-${stock[0].id}`, stock);
  }
};

export const startOldStockQueue = () => {
  oldStockQueue();
  oldStockWorker();
};
