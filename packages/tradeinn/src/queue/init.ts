import { type QueueParams } from '@crawlers/base/dist/types/Queue';
import { startCategoriesQueue, categoriesQueue } from './categories';
import { categoryQueue, startCategoryQueue } from './category';
import { startProductQueue, productQueue } from './product';
import { startStockQueue, stockQueue } from './stock';
import { startTranslationQueue, translationQueue } from './translate';
import { productImageQueue, startProductImageQueue } from './product-image';

export const initQueue = async ({
  onCategoriesFound,
  onProductFound,
  onProductImageFound,
  onStockFound,
  onTranslationFound,
  onAttributesFound
}: QueueParams) => {
  await startCategoriesQueue(onCategoriesFound, onAttributesFound);
  startStockQueue(onStockFound);
  startProductQueue(onProductFound);
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
