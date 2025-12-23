import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { fetchProduct } from '@usecases/fetch-product';
import { validateProduct } from '@usecases/validate-product';
import { enqueueStock } from '../stock';
import { type Product } from '@entities/Product';
import { enqueueTranslation } from '../translate';
import { setProductSearched } from '@usecases/searched-products';

export type ProductFoundCallback = (product: Product) => Promise<any>;

interface ProductQueueItem {
  url: string
  categoryUrl: string
  language?: string
};

const QUEUE_NAME = 'bike_discount.product';

let queue: Queue;
export const productQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const productWorker = (onProductFound: ProductFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductQueueItem>) => {
    console.log('STARTED loading product', data);
    const result = await fetchProduct(data.url, data.categoryUrl, data.language);
    if (result) {
      await validateProduct(result);
      if (result.isValid) {
        if (data.language !== 'es') {
          await enqueueTranslation(data.url, 'es');
        }
        await enqueueStock(data.url);
        await onProductFound(result);
        await setProductSearched(data.url);
      }
      console.log('Product: ', {
        id: result.id,
        sku: result.sku,
        isValid: result.isValid
      });
    }
    console.log('FINISHED loading product');
  });
  return worker;
};

export const enqueueProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  await queue.add(`product:${productUrl}:${language}`, {
    url: productUrl,
    categoryUrl,
    language
  }, {
    ...removeOptions
  });
};

export const startProductQueue = (onProductFound: ProductFoundCallback) => {
  productQueue();
  productWorker(onProductFound);
};
