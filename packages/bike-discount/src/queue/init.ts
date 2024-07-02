import { type CategoriesFoundCallback, startCategoriesQueue, categoriesQueue } from './categories';
import { startCategoryQueue } from './category';
import { type ProductFoundCallback, startProductQueue, productQueue } from './product';
import { type StockFoundCallback, startStockQueue, stockQueue } from './stock';
import { type TranslationFoundCallback, startTranslationQueue, translationQueue } from './translate';

export interface QueueParams {
  onCategoriesFound: CategoriesFoundCallback
  onProductFound: ProductFoundCallback
  onStockFound: StockFoundCallback
  onTranslationFound: TranslationFoundCallback
}

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
    translationQueue()
  ];
};
