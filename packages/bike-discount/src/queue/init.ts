import { type CategoriesFoundCallback, startCategoriesQueue, categoriesQueue } from './categories';
import { startCategoryQueue } from './category';
import { type ProductFoundCallback, startProductQueue, productQueue } from './product';
import { type StockFoundCallback, startStockQueue, stockQueue } from './stock';

export interface QueueParams {
  onCategoriesFound: CategoriesFoundCallback
  onProductFound: ProductFoundCallback
  onStockFound: StockFoundCallback
}

export const initQueue = async ({
  onCategoriesFound,
  onProductFound,
  onStockFound
}: QueueParams) => {
  await startCategoriesQueue(onCategoriesFound);
  startStockQueue(onStockFound);
  startProductQueue(onProductFound);
  startCategoryQueue();
};

export const queues = () => {
  return [
    stockQueue(),
    productQueue(),
    categoriesQueue()
  ];
};
