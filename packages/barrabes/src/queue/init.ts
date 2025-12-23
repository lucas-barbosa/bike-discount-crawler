import { type QueueParams as BaseQueueParams } from '@crawlers/base/dist/types/Queue';
import { startCategoriesQueue, categoriesQueue } from './categories';
import { categoryQueue, startCategoryQueue } from './category';
import { startProductQueue, productQueue } from './product';
import { startStockQueue, stockQueue } from './stock';
import { startTranslationQueue, translationQueue } from './translate';
import { productImageQueue, startProductImageQueue } from './product-image';

export type RegisterProductCallback = (productUrl: string, metadata?: any) => Promise<void>;

export interface QueueParams extends BaseQueueParams {
  registerProduct: RegisterProductCallback
}

export const initQueue = async ({
  onCategoriesFound,
  onProductFound,
  onProductImageFound,
  onStockFound,
  onTranslationFound,
  registerProduct
}: QueueParams) => {
  await startCategoriesQueue(onCategoriesFound);
  startStockQueue(onStockFound);
  startProductQueue(onProductFound, registerProduct);
  startTranslationQueue(onTranslationFound);
  startCategoryQueue();
  if (onProductImageFound) startProductImageQueue(onProductImageFound);
};

export const queues = () => {
  return [
    stockQueue(),
    productQueue(),
    productImageQueue(),
    categoriesQueue(),
    categoryQueue(),
    translationQueue()
  ];
};
