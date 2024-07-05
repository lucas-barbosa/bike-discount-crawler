import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type OldStockResult } from '@crawlers/bike-discount/src/queue/old-stock';
import { addOldStockToCache, hasOldStockChanged } from '#infrastructure/stock-cache';
import { publishOldStockChanges } from '#publishers/stock';

const QUEUE_NAME = 'crawlers.main.old_product_stock';

let queue: Queue;
export const oldStockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const oldStockWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<OldStockResult>) => {
    console.log('START PUBLISHING old stock', data);
    if (await hasOldStockChanged(data)) {
      await publishOldStockChanges(data);
      await addOldStockToCache(data);
    }
    console.log('FINISHED PUBLISHING old stock');
  });
  return worker;
};

export const enqueueOldStock = async (data: OldStockResult) => {
  if (data.items.length) {
    await queue.add(`old-stock:${data.id}-${data.items[0].id}`, data, { ...removeOptions });
  }
};

export const startOldStockQueue = () => {
  oldStockQueue();
  oldStockWorker();
};
