import { type CategoriesFoundCallback, startCategoriesQueue } from './categories';
import { startCategoryQueue } from './category';
import { type ProductFoundCallback, startProductQueue } from './product';
import { type StockFoundCallback, startStockQueue } from './stock';

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
