import { type CategoriesFoundCallback, startCategoriesQueue, categoriesQueue } from './categories';
import { categoryQueue, startCategoryQueue } from './category';
import { type OldStockFoundCallback, oldStockQueue, startOldStockQueue } from './old-stock';
import { type ProductFoundCallback, startProductQueue, productQueue } from './product';
import { type StockFoundCallback, startStockQueue, stockQueue } from './stock';
import { type TranslationFoundCallback, startTranslationQueue, translationQueue } from './translate';

export type RegisterProductCallback = (productUrl: string, metadata?: any) => Promise<void>;

export interface QueueParams {
  onCategoriesFound: CategoriesFoundCallback
  onProductFound: ProductFoundCallback
  onStockFound: StockFoundCallback
  onOldStockFound: OldStockFoundCallback
  onTranslationFound: TranslationFoundCallback
  registerProduct: RegisterProductCallback
}

export const initQueue = async ({
  onCategoriesFound,
  onProductFound,
  onStockFound,
  onOldStockFound,
  onTranslationFound,
  registerProduct
}: QueueParams) => {
  await startCategoriesQueue(onCategoriesFound);
  startStockQueue(onStockFound);
  startOldStockQueue(onOldStockFound);
  startProductQueue(onProductFound, registerProduct);
  startTranslationQueue(onTranslationFound);
  startCategoryQueue();
};

export const queues = () => {
  return [
    oldStockQueue(),
    stockQueue(),
    productQueue(),
    categoriesQueue(),
    categoryQueue(),
    translationQueue()
  ];
};
