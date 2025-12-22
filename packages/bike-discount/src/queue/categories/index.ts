import { fetchCategories } from '@usecases/fetch-categories';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type Queue } from 'bullmq';

const QUEUE_NAME = 'bike_discount.categories';

export type CategoriesFoundCallback = (categories: any) => Promise<any>;

let queue: Queue;
export const categoriesQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const enqueueInitialCategories = async () => {
  categoriesQueue();
  const existingJobs = await queue.getJobCountByTypes('waiting', 'delayed');
  if (!existingJobs) {
    await queue.add('find-categories', {}, {
      repeat: {
        every: 2629800000
      }
    });
  }
};

export const enqueueCategories = async () => {
  console.log('Enqueuing categories');
  categoriesQueue();
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
  }, {
    lockDuration: 60 * 60 * 1000 // 60 minutes for long-running category jobs
  });
  return worker;
};

export const startCategoriesQueue = async (onCategoriesFound: CategoriesFoundCallback) => {
  categoriesQueue();
  categoriesWorker(onCategoriesFound);
  await enqueueInitialCategories();
};
