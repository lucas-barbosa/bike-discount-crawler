import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type CategoryQueueItem } from '@crawlers/base/dist/types/Queue';

import { crawlerSettings } from '@infrastructure/crawler-settings';
import { fetchProductList } from '@usecases/fetch-product-list';
import { isProductSearched } from '@usecases/searched-products';

import { enqueueProduct } from './product';
import { CRAWLER_NAME } from '../config';

const QUEUE_NAME = `${CRAWLER_NAME}.category`;

let queue: Queue;
export const categoryQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const categoryWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<CategoryQueueItem>) => {
    console.log('STARTED fetching products', data);
    const result = await fetchProductList(data.categoryUrl, data.page);
    if (result?.productLinks.length) await enqueueProducts(result.productLinks, data.categoryUrl);
    if (result?.hasNextPage) await enqueueNextCategoryPage(data);
    console.log('FINISHED fetching products');
  }, {
    limiter: {
      max: 10,
      duration: 1000
    }
  });
  return worker;
};

export const cleanQueueCategory = async () => {
  categoryQueue();
  await queue.drain(true);
};

export const enqueueCategory = async (params: CategoryQueueItem, recurring: number = 0) => {
  categoryQueue();
  await queue.add(`category:${params.categoryUrl}:${params.page ?? 1}`, params, {
    ...(!!recurring && {
      repeat: {
        every: recurring,
        startDate: new Date()
      }
    }),
    ...removeOptions
  });
};

export const enqueueSelectedCategories = async () => {
  await cleanQueueCategory();
  const categories = await crawlerSettings.getSelectedCategories();
  if (!categories) return;
  for (const category of categories) {
    await enqueueCategory({
      categoryUrl: category,
      page: 1
    }, 30 * 24 * 60 * 60 * 1000); // (days * hours * minutes * seconds * milliseconds)"
  };
};

const enqueueNextCategoryPage = async (params: CategoryQueueItem) => {
  await enqueueCategory({
    categoryUrl: params.categoryUrl,
    page: (params.page ?? 1) + 1
  });
};

const enqueueProducts = async (productUrls: string[], categoryUrl: string) => {
  const pendingProducts: string[] = [];
  for (const productUrl of productUrls) {
    const alreadySearched = await isProductSearched(productUrl).catch(() => false);
    if (!alreadySearched) pendingProducts.push(productUrl);
  }
  await Promise.all(pendingProducts.map(url => enqueueProduct(url, categoryUrl)));
};

export const startCategoryQueue = () => {
  categoryQueue();
  categoryWorker();
};
