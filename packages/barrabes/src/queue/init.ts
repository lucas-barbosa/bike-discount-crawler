import { QueueParams } from '@crawlers/base/dist/types/Queue';
import { startCategoriesQueue, categoriesQueue } from './categories';
import { categoryQueue, startCategoryQueue } from './category';
import { startProductQueue, productQueue } from './product';
import { startStockQueue, stockQueue } from './stock';
import { startTranslationQueue, translationQueue } from './translate';

export const initQueue = async ({
  onCategoriesFound,
  onProductFound,
  onStockFound,
  onTranslationFound
}: QueueParams) => {
  await startCategoriesQueue(onCategoriesFound);
  startStockQueue(onStockFound);
  startProductQueue(onProductFound);
  startTranslationQueue(onTranslationFound);
  startCategoryQueue();
};

export const queues = () => {
  return [
    stockQueue(),
    productQueue(),
    categoriesQueue(),
    categoryQueue(),
    translationQueue()
  ];
};
