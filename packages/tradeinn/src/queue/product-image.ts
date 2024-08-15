import { type Job, type Queue } from 'bullmq';
import { fetchProduct } from '@usecases/fetch-product';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type ProductFoundCallback, type ProductQueueItem } from '@crawlers/base/dist/types/Queue';
import { CRAWLER_NAME } from '../config';

const QUEUE_NAME = `${CRAWLER_NAME}.product-images`;

let queue: Queue;
export const productImageQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productImageWorker = (onProductFound: ProductFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductQueueItem>) => {
    console.log('STARTED loading product image', data);
    const result = await fetchProduct(data.url, '', 'pt');

    if (result) {
      if (result.images?.length) {
        await onProductFound(result);
      }
      console.log('Product: ', {
        id: result.id,
        sku: result.sku,
        images: result.images
      });
    }
    console.log('FINISHED loading product image');
  });
  return worker;
};

export const enqueueProductImage = async (productUrl: string) => {
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
