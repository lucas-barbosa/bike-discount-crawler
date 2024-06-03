import { fetchCategories } from '@usecases/fetch-categories';
import { createQueue, createWorker } from '../client';
import { type Queue } from 'bullmq';

const QUEUE_NAME = 'bike_discount.categories';

export type CategoriesFoundCallback = (categories: any) => Promise<any>;

let queue: Queue;
export const categoriesQueue = async (enqueueInitial = false) => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  const existingJobs = await queue.getJobCountByTypes('waiting', 'delayed');
  if (!existingJobs && enqueueInitial) {
    await queue.add('find-categories', {}, {
      repeat: {
        every: 2629800000
      }
    });
  }
  return queue;
};

export const enqueueCategories = async () => {
  console.log('Enqueuing categories');
  await categoriesQueue(false);
  await queue.add(`find-categories:${new Date().toISOString()}`, {});
  console.log('Finished');
};

export const categoriesWorker = (onCategoriesFound: CategoriesFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async () => {
    console.log('Categories worker');
    const result = await fetchCategories();
    if (result) {
      console.log('Categories found');
      await onCategoriesFound({
        data: result,
        crawlerId: 'BD'
      });
    }
    console.log('Categories worker finished');
  });
  return worker;
};

export const startCategoriesQueue = async (onCategoriesFound: CategoriesFoundCallback) => {
  await categoriesQueue(true);
  categoriesWorker(onCategoriesFound);
};
