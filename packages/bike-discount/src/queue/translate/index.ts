import { type Job, type Queue } from 'bullmq';
import { removeOptions, createQueue, createWorker } from '@crawlers/base/dist/queue/client';
import { type Translation } from '@entities/Translation';
import { fetchTranslation } from '@usecases/fetch-translation';

export type TranslationFoundCallback = (translation: Translation) => Promise<any>;

interface TranslationQueueItem {
  url: string
  language: string
};

const QUEUE_NAME = 'bike_discount.translation';

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
