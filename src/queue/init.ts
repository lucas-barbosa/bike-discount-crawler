import { startCategoriesQueue } from './categories';
import { enqueueCategory, startCategoryQueue } from './category';
import { startProductQueue } from './product';

export const initQueue = async () => {
  await startCategoriesQueue();
  startProductQueue();
  startCategoryQueue();
  await enqueueCategory({
    categoryUrl: 'https://bike-discount.de/en/shop/bottles-21788/l-24/',
    page: 1
  });
};

initQueue(); // TODO remove later
