import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker } from '../client';
import { fetchProductList } from '@usecases/fetch-product-list';
import { enqueueProduct } from '../product';

interface Category {
  categoryUrl: string
  page?: number
};

const QUEUE_NAME = 'bike_discount.category';

let queue: Queue;
export const categoryQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const categoryWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<Category>) => {
    console.log('STARTED fetching products', data);
    const result = await fetchProductList(data.categoryUrl, data.page);
    if (result?.productLinks.length) await enqueueProducts(result.productLinks, data.categoryUrl);
    if (result?.hasNextPage) await enqueueNextCategoryPage(data);
    console.log('FINISHED fetching products');
  });
  return worker;
};

export const enqueueCategory = async (params: Category, recurring: string = '') => {
  categoryQueue();
  await queue.add(`category:${params.categoryUrl}:${params.page ?? 1}`, params, {
    ...(recurring && {
      repeat: {
        pattern: recurring
      }
    })
  });
};

const enqueueNextCategoryPage = async (params: Category) => {
  await enqueueCategory({
    categoryUrl: params.categoryUrl,
    page: (params.page ?? 1) + 1
  });
};

const enqueueProducts = async (productUrls: string[], categoryUrl: string) => {
  await Promise.all(productUrls.map(url => enqueueProduct(url, categoryUrl)));
};

export const startCategoryQueue = () => {
  categoryQueue();
  categoryWorker();
};
