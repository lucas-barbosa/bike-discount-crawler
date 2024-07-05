import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { publishCategoriesChange } from '#publishers/categories';

const QUEUE_NAME = 'crawlers.main.categories';

let queue: Queue;
export const categoryQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const categoryWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<any>) => {
    console.log('STARTED PUBLISHING category');
    await publishCategoriesChange(data);
    console.log('FINISHED PUBLISHING category');
  });
  return worker;
};

export const enqueueCategories = async (category: any) => {
  categoryQueue();
  await queue.add('category', category, { ...removeOptions });
};

export const startCategoryQueue = () => {
  categoryQueue();
  categoryWorker();
};
