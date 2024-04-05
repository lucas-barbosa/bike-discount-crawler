import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '../client';

interface Product {
  url: string
};

const QUEUE_NAME = 'bike_discount.product';

let queue: Queue;
export const productQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Product>) => {
    console.log('STARTED loading product', data);

    console.log('FINISHED loading product');
  });
  return worker;
};

export const enqueueProduct = async (productUrl: string) => {
  await queue.add('product', {
    url: productUrl
  });
};

export const startProductQueue = () => {
  productQueue();
  productWorker();
};
