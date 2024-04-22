import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '../client';
import { fetchProduct } from '@usecases/fetch-product';
import { validateProduct } from '@usecases/validate-product';

interface ProductQueueItem {
  url: string
  categoryUrl: string
  language?: string
};

const QUEUE_NAME = 'bike_discount.product';

let queue: Queue;
export const productQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductQueueItem>) => {
    console.log('STARTED loading product', data);
    const result = await fetchProduct(data.url, data.categoryUrl, data.language);
    if (result) {
      await validateProduct(result);
      console.log('Product: ', !result.invalid);
    }
    console.log(result);
    console.log('FINISHED loading product');
  });
  return worker;
};

export const enqueueProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  await queue.add('product', {
    url: productUrl,
    categoryUrl,
    language
  });
};

export const startProductQueue = () => {
  productQueue();
  productWorker();
};
