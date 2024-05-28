import { startCategoryQueue } from './categories';
import { startProductQueue } from './product';
import { startStockQueue } from './stock';

export const initQueue = () => {
  startCategoryQueue();
  startProductQueue();
  startStockQueue();
};
