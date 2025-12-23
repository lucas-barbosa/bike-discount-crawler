import { type Job, type Queue } from 'bullmq';
import { fetchProductList } from '@usecases/fetch-product-list';
import { isProductSearched } from '@usecases/searched-products';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { type CategoryQueueItem } from '@crawlers/base/dist/types/Queue';
import { logger } from '@crawlers/base';
import { enqueueProduct } from './product';
import { crawlerSettings } from '@infrastructure/crawler-settings';

const QUEUE_NAME = 'barrabes.category';

let queue: Queue;
export const categoryQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const categoryWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<CategoryQueueItem>) => {
    logger.info({ categoryUrl: data.categoryUrl, page: data.page }, 'STARTED fetching products');
    const result = await fetchProductList(data.categoryUrl, data.page);
    if (result?.productLinks.length) await enqueueProducts(result.productLinks, data.categoryUrl);
    if (result?.hasNextPage) await enqueueNextCategoryPage(data);
    logger.info({ categoryUrl: data.categoryUrl }, 'FINISHED fetching products');
  });
  return worker;
};

export const cleanQueueCategory = async () => {
  categoryQueue();
  await queue.drain(true);
};

export const enqueueCategory = async (params: CategoryQueueItem) => {
  categoryQueue();
  await queue.add(`category:${params.categoryUrl}:${params.page ?? 1}`, params, removeOptions);
};

export const enqueueSelectedCategories = async () => {
  await cleanQueueCategory();
  const categories = await crawlerSettings.getSelectedCategories();
  if (!categories) return;
  for (const category of categories) {
    await enqueueCategory({
      categoryUrl: category,
      page: 1
    });
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
