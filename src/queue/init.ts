import { startCategoriesQueue } from './categories';

export const initQueue = async () => {
  await startCategoriesQueue();
};

initQueue();
