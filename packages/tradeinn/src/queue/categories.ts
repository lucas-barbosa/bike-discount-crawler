import { type Queue } from 'bullmq';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type CategoryAttributesFoundCallback, type CategoriesFoundCallback } from '@crawlers/base/dist/types/Queue';
import { fetchCategories } from '@usecases/fetch-categories';
import { CRAWLER_ID, CRAWLER_NAME } from '../config';
import { logger } from '@crawlers/base';

const QUEUE_NAME = `${CRAWLER_NAME}.categories`;

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
  logger.info('Categories enqueued');
};

export const categoriesWorker = (onCategoriesFound: CategoriesFoundCallback, onAttributesFound: CategoryAttributesFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async () => {
    logger.info('Categories worker started');
    const { categories, attributes } = await fetchCategories();

    if (categories) {
      logger.info('Categories found');
      await onCategoriesFound({
        data: categories,
        crawlerId: CRAWLER_ID
      });
    }

    if (attributes) {
      logger.info('Attributes found');
      await onAttributesFound({
        data: attributes,
        crawlerId: CRAWLER_ID
      });
    }

    logger.info('Categories worker finished');
  }, {
    lockDuration: 180 * 60 * 1000 // 180 minutes for long-running category jobs
  });
  return worker;
};

export const startCategoriesQueue = async (onCategoriesFound: CategoriesFoundCallback, onAttributesFound: CategoryAttributesFoundCallback) => {
  categoriesQueue();
  categoriesWorker(onCategoriesFound, onAttributesFound);
  await enqueueInitialCategories();
};
