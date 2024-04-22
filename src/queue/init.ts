import { startCategoriesQueue } from './categories';
import { startCategoryQueue } from './category';
import { startProductQueue } from './product';

export const initQueue = async () => {
  await startCategoriesQueue();
  startProductQueue();
  startCategoryQueue();
};

initQueue(); // TODO remove later
