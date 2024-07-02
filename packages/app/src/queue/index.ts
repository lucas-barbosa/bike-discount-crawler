import { startCategoryQueue } from './categories';
import { startProductQueue } from './product';
import { startStockQueue } from './stock';
import { startTranslationQueue } from './translation';

export const initQueue = () => {
  startCategoryQueue();
  startProductQueue();
  startStockQueue();
  startTranslationQueue();
};
