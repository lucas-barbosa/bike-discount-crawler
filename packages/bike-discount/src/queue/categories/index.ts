import { fetchCategories } from '@usecases/fetch-categories';
import { createQueue, createWorker } from '../client';

const QUEUE_NAME = 'bike_discount.categories';

export const categoriesQueue = async () => {
  const queue = createQueue(QUEUE_NAME);
  const existingJobs = await queue.getJobCountByTypes('waiting', 'delayed');
  if (!existingJobs) {
    await queue.add('find-categories', {}, {
      repeat: {
        every: 2629800000
      }
    });
  }
};

export const categoriesWorker = () => {
  const worker = createWorker(QUEUE_NAME, async () => {
    await fetchCategories();
  });
  return worker;
};

export const startCategoriesQueue = async () => {
  await categoriesQueue();
  categoriesWorker();
};
