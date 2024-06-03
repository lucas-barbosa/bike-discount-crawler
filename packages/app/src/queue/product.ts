import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
// import { publishProductChanges } from '#publishers/product';

const QUEUE_NAME = 'crawlers.main.product';

let queue: Queue;
export const productQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Product>) => {
    console.log('STARTED PUBLISHING product');
    // await publishProductChanges(data);
    console.log('FINISHED PUBLISHING product');
  });
  return worker;
};

export const enqueueProduct = async (product: Product) => {
  await queue.add(`product:${product.crawlerId}:${product.id}`, product);
};

export const startProductQueue = () => {
  productQueue();
  productWorker();
};
