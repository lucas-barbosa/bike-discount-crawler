import { type Queue } from 'bullmq';
import { fetchCategories } from '@usecases/fetch-categories';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type CategoriesFoundCallback } from '@crawlers/base/dist/types/Queue';
import { logger } from '@crawlers/base';

const QUEUE_NAME = 'barrabes.categories';

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
  logger.info('Enqueuing categories');
  categoriesQueue();
  await queue.add(`find-categories:${new Date().toISOString()}`, {});
  logger.info('Finished');
};

export const categoriesWorker = (onCategoriesFound: CategoriesFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async () => {
    logger.info('Categories worker started');
    const result = await fetchCategories();
    if (result) {
      logger.info('Categories found');
      await onCategoriesFound({
        data: result,
        crawlerId: 'BB'
      });
    }
    logger.info('Categories worker finished');
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
