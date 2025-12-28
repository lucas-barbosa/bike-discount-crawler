import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { logger } from '@crawlers/base';
import { publishProductChanges } from '#publishers/product';

const QUEUE_NAME = 'crawlers.main.product';
const PRODUCT_WORKER_CONCURRENCY = Number(process.env.PRODUCT_WORKER_CONCURRENCY) || 1;

let queue: Queue;
export const productQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Product>) => {
    logger.info({ productId: data.id }, 'STARTED PUBLISHING product');
    await publishProductChanges(data);
    logger.info({ productId: data.id }, 'FINISHED PUBLISHING product');
  }, {
    concurrency: PRODUCT_WORKER_CONCURRENCY
  });
  return worker;
};

export const enqueueProduct = async (product: Product) => {
  await queue.add(`product:${product.crawlerId}:${product.id}`, product, { ...removeOptions });
};

export const startProductQueue = () => {
  productQueue();
  productWorker();
};
