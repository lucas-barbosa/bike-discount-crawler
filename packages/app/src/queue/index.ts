import { startProductQueue } from './product';
import { startStockQueue } from './stock';

export const initQueue = () => {
  startProductQueue();
  startStockQueue();
};
