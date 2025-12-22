import { startOldStockQueue } from './old-stock';
import { startCategoryQueue } from './categories';
import { startProductQueue } from './product';
import { startStockQueue } from './stock';
import { startTranslationQueue } from './translation';
import { startProductImageQueue } from './product-image';
import { startAttributeQueue } from './attributes';
import { startSchedulerQueue } from './scheduler';

export const initQueue = async () => {
  startCategoryQueue();
  startProductQueue();
  startProductImageQueue();
  startStockQueue();
  startOldStockQueue();
  startTranslationQueue();
  startAttributeQueue();
  await startSchedulerQueue();
};
