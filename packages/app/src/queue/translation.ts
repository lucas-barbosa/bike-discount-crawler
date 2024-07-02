import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type Translation } from '@crawlers/bike-discount/dist/types/Translation';
import { publishTranslationChanges } from '#publishers/translation';

const QUEUE_NAME = 'crawlers.main.translation';

let queue: Queue;
export const translationQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const translationWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Translation>) => {
    console.log('STARTED PUBLISHING translation');
    await publishTranslationChanges(data);
    console.log('FINISHED PUBLISHING translation');
  });
  return worker;
};

export const enqueueTranslation = async (translation: Translation) => {
  await queue.add(`translation:${translation.crawlerId}:${translation.id}:${translation.language}`, translation);
};

export const startTranslationQueue = () => {
  translationQueue();
  translationWorker();
};
