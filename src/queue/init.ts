import { startCategoriesQueue } from './categories';
import { startCategoryQueue } from './category';
import { type ProductFoundCallback, startProductQueue } from './product';
import { type StockFoundCallback, startStockQueue } from './stock';

export interface QueueParams {
  onProductFound: ProductFoundCallback
  onStockFound: StockFoundCallback
}

export const initQueue = async ({
  onProductFound,
  onStockFound
}: QueueParams) => {
  await startCategoriesQueue();
  startStockQueue(onStockFound);
  startProductQueue(onProductFound);
  startCategoryQueue();
};
