import { startOldStockQueue } from './old-stock';
import { startCategoryQueue } from './categories';
import { startProductQueue } from './product';
import { startStockQueue } from './stock';
import { startTranslationQueue } from './translation';
import { startProductImageQueue } from './product-image';

export const initQueue = () => {
  startCategoryQueue();
  startProductQueue();
  startProductImageQueue();
  startStockQueue();
  startOldStockQueue();
  startTranslationQueue();
};
