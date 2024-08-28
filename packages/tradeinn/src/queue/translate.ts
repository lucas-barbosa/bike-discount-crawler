import { type Job, type Queue } from 'bullmq';
import { fetchTranslation } from '@usecases/fetch-translation';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type TranslationFoundCallback, type TranslationQueueItem } from '@crawlers/base/dist/types/Queue';
import { CRAWLER_NAME } from '../config';

const QUEUE_NAME = `${CRAWLER_NAME}.translation`;

let queue: Queue;
export const translationQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const translationWorker = (onTranslationFound: TranslationFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<TranslationQueueItem>) => {
    console.log('STARTED loading translation', data);
    const result = await fetchTranslation(data.url, data.language);
    if (result) {
      await onTranslationFound(result);
    }
    console.log('FINISHED loading translation');
  }, {
    limiter: {
      max: 10,
      duration: 1000
    }
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
