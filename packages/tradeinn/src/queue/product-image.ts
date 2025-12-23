import { type Job, type Queue } from 'bullmq';
import { fetchProduct } from '@usecases/fetch-product';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type ProductFoundCallback, type ProductQueueItem } from '@crawlers/base/dist/types/Queue';
import { CRAWLER_NAME } from '../config';
import { logger } from '@crawlers/base';

const QUEUE_NAME = `${CRAWLER_NAME}.product-images`;

let queue: Queue;
export const productImageQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productImageWorker = (onProductFound: ProductFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductQueueItem>) => {
    logger.info({ url: data.url }, 'STARTED loading product image');
    const result = await fetchProduct(data.url, '', 'pt');

    if (result) {
      if (result.images?.length) {
        await onProductFound(result);
      }
      logger.debug({
        id: result.id,
        sku: result.sku,
        imagesCount: result.images?.length
      }, 'Product found');
    }
    logger.info({ url: data.url }, 'FINISHED loading product image');
  }, {
    limiter: {
      max: 10,
      duration: 1000
    }
  });
  return worker;
};

export const enqueueProductImage = async (productUrl: string) => {
  productImageQueue();
  await queue.add(`product-image:${productUrl}`, {
    url: productUrl
  }, {
    ...removeOptions
  });
};

export const startProductImageQueue = (onProductFound: ProductFoundCallback) => {
  productImageQueue();
  productImageWorker(onProductFound);
};
