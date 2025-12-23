import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type TranslationFoundCallback, type TranslationQueueItem } from '@crawlers/base/dist/types/Queue';
import { fetchTranslation } from '@usecases/fetch-translation';
import { logger } from '@crawlers/base';

const QUEUE_NAME = 'barrabes.translation';

let queue: Queue;
export const translationQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const translationWorker = (onTranslationFound: TranslationFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<TranslationQueueItem>) => {
    logger.info({ url: data.url, language: data.language }, 'STARTED loading translation');
    const result = await fetchTranslation(data.url, data.language);
    if (result) {
      await onTranslationFound(result);
    }
    logger.info({ url: data.url }, 'FINISHED loading translation');
  });
  return worker;
};

export const enqueueTranslation = async (productUrl: string, language: string) => {
  await queue.add(`translation:${productUrl}:${language}`, {
    url: productUrl,
    language
  }, {
    ...removeOptions
  });
};

export const startTranslationQueue = (onTranslationFound: TranslationFoundCallback) => {
  translationQueue();
  translationWorker(onTranslationFound);
};
