import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type Translation } from '@crawlers/bike-discount/dist/types/Translation';
import { logger } from '@crawlers/base';
import { publishTranslationChanges } from '#publishers/translation';

const QUEUE_NAME = 'crawlers.main.translation';

let queue: Queue;
export const translationQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const translationWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Translation>) => {
    logger.info({ translationId: data.id }, 'STARTED PUBLISHING translation');
    await publishTranslationChanges(data);
    logger.info({ translationId: data.id }, 'FINISHED PUBLISHING translation');
  });
  return worker;
};

export const enqueueTranslation = async (translation: Translation) => {
  await queue.add(`translation:${translation.crawlerId}:${translation.id}:${translation.language}`, translation, {
    delay: 86400000, // 24 * 60 * 60 * 1000
    ...removeOptions
  });
};

export const startTranslationQueue = () => {
  translationQueue();
  translationWorker();
};
