import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { logger } from '@crawlers/base';
import { fetchProduct } from '@usecases/fetch-product';
import { validateProduct } from '@usecases/validate-product';
import { type Product } from '@entities/Product';
import { type RegisterProductCallback } from '../init';
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

export const productWorker = (onProductFound: ProductFoundCallback, registerProduct: RegisterProductCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<ProductQueueItem>) => {
    logger.info({ url: data.url }, 'STARTED loading product');
    const result = await fetchProduct(data.url, data.categoryUrl, data.language);
    if (result) {
      await validateProduct(result);
      if (result.isValid) {
        if (data.language !== 'es') {
          await enqueueTranslation(data.url, 'es');
        }
        await registerProduct(data.url);
        await onProductFound(result);
        await setProductSearched(data.url);
      }
      logger.debug({
        id: result.id,
        sku: result.sku,
        isValid: result.isValid
      }, 'Product loaded');
    }
    logger.info({ url: data.url }, 'FINISHED loading product');
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

export const startProductQueue = (onProductFound: ProductFoundCallback, registerProduct: RegisterProductCallback) => {
  productQueue();
  productWorker(onProductFound, registerProduct);
};
