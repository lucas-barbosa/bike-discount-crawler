import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { logger } from '@crawlers/base';
import { publish } from '#publishers/base';

const QUEUE_NAME = 'crawlers.main.product_image';

let queue: Queue;
export const productImageQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productImageWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Product>) => {
    logger.info({ productId: data.id }, 'STARTED PUBLISHING image');
    await publish('product-image', data);
    logger.info({ productId: data.id }, 'FINISHED PUBLISHING product image');
  });
  return worker;
};

export const enqueueProductImage = async (product: Product) => {
  await queue.add(`product_image:${product.crawlerId}:${product.id}`, product, { ...removeOptions });
};

export const startProductImageQueue = () => {
  productImageQueue();
  productImageWorker();
};
